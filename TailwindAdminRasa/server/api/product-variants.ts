import { Router } from 'express';
import { db } from '../db';
import { productVariants, products, inventoryMovements, warehouseLocations } from '../../shared/schema';
import { eq, and, desc, sql, count, sum } from 'drizzle-orm';
import { z } from 'zod';

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

// ============================================
// 📦 PRODUCT VARIANTS CRUD OPERATIONS
// ============================================

// GET /api/product-variants - List all product variants with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      productId, 
      status, 
      lowStock,
      page = '1', 
      limit = '20',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('📦 API: Getting product variants with filters:', { productId, status, lowStock });

    // Build dynamic query conditions
    const conditions = [];
    if (productId) conditions.push(eq(productVariants.productId, productId as string));
    if (status) conditions.push(eq(productVariants.status, status as any));

    // Base query with product information
    let query = db
      .select({
        variant: productVariants,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
          status: products.status
        }
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id));

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Search functionality
    if (search) {
      query = query.where(
        sql`${productVariants.name} ILIKE ${`%${search}%`} OR ${productVariants.sku} ILIKE ${`%${search}%`}`
      );
    }

    // Sorting
    const orderColumn = sortBy === 'name' ? productVariants.name : 
                       sortBy === 'stock' ? productVariants.stock :
                       productVariants.createdAt;
    query = query.orderBy(sortOrder === 'asc' ? orderColumn : desc(orderColumn));

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    query = query.limit(limitNum).offset(offset);

    const results = await query;

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: count() })
      .from(productVariants)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Filter for low stock if requested
    let variants = results;
    if (lowStock === 'true') {
      variants = results.filter(({ variant }) => 
        variant.stock <= (variant.reorderPoint || 10)
      );
    }

    res.json({
      success: true,
      data: variants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(total.toString()),
        totalPages: Math.ceil(parseInt(total.toString()) / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching product variants:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product variants',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/product-variants/:id - Get single product variant with inventory details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 API: Getting product variant with ID:', id);

    // Get variant with product information
    const [result] = await db
      .select({
        variant: productVariants,
        product: products
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, id));

    if (!result) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    // Get recent inventory movements for this variant
    const recentMovements = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, id))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(10);

    // Calculate inventory statistics
    const [stockStats] = await db
      .select({
        totalMovements: count(),
        totalInbound: sql<number>`COALESCE(SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END), 0)`,
        totalOutbound: sql<number>`COALESCE(SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END), 0)`
      })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, id));

    res.json({
      success: true,
      data: {
        ...result.variant,
        product: result.product,
        inventoryStats: {
          currentStock: result.variant.stock,
          reservedStock: result.variant.reservedStock,
          availableStock: result.variant.stock - result.variant.reservedStock,
          reorderPoint: result.variant.reorderPoint,
          maxStock: result.variant.maxStock,
          stockStatus: result.variant.stock <= (result.variant.reorderPoint || 10) ? 'low' : 
                      result.variant.stock === 0 ? 'out' : 'normal',
          movements: {
            total: parseInt(stockStats.totalMovements.toString()),
            inbound: parseInt(stockStats.totalInbound.toString()),
            outbound: parseInt(stockStats.totalOutbound.toString())
          }
        },
        recentMovements
      }
    });

  } catch (error) {
    console.error('❌ Error fetching product variant:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product variant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/product-variants - Create new product variant
const createVariantSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Variant name is required"),
  attributes: z.object({}).passthrough().optional(),
  price: z.string().optional(),
  cost: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  reorderPoint: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  weight: z.string().optional(),
  images: z.array(z.object({}).passthrough()).optional(),
  defaultImageIndex: z.number().int().min(0).optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  isDefault: z.boolean().default(false),
  tagIds: z.array(z.string()).optional()
});

