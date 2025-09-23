import crypto from 'crypto';
import { db } from './db.js';
import { shopeeBusinessAccounts } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// 🔒 PRODUCTION-GRADE AES-256-GCM ENCRYPTION (Fixed)
function encryptSecret(secret: string): string {
  // Require encryption key in production
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for production');
  }
  
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'shopee-salt-v1', 32);
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  cipher.setAAD(Buffer.from('shopee-tokens'));
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptSecret(encryptedSecret: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for production');
  }
  
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'shopee-salt-v1', 32);
  
  const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted secret format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAAD(Buffer.from('shopee-tokens'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export interface ShopeeAuthConfig {
  partnerId: string;
  partnerKey: string;
  redirectUri: string;
  region: string; // VN, TH, MY, SG, PH, etc.
}

export interface ShopeeAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  shopId?: string;
  error?: string;
}

export interface ShopeeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  shopId: string;
}

class ShopeeAuthService {
  private config: ShopeeAuthConfig;
  private baseUrl: string;

  constructor(config: ShopeeAuthConfig) {
    this.config = config;
    // Set base URL based on region
    this.baseUrl = this.getRegionalBaseUrl(config.region);
  }

  private getRegionalBaseUrl(region: string): string {
    // Shopee API endpoints vary by region
    const regionUrls: Record<string, string> = {
      'VN': 'https://partner.shopeemobile.com',
      'TH': 'https://partner.shopeemobile.com',
      'MY': 'https://partner.shopeemobile.com',
      'SG': 'https://partner.shopeemobile.com',
      'PH': 'https://partner.shopeemobile.com',
      'ID': 'https://partner.shopeemobile.com',
      'BR': 'https://partner.shopeemobile.com',
      'test': 'https://partner.test-stable.shopeemobile.com'
    };
    
    return regionUrls[region] || regionUrls['VN'];
  }

  /**
   * Generate HMAC-SHA256 signature for Shopee API
   */
  private generateSign(path: string, timestamp: number, additionalParams: string = ''): string {
    const baseString = `${this.config.partnerId}${path}${timestamp}${additionalParams}`;
    return crypto.createHmac('sha256', this.config.partnerKey).update(baseString).digest('hex');
  }

