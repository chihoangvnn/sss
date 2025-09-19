import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { storage } from '../storage';
import { postScheduler } from '../services/post-scheduler';
import { aiContentGenerator } from '../services/ai-content-generator';
import { facebookPostingService } from '../services/facebook-posting-service';
import { insertContentCategorySchema, insertContentAssetSchema, insertScheduledPostSchema, insertContentLibrarySchema, updateContentLibrarySchema } from '../../shared/schema';
import { smartSchedulerService } from '../services/smart-scheduler';
import type { SmartSchedulingConfig } from '../services/smart-scheduler';

const router = Router();

// 🔒 Authentication middleware for content management
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to access content management.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// 🔒 Admin authentication middleware for sensitive operations
const requireAdminAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in as an administrator.",
      code: "AUTH_REQUIRED"
    });
  }
  
  // Additional admin check could be added here if needed
  // For now, any authenticated user is considered admin for content management
  next();
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  },
});

// ===========================================
// CONTENT CATEGORIES
// ===========================================

// Get all content categories (read-only, requires basic auth)
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const categories = await storage.getContentCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new content category (requires admin auth)
router.post('/categories', requireAdminAuth, async (req, res) => {
  try {
    const validatedData = insertContentCategorySchema.parse(req.body);
    const category = await storage.createContentCategory(validatedData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({ error: 'Invalid category data' });
  }
});

// Update content category (requires admin auth)
router.put('/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertContentCategorySchema.partial().parse(req.body);
    const category = await storage.updateContentCategory(id, validatedData);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({ error: 'Invalid category data' });
  }
});

