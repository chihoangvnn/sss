import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';
import { insertShopSettingsSchema } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      if (id === 'default') {
        // GET /api/shop-settings?id=default - Get default shop settings
        const defaultSettings = await storage.getDefaultShopSettings();
        res.json(defaultSettings || null);
      } else if (id && typeof id === 'string') {
        // GET /api/shop-settings?id=<id> - Get specific shop settings
        const foundSettings = await storage.getShopSettingsById(id);
        
        if (!foundSettings) {
          return res.status(404).json({ error: 'Shop settings not found' });
        }
        
        res.json(foundSettings);
      } else {
        // GET /api/shop-settings - Get all shop settings
        const settings = await storage.getShopSettings();
        res.json(settings);
      }
      
    } else if (req.method === 'POST') {
      // POST /api/shop-settings - Create new shop settings
      const validation = insertShopSettingsSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid data format',
          details: validation.error.errors 
        });
      }

      const settings = await storage.createShopSettings(validation.data);
      res.json({ 
        success: true, 
        settings,
        message: 'Shop settings created successfully' 
      });
      
    } else if (req.method === 'PUT') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Settings ID is required for update' });
      }

      if (id === 'set-default') {
        // PUT /api/shop-settings?id=set-default - Set default shop settings
        const { settingsId } = req.body;
        
        if (!settingsId) {
          return res.status(400).json({ error: 'Settings ID is required' });
        }

        const updatedSettings = await storage.setDefaultShopSettings(settingsId);
        
        if (!updatedSettings) {
          return res.status(404).json({ error: 'Shop settings not found' });
        }
        
        res.json({ 
          success: true,
          settings: updatedSettings,
          message: 'Default shop settings updated successfully' 
        });
      } else {
        // PUT /api/shop-settings?id=<id> - Update specific shop settings
        const validation = insertShopSettingsSchema.partial().safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({ 
            error: 'Invalid data format',
            details: validation.error.errors 
          });
        }

        const updatedSettings = await storage.updateShopSettings(id, validation.data);
        
        if (!updatedSettings) {
          return res.status(404).json({ error: 'Shop settings not found' });
        }
        
        res.json({ 
          success: true,
          settings: updatedSettings,
          message: 'Shop settings updated successfully' 
        });
      }
      
    } else if (req.method === 'DELETE') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Settings ID is required for deletion' });
      }

      // DELETE /api/shop-settings?id=<id> - Delete shop settings
      const success = await storage.deleteShopSettings(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Shop settings not found' });
      }
      
      res.json({ 
        success: true,
        message: 'Shop settings deleted successfully' 
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Shop settings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}