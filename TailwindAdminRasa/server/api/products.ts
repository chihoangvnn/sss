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

// GET /api/products - List all products
router.get('/', async (req, res) => {
  try {
    console.log('📊 API: Getting all products');
    const products = await storage.getProducts();
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
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

export default router;