// Delete content category (requires admin auth)
router.delete('/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteContentCategory(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ===========================================
// CONTENT ASSETS
// ===========================================

// Get all content assets (read-only, requires basic auth)
router.get('/assets', requireAuth, async (req, res) => {
  try {
    const categoryId = req.query.category ? parseInt(req.query.category as string) : undefined;
    
    let assets;
    if (categoryId) {
      assets = await storage.getContentAssetsByCategory(categoryId);
    } else {
      assets = await storage.getContentAssets();
    }
    
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get specific content asset (read-only, requires basic auth)
router.get('/assets/:id', requireAuth, async (req, res) => {
  try {
    const asset = await storage.getContentAsset(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Upload new content asset (requires admin auth - sensitive operation)
router.post('/assets/upload', requireAdminAuth, upload.single('file') as any, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { categoryId, altText, caption, tags } = req.body;

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: 'social-content',
        resource_type: 'auto', // Automatically detect file type
        format: 'auto',
        quality: 'auto:good',
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file!.buffer);
    }) as any;

    // Parse tags if provided
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = typeof tags === 'string' ? [tags] : [];
      }
    }

    // Save to database
    const assetData = {
      filename: req.file.originalname,
      originalFilename: req.file.originalname,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.url,
      cloudinarySecureUrl: uploadResult.secure_url,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      width: uploadResult.width || undefined,
      height: uploadResult.height || undefined,
      duration: uploadResult.duration || undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      tags: parsedTags,
      altText: altText || undefined,
      caption: caption || undefined,
    };

    const asset = await storage.createContentAsset(assetData);
    
    res.status(201).json(asset);
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

// Update content asset metadata (requires admin auth)
router.put('/assets/:id', requireAdminAuth, async (req, res) => {
  try {
    const { altText, caption, tags, categoryId } = req.body;
    
    const updateData: any = {};
    if (altText !== undefined) updateData.altText = altText;
    if (caption !== undefined) updateData.caption = caption;
    if (tags !== undefined) updateData.tags = tags;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const asset = await storage.updateContentAsset(req.params.id, updateData);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(400).json({ error: 'Invalid asset data' });
  }
});

// Delete content asset (requires admin auth - sensitive operation)
router.delete('/assets/:id', requireAdminAuth, async (req, res) => {
  try {
    const asset = await storage.getContentAsset(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(asset.cloudinaryPublicId, { 
      resource_type: asset.mimeType.startsWith('video/') ? 'video' : 'image' 
    });

    // Delete from database
    const deleted = await storage.deleteContentAsset(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// ===========================================
// SCHEDULED POSTS
// ===========================================

// Get all scheduled posts (read-only, no auth required for demo mode)
router.get('/scheduled-posts', async (req, res) => {
  try {
    const socialAccountId = req.query.account as string;
    
    let posts;
    if (socialAccountId) {
      posts = await storage.getScheduledPostsByAccount(socialAccountId);
    } else {
      posts = await storage.getScheduledPosts();
    }
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled posts' });
  }
});

// Get upcoming scheduled posts (read-only, requires basic auth)
router.get('/scheduled-posts/upcoming', requireAuth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const posts = await postScheduler.getUpcomingPosts(limit);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching upcoming posts:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming posts' });
  }
});

// Create new scheduled post (requires admin auth - sensitive operation)
router.post('/scheduled-posts', requireAdminAuth, async (req, res) => {
  try {
    const validatedData = insertScheduledPostSchema.parse({
      ...req.body,
      scheduledTime: new Date(req.body.scheduledTime),
    });
    
    const post = await storage.createScheduledPost(validatedData);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    res.status(400).json({ error: 'Invalid post data' });
  }
});

// Update scheduled post (requires admin auth)
router.put('/scheduled-posts/:id', requireAdminAuth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.scheduledTime) {
      updateData.scheduledTime = new Date(updateData.scheduledTime);
    }
    
    const post = await storage.updateScheduledPost(req.params.id, updateData);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    res.status(400).json({ error: 'Invalid post data' });
  }
});

// Delete scheduled post (requires admin auth - sensitive operation)
router.delete('/scheduled-posts/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteScheduledPost(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Manually trigger a scheduled post (requires admin auth - highly sensitive)
router.post('/scheduled-posts/:id/trigger', requireAdminAuth, async (req, res) => {
  try {
    const result = await postScheduler.triggerPost(req.params.id);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ message: 'Post triggered successfully' });
  } catch (error) {
    console.error('Error triggering post:', error);
    res.status(500).json({ error: 'Failed to trigger post' });
  }
});

// Get scheduler status (read-only, no auth required for demo mode)
router.get('/scheduler/status', async (req, res) => {
  try {
    const status = postScheduler.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

// Start/stop scheduler (requires admin auth - highly sensitive system operation)
router.post('/scheduler/:action', requireAdminAuth, async (req, res) => {
  try {
    const { action } = req.params;
    
    if (action === 'start') {
      postScheduler.start();
      res.json({ message: 'Scheduler started' });
    } else if (action === 'stop') {
      postScheduler.stop();
      res.json({ message: 'Scheduler stopped' });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    res.status(500).json({ error: 'Failed to control scheduler' });
  }
});

// ===========================================
// CONTENT LIBRARY
// ===========================================

// Get all content library items with optional filtering (demo mode - no auth)
router.get('/library', async (req, res) => {
  try {
    const { tags, status, contentType, priority } = req.query;
    
    const filters: any = {};
    if (tags && typeof tags === 'string') {
      filters.tags = tags.split(',').map(tag => tag.trim());
    }
    if (status && typeof status === 'string') {
      filters.status = status;
    }
    if (contentType && typeof contentType === 'string') {
      filters.contentType = contentType;
    }
    if (priority && typeof priority === 'string') {
      filters.priority = priority;
    }

    const items = await storage.getContentLibraryItems(filters);
    res.json(items);
  } catch (error) {
    console.error('Error fetching content library items:', error);
    res.status(500).json({ error: 'Failed to fetch content library items' });
  }
});

// Get specific content library item by ID (requires basic auth)
router.get('/library/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await storage.getContentLibraryItem(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Content library item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching content library item:', error);
    res.status(500).json({ error: 'Failed to fetch content library item' });
  }
});

// Create new content library item (demo mode - no auth)
router.post('/library', async (req, res) => {
  try {
    const validatedData = insertContentLibrarySchema.parse(req.body);
    const newItem = await storage.createContentLibraryItem(validatedData);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating content library item:', error);
    res.status(400).json({ error: 'Invalid content library item data' });
  }
});

// Update content library item (demo mode - no auth)
router.put('/library/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateContentLibrarySchema.parse(req.body);
    
    const updatedItem = await storage.updateContentLibraryItem(id, validatedData);
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Content library item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating content library item:', error);
    res.status(400).json({ error: 'Invalid content library item data' });
  }
});

// Delete content library item (demo mode - no auth)
router.delete('/library/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteContentLibraryItem(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Content library item not found' });
    }
    
    res.json({ message: 'Content library item deleted successfully' });
  } catch (error) {
    console.error('Error deleting content library item:', error);
    res.status(500).json({ error: 'Failed to delete content library item' });
  }
});

