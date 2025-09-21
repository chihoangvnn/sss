import { Router } from 'express';
import { DatabaseStorage } from '../storage';
import { SocialAccount, ContentLibrary, ScheduledPost } from '../../shared/schema';

// Simple auth middleware for development
const requireAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests (production would check session)
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

const router = Router();

// Simple automation endpoint - tự động tạo lịch đăng dựa trên platform, số bài, số page
router.post('/simple', requireAuth, async (req, res) => {
  try {
    const { platform, numberOfPosts, numberOfPages, startDate, endDate } = req.body;
    
    // Validate input
    if (!platform || !numberOfPosts || !numberOfPages || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: platform, numberOfPosts, numberOfPages, startDate, endDate' 
      });
    }

    const storage = req.app.get('storage') as DatabaseStorage;
    
    // 1. Get social accounts for the platform
    let accounts: SocialAccount[] = [];
    if (platform === 'all') {
      accounts = await storage.getSocialAccounts();
    } else {
      accounts = await storage.getSocialAccounts();
      accounts = accounts.filter(acc => acc.platform === platform);
    }
    
    if (accounts.length === 0) {
      return res.status(400).json({ error: `No accounts found for platform: ${platform}` });
    }

    // 2. Limit to requested number of pages
    const selectedAccounts = accounts.slice(0, numberOfPages);
    
    // 3. Get content library
    const contentLibrary = await storage.getContentLibraryItems();
    
    // 4. Auto tag matching - lấy content có tags match với account tags
    const scheduledPosts: Partial<ScheduledPost>[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Distribute posts evenly across time period
    const totalSlots = Math.max(1, daysBetween * 3); // 3 slots per day: 9:00, 14:00, 21:00
    const postsPerSlot = Math.ceil(numberOfPosts / totalSlots);
    
    let postCount = 0;
    let contentIndex = 0;
    
    for (let day = 0; day < daysBetween && postCount < numberOfPosts; day++) {
      for (let slot = 0; slot < 3 && postCount < numberOfPosts; slot++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + day);
        
        // Set time slots: 9:00, 14:00, 21:00
        const hours = [9, 14, 21][slot];
        currentDate.setHours(hours, 0, 0, 0);
        
        // Round-robin through accounts
        const accountIndex = postCount % selectedAccounts.length;
        const account = selectedAccounts[accountIndex];
        
        // Find matching content based on account tags
        let selectedContent: ContentLibrary | null = null;
        let attempts = 0;
        
        while (attempts < contentLibrary.length && !selectedContent) {
          const content = contentLibrary[contentIndex % contentLibrary.length];
          
          // Tag matching logic
          const accountTags = account.tagIds || [];
          const contentTags = content.tagIds || [];
          const hasMatchingTags = accountTags.some(tag => contentTags.includes(tag));
          
          if (hasMatchingTags || accountTags.length === 0) {
            selectedContent = content;
          }
          
          contentIndex++;
          attempts++;
        }
        
        // If no tag match found, use first available content
        if (!selectedContent && contentLibrary.length > 0) {
          selectedContent = contentLibrary[contentIndex % contentLibrary.length];
          contentIndex++;
        }
        
        if (selectedContent) {
          scheduledPosts.push({
            caption: selectedContent.title,
            hashtags: [selectedContent.baseContent || ''],
            assetIds: selectedContent.assetIds || [],
            socialAccountId: account.id,
            platform: account.platform as any,
            scheduledTime: currentDate,
            timezone: 'Asia/Ho_Chi_Minh',
            status: 'scheduled'
          });
          
          postCount++;
        }
      }
    }
    
    // 5. Bulk insert scheduled posts
    const results = [];
    for (const post of scheduledPosts) {
      try {
        const scheduledPost = await storage.createScheduledPost(post);
        results.push(scheduledPost);
      } catch (error) {
        console.error('Error creating scheduled post:', error);
      }
    }
    
    res.json({
      success: true,
      message: `Created ${results.length} scheduled posts`,
      posts: results,
      summary: {
        totalPosts: results.length,
        accounts: selectedAccounts.length,
        platform: platform,
        period: `${startDate} to ${endDate}`
      }
    });
    
  } catch (error) {
    console.error('Simple automation error:', error);
    res.status(500).json({ error: 'Failed to create automation schedule' });
  }
});

// Preview automation endpoint
router.post('/simple/preview', requireAuth, async (req, res) => {
  try {
    const { platform, numberOfPosts, numberOfPages, startDate, endDate } = req.body;
    
    const storage = req.app.get('storage') as DatabaseStorage;
    
    // Get accounts for preview
    let accounts: SocialAccount[] = [];
    if (platform === 'all') {
      accounts = await storage.getSocialAccounts();
    } else {
      accounts = await storage.getSocialAccounts();
      accounts = accounts.filter(acc => acc.platform === platform);
    }
    
    const selectedAccounts = accounts.slice(0, numberOfPages);
    const contentLibrary = await storage.getContentLibraryItems();
    
    // Calculate distribution preview
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    res.json({
      preview: {
        accounts: selectedAccounts.map(acc => ({
          id: acc.id,
          name: acc.name,
          platform: acc.platform,
          tags: acc.tagIds || []
        })),
        contentAvailable: contentLibrary.length,
        distribution: {
          totalPosts: numberOfPosts,
          totalDays: daysBetween,
          postsPerDay: Math.ceil(numberOfPosts / daysBetween),
          postsPerAccount: Math.ceil(numberOfPosts / selectedAccounts.length)
        }
      }
    });
    
  } catch (error) {
    console.error('Preview automation error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

export default router;