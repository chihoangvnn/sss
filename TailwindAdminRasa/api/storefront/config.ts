import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { insertStorefrontConfigSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/storefront/config - Get all storefront configs
      const configs = await storage.getStorefrontConfigs();
      res.json(configs);
      
    } else if (req.method === 'POST') {
      // POST /api/storefront/config - Create new storefront config
      const validation = insertStorefrontConfigSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid data format',
          details: validation.error.errors 
        });
      }

      const config = await storage.createStorefrontConfig(validation.data);
      res.json({ 
        success: true, 
        config,
        message: 'Storefront config created successfully' 
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Storefront config API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}