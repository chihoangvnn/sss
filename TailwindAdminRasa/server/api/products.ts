import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

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

// GET /api/products - List all products with search and sort support
router.get('/', async (req, res) => {
  try {
    const { limit, categoryId, search, offset, sortBy, sortOrder } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const sortByStr = sortBy as string || 'newest';
    const sortOrderStr = sortOrder as string || 'desc';
    
    console.log('📊 API: Getting products with filters:', { 
      limitNum, categoryId, search, offsetNum, sortBy: sortByStr, sortOrder: sortOrderStr 
    });
    
    const products = await storage.getProducts(
      limitNum, 
      categoryId as string, 
      search as string, 
      offsetNum,
      sortByStr,
      sortOrderStr
    );
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/slug/:slug - Get product by slug (for public ProductPage)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('📊 API: Getting product with slug:', slug);
    
    const product = await storage.getProductBySlug(slug);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching product by slug:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/:id/faqs - Get product FAQs
router.get('/:id/faqs', async (req, res) => {
  try {
    const { id } = req.params;
    const includeInactive = req.query.includeInactive === 'true';
    console.log('📊 API: Getting FAQs for product:', id, includeInactive ? '(including inactive)' : '(active only)');
    
    const faqs = await storage.getProductFAQs(id, includeInactive);
    res.json(faqs);
  } catch (error) {
    console.error('❌ Error fetching product FAQs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product FAQs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/:id/policies - Get product policies
router.get('/:id/policies', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 API: Getting policies for product:', id);
    
    const associations = await storage.getProductPolicyAssociations(id);
    // Transform associations to return just the policies with defensive mapping
    const policies = associations
      .map(assoc => assoc.policy)
      .filter(Boolean); // Remove any null/undefined policies
    res.json(policies);
  } catch (error) {
    console.error('❌ Error fetching product policies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product policies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/by-barcode - Get product by barcode (optimized for barcode scanning)
// IMPORTANT: This route must come BEFORE /:id to avoid conflicts
router.get('/by-barcode', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Barcode code is required' });
    }
    
    console.log('📊 API: Getting product by barcode:', code);
    
    // First try to get by SKU
    let product = await storage.getProductBySKU(code as string);
    
    // If not found by SKU, search by itemCode
    if (!product) {
      const products = await storage.getProducts(1, undefined, code as string);
      product = products.find(p => p.itemCode === code);
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found', code });
    }
    
    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching product by barcode:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product by barcode',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/:id/reviews - Get product reviews with stats
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 API: Getting reviews for product:', id);
    
    const reviewsData = await storage.getProductReviewsWithStats(id);
    res.json(reviewsData);
  } catch (error) {
    console.error('❌ Error fetching product reviews:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product reviews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 API: Getting product with ID:', id);
    
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/products - Create new product
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('📊 API: Creating new product');
    const product = await storage.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/products/:id - Update existing product
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 API: Updating product with ID:', id);
    
    const updatedProduct = await storage.updateProduct(id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/products/:id - Delete product  
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ API: Deleting product with ID:', id);
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Product ID is required',
        message: 'Please provide a valid product ID' 
      });
    }
    
    const deleted = await storage.deleteProduct(id);
    
    if (!deleted) {
      console.log('❌ Product cannot be deleted:', id);
      return res.status(400).json({ 
        error: 'Cannot delete product',
        message: 'This product cannot be deleted because it has been ordered by customers or does not exist',
        code: 'PRODUCT_HAS_ORDERS'
      });
    }

    console.log('✅ Product deleted successfully:', id);
    res.json({ 
      success: true, 
      message: 'Product deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🚀 SALES TECHNIQUES ENDPOINTS - Advanced sales technique data management

// GET /api/products/:id/sales-techniques - Get all sales technique data for a product
router.get('/:id/sales-techniques', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🎯 API: Getting sales techniques for product:', id);
    
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Extract all sales technique data
    const salesTechniques = {
      urgencyData: product.urgencyData,
      socialProofData: product.socialProofData,
      personalizationData: product.personalizationData,
      leadingQuestionsData: product.leadingQuestionsData,
      objectionHandlingData: product.objectionHandlingData
    };
    
    res.json(salesTechniques);
  } catch (error) {
    console.error('❌ Error fetching product sales techniques:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales techniques',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/products/:id/sales-techniques - Update specific sales technique data
router.put('/:id/sales-techniques', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      urgencyData, 
      socialProofData, 
      personalizationData, 
      leadingQuestionsData, 
      objectionHandlingData 
    } = req.body;
    
    console.log('🎯 API: Updating sales techniques for product:', id);
    console.log('📊 Sales technique data keys:', Object.keys(req.body));

    // Build the update object with only provided fields
    const updateData: any = {};
    if (urgencyData !== undefined) updateData.urgencyData = urgencyData;
    if (socialProofData !== undefined) updateData.socialProofData = socialProofData;
    if (personalizationData !== undefined) updateData.personalizationData = personalizationData;
    if (leadingQuestionsData !== undefined) updateData.leadingQuestionsData = leadingQuestionsData;
    if (objectionHandlingData !== undefined) updateData.objectionHandlingData = objectionHandlingData;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No sales technique data provided',
        message: 'Please provide at least one sales technique data field to update'
      });
    }

    const updatedProduct = await storage.updateProduct(id, updateData);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Return only the updated sales technique data
    const updatedSalesTechniques = {
      urgencyData: updatedProduct.urgencyData,
      socialProofData: updatedProduct.socialProofData,
      personalizationData: updatedProduct.personalizationData,
      leadingQuestionsData: updatedProduct.leadingQuestionsData,
      objectionHandlingData: updatedProduct.objectionHandlingData
    };
    
    res.json(updatedSalesTechniques);
  } catch (error) {
    console.error('❌ Error updating product sales techniques:', error);
    res.status(500).json({ 
      error: 'Failed to update sales techniques',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/products/:id/sales-techniques/:technique - Update individual sales technique
router.put('/:id/sales-techniques/:technique', requireAuth, async (req, res) => {
  try {
    const { id, technique } = req.params;
    const techniqueData = req.body;
    
    console.log(`🎯 API: Updating ${technique} for product:`, id);

    // Validate technique type
    const validTechniques = ['urgency', 'social-proof', 'personalization', 'leading-questions', 'objection-handling'];
    if (!validTechniques.includes(technique)) {
      return res.status(400).json({ 
        error: 'Invalid sales technique',
        message: `Valid techniques are: ${validTechniques.join(', ')}`
      });
    }

    // Map technique names to database field names
    const fieldMapping: { [key: string]: string } = {
      'urgency': 'urgencyData',
      'social-proof': 'socialProofData',  
      'personalization': 'personalizationData',
      'leading-questions': 'leadingQuestionsData',
      'objection-handling': 'objectionHandlingData'
    };

    const updateField = fieldMapping[technique];
    const updateData = { [updateField]: techniqueData };

    const updatedProduct = await storage.updateProduct(id, updateData);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ 
      [technique]: (updatedProduct as any)[updateField],
      message: `${technique} data updated successfully`
    });
  } catch (error) {
    console.error(`❌ Error updating ${req.params.technique} for product:`, error);
    res.status(500).json({ 
      error: `Failed to update ${req.params.technique} data`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;