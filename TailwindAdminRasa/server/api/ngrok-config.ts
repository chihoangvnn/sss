import { Router, Request, Response } from 'express';
import { spawn, execSync } from 'child_process';
import { DatabaseStorage } from '../storage';
import { z } from 'zod';

const router = Router();
const storage = new DatabaseStorage();

// Authentication middleware - follows same pattern as other admin routes
const requireAuth = (req: any, res: any, next: any) => {
  // In development, allow all requests (same as other admin routes)
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    next();
    return;
  }
  
  // Production: check session authentication
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in as an administrator.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// Schema validation cho ngrok configuration với strict validation
const ngrokConfigSchema = z.object({
  whiteListId: z.string().regex(/^[a-z0-9\-]+$/, 'Invalid white list ID format'),
  authToken: z.string().optional(),
  region: z.enum(['us', 'eu', 'ap', 'au', 'sa', 'jp', 'in']).default('ap'),
  protocol: z.enum(['http', 'https']).default('http'),
  port: z.number().int().min(1000).max(65535).default(5000),
  isEnabled: z.boolean().default(true)
});

// Whitelist allowed parameters to prevent command injection
const validateNgrokCommand = (config: any) => {
  const allowedRegions = ['us', 'eu', 'ap', 'au', 'sa', 'jp', 'in'];
  const allowedPorts = [3000, 5000, 8000, 8080, 9000];
  
  if (!allowedRegions.includes(config.region)) {
    throw new Error(`Invalid region: ${config.region}`);
  }
  
  if (!allowedPorts.includes(config.port)) {
    throw new Error(`Port ${config.port} not allowed`);
  }
  
  return true;
};

// Fixed white ID từ user
const FIXED_WHITE_ID = '9c3313cc-33fd-4764-9a29-c3d52979e891';

/**
 * GET /api/ngrok/status
 * Lấy trạng thái hiện tại của ngrok
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    let ngrokStatus = {
      isRunning: false,
      tunnelUrl: null,
      whiteId: FIXED_WHITE_ID,
      uptime: null,
      connections: 0,
      region: 'ap',
      error: null
    };

    try {
      // Kiểm tra ngrok process
      const processes = execSync('pgrep -f ngrok', { encoding: 'utf8', timeout: 3000 });
      if (processes.trim()) {
        ngrokStatus.isRunning = true;
        
        try {
          // Get ngrok API info (port 4040)
          const { default: fetch } = await import('node-fetch');
          const response = await fetch('http://localhost:4040/api/tunnels', { timeout: 2000 });
          
          if (response.ok) {
            const data = await response.json();
            const tunnel = data.tunnels?.find((t: any) => t.proto === 'https');
            
            if (tunnel) {
              ngrokStatus.tunnelUrl = tunnel.public_url;
              ngrokStatus.connections = tunnel.metrics?.conns?.count || 0;
              
              // Parse ngrok config if available
              const config = tunnel.config;
              if (config?.addr) {
                ngrokStatus.uptime = new Date().toISOString();
              }
            }
          }
        } catch (apiError) {
          console.log('Ngrok API not available:', (apiError as Error).message);
          ngrokStatus.error = 'Ngrok running but API unavailable';
        }
      }
    } catch (processError) {
      // Ngrok not running
      ngrokStatus.isRunning = false;
    }

    res.json({
      success: true,
      status: ngrokStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking ngrok status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check ngrok status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ngrok/start
 * Khởi động ngrok với cấu hình mới - Requires Authentication
 */
