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
    // Facebook Graph API expects form-encoded data, not JSON
    const formData = new URLSearchParams();
    formData.append('message', message);
    formData.append('access_token', pageAccessToken);

    // Add scheduling if specified
    if (scheduledPublishTime) {
      formData.append('published', 'false');
      formData.append('scheduled_publish_time', scheduledPublishTime.toString());
    }

    const response = await fetch(`${this.graphApiUrl}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = this.parseGraphAPIError(errorData);
      throw new Error(errorMessage);
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
    // Facebook Graph API expects form-encoded data for photos
    const formData = new URLSearchParams();
    formData.append('url', imageUrl);
    formData.append('caption', message);
    formData.append('access_token', pageAccessToken);

    // Add scheduling if specified
    if (scheduledPublishTime) {
      formData.append('published', 'false');
      formData.append('scheduled_publish_time', scheduledPublishTime.toString());
    }

    const response = await fetch(`${this.graphApiUrl}/${pageId}/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = this.parseGraphAPIError(errorData);
      throw new Error(errorMessage);
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
        const uploadFormData = new URLSearchParams();
        uploadFormData.append('url', imageUrl);
        uploadFormData.append('published', 'false'); // Don't publish individual photos
        uploadFormData.append('access_token', pageAccessToken);

        const uploadResponse = await fetch(`${this.graphApiUrl}/${pageId}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: uploadFormData.toString(),
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          const errorMessage = this.parseGraphAPIError(errorData);
          throw new Error(`Photo upload failed: ${errorMessage}`);
        }

        const uploadResult = await uploadResponse.json();
        photoIds.push(uploadResult.id);
      }

      // Step 2: Create the album post with all photos using proper form encoding
      const albumFormData = new URLSearchParams();
      albumFormData.append('message', message);
      albumFormData.append('access_token', pageAccessToken);
      
      // Attach each photo using the correct format for attached_media
      photoIds.forEach((id, index) => {
        albumFormData.append(`attached_media[${index}][media_fbid]`, id);
      });

      // Add scheduling if specified
      if (scheduledPublishTime) {
        albumFormData.append('published', 'false');
        albumFormData.append('scheduled_publish_time', scheduledPublishTime.toString());
      }

      const albumResponse = await fetch(`${this.graphApiUrl}/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: albumFormData.toString(),
      });

      if (!albumResponse.ok) {
        const errorData = await albumResponse.json().catch(() => ({}));
        const errorMessage = this.parseGraphAPIError(errorData);
        throw new Error(`Album creation failed: ${errorMessage}`);
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

  /**
   * Parse Graph API errors for better error handling
   */
  private parseGraphAPIError(errorData: any): string {
    if (!errorData?.error) {
      return 'Unknown Facebook API error occurred';
    }

    const error = errorData.error;
    const code = error.code;
    const subcode = error.error_subcode;
    const message = error.message || 'Facebook API error';

    // Handle specific Facebook error codes
    switch (code) {
      case 190: // Invalid access token
        if (subcode === 463) {
          return 'Facebook access token has expired. Please reconnect your Facebook account.';
        } else if (subcode === 467) {
          return 'Facebook access token is invalid. Please reconnect your Facebook account.';
        }
        return 'Facebook access token issue. Please reconnect your Facebook account.';

      case 200: // Permission error
        return 'Insufficient permissions to post to this Facebook page. Please check page permissions.';

      case 613: // Rate limit exceeded
        return 'Facebook posting rate limit exceeded. Please try again later.';

      case 368: // Temporarily blocked
        return 'Facebook has temporarily blocked this action. Please try again later.';

      case 100: // Invalid parameter
        return `Facebook API parameter error: ${message}`;

      case 104: // Access token required
        return 'Facebook access token is required. Please reconnect your Facebook account.';

      case 341: // Reach limit
        return 'Facebook posting limit reached. Please try again later.';

      case 506: // Duplicate post
        return 'This content has already been posted recently. Facebook prevents duplicate posts.';

      default:
        // Return the original message with error code for debugging
        return `Facebook API Error (${code}${subcode ? `/${subcode}` : ''}): ${message}`;
    }
  }
}

// Export singleton instance
export const facebookPostingService = new FacebookPostingService();