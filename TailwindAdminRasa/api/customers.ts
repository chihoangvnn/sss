import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const customers = await storage.getCustomers(50);
      res.json(customers);
    } else if (req.method === 'POST') {
      const { name, phone, email } = req.body;
      const customerId = await storage.createCustomer({
        name,
        phone,
        email,
        status: 'active'
      });
      res.json({ id: customerId, message: 'Customer created successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customer API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}