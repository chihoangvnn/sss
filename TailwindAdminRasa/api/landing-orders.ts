import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { landingPageId, customerInfo, productInfo, paymentMethod } = req.body;
    
    if (!customerInfo?.name || !customerInfo?.phone || !productInfo?.productId) {
      return res.status(400).json({ 
        error: 'Missing required fields: customer name, phone, and product ID' 
      });
    }

    // Create guest customer for the order
    const guestCustomer = await storage.createCustomer({
      name: customerInfo.name,
      email: customerInfo.email || `guest-${Date.now()}@landing.local`,
      phone: customerInfo.phone,
      status: 'active'
    });

    // Create order
    const totalAmount = productInfo.price * (productInfo.quantity || 1);
    const orderId = await storage.createOrder({
      customerId: guestCustomer.id,
      total: totalAmount.toString(),
      items: productInfo.quantity || 1,
      status: 'pending'
    });

    res.json({
      success: true,
      orderId: orderId,
      customerId: guestCustomer.id,
      message: 'Đơn hàng đã được tạo thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.',
      orderDetails: {
        customerName: customerInfo.name,
        phone: customerInfo.phone,
        productName: productInfo.productName,
        quantity: productInfo.quantity || 1,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod || 'cod'
      }
    });
    
  } catch (error) {
    console.error('Landing order API error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại sau.',
      success: false 
    });
  }
}