// Add AI variation to content library item (requires admin auth)
router.post('/library/:id/variations', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tone, style } = req.body;
    
    if (!content || !tone || !style) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, tone, style' 
      });
    }
    
    const updatedItem = await storage.addAIVariation(id, { content, tone, style });
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Content library item not found' });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error adding AI variation:', error);
    res.status(500).json({ error: 'Failed to add AI variation' });
  }
});

// Increment content usage count (requires basic auth)
router.post('/library/:id/usage', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.incrementContentUsage(id);
    res.json({ message: 'Usage count incremented' });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ error: 'Failed to increment usage count' });
  }
});

// Get content library items by tags (requires basic auth)
router.get('/library/tags/:tagIds', requireAuth, async (req, res) => {
  try {
    const { tagIds } = req.params;
    const tagIdArray = tagIds.split(',').map(tag => tag.trim());
    
    const items = await storage.getContentLibraryByTags(tagIdArray);
    res.json(items);
  } catch (error) {
    console.error('Error fetching content by tags:', error);
    res.status(500).json({ error: 'Failed to fetch content by tags' });
  }
});

// Batch create content library items (demo mode - no auth)
router.post('/library/batch', async (req, res) => {
  try {
    const { variations } = req.body;
    
    if (!variations || !Array.isArray(variations)) {
      return res.status(400).json({ error: 'Variations array is required' });
    }

    const createdItems = [];
    for (const variation of variations) {
      try {
        const validatedData = insertContentLibrarySchema.parse(variation);
        const newItem = await storage.createContentLibraryItem(validatedData);
        createdItems.push(newItem);
      } catch (error) {
        console.error('Error creating variation:', error);
        // Continue with other variations
      }
    }

    res.status(201).json({
      totalSaved: createdItems.length,
      items: createdItems
    });
  } catch (error) {
    console.error('Error batch creating content library items:', error);
    res.status(500).json({ error: 'Failed to batch create content library items' });
  }
});

// Get content library items by priority (requires basic auth)
router.get('/library/priority/:priority', requireAuth, async (req, res) => {
  try {
    const { priority } = req.params;
    
    if (!['high', 'normal', 'low'].includes(priority)) {
      return res.status(400).json({ 
        error: 'Invalid priority. Must be: high, normal, or low' 
      });
    }
    
    const items = await storage.getContentLibraryByPriority(priority);
    res.json(items);
  } catch (error) {
    console.error('Error fetching content by priority:', error);
    res.status(500).json({ error: 'Failed to fetch content by priority' });
  }
});

// ===========================================
// SMART SCHEDULER ENGINE API
// ===========================================

