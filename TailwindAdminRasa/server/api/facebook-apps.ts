import { Router } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

const router = Router();

// 🔒 Authentication middleware for Facebook apps management
const requireAdminAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests (production would check session)
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    next();
    return;
  }

  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in as an administrator.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// Secure encryption/decryption for app secrets using AES-256-GCM
const ENCRYPTION_KEY = (() => {
  const key = process.env.ENCRYPTION_KEY;
  
  // In development mode, use a default key if not provided
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    const defaultKey = key || '7dffad63efad7b86be74caa78dfe0d045d0ce331e9d70230aa740370f354e406';
    if (defaultKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character (32-byte) hex string');
    }
    return Buffer.from(defaultKey, 'hex');
  }
  
  // In production, require the environment variable
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY environment variable must be a 64-character (32-byte) hex string');
  }
  return Buffer.from(key, 'hex');
})();

const encryptSecret = (secret: string): string => {
  const iv = crypto.randomBytes(16); // 128-bit IV for AES
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

const decryptSecret = (encryptedSecret: string): string => {
  try {
    const parts = encryptedSecret.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted secret format');
    }
    
    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting app secret:', error);
    return '';
  }
};

// =====================================================================
// 📱 FACEBOOK APPS MANAGEMENT API
// =====================================================================

