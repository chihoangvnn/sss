import { randomBytes } from 'crypto';

interface TikTokAuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface TikTokUserProfile {
  open_id: string;
  union_id: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  bio_description?: string;
  is_verified?: boolean;
}

interface TikTokBusinessProfile {
  advertiser_id: string;
  advertiser_name: string;
  address?: string;
  industry?: string;
  license_no?: string;
  license_url?: string;
  telephone?: string;
  email?: string;
  timezone?: string;
}

export class TikTokAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private shopRedirectUri: string;

  constructor() {
    this.clientId = process.env.TIKTOK_CLIENT_ID || process.env.TIKTOK_APP_ID || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_APP_SECRET || '';
    this.redirectUri = process.env.TIKTOK_REDIRECT_URI || `${process.env.REPL_URL || 'http://localhost:5000'}/auth/tiktok-business/callback`;
    this.shopRedirectUri = process.env.TIKTOK_SHOP_REDIRECT_URI || `${process.env.REPL_URL || 'http://localhost:5000'}/auth/tiktok-shop/callback`;

    if (!this.clientId || !this.clientSecret) {
      console.warn('TikTok OAuth credentials not found. Set TIKTOK_CLIENT_ID and TIKTOK_CLIENT_SECRET environment variables.');
    }
  }

  /**
   * Generate a secure state parameter for CSRF protection
   */
  generateState(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate the TikTok Business OAuth authorization URL
   */
  getBusinessAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: 'user.info.basic,business.get,video.list,video.upload',
      response_type: 'code',
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  /**
   * Generate the TikTok Shop OAuth authorization URL
   */
  getShopAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.clientId,
      redirect_uri: this.shopRedirectUri,
      state: state,
      scope: 'user.info.basic,shop.product.list,shop.order.list,shop.fulfillment',
      response_type: 'code',
    });

    return `https://services.tiktok.com/shop/oauth/authorize/?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token (Business API)
   */
  async exchangeBusinessCodeForToken(code: string): Promise<TikTokAuthTokens> {
    try {
      const params = {
        client_key: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      };

      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok Business token exchange failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok Business OAuth error: ${data.error} - ${data.error_description}`);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
      };
    } catch (error) {
      console.error('TikTok Business token exchange error:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token (Shop API)
   */
  async exchangeShopCodeForToken(code: string): Promise<TikTokAuthTokens> {
    try {
      const params = {
        client_key: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.shopRedirectUri,
      };

      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams(params).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok Shop token exchange failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok Shop OAuth error: ${data.error} - ${data.error_description}`);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
      };
    } catch (error) {
      console.error('TikTok Shop token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get user profile from TikTok Business API
   */
  async getUserProfile(accessToken: string): Promise<TikTokUserProfile> {
    try {
      const params = new URLSearchParams({
        fields: 'open_id,union_id,avatar_url,display_name,bio_description,is_verified',
      });

      const response = await fetch(`https://open.tiktokapis.com/v2/user/info/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok user profile fetch failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok user profile error: ${data.error.message}`);
      }

      return data.data.user;
    } catch (error) {
      console.error('TikTok user profile fetch error:', error);
      throw error;
    }
  }

  /**
   * Get business profile from TikTok Business API
   */
  async getBusinessProfile(accessToken: string): Promise<TikTokBusinessProfile[]> {
    try {
      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/advertiser/get/', {
        method: 'GET',
        headers: {
          'Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok business profile fetch failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`TikTok business profile error: ${data.message}`);
      }

      return data.data.list;
    } catch (error) {
      console.error('TikTok business profile fetch error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TikTokAuthTokens> {
    try {
      const params = {
        client_key: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };

      const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok token refresh failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`TikTok token refresh error: ${data.error} - ${data.error_description}`);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
      };
    } catch (error) {
      console.error('TikTok token refresh error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tiktokAuth = new TikTokAuthService();