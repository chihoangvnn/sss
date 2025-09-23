import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPGSimple from "connect-pg-simple";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";

const app = express();

// Trust proxy for secure cookies behind reverse proxy in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration for custom domain support
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [
  'http://localhost:3000',
  'http://localhost:5000', 
  'https://your-storefront.vercel.app',
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

// Add Replit default domain dynamically
if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (allowedOrigins.some(allowedOrigin => {
      // Support wildcard subdomain matching for development
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowedOrigin === origin;
    })) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.warn(`🚫 CORS: Rejected origin ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Support cookies and authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Session-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session-based authentication for frontend users
const PGStore = ConnectPGSimple(session);

app.use(session({
  store: new PGStore({
    pool: pool, // Use PostgreSQL Pool directly
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: (() => {
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET environment variable must be set in production');
    }
    return process.env.SESSION_SECRET || 'dev-session-secret-change-in-production';
  })(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  name: 'admin.session' // Custom session name
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error with request context for debugging
    log(`Error ${status}: ${message} - ${req.method} ${req.path}`, "error");
    if (status >= 500) {
      console.error(err.stack); // Log full stack trace for server errors
    }

    res.status(status).json({ message });
    // Don't throw - just log and respond to prevent process crash
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