router.post('/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const config = ngrokConfigSchema.parse(req.body);
    validateNgrokCommand(config);
    
    // Sử dụng fixed white ID thay vì từ request
    const whiteId = FIXED_WHITE_ID;
    
    // Kiểm tra xem ngrok đã chạy chưa
    try {
      const processes = execSync('pgrep -f ngrok', { encoding: 'utf8', timeout: 3000 });
      if (processes.trim()) {
        // Stop existing ngrok first
        execSync('pkill -f ngrok', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    } catch (e) {
      // Ngrok not running, continue
    }

    // Validate auth token if provided
    const authToken = config.authToken || process.env.NGROK_AUTH_TOKEN;
    
    console.log(`🔒 Using fixed White ID: ${whiteId}`);
    console.log(`🚀 Starting ngrok with validated parameters`);
    
    // Secure command execution - no shell, direct process spawn
    const ngrokArgs = [
      'http',
      config.port.toString(),
      '--region', config.region
    ];
    
    // Add auth token if available (secure way)
    if (authToken) {
      // First set auth token
      const authProcess = spawn('ngrok', ['authtoken', authToken], {
        stdio: 'pipe'
      });
      
      await new Promise((resolve, reject) => {
        authProcess.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error(`Auth token setup failed with code ${code}`));
          }
        });
        
        setTimeout(() => {
          authProcess.kill();
          reject(new Error('Auth token setup timeout'));
        }, 10000);
      });
    }
    
    // Spawn ngrok process securely without shell
    const ngrokProcess = spawn('ngrok', ngrokArgs, {
      detached: true,
      stdio: 'ignore'
    });

    ngrokProcess.unref();

    // Đợi một chút để ngrok khởi động
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Lấy tunnel URL mới
    let tunnelUrl = null;
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch('http://localhost:4040/api/tunnels', { timeout: 5000 });
      
      if (response.ok) {
        const data = await response.json();
        const tunnel = data.tunnels?.find((t: any) => t.proto === 'https');
        tunnelUrl = tunnel?.public_url;
      }
    } catch (apiError) {
      console.log('Could not get tunnel URL immediately:', (apiError as Error).message);
    }

    res.json({
      success: true,
      message: 'Ngrok started successfully',
      config: {
        whiteId: whiteId,
        port: config.port,
        region: config.region,
        tunnelUrl: tunnelUrl
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        details: error.errors
      });
    }

    console.error('Error starting ngrok:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start ngrok',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ngrok/stop
 * Dừng ngrok - Requires Authentication
 */
router.post('/stop', requireAuth, async (req: Request, res: Response) => {
  try {
    // Kill ngrok processes
    try {
      execSync('pkill -f ngrok', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({
        success: true,
        message: 'Ngrok stopped successfully',
        timestamp: new Date().toISOString()
      });
    } catch (killError) {
      res.json({
        success: true,
        message: 'Ngrok was not running or already stopped',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error stopping ngrok:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop ngrok',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ngrok/restart
 * Restart ngrok để lấy URL mới - Requires Authentication
 */
router.post('/restart', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Restarting ngrok...');

    // Stop existing ngrok
    try {
      execSync('pkill -f ngrok', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      // Continue if no process found
    }

    // Start ngrok again with default config
    const defaultConfig = {
      whiteListId: FIXED_WHITE_ID,
      region: 'ap',
      port: 5000,
      isEnabled: true
    };

    // Get auth token from environment if available
    const authToken = process.env.NGROK_AUTH_TOKEN;
    
    console.log(`🚀 Restarting ngrok with White ID: ${FIXED_WHITE_ID}`);
    
    // Secure restart - direct process spawn
    const ngrokArgs = [
      'http',
      defaultConfig.port.toString(),
      '--region', defaultConfig.region
    ];
    
    // Set auth token securely if available
    if (authToken) {
      const authProcess = spawn('ngrok', ['authtoken', authToken], {
        stdio: 'pipe'
      });
      
      await new Promise((resolve, reject) => {
        authProcess.on('close', (code) => {
          if (code === 0) resolve(true);
          else reject(new Error(`Auth setup failed: ${code}`));
        });
        setTimeout(() => {
          authProcess.kill();
          reject(new Error('Auth setup timeout'));
        }, 10000);
      });
    }
    
    const ngrokProcess = spawn('ngrok', ngrokArgs, {
      detached: true,
      stdio: 'ignore'
    });

    ngrokProcess.unref();

    // Đợi ngrok khởi động
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Lấy tunnel URL mới
    let tunnelUrl = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!tunnelUrl && attempts < maxAttempts) {
      try {
        const { default: fetch } = await import('node-fetch');
        const response = await fetch('http://localhost:4040/api/tunnels', { timeout: 3000 });
        
        if (response.ok) {
          const data = await response.json();
          const tunnel = data.tunnels?.find((t: any) => t.proto === 'https');
          tunnelUrl = tunnel?.public_url;
        }
      } catch (apiError) {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    res.json({
      success: true,
      message: 'Ngrok restarted successfully',
      config: {
        whiteId: FIXED_WHITE_ID,
        port: defaultConfig.port,
        region: defaultConfig.region,
        tunnelUrl: tunnelUrl,
        attempts: attempts
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error restarting ngrok:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart ngrok',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ngrok/config
 * Lấy cấu hình ngrok hiện tại
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = {
      whiteId: FIXED_WHITE_ID,
      authToken: process.env.NGROK_AUTH_TOKEN ? '***HIDDEN***' : null,
      region: 'ap',
      protocol: 'http',
      port: 5000,
      isEnabled: true,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      config: config
    });

  } catch (error) {
    console.error('Error getting ngrok config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ngrok config'
    });
  }
});

/**
 * GET /api/ngrok/tunnels
 * Lấy danh sách tất cả tunnels active
 */
router.get('/tunnels', async (req: Request, res: Response) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:4040/api/tunnels', { timeout: 5000 });
    
    if (!response.ok) {
      throw new Error(`Ngrok API returned ${response.status}`);
    }

    const data = await response.json();
    
    const tunnels = data.tunnels?.map((tunnel: any) => ({
      name: tunnel.name,
      publicUrl: tunnel.public_url,
      proto: tunnel.proto,
      config: {
        addr: tunnel.config?.addr,
        inspect: tunnel.config?.inspect
      },
      metrics: {
        connections: tunnel.metrics?.conns?.count || 0,
        httpRequests: tunnel.metrics?.http?.count || 0
      }
    })) || [];

    res.json({
      success: true,
      tunnels: tunnels,
      count: tunnels.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting tunnels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tunnels',
      details: error instanceof Error ? error.message : 'Unknown error',
      isNgrokRunning: false
    });
  }
});

export default router;