router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('📦 API: Creating new product variant');
    
    const validatedData = createVariantSchema.parse(req.body);

    // Verify product exists
    const [product] = await db
      .select({ id: products.id, sku: products.sku })
      .from(products)
      .where(eq(products.id, validatedData.productId));

    if (!product) {
      return res.status(400).json({ error: 'Product not found' });
    }

    // Generate unique SKU for variant
    const variantCount = await db
      .select({ count: count() })
      .from(productVariants)
      .where(eq(productVariants.productId, validatedData.productId));

    const variantSuffix = String(parseInt(variantCount[0].count.toString()) + 1).padStart(2, '0');
    const generatedSku = `${product.sku}-V${variantSuffix}`;

    // Create variant
    const [newVariant] = await db
      .insert(productVariants)
      .values({
        ...validatedData,
        sku: generatedSku,
        images: validatedData.images || [],
        attributes: validatedData.attributes || {},
        tagIds: validatedData.tagIds || []
      })
      .returning();

    console.log('✅ Product variant created successfully:', newVariant.id);
    res.status(201).json({
      success: true,
      data: newVariant,
      message: 'Product variant created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('❌ Error creating product variant:', error);
    res.status(500).json({ 
      error: 'Failed to create product variant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/product-variants/:id - Update product variant
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 API: Updating product variant with ID:', id);

    const updateData = createVariantSchema.partial().parse(req.body);

    // Check if variant exists
    const [existingVariant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id));

    if (!existingVariant) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    // Update variant
    const [updatedVariant] = await db
      .update(productVariants)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(productVariants.id, id))
      .returning();

    console.log('✅ Product variant updated successfully:', id);
    res.json({
      success: true,
      data: updatedVariant,
      message: 'Product variant updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('❌ Error updating product variant:', error);
    res.status(500).json({ 
      error: 'Failed to update product variant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/product-variants/:id - Delete product variant
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ API: Deleting product variant with ID:', id);

    // Check if variant exists and has no inventory movements
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id));

    if (!variant) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    // Check for inventory movements
    const [movementCount] = await db
      .select({ count: count() })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, id));

    if (parseInt(movementCount.count.toString()) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete variant',
        message: 'This variant has inventory movement history and cannot be deleted',
        code: 'VARIANT_HAS_MOVEMENTS'
      });
    }

    // Delete variant
    await db
      .delete(productVariants)
      .where(eq(productVariants.id, id));

    console.log('✅ Product variant deleted successfully:', id);
    res.json({ 
      success: true, 
      message: 'Product variant deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('❌ Error deleting product variant:', error);
    res.status(500).json({ 
      error: 'Failed to delete product variant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// 📊 PRODUCT VARIANTS ANALYTICS & REPORTING
// ============================================

// GET /api/product-variants/analytics/stock-summary - Get stock summary across all variants
router.get('/analytics/stock-summary', async (req, res) => {
  try {
    console.log('📊 API: Getting variant stock summary');

    const stockSummary = await db
      .select({
        totalVariants: count(),
        totalStock: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`,
        totalReservedStock: sql<number>`COALESCE(SUM(${productVariants.reservedStock}), 0)`,
        lowStockVariants: sql<number>`COUNT(CASE WHEN ${productVariants.stock} <= COALESCE(${productVariants.reorderPoint}, 10) THEN 1 END)`,
        outOfStockVariants: sql<number>`COUNT(CASE WHEN ${productVariants.stock} = 0 THEN 1 END)`,
        activeVariants: sql<number>`COUNT(CASE WHEN ${productVariants.status} = 'active' THEN 1 END)`,
        inactiveVariants: sql<number>`COUNT(CASE WHEN ${productVariants.status} = 'inactive' THEN 1 END)`,
        discontinuedVariants: sql<number>`COUNT(CASE WHEN ${productVariants.status} = 'discontinued' THEN 1 END)`
      })
      .from(productVariants);

    const summary = stockSummary[0];
    
    res.json({
      success: true,
      data: {
        overview: {
          totalVariants: parseInt(summary.totalVariants.toString()),
          totalStock: parseInt(summary.totalStock.toString()),
          totalReservedStock: parseInt(summary.totalReservedStock.toString()),
          availableStock: parseInt(summary.totalStock.toString()) - parseInt(summary.totalReservedStock.toString())
        },
        stockHealth: {
          lowStockVariants: parseInt(summary.lowStockVariants.toString()),
          outOfStockVariants: parseInt(summary.outOfStockVariants.toString()),
          healthyVariants: parseInt(summary.totalVariants.toString()) - 
                          parseInt(summary.lowStockVariants.toString()) - 
                          parseInt(summary.outOfStockVariants.toString())
        },
        status: {
          active: parseInt(summary.activeVariants.toString()),
          inactive: parseInt(summary.inactiveVariants.toString()),
          discontinued: parseInt(summary.discontinuedVariants.toString())
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting variant stock summary:', error);
    res.status(500).json({ 
      error: 'Failed to get stock summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/product-variants/analytics/low-stock - Get variants with low stock levels
router.get('/analytics/low-stock', async (req, res) => {
  try {
    const { threshold } = req.query;
    console.log('📊 API: Getting low stock variants');

    const lowStockVariants = await db
      .select({
        variant: productVariants,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku
        }
      })
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(
        threshold 
          ? sql`${productVariants.stock} <= ${parseInt(threshold as string)}`
          : sql`${productVariants.stock} <= COALESCE(${productVariants.reorderPoint}, 10)`
      )
      .orderBy(productVariants.stock);

    res.json({
      success: true,
      data: lowStockVariants.map(({ variant, product }) => ({
        ...variant,
        product,
        stockStatus: variant.stock === 0 ? 'out_of_stock' : 
                    variant.stock <= (variant.reorderPoint || 10) ? 'low_stock' : 'normal',
        recommendedReorder: Math.max((variant.maxStock || 100) - variant.stock, 0)
      }))
    });

  } catch (error) {
    console.error('❌ Error getting low stock variants:', error);
    res.status(500).json({ 
      error: 'Failed to get low stock variants',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;