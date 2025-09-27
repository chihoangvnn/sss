/**
 * 🎯 APPROACH 2: DYNAMIC PRODUCT FIELDS
 * API Routes for Custom Description Management
 * Connects ProductDescriptionService to Admin/Storefront/RASA/Social/SEO
 */

import { Router } from 'express';
import { productDescriptionService } from '../services/product-description-service';
import type { 
  DisplayDescriptionsOptions,
  ConsultationDescriptionsOptions,
  SocialDescriptionsOptions,
  SEODescriptionsOptions
} from '../services/product-description-service';
import type { CustomDescriptionData } from '../../shared/schema';

const router = Router();

/**
 * GET /api/products/:id/descriptions/raw
 * Get raw custom descriptions for a product
 */
router.get('/products/:id/descriptions/raw', async (req, res) => {
  try {
    const { id } = req.params;
    const descriptions = await productDescriptionService.getRawDescriptions(id);
    
    res.json({
      success: true,
      data: descriptions || { version: 1, fields: {} }
    });
  } catch (error) {
    console.error('Error fetching raw descriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch descriptions'
    });
  }
});

/**
 * GET /api/products/:id/descriptions/display
 * Get descriptions optimized for storefront display
 */
router.get('/products/:id/descriptions/display', async (req, res) => {
  try {
    const { id } = req.params;
    const { context = 'mobile', category, includeEmpty = 'false' } = req.query;
    
    const options: DisplayDescriptionsOptions = {
      context: context as 'mobile' | 'desktop' | 'admin',
      category: category as any,
      includeEmpty: includeEmpty === 'true'
    };
    
    const descriptions = await productDescriptionService.getDisplayDescriptions(id, options);
    
    res.json({
      success: true,
      data: descriptions
    });
  } catch (error) {
    console.error('Error fetching display descriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch display descriptions'
    });
  }
});

/**
 * GET /api/products/:id/descriptions/consultation
 * Get descriptions for RASA chatbot consultation
 */
router.get('/products/:id/descriptions/consultation', async (req, res) => {
  try {
    const { id } = req.params;
    const { intent, category, priority } = req.query;
    
    const options: ConsultationDescriptionsOptions = {
      intent: intent as string,
      category: category as any,
      priority: priority as any
    };
    
    const descriptions = await productDescriptionService.getConsultationDescriptions(id, options);
    
    res.json({
      success: true,
      data: descriptions
    });
  } catch (error) {
    console.error('Error fetching consultation descriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultation descriptions'
    });
  }
});

/**
 * GET /api/products/:id/descriptions/social
 * Generate social media content from descriptions
 */
router.get('/products/:id/descriptions/social', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform = 'facebook', format = 'post', maxLength } = req.query;
    
    const options: SocialDescriptionsOptions = {
      platform: platform as 'facebook' | 'instagram' | 'tiktok',
      format: format as 'post' | 'story' | 'reel',
      maxLength: maxLength ? parseInt(maxLength as string) : undefined
    };
    
    const content = await productDescriptionService.getSocialDescriptions(id, options);
    
    res.json({
      success: true,
      data: {
        content,
        platform,
        format,
        length: content.length
      }
    });
  } catch (error) {
    console.error('Error generating social content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate social content'
    });
  }
});

/**
 * GET /api/products/:id/descriptions/seo
 * Generate SEO content from descriptions
 */
router.get('/products/:id/descriptions/seo', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'meta_description', maxLength } = req.query;
    
    const options: SEODescriptionsOptions = {
      type: type as 'meta_description' | 'schema_markup' | 'keywords',
      maxLength: maxLength ? parseInt(maxLength as string) : undefined
    };
    
    const content = await productDescriptionService.getSEODescriptions(id, options);
    
    res.json({
      success: true,
      data: {
        content,
        type,
        length: content.length
      }
    });
  } catch (error) {
    console.error('Error generating SEO content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate SEO content'
    });
  }
});

/**
 * GET /api/products/:id/descriptions/editable
 * Get editable descriptions with templates for admin
 */
router.get('/products/:id/descriptions/editable', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await productDescriptionService.getEditableDescriptions(id);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching editable descriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch editable descriptions'
    });
  }
});

/**
 * PUT /api/products/:id/descriptions
 * Update custom descriptions for a product
 */
