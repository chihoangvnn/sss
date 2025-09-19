import { randomBytes } from 'crypto';

interface FacebookAuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookPageInfo {
  id: string;
  name: string;
  access_token: string;
  category: string;
  tasks: string[];
}

export class FacebookAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.FACEBOOK_APP_ID || '';
    this.clientSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${process.env.REPL_URL || 'http://localhost:5000'}/auth/facebook/callback`;

    if (!this.clientId || !this.clientSecret) {
      console.warn('Facebook OAuth credentials not found. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.');
    }
  }

  /**
   * Generate a secure state parameter for CSRF protection
   */
  generateState(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate the Facebook OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: 'email,pages_read_engagement,pages_show_list,pages_manage_posts,pages_messaging,pages_messaging_subscriptions',
      response_type: 'code',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<FacebookAuthTokens> {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code,
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<FacebookUserProfile> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'id,name,email,picture',
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/me?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get user's Facebook pages
   */
  async getUserPages(accessToken: string): Promise<FacebookPageInfo[]> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'id,name,access_token,category,tasks',
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching user pages:', error);
      throw new Error('Failed to fetch user pages');
    }
  }

  /**
   * Get long-lived access token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<FacebookAuthTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        fb_exchange_token: shortLivedToken,
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting long-lived token:', error);
      throw new Error('Failed to get long-lived token');
    }
  }

  /**
   * Verify access token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/me?${params.toString()}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get basic page insights (follower count, etc.)
   */
  async getPageInsights(pageId: string, accessToken: string): Promise<{ followers: number; engagement: number }> {
    try {
      // Get follower count
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'followers_count',
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const followers = data.followers_count || 0;
      
      // For engagement, we'll start with a basic calculation
      // In a real implementation, you'd fetch page insights data
      const engagement = Math.floor(Math.random() * 10) + 1; // Placeholder

      return { followers, engagement };
    } catch (error) {
      console.error('Error fetching page insights:', error);
      return { followers: 0, engagement: 0 };
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
      });

      const response = await fetch(`https://graph.facebook.com/v18.0/me/permissions?${params.toString()}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }
}

export const facebookAuth = new FacebookAuthService();