// Generate smart schedule from Content Library (requires admin auth)
router.post('/scheduler/smart-generate', requireAdminAuth, async (req, res) => {
  try {
    const { targetTime, platforms, tags, priority, accountSelection, maxPostsPerAccount } = req.body;
    
    if (!targetTime || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ 
        error: 'Missing required fields: targetTime, platforms (array)' 
      });
    }

    const scheduledPosts = await postScheduler.generateSmartSchedule({
      targetTime: new Date(targetTime),
      platforms,
      tags,
      priority,
      accountSelection: accountSelection || 'round-robin',
      maxPostsPerAccount: maxPostsPerAccount || 1
    });
    
    res.status(201).json({
      message: `Generated ${scheduledPosts.length} smart scheduled posts`,
      scheduledPosts,
      summary: {
        totalPosts: scheduledPosts.length,
        platforms: Array.from(new Set(scheduledPosts.map(p => p.platform))),
        accounts: Array.from(new Set(scheduledPosts.map(p => p.socialAccountId)))
      }
    });
  } catch (error) {
    console.error('Error generating smart schedule:', error);
    res.status(500).json({ error: 'Failed to generate smart schedule' });
  }
});

// Batch generate smart schedules for multiple time slots (requires admin auth)
router.post('/scheduler/smart-batch', requireAdminAuth, async (req, res) => {
  try {
    const { startTime, endTime, intervalHours, platforms, tags, priority, accountSelection } = req.body;
    
    if (!startTime || !endTime || !intervalHours || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ 
        error: 'Missing required fields: startTime, endTime, intervalHours, platforms (array)' 
      });
    }

    const scheduledPosts = await postScheduler.batchGenerateSmartSchedule({
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      intervalHours,
      platforms,
      tags,
      priority,
      accountSelection: accountSelection || 'round-robin'
    });
    
    res.status(201).json({
      message: `Batch generated ${scheduledPosts.length} smart scheduled posts`,
      scheduledPosts,
      summary: {
        totalPosts: scheduledPosts.length,
        platforms: Array.from(new Set(scheduledPosts.map(p => p.platform))),
        accounts: Array.from(new Set(scheduledPosts.map(p => p.socialAccountId))),
        timeSlots: Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / (intervalHours * 60 * 60 * 1000))
      }
    });
  } catch (error) {
    console.error('Error batch generating smart schedule:', error);
    res.status(500).json({ error: 'Failed to batch generate smart schedule' });
  }
});

// Preview smart content selection without creating posts (requires basic auth)
router.post('/scheduler/smart-preview', requireAuth, async (req, res) => {
  try {
    const { platforms, tags, priority, accountSelection, maxPostsPerAccount } = req.body;
    
    if (!platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ 
        error: 'Missing required field: platforms (array)' 
      });
    }

    // Get smart content selection
    const contentItems = await postScheduler.selectSmartContent({
      tags,
      priority,
      platforms,
      excludeRecentlyUsed: true,
      limit: 20
    });

    // Get account selection
    const selectedAccounts = await postScheduler.selectAccountsForDistribution({
      platforms,
      selectionMode: accountSelection || 'round-robin',
      maxAccountsPerPlatform: maxPostsPerAccount || 1,
      excludeInactive: true
    });

    res.json({
      contentItems: contentItems.map(item => ({
        id: item.id,
        content: item.baseContent?.substring(0, 100) + (item.baseContent && item.baseContent.length > 100 ? '...' : ''),
        priority: item.priority,
        tags: item.tagIds,
        platforms: item.platforms,
        usageCount: item.usageCount,
        lastUsed: item.lastUsed
      })),
      selectedAccounts: selectedAccounts.map(account => ({
        id: account.id,
        platform: account.platform,
        name: account.name,
        isActive: account.isActive,
        connected: account.connected,
        lastPost: account.lastPost
      })),
      estimatedPosts: Math.min(contentItems.length, selectedAccounts.length),
      distribution: selectedAccounts.reduce((acc, account) => {
        acc[account.platform] = (acc[account.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error previewing smart selection:', error);
    res.status(500).json({ error: 'Failed to preview smart selection' });
  }
});

// Get content performance analytics (requires basic auth)
router.get('/analytics/content/:contentId', requireAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const analytics = await postScheduler.getContentAnalytics(contentId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching content analytics:', error);
    res.status(500).json({ error: 'Failed to fetch content analytics' });
  }
});

// ===========================================
// AI CONTENT VARIATIONS API
// ===========================================

// Generate content variations using AI (requires admin auth)
router.post('/ai/variations', async (req, res) => {
  try {
    const { baseContent, platforms, tones, variationsPerPlatform, includeHashtags, targetAudience, contentType } = req.body;
    
    if (!baseContent || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ 
        error: 'Missing required fields: baseContent, platforms (array)' 
      });
    }

    const result = await aiContentGenerator.generateVariations({
      baseContent,
      platforms,
      tones,
      variationsPerPlatform: variationsPerPlatform || 2,
      includeHashtags: includeHashtags !== false, // Default to true
      targetAudience,
      contentType
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error generating AI variations:', error);
    res.status(500).json({ error: `Failed to generate AI variations: ${error}` });
  }
});

// Optimize single content for specific platform (test endpoint - no auth for now)  
router.post('/ai/optimize', async (req, res) => {
  try {
    const { content, platform, tone } = req.body;
    
    if (!content || !platform) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, platform' 
      });
    }

    const optimized = await aiContentGenerator.optimizeForPlatform(
      content,
      platform,
      tone || 'professional'
    );
    
    res.json(optimized);
  } catch (error) {
    console.error('Error optimizing content:', error);
    res.status(500).json({ error: `Failed to optimize content: ${error}` });
  }
});