router.put('/products/:id/descriptions', async (req, res) => {
  try {
    const { id } = req.params;
    const data: CustomDescriptionData = req.body;
    
    // Basic validation
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid description data'
      });
    }

    if (!data.version || typeof data.version !== 'number') {
      data.version = 1;
    }

    if (!data.fields || typeof data.fields !== 'object') {
      data.fields = {};
    }
    
    const success = await productDescriptionService.updateDescriptions(id, data);
    
    if (success) {
      res.json({
        success: true,
        message: 'Descriptions updated successfully',
        data
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update descriptions'
      });
    }
  } catch (error) {
    console.error('Error updating descriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update descriptions'
    });
  }
});

/**
 * GET /api/custom-description-templates
 * Get all available templates
 */
router.get('/custom-description-templates', async (req, res) => {
  try {
    // For now, return static templates for Vietnamese incense business
    // This will be replaced with database query once schema is synced
    const staticTemplates = [
      {
        templateName: 'Nhang Thờ Cúng Cơ Bản',
        fieldTemplate: {
          'spiritual_meaning': {
            label: 'Ý nghĩa tâm linh',
            type: 'textarea',
            category: 'spiritual',
            required: true,
            placeholder: 'Mô tả ý nghĩa tâm linh của sản phẩm...',
            icon: '🙏'
          },
          'burning_guide': {
            label: 'Hướng dẫn thắp hương',
            type: 'textarea',
            category: 'main',
            required: true,
            placeholder: 'Cách thắp và sử dụng hương...',
            icon: '🔥'
          },
          'cultural_significance': {
            label: 'Ý nghĩa văn hóa',
            type: 'textarea',
            category: 'cultural',
            required: false,
            placeholder: 'Vai trò trong văn hóa Việt Nam...',
            icon: '🏛️'
          },
          'burn_time': {
            label: 'Thời gian đốt',
            type: 'text',
            category: 'technical',
            required: true,
            placeholder: '45-60 phút',
            icon: '⏰'
          },
          'occasions': {
            label: 'Dịp sử dụng',
            type: 'list',
            category: 'spiritual',
            required: false,
            placeholder: 'Các dịp lễ phù hợp',
            icon: '🎋'
          }
        }
      },
      {
        templateName: 'Nhang Thiền Định',
        fieldTemplate: {
          'meditation_benefits': {
            label: 'Lợi ích thiền định',
            type: 'textarea',
            category: 'spiritual',
            required: true,
            placeholder: 'Tác dụng hỗ trợ thiền định...',
            icon: '🧘'
          },
          'aroma_profile': {
            label: 'Hương thơm',
            type: 'textarea',
            category: 'main',
            required: true,
            placeholder: 'Mô tả hương thơm đặc trưng...',
            icon: '🌸'
          },
          'chakra_alignment': {
            label: 'Chakra tương ứng',
            type: 'text',
            category: 'spiritual',
            required: false,
            placeholder: 'Chakra nào được kích hoạt...',
            icon: '⚡'
          }
        }
      }
    ];
    
    res.json({
      success: true,
      data: staticTemplates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * POST /api/products/:id/descriptions/generate
 * Generate descriptions using AI/templates
 */
router.post('/products/:id/descriptions/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const { template, productInfo } = req.body;
    
    // For now, return a sample generated description
    // This would integrate with AI service in the future
    const generatedData: CustomDescriptionData = {
      version: 1,
      fields: {
        'spiritual_meaning': {
          label: 'Ý nghĩa tâm linh',
          value: 'Mang lại sự thanh tịnh và bình an cho tâm hồn, giúp kết nối với thế giới tâm linh.',
          type: 'textarea',
          category: 'spiritual',
          displayOrder: 1,
          icon: '🙏',
          contexts: ['storefront', 'chatbot', 'social'],
          priority: 'high'
        },
        'burning_guide': {
          label: 'Hướng dẫn thắp hương',
          value: '1. Thắp đầu nhang bằng diêm\n2. Để cháy 3-5 giây rồi thổi tắt lửa\n3. Cắm vào lư hương và để tự cháy',
          type: 'textarea',
          category: 'main',
          displayOrder: 2,
          icon: '🔥',
          contexts: ['storefront', 'chatbot'],
          priority: 'high'
        }
      }
    };
    
    res.json({
      success: true,
      data: generatedData,
      message: 'Generated using template: ' + template
    });
  } catch (error) {
    console.error('Error generating descriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate descriptions'
    });
  }
});

export default router;