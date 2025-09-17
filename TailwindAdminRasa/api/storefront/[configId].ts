import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { configId } = req.query;
    
    if (!configId || typeof configId !== 'string') {
      return res.status(400).json({ error: 'Config ID is required' });
    }

    if (req.method === 'GET') {
      // GET /api/storefront/[configId] - Get storefront config with top products
      const config = await storage.getStorefrontConfig(configId);
      
      if (!config || !config.isActive) {
        return res.status(404).json({ error: 'Storefront config not found or inactive' });
      }

      const topProducts = await storage.getTopProductsForStorefront(configId);
      
      res.json({
        config,
        products: topProducts
      });
      
    } else if (req.method === 'PUT') {
      // PUT /api/storefront/[configId] - Update storefront config
      const updatedConfig = await storage.updateStorefrontConfig(configId, req.body);
      
      if (!updatedConfig) {
        return res.status(404).json({ error: 'Storefront config not found' });
      }
      
      res.json({ 
        success: true,
        config: updatedConfig,
        message: 'Storefront config updated successfully' 
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Storefront config API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}