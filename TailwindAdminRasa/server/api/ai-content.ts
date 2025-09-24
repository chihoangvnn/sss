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

    // 🛡️ Comprehensive input validation and sanitization
    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Product name is required and cannot be empty' 
      });
    }

    // Strip HTML and sanitize all inputs with safe type handling
    const stripHtml = (input: any): string => {
      if (typeof input !== 'string') return '';
      return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/data:/gi, '') // Remove data: URLs
        .replace(/vbscript:/gi, '') // Remove vbscript: URLs
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    };

    // Sanitize and validate all inputs with safe defaults
    const sanitizedInputs = {
      productName: stripHtml(productName),
      productDescription: stripHtml(productDescription || ''),
      category: stripHtml(category || 'general'),
      options: {
        targetMarket: (options?.targetMarket && typeof options.targetMarket === 'string') 
          ? options.targetMarket as 'vietnam' | 'international' 
          : 'vietnam',
        includeLocalKeywords: Boolean(options?.includeLocalKeywords),
      }
    };

    // Final validation after sanitization
    if (sanitizedInputs.productName.length === 0) {
      return res.status(400).json({ 
        error: 'Product name contains invalid characters or is empty after sanitization' 
      });
    }

    console.log('🔍 Generating SEO data for:', sanitizedInputs.productName, 'Category:', sanitizedInputs.category);
    console.log('📝 Description provided:', sanitizedInputs.productDescription ? 'Yes' : 'No');

    // Determine e-commerce category for intelligent optimization
    const getEcommerceType = (categoryName: string): string => {
      if (!categoryName || typeof categoryName !== 'string') return 'general';
      const catLower = categoryName.toLowerCase();
      if (catLower.includes('mỹ phẩm') || catLower.includes('cosmetic') || catLower.includes('beauty') || catLower.includes('skincare')) return 'cosmetics';
      if (catLower.includes('thực phẩm') || catLower.includes('vitamin') || catLower.includes('supplement')) return 'supplements';
      if (catLower.includes('điện tử') || catLower.includes('electronic') || catLower.includes('tech')) return 'electronics';
      if (catLower.includes('thời trang') || catLower.includes('fashion') || catLower.includes('clothes')) return 'fashion';
      if (catLower.includes('thực phẩm') || catLower.includes('food') || catLower.includes('eat')) return 'food';
      return 'general';
    };

    // Generate SEO data using AI Content Generator with sanitized inputs
    const result = await aiContentGenerator.generateSEOData(
      sanitizedInputs.productName,
      sanitizedInputs.productDescription,
      sanitizedInputs.category,
      {
        targetMarket: sanitizedInputs.options.targetMarket,
        includeLocalKeywords: sanitizedInputs.options.includeLocalKeywords !== false, // Default true
        ecommerceType: getEcommerceType(sanitizedInputs.category) as 'fashion' | 'cosmetics' | 'supplements' | 'electronics' | 'food' | 'general'
      }
    );

    console.log('🔍 SEO generation successful:', Object.keys(result));
    res.json(result);

  } catch (error: any) {
    console.error('SEO Generation Error:', error);
    
    // 🎯 Enhanced error handling for specific API issues
    let userMessage = 'Không thể tạo dữ liệu SEO. Vui lòng thử lại sau.';
    let statusCode = 500;
    
    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      userMessage = '🤖 Hệ thống AI đang quá tải. Vui lòng thử lại sau vài phút hoặc contact admin để được hỗ trợ.';
      statusCode = 503;
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      userMessage = '📊 Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
      statusCode = 429;
    } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
      userMessage = '🌐 Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.';
      statusCode = 503;
    }
    
    // Return user-friendly error message
    res.status(statusCode).json({ 
      error: userMessage,
      code: 'SEO_GENERATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;