// Generate hashtags for content (test endpoint - no auth for now)
router.post('/ai/hashtags', async (req, res) => {
  try {
    const { content, platform, count } = req.body;
    
    if (!content || !platform) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, platform' 
      });
    }

    const hashtags = await aiContentGenerator.generateHashtags(
      content,
      platform,
      count || 5
    );
    
    res.json({ hashtags, count: hashtags.length });
  } catch (error) {
    console.error('Error generating hashtags:', error);
    res.status(500).json({ error: `Failed to generate hashtags: ${error}` });
  }
});

// Generate variations and save to Content Library (requires admin auth)
router.post('/ai/variations/save', async (req, res) => {
  try {
    const { baseContent, platforms, tones, variationsPerPlatform, includeHashtags, targetAudience, contentType, priority, tagIds } = req.body;
    
    if (!baseContent || !platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ 
        error: 'Missing required fields: baseContent, platforms (array)' 
      });
    }

    // Generate AI variations
    const aiResult = await aiContentGenerator.generateVariations({
      baseContent,
      platforms,
      tones,
      variationsPerPlatform: variationsPerPlatform || 2,
      includeHashtags: includeHashtags !== false,
      targetAudience,
      contentType
    });

    // Save each variation to Content Library
    const savedItems = [];
    for (const variation of aiResult.variations) {
      try {
        const contentLibraryItem = await storage.createContentLibraryItem({
          title: `AI Generated - ${variation.platform} (${variation.tone})`,
          baseContent: variation.variation,
          contentType: 'text',
          platforms: [variation.platform],
          priority: priority || 'normal',
          status: 'active',
          tagIds: tagIds || []
        });
        
        savedItems.push(contentLibraryItem);
      } catch (saveError) {
        console.error(`Failed to save variation for ${variation.platform}:`, saveError);
      }
    }

    res.status(201).json({
      message: `Generated and saved ${savedItems.length} content variations`,
      aiResult,
      savedItems: savedItems.map(item => ({
        id: item.id,
        title: item.title,
        platform: item.platforms?.[0],
        content: item.baseContent?.substring(0, 100) + (item.baseContent && item.baseContent.length > 100 ? '...' : '')
      })),
      totalGenerated: aiResult.totalGenerated,
      totalSaved: savedItems.length
    });
  } catch (error) {
    console.error('Error generating and saving AI variations:', error);
    res.status(500).json({ error: `Failed to generate and save variations: ${error}` });
  }
});

// =====================================================================
// 🏷️ TAGS API ENDPOINTS
// =====================================================================

/**
 * GET /api/content/tags
 * Get all unified tags
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await storage.getUnifiedTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tags',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================================
// 🎯 SMART SCHEDULER API ENDPOINTS
// =====================================================================

/**
 * POST /api/content/smart-scheduler/preview
 * Generate preview of smart scheduling distribution
 */