  /**
   * Generate authorization URL for seller authentication
   */
  generateAuthUrl(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = this.generateSign(path, timestamp);
    
    const params = new URLSearchParams({
      partner_id: this.config.partnerId,
      redirect: this.config.redirectUri,
      timestamp: timestamp.toString(),
      sign: sign
    });

    return `${this.baseUrl}${path}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(authCode: string, shopId: string): Promise<ShopeeAuthResult> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const path = '/api/v2/auth/token/get';
      const sign = this.generateSign(path, timestamp, authCode + shopId);

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_id: this.config.partnerId,
          code: authCode,
          shop_id: shopId,
          timestamp,
          sign
        })
      });

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          error: data.message || 'Token exchange failed'
        };
      }

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        shopId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during token exchange'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string, shopId: string): Promise<ShopeeAuthResult> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const path = '/api/v2/auth/access_token/get';
      const sign = this.generateSign(path, timestamp, refreshToken + shopId);

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_id: this.config.partnerId,
          refresh_token: refreshToken,
          shop_id: shopId,
          timestamp,
          sign
        })
      });

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          error: data.message || 'Token refresh failed'
        };
      }

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        shopId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during token refresh'
      };
    }
  }

  /**
   * Store Shopee business account in database
   */
  async storeBusinessAccount(tokens: ShopeeTokens, shopInfo: any): Promise<void> {
    await db.insert(shopeeBusinessAccounts).values({
      partnerId: this.config.partnerId,
      shopId: tokens.shopId,
      displayName: shopInfo.shop_name || 'Shopee Shop',
      shopName: shopInfo.shop_name,
      shopLogo: shopInfo.shop_logo,
      // 🔒 PRODUCTION SECURITY: Encrypt sensitive tokens
      accessToken: encryptSecret(tokens.accessToken),
      refreshToken: encryptSecret(tokens.refreshToken),
      tokenExpiresAt: tokens.expiresAt,
      // ❌ NEVER store partnerKey in database - read from env only
      shopType: shopInfo.shop_type || 'normal',
      region: this.config.region,
      contactEmail: shopInfo.contact_email,
      contactPhone: shopInfo.contact_phone,
      connected: true,
      isActive: true
    }).onConflictDoUpdate({
      target: shopeeBusinessAccounts.shopId,
      set: {
        accessToken: encryptSecret(tokens.accessToken),
        refreshToken: encryptSecret(tokens.refreshToken),
        tokenExpiresAt: tokens.expiresAt,
        connected: true,
        lastSync: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get business account by shop ID
   */
  async getBusinessAccount(shopId: string) {
    const [account] = await db
      .select()
      .from(shopeeBusinessAccounts)
      .where(eq(shopeeBusinessAccounts.shopId, shopId));

    return account;
  }

  /**
   * Check if access token is expired and refresh if needed
   */
  async ensureValidToken(shopId: string): Promise<string | null> {
    const account = await this.getBusinessAccount(shopId);
    
    if (!account || !account.accessToken) {
      return null;
    }

    // Check if token expires within next 5 minutes
    const expiresAt = account.tokenExpiresAt;
    if (expiresAt && expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
      // Token is expired or expiring soon, refresh it
      if (account.refreshToken) {
        // 🔒 CRITICAL FIX: Decrypt refreshToken before using it
        const decryptedRefreshToken = decryptSecret(account.refreshToken);
        const refreshResult = await this.refreshAccessToken(decryptedRefreshToken, shopId);
        
        if (refreshResult.success && refreshResult.accessToken) {
          // Update database with new encrypted tokens
          await db.update(shopeeBusinessAccounts)
            .set({
              accessToken: encryptSecret(refreshResult.accessToken!),
              refreshToken: encryptSecret(refreshResult.refreshToken!),
              tokenExpiresAt: refreshResult.expiresAt,
              lastSync: new Date(),
              updatedAt: new Date()
            })
            .where(eq(shopeeBusinessAccounts.shopId, shopId));
          
          return refreshResult.accessToken;
        }
      }
      
      return null; // Failed to refresh
    }

    // 🔒 CRITICAL FIX: Decrypt token before returning
    return decryptSecret(account.accessToken);
  }

  /**
   * Make authenticated API call to Shopee
   */
  /**
   * Helper to get decrypted tokens for a shop
   */
  async getDecryptedTokens(shopId: string): Promise<ShopeeTokens | null> {
    const account = await this.getBusinessAccount(shopId);
    if (!account || !account.accessToken || !account.refreshToken) {
      return null;
    }
    
    return {
      accessToken: decryptSecret(account.accessToken),
      refreshToken: decryptSecret(account.refreshToken),
      expiresAt: account.tokenExpiresAt || new Date(),
      shopId: account.shopId
    };
  }

  async makeAuthenticatedRequest(
    endpoint: string, 
    shopId: string, 
    method: string = 'GET', 
    data?: any
  ): Promise<any> {
    const accessToken = await this.ensureValidToken(shopId);
    
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const path = `/api/v2/${endpoint}`;
    const sign = this.generateSign(path, timestamp, accessToken + shopId);

    const params = new URLSearchParams({
      partner_id: this.config.partnerId,
      shop_id: shopId,
      timestamp: timestamp.toString(),
      access_token: accessToken,
      sign: sign
    });

    const url = `${this.baseUrl}${path}?${params.toString()}`;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Shopee API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Disconnect shop by revoking tokens
   */
  async disconnectShop(shopId: string): Promise<void> {
    await db.update(shopeeBusinessAccounts)
      .set({
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        connected: false,
        lastSync: new Date(),
        updatedAt: new Date()
      })
      .where(eq(shopeeBusinessAccounts.shopId, shopId));
  }
}

export default ShopeeAuthService;