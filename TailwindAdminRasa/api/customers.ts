import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { 
        search, 
        recent, 
        vip, 
        frequent, 
        limit = '10',
        phone,
        q 
      } = req.query;

      // Handle different query types
      if (search || phone || q) {
        // Search customers by name, phone, or email
        const searchTerm = search as string || phone as string || q as string;
        const customers = await storage.searchCustomers(searchTerm, parseInt(limit as string));
        res.json(customers);
      } else if (recent === 'true') {
        // Get recent customers (with orders in last 30 days)
        const customers = await storage.getRecentCustomers(parseInt(limit as string));
        res.json(customers);
      } else if (vip === 'true') {
        // Get VIP customers
        const customers = await storage.getVipCustomers(parseInt(limit as string));
        res.json(customers);
      } else if (frequent === 'true') {
        // Get frequent customers (most orders)
        const customers = await storage.getFrequentCustomers(parseInt(limit as string));
        res.json(customers);
      } else {
        // Default: get all customers with enriched data
        const customers = await storage.getCustomers(parseInt(limit as string));
        res.json(customers);
      }
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