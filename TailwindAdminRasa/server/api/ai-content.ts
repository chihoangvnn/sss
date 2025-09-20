import express from 'express';
import { aiContentGenerator } from '../services/ai-content-generator';

const router = express.Router();

// POST /api/ai/generate-product-descriptions
router.post('/generate-product-descriptions', async (req, res) => {
  try {
    const { productName, industryName, categoryName, options = {} } = req.body;

    // Validate required fields
    if (!productName || typeof productName !== 'string' || productName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Product name is required and cannot be empty' 
      });
    }

    console.log('Generating AI descriptions for:', productName, 'Industry:', industryName, 'Category:', categoryName);

    // Generate product descriptions using AI Content Generator
    const result = await aiContentGenerator.generateProductDescriptions(
      productName.trim(),
      industryName,
      categoryName,
      {
        targetLanguage: options.targetLanguage || 'vietnamese',
        customContext: options.customContext || ''
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

export default router;