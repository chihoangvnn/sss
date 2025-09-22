import { Router } from 'express';
import { DatabaseStorage } from '../storage.js';

const router = Router();
const storage = new DatabaseStorage();

// 🔒 Simple auth middleware for development
const requireAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    next();
    return;
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// POST /api/product-faqs - Create new FAQ
router.post('/', requireAuth, async (req, res) => {
  try {
    const { productId, question, answer, sortOrder, isActive } = req.body;
    
    if (!productId || !question || !answer) {
      return res.status(400).json({ 
        error: 'Product ID, question, and answer are required' 
      });
    }

    console.log('📝 Creating new FAQ for product:', productId);
    
    // Always use server-calculated sortOrder to prevent collisions
    // Client sortOrder is ignored to ensure consistent ordering
    const maxSortOrder = await storage.getMaxProductFAQSortOrder(productId);
    const serverSortOrder = maxSortOrder + 1;
    
    const newFAQ = await storage.createProductFAQ({
      productId,
      question: question.trim(),
      answer: answer.trim(),
      sortOrder: serverSortOrder,
      isActive: isActive ?? true
    });

    res.status(201).json({
      success: true,
      faq: newFAQ,
      message: 'FAQ created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating FAQ:', error);
    res.status(500).json({ 
      error: 'Failed to create FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/product-faqs/:id - Update existing FAQ
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, sortOrder, isActive } = req.body;
    
    console.log('✏️ Updating FAQ:', id);
    
    const updateData: any = {};
    if (question !== undefined) updateData.question = question.trim();
    if (answer !== undefined) updateData.answer = answer.trim();
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedFAQ = await storage.updateProductFAQ(id, updateData);
    
    if (!updatedFAQ) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({
      success: true,
      faq: updatedFAQ,
      message: 'FAQ updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating FAQ:', error);
    res.status(500).json({ 
      error: 'Failed to update FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/product-faqs/:id - Delete FAQ
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting FAQ:', id);
    
    const success = await storage.deleteProductFAQ(id);
    
    if (!success) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting FAQ:', error);
    res.status(500).json({ 
      error: 'Failed to delete FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/product-faqs/reorder/:productId - Update FAQ order
router.put('/reorder/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { faqIds } = req.body;
    
    if (!Array.isArray(faqIds)) {
      return res.status(400).json({ error: 'FAQ IDs array is required' });
    }

    console.log('🔄 Reordering FAQs for product:', productId);
    
    const success = await storage.updateProductFAQOrder(productId, faqIds);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update FAQ order' });
    }

    res.json({
      success: true,
      message: 'FAQ order updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating FAQ order:', error);
    res.status(500).json({ 
      error: 'Failed to update FAQ order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/product-faqs/:id - Get single FAQ (for editing)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📖 Getting FAQ:', id);
    
    const faq = await storage.getProductFAQ(id);
    
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({
      success: true,
      faq
    });
  } catch (error) {
    console.error('❌ Error fetching FAQ:', error);
    res.status(500).json({ 
      error: 'Failed to fetch FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;