router.post('/smart-scheduler/preview', async (req, res) => {
  try {
    console.log('🎯 Smart Scheduler Preview API called');

    const config: SmartSchedulingConfig = req.body;
    
    // Validate required fields
    if (!config.selectedTags || config.selectedTags.length === 0) {
      return res.status(400).json({
        error: 'Selected tags are required',
        details: 'Please select at least one tag for content filtering'
      });
    }

    if (!config.selectedFanpages || config.selectedFanpages.length === 0) {
      return res.status(400).json({
        error: 'Selected fanpages are required',
        details: 'Please select at least one fanpage for distribution'
      });
    }

    if (!config.contentTypes || config.contentTypes.length === 0) {
      return res.status(400).json({
        error: 'Content types are required',
        details: 'Please select at least one content type (image, video, or text)'
      });
    }

    if (!config.schedulingPeriod?.startDate || !config.schedulingPeriod?.endDate) {
      return res.status(400).json({
        error: 'Scheduling period is required',
        details: 'Please provide start and end dates for the scheduling period'
      });
    }

    // Generate preview
    const preview = await smartSchedulerService.generatePreview(config);
    
    console.log(`✅ Generated preview with ${preview.length} matches`);
    
    res.json(preview);

  } catch (error) {
    console.error('❌ Smart Scheduler Preview error:', error);
    
    res.status(500).json({
      error: 'Failed to generate smart scheduling preview',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/content/smart-scheduler/schedule
 * Execute smart scheduling and create scheduled posts
 */
router.post('/smart-scheduler/schedule', requireAdminAuth, async (req, res) => {
  try {
    console.log('🚀 Smart Scheduler Schedule API called');

    const config: SmartSchedulingConfig = req.body;
    
    // Same validation as preview
    if (!config.selectedTags || config.selectedTags.length === 0) {
      return res.status(400).json({
        error: 'Selected tags are required',
        details: 'Please select at least one tag for content filtering'
      });
    }

    if (!config.selectedFanpages || config.selectedFanpages.length === 0) {
      return res.status(400).json({
        error: 'Selected fanpages are required',
        details: 'Please select at least one fanpage for distribution'
      });
    }

    if (!config.contentTypes || config.contentTypes.length === 0) {
      return res.status(400).json({
        error: 'Content types are required',
        details: 'Please select at least one content type (image, video, or text)'
      });
    }

    if (!config.schedulingPeriod?.startDate || !config.schedulingPeriod?.endDate) {
      return res.status(400).json({
        error: 'Scheduling period is required',
        details: 'Please provide start and end dates for the scheduling period'
      });
    }

    if (!config.postsPerDay || config.postsPerDay < 1) {
      return res.status(400).json({
        error: 'Posts per day must be at least 1',
        details: 'Please specify a valid number of posts per day'
      });
    }

    // Execute smart scheduling
    const result = await smartSchedulerService.executeSmartScheduling(config);
    
    console.log(`✅ Smart scheduling completed: ${result.totalPosts} posts created`);
    
    res.json({
      success: true,
      message: 'Smart scheduling completed successfully',
      totalPosts: result.totalPosts,
      fanpageCount: result.fanpageCount,
      contentMatched: result.contentMatched,
      avgScore: result.avgScore,
      timeDistribution: result.timeDistribution,
      summary: {
        scheduledPosts: result.totalPosts,
        fanpagesUsed: result.fanpageCount,
        contentItemsUsed: result.contentMatched,
        averageMatchScore: Math.round(result.avgScore),
        schedulingPeriod: {
          from: config.schedulingPeriod.startDate,
          to: config.schedulingPeriod.endDate
        },
        distributionMode: config.distributionMode
      }
    });

  } catch (error) {
    console.error('❌ Smart Scheduler Schedule error:', error);
    
    res.status(500).json({
      error: 'Failed to execute smart scheduling',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;