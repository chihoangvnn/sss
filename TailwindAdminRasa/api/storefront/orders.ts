import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';
import { insertStorefrontOrderSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // GET /api/storefront/orders - Get storefront orders (for admin)
      const { configId, limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 50;
      
      const orders = await storage.getStorefrontOrders(
        configId as string, 
        limitNum
      );
      
      res.json(orders);
      
    } else if (req.method === 'POST') {
      // POST /api/storefront/orders - Create new customer order
      const validation = insertStorefrontOrderSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Thông tin đơn hàng không hợp lệ',
          details: validation.error.errors 
        });
      }

      // Verify storefront config exists and is active
      const config = await storage.getStorefrontConfig(validation.data.storefrontConfigId);
      if (!config || !config.isActive) {
        return res.status(400).json({ 
          error: 'Storefront không tồn tại hoặc đã bị tắt' 
        });
      }

      // Verify product exists
      const product = await storage.getProduct(validation.data.productId);
      if (!product) {
        return res.status(400).json({ 
          error: 'Sản phẩm không tồn tại' 
        });
      }

      const order = await storage.createStorefrontOrder(validation.data);
      
      res.json({ 
        success: true,
        orderId: order.id,
        message: 'Đơn hàng đã được tạo thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
        orderDetails: {
          customerName: order.customerName,
          phone: order.customerPhone,
          productName: order.productName,
          quantity: order.quantity,
          total: order.total,
          deliveryType: order.deliveryType
        }
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Storefront orders API error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại sau.',
      success: false 
    });
  }
}