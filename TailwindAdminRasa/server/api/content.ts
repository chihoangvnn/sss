import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { storage } from '../storage';
import { postScheduler } from '../services/post-scheduler';
import { facebookPostingService } from '../services/facebook-posting-service';
import { insertContentCategorySchema, insertContentAssetSchema, insertScheduledPostSchema } from '../../shared/schema';

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
router.post('/assets/upload', requireAdminAuth, upload.single('file'), async (req, res) => {
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

// Get all scheduled posts (read-only, requires basic auth)
router.get('/scheduled-posts', requireAuth, async (req, res) => {
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

// Get scheduler status (requires basic auth)
router.get('/scheduler/status', requireAuth, async (req, res) => {
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

export default router;