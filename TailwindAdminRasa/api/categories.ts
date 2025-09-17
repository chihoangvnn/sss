import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      if (id && typeof id === 'string') {
        // GET /api/categories/:id
        const category = await storage.getCategory(id);
        if (category) {
          res.json(category);
        } else {
          res.status(404).json({ error: 'Category not found' });
        }
      } else {
        // GET /api/categories
        const { industryId } = req.query;
        const industryIdParam = typeof industryId === 'string' ? industryId : undefined;
        const categories = await storage.getCategories(industryIdParam);
        res.json(categories);
      }
    } else if (req.method === 'POST') {
      // POST /api/categories
      const { name, description, industryId, isActive = true, sortOrder = 0 } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      if (!industryId) {
        return res.status(400).json({ error: 'Industry ID is required' });
      }
      
      const category = await storage.createCategory({
        name,
        description,
        industryId,
        isActive,
        sortOrder
      });
      res.json({ ...category, message: 'Category created successfully' });
    } else if (req.method === 'PUT' && id && typeof id === 'string') {
      // PUT /api/categories/:id
      const { name, description, industryId, isActive, sortOrder } = req.body;
      const category = await storage.updateCategory(id, {
        name,
        description,
        industryId,
        isActive,
        sortOrder
      });
      if (category) {
        res.json({ ...category, message: 'Category updated successfully' });
      } else {
        res.status(404).json({ error: 'Category not found' });
      }
    } else if (req.method === 'DELETE' && id && typeof id === 'string') {
      // DELETE /api/categories/:id
      const success = await storage.deleteCategory(id);
      if (success) {
        res.json({ message: 'Category deleted successfully' });
      } else {
        res.status(404).json({ error: 'Category not found' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Categories API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}