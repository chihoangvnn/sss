import { Router } from 'express';
import { storage } from '../storage';
import { eq, desc, and, count, ilike, or, inArray, sql } from 'drizzle-orm';
import { productReviews, products } from '@shared/schema';
import { db } from '../db';

const router = Router();

// 🔒 Admin-only authentication middleware
const requireAdminAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  // Check session first
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Authentication required", 
      message: "Please log in to access this resource",
      code: "AUTH_REQUIRED"
    });
  }
  
  // Check admin role
  if (!req.session.isAdmin && req.session.role !== 'admin') {
    return res.status(403).json({ 
      error: "Admin access required", 
      message: "Only administrators can manage reviews",
      code: "ADMIN_REQUIRED"
    });
  }
  
  next();
};

// 🛡️ CSRF protection for destructive operations
const requireCSRFToken = (req: any, res: any, next: any) => {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;
  const sessionCSRF = req.session.csrfToken;
  
  if (!csrfToken || !sessionCSRF || csrfToken !== sessionCSRF) {
    return res.status(403).json({ 
      error: "CSRF token invalid", 
      message: "Invalid or missing CSRF token",
      code: "CSRF_REQUIRED"
    });
  }
  
  next();
};

// GET /api/admin/reviews - List all reviews with filtering and pagination
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      productId,
      rating,
      approvalStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    console.log(`📋 Admin Reviews: Fetching page ${pageNum} with filters:`, {
      productId, rating, approvalStatus, search
    });

    // Build where conditions
    const whereConditions = [];

    if (productId) {
      whereConditions.push(eq(productReviews.productId, productId as string));
    }

    if (rating) {
      whereConditions.push(eq(productReviews.rating, parseInt(rating as string)));
    }

    if (approvalStatus === 'approved') {
      whereConditions.push(eq(productReviews.isApproved, true));
    } else if (approvalStatus === 'pending') {
      whereConditions.push(eq(productReviews.isApproved, false));
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(productReviews.customerName, `%${search}%`),
          ilike(productReviews.title, `%${search}%`),
          ilike(productReviews.content, `%${search}%`),
          ilike(products.name, `%${search}%`)
        )
      );
    }

    // Build sort condition
    const sortColumn = sortBy === 'rating' ? productReviews.rating :
                      sortBy === 'helpfulCount' ? productReviews.helpfulCount :
                      productReviews.createdAt;
    
    const orderBy = sortOrder === 'asc' ? sortColumn : desc(sortColumn);

    // Get reviews with product information
    const reviewsQuery = db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        productName: products.name,
        customerId: productReviews.customerId,
        customerName: productReviews.customerName,
        customerAvatar: productReviews.customerAvatar,
        rating: productReviews.rating,
        title: productReviews.title,
        content: productReviews.content,
        isVerified: productReviews.isVerified,
        isApproved: productReviews.isApproved,
        helpfulCount: productReviews.helpfulCount,
        images: productReviews.images,
        createdAt: productReviews.createdAt,
        updatedAt: productReviews.updatedAt
      })
      .from(productReviews)
      .leftJoin(products, eq(productReviews.productId, products.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    const reviews = await reviewsQuery;

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(productReviews)
      .leftJoin(products, eq(productReviews.productId, products.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const [{ count: totalCount }] = await totalQuery;

    // Get statistics
    const statsQuery = await db
      .select({
        total: count(),
        approved: count(sql`CASE WHEN ${productReviews.isApproved} = true THEN 1 END`),
        pending: count(sql`CASE WHEN ${productReviews.isApproved} = false THEN 1 END`),
        avgRating: sql<number>`ROUND(AVG(${productReviews.rating}), 2)`,
        star5: count(sql`CASE WHEN ${productReviews.rating} = 5 THEN 1 END`),
        star4: count(sql`CASE WHEN ${productReviews.rating} = 4 THEN 1 END`),
        star3: count(sql`CASE WHEN ${productReviews.rating} = 3 THEN 1 END`),
        star2: count(sql`CASE WHEN ${productReviews.rating} = 2 THEN 1 END`),
        star1: count(sql`CASE WHEN ${productReviews.rating} = 1 THEN 1 END`)
      })
      .from(productReviews);

    const [stats] = statsQuery;

    const response = {
      success: true,
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      },
      statistics: {
        total: stats.total,
        approved: stats.approved,
        pending: stats.pending,
        avgRating: stats.avgRating,
        ratingDistribution: {
          star5: stats.star5,
          star4: stats.star4,
          star3: stats.star3,
          star2: stats.star2,
          star1: stats.star1
        }
      },
      filters: { productId, rating, approvalStatus, search, sortBy, sortOrder }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({
      error: 'Failed to fetch reviews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/admin/reviews/:id - Update review (approval status, moderation)
router.put('/:id', requireAdminAuth, requireCSRFToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`📝 Admin Reviews: Updating review ${id} with:`, updateData);

    // Validate update data
    const allowedFields = ['isApproved', 'title', 'content', 'rating', 'isVerified'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        allowedFields
      });
    }

    // Update the review
    const updatedReview = await storage.updateProductReview(id, filteredData);

    if (!updatedReview) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    console.log(`✅ Admin Reviews: Successfully updated review ${id}`);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      error: 'Failed to update review',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/admin/reviews/:id - Delete a single review
router.delete('/:id', requireAdminAuth, requireCSRFToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Admin Reviews: Deleting review ${id}`);

    const deleted = await storage.deleteProductReview(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Review not found'
      });
    }

    console.log(`✅ Admin Reviews: Successfully deleted review ${id}`);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      error: 'Failed to delete review',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/reviews/bulk-approve - Bulk approve reviews
router.post('/bulk-approve', requireAdminAuth, requireCSRFToken, async (req, res) => {
  try {
    const { reviewIds } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        error: 'reviewIds must be a non-empty array'
      });
    }

    console.log(`✅ Admin Reviews: Bulk approving ${reviewIds.length} reviews`);

    // Update multiple reviews to approved status
    const result = await db
      .update(productReviews)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(inArray(productReviews.id, reviewIds));

    res.json({
      success: true,
      message: `Successfully approved ${result.rowCount} reviews`,
      updated: result.rowCount
    });

  } catch (error) {
    console.error('Error bulk approving reviews:', error);
    res.status(500).json({
      error: 'Failed to bulk approve reviews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/reviews/bulk-delete - Bulk delete reviews
router.post('/bulk-delete', requireAdminAuth, requireCSRFToken, async (req, res) => {
  try {
    const { reviewIds, productId, filterBy } = req.body;

    let deletedCount = 0;

    if (reviewIds && Array.isArray(reviewIds) && reviewIds.length > 0) {
      // Delete specific reviews by IDs
      console.log(`🗑️ Admin Reviews: Bulk deleting ${reviewIds.length} reviews by IDs`);
      
      const result = await db
        .delete(productReviews)
        .where(inArray(productReviews.id, reviewIds));
      
      deletedCount = result.rowCount || 0;
    } else if (productId && filterBy) {
      // Delete reviews by filter criteria
      console.log(`🗑️ Admin Reviews: Bulk deleting reviews for product ${productId} with filter:`, filterBy);
      
      const whereConditions = [eq(productReviews.productId, productId)];
      
      if (filterBy.approvalStatus === 'approved') {
        whereConditions.push(eq(productReviews.isApproved, true));
      } else if (filterBy.approvalStatus === 'pending') {
        whereConditions.push(eq(productReviews.isApproved, false));
      }
      
      if (filterBy.rating) {
        whereConditions.push(eq(productReviews.rating, parseInt(filterBy.rating)));
      }
      
      if (filterBy.customerId === null) {
        // Delete AI-generated reviews (no customer ID)
        whereConditions.push(sql`${productReviews.customerId} IS NULL`);
      }
      
      const result = await db
        .delete(productReviews)
        .where(and(...whereConditions));
      
      deletedCount = result.rowCount || 0;
    } else {
      return res.status(400).json({
        error: 'Either reviewIds array or (productId + filterBy) must be provided'
      });
    }

    console.log(`✅ Admin Reviews: Successfully deleted ${deletedCount} reviews`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} reviews`,
      deleted: deletedCount
    });

  } catch (error) {
    console.error('Error bulk deleting reviews:', error);
    res.status(500).json({
      error: 'Failed to bulk delete reviews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;