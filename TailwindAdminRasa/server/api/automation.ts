import { Router } from 'express';
import { storage } from '../storage';
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
    const { platform, numberOfPosts, numberOfPages, startDate, endDate, contentTypes, selectedTags } = req.body;
    
    // Validate input
    if (!platform || !numberOfPosts || !numberOfPages || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: platform, numberOfPosts, numberOfPages, startDate, endDate' 
      });
    }

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
    let contentLibrary = await storage.getContentLibraryItems();
    
    // 3.1. Filter by selected tags if specified
    if (selectedTags && selectedTags.length > 0) {
      contentLibrary = contentLibrary.filter((content: ContentLibrary) => {
        // Check if content has any of the selected tags
        if (!content.tagIds || content.tagIds.length === 0) {
          return false; // Exclude content without tags when tags are specified
        }
        
        // Check if any of the content's tags match the selected tags
        return content.tagIds.some(tagId => selectedTags.includes(tagId));
      });
    }
    
    // 3.2. Filter by content types if specified
    if (contentTypes && contentTypes.length > 0) {
      contentLibrary = contentLibrary.filter((content: ContentLibrary) => {
        // Check if content matches any of the requested types
        return contentTypes.includes(content.contentType as 'image' | 'video' | 'text');
      });
    }
    
    // 3.2. Platform-smart content filtering
    if (platform !== 'all') {
      contentLibrary = contentLibrary.filter((content: ContentLibrary) => {
        const contentType = content.contentType;
        
        switch (platform) {
          case 'instagram':
            // Instagram prefers visual content - filter out text-only posts unless they have assets
            return contentType !== 'text' || (content.assetIds && content.assetIds.length > 0);
          case 'tiktok-business':
            // TikTok Business strictly prefers video content
            return contentType === 'video';
          case 'tiktok-shop':
            // TikTok Shop prefers product videos/images (check for product-related tags or video content)
            const hasProductTags = content.tagIds?.some(tagId => 
              ['product', 'shop', 'sale', 'discount', 'buy'].some(keyword => 
                tagId.toLowerCase().includes(keyword)
              )
            );
            return contentType === 'video' || hasProductTags || (content.assetIds && content.assetIds.length > 0);
          case 'facebook':
          default:
            // Facebook accepts all content types
            return true;
        }
      });
    }
    
    if (contentLibrary.length === 0) {
      const filters = [];
      if (selectedTags && selectedTags.length > 0) filters.push(`selected tags: ${selectedTags.length} tags`);
      if (contentTypes && contentTypes.length > 0) filters.push(`content types: ${contentTypes.join(', ')}`);
      
      return res.status(400).json({ 
        error: `No content found matching the criteria for platform: ${platform}${filters.length > 0 ? ' and ' + filters.join(' and ') : ''}` 
      });
    }
    
    // 4. Auto tag matching - lấy content có tags match với account tags
    const scheduledPosts: Array<{
      caption: string;
      hashtags: string[];
      assetIds: string[];
      socialAccountId: string;
      platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok';
      scheduledTime: Date;
      timezone: string;
      status: 'scheduled';
    }> = [];
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
        
        // Find matching content based on account tags AND platform-specific rules per account
        let selectedContent: ContentLibrary | null = null;
        let attempts = 0;
        
        while (attempts < contentLibrary.length && !selectedContent) {
          const content = contentLibrary[contentIndex % contentLibrary.length];
          
          // Apply per-account platform-specific content filtering
          const isValidForAccountPlatform = (() => {
            const contentType = content.contentType;
            
            switch (account.platform) {
              case 'instagram':
                // Instagram: no text-only content unless it has assets
                return contentType !== 'text' || (content.assetIds && content.assetIds.length > 0);
              case 'tiktok-business':
                // TikTok Business: strictly video content only
                return contentType === 'video';
              case 'tiktok-shop':
                // TikTok Shop: prioritize video content or content with product-related characteristics
                const hasProductContent = content.title?.toLowerCase().includes('product') || 
                                         content.title?.toLowerCase().includes('sale') ||
                                         content.title?.toLowerCase().includes('buy') ||
                                         content.baseContent?.toLowerCase().includes('product') ||
                                         content.baseContent?.toLowerCase().includes('sale');
                
                return contentType === 'video' || hasProductContent || (content.assetIds && content.assetIds.length > 0);
              case 'facebook':
              default:
                // Facebook: accepts all content types
                return true;
            }
          })();
          
          if (!isValidForAccountPlatform) {
            contentIndex++;
            attempts++;
            continue;
          }
          
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
          // Map platform types to match schema expectations
          const platformMapping: Record<string, 'facebook' | 'instagram' | 'twitter' | 'tiktok'> = {
            'facebook': 'facebook',
            'instagram': 'instagram', 
            'twitter': 'twitter',
            'tiktok-business': 'tiktok',
            'tiktok-shop': 'tiktok'
          };
          
          const mappedPlatform = platformMapping[account.platform] || 'facebook';
          
          const newScheduledPost = {
            caption: selectedContent.title,
            hashtags: [selectedContent.baseContent || ''],
            assetIds: selectedContent.assetIds || [],
            socialAccountId: account.id,
            platform: mappedPlatform as 'facebook' | 'instagram' | 'twitter' | 'tiktok',
            scheduledTime: currentDate,
            timezone: 'Asia/Ho_Chi_Minh',
            status: 'scheduled' as const
          };
          
          scheduledPosts.push(newScheduledPost);
          
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
    const { platform, numberOfPosts, numberOfPages, startDate, endDate, contentTypes, selectedTags } = req.body;
    
    // Get accounts for preview
    let accounts: SocialAccount[] = [];
    if (platform === 'all') {
      accounts = await storage.getSocialAccounts();
    } else {
      accounts = await storage.getSocialAccounts();
      accounts = accounts.filter(acc => acc.platform === platform);
    }
    
    const selectedAccounts = accounts.slice(0, numberOfPages);
    let contentLibrary = await storage.getContentLibraryItems();
    
    // Apply tag filtering for preview (same logic as main endpoint)
    if (selectedTags && selectedTags.length > 0) {
      contentLibrary = contentLibrary.filter((content: ContentLibrary) => {
        // Check if content has any of the selected tags
        if (!content.tagIds || content.tagIds.length === 0) {
          return false; // Exclude content without tags when tags are specified
        }
        
        // Check if any of the content's tags match the selected tags
        return content.tagIds.some(tagId => selectedTags.includes(tagId));
      });
    }
    
    // Apply content type filtering for preview
    if (contentTypes && contentTypes.length > 0) {
      contentLibrary = contentLibrary.filter((content: ContentLibrary) => {
        return contentTypes.includes(content.contentType as 'image' | 'video' | 'text');
      });
    }
    
    // Apply platform-smart content filtering for preview
    if (platform !== 'all') {
      contentLibrary = contentLibrary.filter((content: ContentLibrary) => {
        const contentType = content.contentType;
        
        switch (platform) {
          case 'instagram':
            return contentType !== 'text' || (content.assetIds && content.assetIds.length > 0);
          case 'tiktok-business':
            // TikTok Business strictly prefers video content
            return contentType === 'video';
          case 'tiktok-shop':
            // TikTok Shop prefers product videos/images
            const hasProductTags = content.tagIds?.some(tagId => 
              ['product', 'shop', 'sale', 'discount', 'buy'].some(keyword => 
                tagId.toLowerCase().includes(keyword)
              )
            );
            return contentType === 'video' || hasProductTags || (content.assetIds && content.assetIds.length > 0);
          case 'facebook':
          default:
            return true;
        }
      });
    }
    
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