/**
 * GET /api/facebook-apps
 * Get all Facebook apps (secrets masked for security)
 */
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const apps = await storage.getAllFacebookApps();
    
    // Mask app secrets for security and prepare response
    const enhancedApps = apps.map((app, index) => {
      const maskedApp: any = {
        ...app,
        appSecret: undefined, // 🔒 SECURITY: Never return app secrets, even masked
        appSecretSet: !!app.appSecret
      };
      
      // 🎯 DEVELOPMENT ONLY: Add demo group info and posting stats
      if (process.env.NODE_ENV === 'development') {
        const demoGroups = [
          { groupId: 'group-vip', groupName: 'VIP Group', priority: 1, formulaName: 'Formula VIP' },
          { groupId: 'group-normal', groupName: 'Normal Group', priority: 2, formulaName: 'Formula Standard' },
          { groupId: 'group-test', groupName: 'Test Group', priority: 3, formulaName: 'Formula Safe' }
        ];
        
        const demoStats = [
          {
            todayPosts: 5, weekPosts: 23, monthPosts: 89,
            lastPostAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            remainingQuota: { daily: 3, weekly: 27, monthly: 161 },
            status: 'active' as const
          },
          {
            todayPosts: 8, weekPosts: 31, monthPosts: 124,
            lastPostAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            remainingQuota: { daily: 2, weekly: 19, monthly: 126 },
            status: 'active' as const
          },
          {
            todayPosts: 12, weekPosts: 45, monthPosts: 180,
            lastPostAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            remainingQuota: { daily: 0, weekly: 5, monthly: 70 },
            status: 'limit_reached' as const
          }
        ];
        
        // Add demo data only in development
        maskedApp.groupInfo = demoGroups[index % demoGroups.length];
        maskedApp.postingStats = demoStats[index % demoStats.length];
      }
      // In production, real groupInfo/postingStats would come from limits management system
      
      return maskedApp;
    });

    res.json(enhancedApps);
  } catch (error) {
    console.error('Error fetching Facebook apps:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Facebook apps',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/facebook-apps
 * Create new Facebook app configuration
 */
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const { appName, appId, appSecret, verifyToken, environment, description } = req.body;
    
    // Validate required fields
    if (!appName || !appId || !appSecret) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'appName, appId, and appSecret are required'
      });
    }

    // Generate webhook URL - Facebook requires HTTPS
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'https'; // Force HTTPS for webhooks
    const host = process.env.REPLIT_DEV_DOMAIN || req.get('host'); // Use Replit domain if available
    const webhookUrl = `${protocol}://${host}/api/webhooks/facebook/${appId}`;
    
    // Encrypt app secret
    const encryptedSecret = encryptSecret(appSecret);

    const newApp = await storage.createFacebookApp({
      appName,
      appId,
      appSecret: encryptedSecret,
      webhookUrl,
      verifyToken: verifyToken || `verify_${Date.now()}`,
      environment: environment || 'development',
      description,
      subscriptionFields: ['messages', 'messaging_postbacks', 'feed'],
      isActive: true
    });

    // Return without exposing secret
    res.status(201).json({
      ...newApp,
      appSecret: undefined, // 🔒 SECURITY: Never return app secrets
      appSecretSet: true
    });

  } catch (error) {
    console.error('Error creating Facebook app:', error);
    
    if (error instanceof Error && error.message.includes('unique')) {
      return res.status(409).json({
        error: 'App ID already exists',
        details: 'A Facebook app with this App ID is already configured'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create Facebook app',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/facebook-apps/:id
 * Update Facebook app configuration
 */
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Encrypt app secret if provided
    if (updateData.appSecret && updateData.appSecret !== '') {
      updateData.appSecret = encryptSecret(updateData.appSecret);
    } else {
      // Don't update secret if not provided
      delete updateData.appSecret;
    }

    // Update webhook URL if app ID changed
    if (updateData.appId) {
      updateData.webhookUrl = `${req.protocol}://${req.get('host')}/api/webhooks/facebook/${updateData.appId}`;
    }

    const updatedApp = await storage.updateFacebookApp(id, updateData);
    
    if (!updatedApp) {
      return res.status(404).json({ error: 'Facebook app not found' });
    }

    // Return without exposing secret
    res.json({
      ...updatedApp,
      appSecret: undefined, // 🔒 SECURITY: Never return app secrets
      appSecretSet: !!updatedApp.appSecret
    });

  } catch (error) {
    console.error('Error updating Facebook app:', error);
    res.status(500).json({ 
      error: 'Failed to update Facebook app',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/facebook-apps/:id
 * Delete Facebook app configuration
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await storage.deleteFacebookApp(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Facebook app not found' });
    }

    res.json({ 
      success: true, 
      message: 'Facebook app deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting Facebook app:', error);
    res.status(500).json({ 
      error: 'Failed to delete Facebook app',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/facebook-apps/:id/webhook-info
 * Get webhook configuration info for specific app
 */
router.get('/:id/webhook-info', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const app = await storage.getFacebookAppById(id);
    
    if (!app) {
      return res.status(404).json({ error: 'Facebook app not found' });
    }

    res.json({
      webhookUrl: app.webhookUrl,
      verifyToken: app.verifyToken,
      appId: app.appId,
      subscriptionFields: app.subscriptionFields,
      isActive: app.isActive,
      lastWebhookEvent: app.lastWebhookEvent,
      totalEvents: app.totalEvents
    });

  } catch (error) {
    console.error('Error fetching webhook info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch webhook information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/facebook-apps/:id/test-webhook
 * Test webhook configuration
 */
router.post('/:id/test-webhook', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const app = await storage.getFacebookAppById(id);
    
    if (!app) {
      return res.status(404).json({ error: 'Facebook app not found' });
    }

    // For now, just return the configuration for manual testing
    res.json({
      success: true,
      testInstructions: {
        webhookUrl: app.webhookUrl,
        verifyToken: app.verifyToken,
        subscriptionFields: app.subscriptionFields,
        message: 'Use these details to configure webhook in Facebook App Dashboard'
      }
    });

  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ 
      error: 'Failed to test webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/facebook-apps/:id/tags
 * Update tags for a Facebook app
 */
router.patch('/:id/tags', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tagIds } = req.body;
    
    // Validate tagIds is an array
    if (!Array.isArray(tagIds)) {
      return res.status(400).json({
        error: 'Invalid tag data',
        details: 'tagIds must be an array of tag IDs'
      });
    }

    // Validate all tagIds are strings
    const invalidTags = tagIds.filter(tagId => typeof tagId !== 'string');
    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: 'Invalid tag data',
        details: 'All tag IDs must be strings'
      });
    }

    const updatedApp = await storage.updateFacebookApp(id, { tagIds });
    
    if (!updatedApp) {
      return res.status(404).json({ error: 'Facebook app not found' });
    }

    // Return the updated app with masked secret
    res.json({
      ...updatedApp,
      appSecret: updatedApp.appSecret ? `${updatedApp.appSecret.substring(0, 8)}****` : '',
      appSecretSet: !!updatedApp.appSecret
    });

  } catch (error) {
    console.error('Error updating Facebook app tags:', error);
    res.status(500).json({ 
      error: 'Failed to update tags',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export functions for use in webhook handling
export { encryptSecret, decryptSecret };
export default router;