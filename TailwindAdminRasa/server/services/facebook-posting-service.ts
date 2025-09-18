import { SocialAccount, ScheduledPost, ContentAsset } from '../../shared/schema';

export interface FacebookPageToken {
  pageId: string;
  pageName: string;
  accessToken: string;
  permissions: string[];
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface FacebookPostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface FacebookPostOptions {
  message: string;
  imageUrls?: string[];
  scheduledPublishTime?: number; // Unix timestamp
  targeting?: {
    countries?: string[];
    locales?: string[];
    genders?: number[];
    ageMin?: number;
    ageMax?: number;
  };
}

export class FacebookPostingService {
  private apiVersion = 'v18.0';
  private graphApiUrl = `https://graph.facebook.com/${this.apiVersion}`;

  /**
   * Post content to a Facebook page
   */
  async postToPage(
    pageId: string, 
    pageAccessToken: string, 
    options: FacebookPostOptions
  ): Promise<FacebookPostResult> {
    try {
      const { message, imageUrls = [], scheduledPublishTime } = options;

      // If we have images, post as photo(s), otherwise post as text
      if (imageUrls.length > 0) {
        return await this.postPhotos(pageId, pageAccessToken, message, imageUrls, scheduledPublishTime);
      } else {
        return await this.postText(pageId, pageAccessToken, message, scheduledPublishTime);
      }
    } catch (error) {
      console.error('Facebook posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Post text content to Facebook page
   */
  private async postText(
    pageId: string, 
    pageAccessToken: string, 
    message: string, 
    scheduledPublishTime?: number
  ): Promise<FacebookPostResult> {
    const postData: any = {
      message: message,
      access_token: pageAccessToken,
    };

    // Add scheduling if specified
    if (scheduledPublishTime) {
      postData.published = false;
      postData.scheduled_publish_time = scheduledPublishTime;
    }

    const response = await fetch(`${this.graphApiUrl}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      postId: result.id,
      postUrl: `https://www.facebook.com/${result.id}`
    };
  }

  /**
   * Post photos to Facebook page
   */
  private async postPhotos(
    pageId: string, 
    pageAccessToken: string, 
    message: string, 
    imageUrls: string[], 
    scheduledPublishTime?: number
  ): Promise<FacebookPostResult> {
    if (imageUrls.length === 1) {
      // Single photo post
      return await this.postSinglePhoto(pageId, pageAccessToken, message, imageUrls[0], scheduledPublishTime);
    } else {
      // Multiple photos post (album)
      return await this.postPhotoAlbum(pageId, pageAccessToken, message, imageUrls, scheduledPublishTime);
    }
  }

  /**
   * Post a single photo
   */
  private async postSinglePhoto(
    pageId: string, 
    pageAccessToken: string, 
    message: string, 
    imageUrl: string, 
    scheduledPublishTime?: number
  ): Promise<FacebookPostResult> {
    const postData: any = {
      url: imageUrl,
      caption: message,
      access_token: pageAccessToken,
    };

    // Add scheduling if specified
    if (scheduledPublishTime) {
      postData.published = false;
      postData.scheduled_publish_time = scheduledPublishTime;
    }

    const response = await fetch(`${this.graphApiUrl}/${pageId}/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      postId: result.id,
      postUrl: `https://www.facebook.com/${result.post_id || result.id}`
    };
  }

  /**
   * Post multiple photos as an album
   */
  private async postPhotoAlbum(
    pageId: string, 
    pageAccessToken: string, 
    message: string, 
    imageUrls: string[], 
    scheduledPublishTime?: number
  ): Promise<FacebookPostResult> {
    try {
      // Step 1: Upload photos and get their IDs
      const photoIds: string[] = [];
      
      for (const imageUrl of imageUrls) {
        const uploadData = {
          url: imageUrl,
          published: false, // Don't publish individual photos
          access_token: pageAccessToken,
        };

        const uploadResponse = await fetch(`${this.graphApiUrl}/${pageId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadData),
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(`Photo upload failed: ${errorData.error?.message || uploadResponse.statusText}`);
        }

        const uploadResult = await uploadResponse.json();
        photoIds.push(uploadResult.id);
      }

      // Step 2: Create the album post with all photos
      const albumData: any = {
        message: message,
        attached_media: photoIds.map(id => ({ media_fbid: id })),
        access_token: pageAccessToken,
      };

      // Add scheduling if specified
      if (scheduledPublishTime) {
        albumData.published = false;
        albumData.scheduled_publish_time = scheduledPublishTime;
      }

      const albumResponse = await fetch(`${this.graphApiUrl}/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(albumData),
      });

      if (!albumResponse.ok) {
        const errorData = await albumResponse.json().catch(() => ({}));
        throw new Error(`Album creation failed: ${errorData.error?.message || albumResponse.statusText}`);
      }

      const albumResult = await albumResponse.json();
      
      return {
        success: true,
        postId: albumResult.id,
        postUrl: `https://www.facebook.com/${albumResult.id}`
      };

    } catch (error) {
      console.error('Photo album posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to post photo album'
      };
    }
  }

  /**
   * Get page access token for a specific page from social account
   */
  getPageAccessToken(socialAccount: SocialAccount, pageId: string): string | null {
    if (!socialAccount.pageAccessTokens) return null;

    const pageTokens = socialAccount.pageAccessTokens as FacebookPageToken[];
    const pageToken = pageTokens.find(token => token.pageId === pageId);
    
    if (!pageToken || pageToken.status !== 'active') {
      return null;
    }

    return pageToken.accessToken;
  }

  /**
   * Get post insights/analytics from Facebook
   */
  async getPostInsights(postId: string, accessToken: string) {
    try {
      const insights = await fetch(
        `${this.graphApiUrl}/${postId}/insights?metric=post_impressions,post_engaged_users,post_clicks&access_token=${accessToken}`
      );
      
      if (!insights.ok) {
        console.warn('Failed to fetch post insights:', await insights.text());
        return null;
      }

      const result = await insights.json();
      
      // Parse insights data
      const analytics: any = {};
      if (result.data) {
        for (const metric of result.data) {
          switch (metric.name) {
            case 'post_impressions':
              analytics.impressions = metric.values[0]?.value || 0;
              break;
            case 'post_engaged_users':
              analytics.engagement = metric.values[0]?.value || 0;
              break;
            case 'post_clicks':
              analytics.clicks = metric.values[0]?.value || 0;
              break;
          }
        }
      }

      return analytics;
    } catch (error) {
      console.error('Error fetching post insights:', error);
      return null;
    }
  }

  /**
   * Validate page access token
   */
  async validatePageToken(pageId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.graphApiUrl}/${pageId}?access_token=${accessToken}`);
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Helper method to format hashtags
   */
  formatHashtags(hashtags: string[]): string {
    return hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
  }

  /**
   * Helper method to combine caption with hashtags
   */
  buildPostMessage(caption: string, hashtags?: string[]): string {
    let message = caption;
    
    if (hashtags && hashtags.length > 0) {
      const formattedHashtags = this.formatHashtags(hashtags);
      message += `\n\n${formattedHashtags}`;
    }
    
    return message;
  }
}

// Export singleton instance
export const facebookPostingService = new FacebookPostingService();