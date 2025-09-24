import express from 'express';
import { aiContentGenerator } from '../services/ai-content-generator';

const router = express.Router();

// POST /api/ai/generate-product-descriptions
router.post('/generate-product-descriptions', async (req, res) => {
  try {
    const { productName, industryName, categoryName, consultationData = {}, options = {} } = req.body;

    // Validate required fields
    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Product name is required and cannot be empty' 
      });
    }

    console.log('🤖 Generating AI descriptions for:', productName, 'Industry:', industryName, 'Category:', categoryName);
    console.log('🧠 Consultation data available:', Object.keys(consultationData).length > 0 ? 'Yes' : 'No');

    // Generate product descriptions using AI Content Generator
    const result = await aiContentGenerator.generateProductDescriptions(
      productName.trim(),
      industryName,
      categoryName,
      {
        targetLanguage: options.targetLanguage || 'vietnamese',
        customContext: options.customContext || '',
        consultationData: consultationData // 🧠 Pass consultation data to AI generator
      }
    );

    console.log('AI generation successful:', Object.keys(result));
    res.json(result);

  } catch (error: any) {
    console.error('AI Product Description Generation Error:', error);
    
    // Return user-friendly error message
    res.status(500).json({ 
      error: error.message || 'Không thể tạo mô tả sản phẩm. Vui lòng thử lại sau.',
      code: 'AI_GENERATION_FAILED'
    });
  }
});

// 🔍 POST /api/ai/generate-seo-data
router.post('/generate-seo-data', async (req, res) => {
  try {
    const { 
      productName, 
      productDescription, 
      category,
      options = {} 
    } = req.body;

    // Validate required fields
    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Product name is required and cannot be empty' 
      });
    }

    console.log('🔍 Generating SEO data for:', productName, 'Category:', category);
    console.log('📝 Description provided:', productDescription ? 'Yes' : 'No');

    // Determine e-commerce category for intelligent optimization
    const getEcommerceType = (categoryName: string): string => {
      if (!categoryName) return 'general';
      const catLower = categoryName.toLowerCase();
      if (catLower.includes('mỹ phẩm') || catLower.includes('cosmetic') || catLower.includes('beauty') || catLower.includes('skincare')) return 'cosmetics';
      if (catLower.includes('thực phẩm') || catLower.includes('vitamin') || catLower.includes('supplement')) return 'supplements';
      if (catLower.includes('điện tử') || catLower.includes('electronic') || catLower.includes('tech')) return 'electronics';
      if (catLower.includes('thời trang') || catLower.includes('fashion') || catLower.includes('clothes')) return 'fashion';
      if (catLower.includes('thực phẩm') || catLower.includes('food') || catLower.includes('eat')) return 'food';
      return 'general';
    };

    // Generate SEO data using AI Content Generator
    const result = await aiContentGenerator.generateSEOData(
      productName.trim(),
      productDescription,
      category,
      {
        targetMarket: options.targetMarket || 'vietnam',
        includeLocalKeywords: options.includeLocalKeywords !== false, // Default true
        ecommerceType: getEcommerceType(category)
      }
    );

    console.log('🔍 SEO generation successful:', Object.keys(result));
    res.json(result);

  } catch (error: any) {
    console.error('SEO Generation Error:', error);
    
    // Return user-friendly error message
    res.status(500).json({ 
      error: error.message || 'Không thể tạo dữ liệu SEO. Vui lòng thử lại sau.',
      code: 'SEO_GENERATION_FAILED'
    });
  }
});

export default router;