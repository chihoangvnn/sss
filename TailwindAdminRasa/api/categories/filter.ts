import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { frontendId } = req.query;

    // For now, we'll support frontend-a and return all categories
    // This can be extended to filter by specific frontend configurations
    if (typeof frontendId === 'string' && frontendId === 'frontend-a') {
      // Get all active categories for the mobile storefront
      const categories = await storage.getCategories();
      
      // Filter only active categories and format for mobile storefront
      const filteredCategories = categories
        .filter(cat => cat.isActive !== false)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          industryId: cat.industryId,
          sortOrder: cat.sortOrder || 0
        }))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      return res.json(filteredCategories);
    }

    // If frontendId is not provided or not supported, return error
    return res.status(400).json({ 
      error: 'Invalid or missing frontendId parameter. Supported values: frontend-a' 
    });

  } catch (error) {
    console.error('Categories Filter API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}