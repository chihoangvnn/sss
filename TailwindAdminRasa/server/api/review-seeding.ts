import { Router } from 'express';
import { aiReviewGenerator, type ReviewSeedingRequest } from '../services/ai-review-generator';
import { storage } from '../storage';

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
      message: "Only administrators can seed reviews",
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

// 🚦 Rate limiting for AI review seeding to prevent API abuse
const reviewSeedingRateLimit = new Map<string, { count: number; resetTime: number; lastRequest: number }>();
const SEEDING_RATE_LIMIT_WINDOW = 300000; // 5 minutes
const SEEDING_RATE_LIMIT_MAX = 10; // 10 seeding requests per 5 minutes per IP
const SEEDING_MIN_INTERVAL = 10000; // 10 seconds between requests

const reviewSeedingRateLimitMiddleware = (req: any, res: any, next: any) => {
  // For development, allow all requests (bypass rate limiting)
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  
  const clientData = reviewSeedingRateLimit.get(clientIP);
  
  // Check if this is a new client or if the window has reset
  if (!clientData || now > clientData.resetTime) {
    reviewSeedingRateLimit.set(clientIP, { 
      count: 1, 
      resetTime: now + SEEDING_RATE_LIMIT_WINDOW,
      lastRequest: now
    });
    next();
    return;
  }
  
  // Check minimum interval between requests (prevents spam)
  if (now - clientData.lastRequest < SEEDING_MIN_INTERVAL) {
    const retryAfter = Math.ceil((SEEDING_MIN_INTERVAL - (now - clientData.lastRequest)) / 1000);
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: `Please wait ${retryAfter} seconds before making another seeding request.`,
      code: "TOO_FREQUENT",
      retryAfter
    });
  }
  
  // Check max requests per window
  if (clientData.count >= SEEDING_RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: `Too many AI seeding requests. Maximum ${SEEDING_RATE_LIMIT_MAX} requests per ${SEEDING_RATE_LIMIT_WINDOW / 60000} minutes.`,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter
    });
  }
  
  // Update counters
  clientData.count++;
  clientData.lastRequest = now;
  next();
};

// POST /api/review-seeding - Generate and seed AI reviews for a product
router.post('/', requireAdminAuth, requireCSRFToken, reviewSeedingRateLimitMiddleware, async (req, res) => {
  try {
    const {
      productId,
      quantity = 10,
      ratingDistribution,
      includeImages = false,
      customPrompt,
      autoApprove = false
    }: ReviewSeedingRequest & { autoApprove?: boolean } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({
        error: 'Missing required field: productId'
      });
    }

    if (quantity < 1 || quantity > 50) {
      return res.status(400).json({
        error: 'Quantity must be between 1 and 50 reviews'
      });
    }

    // Verify product exists
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    console.log(`🤖 AI Review Seeding: Generating ${quantity} reviews for product "${product.name}"`);

    // Generate reviews using AI
    const aiResponse = await aiReviewGenerator.generateReviews({
      productId,
      quantity,
      ratingDistribution,
      includeImages,
      customPrompt
    }, product);

    // Save generated reviews to database
    const savedReviews = [];
    let errorCount = 0;

    for (const generatedReview of aiResponse.reviews) {
      try {
        const reviewData = {
          productId,
          customerId: null, // AI-generated reviews don't have real customer IDs
          customerName: generatedReview.customerName,
          customerAvatar: generatedReview.customerAvatar || null,
          rating: generatedReview.rating,
          title: generatedReview.title,
          content: generatedReview.content,
          isVerified: generatedReview.isVerified,
          isApproved: autoApprove, // Reviews can be auto-approved or require manual approval
          helpfulCount: generatedReview.helpfulCount,
          images: [] // No images for now, can be enhanced later
        };

        const savedReview = await storage.createProductReview(reviewData);
        savedReviews.push(savedReview);
      } catch (error) {
        console.error('Error saving generated review:', error);
        errorCount++;
      }
    }

    const response = {
      success: true,
      message: `Successfully generated and saved ${savedReviews.length} AI reviews for "${product.name}"`,
      productId,
      productName: product.name,
      generated: aiResponse.generated,
      saved: savedReviews.length,
      errors: errorCount,
      autoApproved: autoApprove,
      reviews: savedReviews.map(review => ({
        id: review.id,
        customerName: review.customerName,
        rating: review.rating,
        title: review.title,
        content: review.content.substring(0, 100) + (review.content.length > 100 ? '...' : ''),
        isApproved: review.isApproved,
        createdAt: review.createdAt
      }))
    };

    console.log(`✅ AI Review Seeding completed: ${savedReviews.length}/${quantity} reviews saved`);
    res.json(response);

  } catch (error) {
    console.error('Error in AI review seeding:', error);
    res.status(500).json({
      error: 'Failed to generate AI reviews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/review-seeding/preview - Preview what AI reviews would look like (requires admin access)
router.post('/preview', requireAdminAuth, requireCSRFToken, reviewSeedingRateLimitMiddleware, async (req, res) => {
  try {
    const {
      productId,
      quantity = 3,
      ratingDistribution,
      customPrompt
    }: ReviewSeedingRequest = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Missing required field: productId'
      });
    }

    // Verify product exists
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    console.log(`👀 AI Review Preview: Generating ${quantity} preview reviews for "${product.name}"`);

    // Generate preview reviews (small quantity)
    const previewQuantity = Math.min(quantity, 5);
    const aiResponse = await aiReviewGenerator.generateReviews({
      productId,
      quantity: previewQuantity,
      ratingDistribution,
      customPrompt
    }, product);

    res.json({
      success: true,
      message: `Preview of ${previewQuantity} AI-generated reviews`,
      productId,
      productName: product.name,
      generated: aiResponse.generated,
      reviews: aiResponse.reviews.map(review => ({
        customerName: review.customerName,
        rating: review.rating,
        title: review.title,
        content: review.content,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount
      }))
    });

  } catch (error) {
    console.error('Error in AI review preview:', error);
    res.status(500).json({
      error: 'Failed to generate AI review preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;