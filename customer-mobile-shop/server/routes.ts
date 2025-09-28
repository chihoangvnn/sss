import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    res.json({ message: "This is a protected route", userId });
  });

  // CSRF token endpoint
  app.get("/api/facebook-apps/csrf-token", isAuthenticated, async (req, res) => {
    try {
      // Generate CSRF token using session data
      const csrfToken = require('crypto').randomBytes(32).toString('hex');
      (req.session as any).csrfToken = csrfToken;
      res.json({ csrfToken });
    } catch (error) {
      console.error("Error generating CSRF token:", error);
      res.status(500).json({ message: "Failed to generate CSRF token" });
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "BookStore API is running" });
  });

  const httpServer = createServer(app);
  return httpServer;
}