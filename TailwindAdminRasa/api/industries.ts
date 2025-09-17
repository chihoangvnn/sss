import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      if (id && typeof id === 'string') {
        // GET /api/industries/:id
        const industry = await storage.getIndustry(id);
        if (industry) {
          res.json(industry);
        } else {
          res.status(404).json({ error: 'Industry not found' });
        }
      } else {
        // GET /api/industries
        const industries = await storage.getIndustries();
        res.json(industries);
      }
    } else if (req.method === 'POST') {
      // POST /api/industries
      const { name, description, isActive = true, sortOrder = 0 } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      const industry = await storage.createIndustry({
        name,
        description,
        isActive,
        sortOrder
      });
      res.json({ ...industry, message: 'Industry created successfully' });
    } else if (req.method === 'PUT' && id && typeof id === 'string') {
      // PUT /api/industries/:id
      const { name, description, isActive, sortOrder } = req.body;
      const industry = await storage.updateIndustry(id, {
        name,
        description,
        isActive,
        sortOrder
      });
      if (industry) {
        res.json({ ...industry, message: 'Industry updated successfully' });
      } else {
        res.status(404).json({ error: 'Industry not found' });
      }
    } else if (req.method === 'DELETE' && id && typeof id === 'string') {
      // DELETE /api/industries/:id
      const success = await storage.deleteIndustry(id);
      if (success) {
        res.json({ message: 'Industry deleted successfully' });
      } else {
        res.status(404).json({ error: 'Industry not found' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Industries API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}