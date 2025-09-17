import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const orders = await storage.getOrders(50);
      res.json(orders);
    } else if (req.method === 'POST') {
      const { customerId, items, total, status } = req.body;
      const orderId = await storage.createOrder({
        customerId,
        total: total || '0',
        items: items || 1,
        status: status || 'pending'
      });
      res.json({ id: orderId, message: 'Order created successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Order API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}