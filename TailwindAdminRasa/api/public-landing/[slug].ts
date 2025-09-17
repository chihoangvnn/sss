import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // Extract product ID from slug (format: product-{id})
    const productId = slug.replace('product-', '');
    
    // Get product from database
    const products = await storage.getProducts(100);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: "Landing page not found or inactive" });
    }

    // Get theme and color from query params for testing
    const theme = req.query.theme as string || 'light';
    const primaryColor = req.query.color as string || '#007bff';

    // Generate landing page data
    const landingPage = {
      id: `demo-${product.id}`,
      title: `Landing Page - ${product.name}`,
      slug: slug,
      description: product.description,
      productId: product.id,
      customPrice: parseFloat(product.price),
      finalPrice: parseFloat(product.price),
      originalPrice: parseFloat(product.price) * 1.2, // 20% discount for demo
      heroTitle: `Mua ngay ${product.name}`,
      heroSubtitle: `${product.description}`,
      isActive: true,
      theme: theme,
      primaryColor: primaryColor,
      displayName: product.name,
      displayDescription: product.description,
      displayImage: product.image,
      callToAction: "Đặt hàng ngay",
      contactInfo: {
        phone: '0123456789',
        email: 'contact@store.com',
        businessName: 'Cửa hàng Demo'
      },
      paymentMethods: {
        cod: true,
        bankTransfer: true,
        online: false
      },
      features: [`Sản phẩm ${product.name} chất lượng cao`, 'Giao hàng tận nơi', 'Đổi trả dễ dàng'],
      viewCount: Math.floor(Math.random() * 1000) + 1, // Increment view
      orderCount: Math.floor(Math.random() * 50),
      conversionRate: (Math.random() * 10).toFixed(2),
      product: {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category
      }
    };
    
    res.json(landingPage);
    
  } catch (error) {
    console.error('Public landing page API error:', error);
    res.status(500).json({ error: 'Failed to fetch landing page' });
  }
}