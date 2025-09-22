import { Router } from 'express';
import { aiReviewGenerator, type ReviewSeedingRequest } from '../services/ai-review-generator';
import { storage } from '../storage';

const router = Router();

// POST /api/review-seeding - Generate and seed AI reviews for a product
router.post('/', async (req, res) => {
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

// GET /api/review-seeding/preview - Preview what AI reviews would look like
router.post('/preview', async (req, res) => {
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