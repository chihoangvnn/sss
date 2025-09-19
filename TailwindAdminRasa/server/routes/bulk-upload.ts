import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { storage } from '../storage';

const router = Router();

// Configure multer for file uploads (temporary storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Validation schema for bulk upload posts
const BulkPostSchema = z.object({
  caption: z.string().min(1, 'Caption is required').max(2200, 'Caption too long'),
  hashtags: z.array(z.string()).max(30, 'Too many hashtags').default([]),
  platform: z.enum(['facebook', 'instagram', 'tiktok']),
  socialAccountId: z.string().uuid('Invalid social account ID'),
  scheduledTime: z.coerce.date().refine(date => date > new Date(), 'Scheduled time must be in the future'),
  timezone: z.string().default('Asia/Ho_Chi_Minh'),
  assetIds: z.array(z.string()).default([])
});

const BulkUploadSchema = z.object({
  posts: z.array(BulkPostSchema).min(1, 'At least one post is required').max(100, 'Too many posts (max 100)')
});

// Authentication middleware for bulk upload
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to perform bulk upload.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// POST /api/content/bulk-upload - Create multiple scheduled posts
router.post('/bulk-upload', requireAuth, async (req, res) => {
  try {
    const validation = BulkUploadSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { posts } = validation.data;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Fetch all social accounts once for efficiency
    const allSocialAccounts = await storage.getAllSocialAccounts();
    const socialAccountMap = new Map(allSocialAccounts.map(acc => [acc.id, acc]));

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      
      try {
        // Verify social account exists (using pre-fetched map)
        const socialAccount = socialAccountMap.get(post.socialAccountId);

        if (!socialAccount) {
          results.push({
            index: i + 1,
            success: false,
            error: `Social account not found: ${post.socialAccountId}`
          });
          errorCount++;
          continue;
        }

        // Create scheduled post
        const newPost = await storage.createScheduledPost({
          caption: post.caption,
          hashtags: post.hashtags,
          assetIds: post.assetIds,
          socialAccountId: post.socialAccountId,
          platform: post.platform,
          scheduledTime: post.scheduledTime,
          timezone: post.timezone,
          status: 'scheduled'
        });

        results.push({
          index: i + 1,
          success: true,
          postId: newPost.id
        });
        successCount++;

      } catch (error) {
        console.error(`Error creating post ${i + 1}:`, error);
        results.push({
          index: i + 1,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
      }
    }

    res.json({
      success: successCount > 0,
      message: `Bulk upload completed: ${successCount} successful, ${errorCount} failed`,
      successCount,
      errorCount,
      totalCount: posts.length,
      results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/content/bulk-upload/file - Upload and parse CSV/Excel file
router.post('/bulk-upload/file', requireAuth, upload.single('file') as any, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    let parsedData: any[] = [];

    if (fileExtension === 'csv') {
      // Parse CSV using server-side parser
      const csvContent = fileBuffer.toString('utf-8');
      const Papa = require('papaparse');
      
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'CSV parsing failed',
          errors: parseResult.errors
        });
      }

      parsedData = parseResult.data;

    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel file
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      parsedData = XLSX.utils.sheet_to_json(worksheet);

    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Only CSV and Excel files are supported.'
      });
    }

    // Validate and transform data
    const validationErrors: any[] = [];
    const validPosts: any[] = [];

    parsedData.forEach((row, index) => {
      try {
        // Map row data to expected format
        const postData = {
          caption: row.caption || row.Caption || '',
          hashtags: typeof row.hashtags === 'string' 
            ? row.hashtags.split(/[,\s]+/).filter(Boolean) 
            : [],
          platform: (row.platform || row.Platform || '').toLowerCase(),
          socialAccountId: row.socialAccountId || row.accountId || '',
          scheduledTime: new Date(row.scheduledTime || row.ScheduledTime || ''),
          timezone: row.timezone || row.Timezone || 'Asia/Ho_Chi_Minh',
          assetIds: []
        };

        // Basic validation
        const validation = BulkPostSchema.safeParse(postData);
        if (validation.success) {
          validPosts.push(validation.data);
        } else {
          validationErrors.push({
            row: index + 1,
            errors: validation.error.errors
          });
        }

      } catch (error) {
        validationErrors.push({
          row: index + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    res.json({
      success: true,
      message: `File parsed successfully. ${validPosts.length} valid posts, ${validationErrors.length} errors`,
      parsedCount: parsedData.length,
      validCount: validPosts.length,
      errorCount: validationErrors.length,
      validPosts: validPosts.slice(0, 50), // Return first 50 for preview
      errors: validationErrors
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process uploaded file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;