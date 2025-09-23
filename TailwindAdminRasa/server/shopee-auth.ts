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
   * CRITICAL FIX: Use correct endpoint /token/get for code exchange
   */
  async exchangeCodeForToken(authCode: string, shopId: string): Promise<ShopeeAuthResult> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const path = '/api/v2/auth/token/get';
      
      // 🔧 CRITICAL FIX: Create signature for token exchange
      // Base string: partner_id + path + timestamp + code + shop_id
      const baseString = `${this.config.partnerId}${path}${timestamp}${authCode}${shopId}`;
      const sign = crypto.createHmac('sha256', this.config.partnerKey).update(baseString).digest('hex');

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_id: parseInt(this.config.partnerId),  // Must be integer
          code: authCode,
          shop_id: parseInt(shopId),  // Must be integer
          timestamp: timestamp,
          sign: sign
        })
      });

      const data = await response.json();

      // 🔧 FIXED: Handle Shopee API error structure
      if (data.error || !data.access_token) {
        return {
          success: false,
          error: data.message || data.error || 'Token exchange failed'
        };
      }

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + (data.expires_in || 14400) * 1000), // Default 4 hours
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
   * CRITICAL FIX: Shopee v2 requires signed requests even for refresh token
   */
  async refreshAccessToken(refreshToken: string, shopId: string): Promise<ShopeeAuthResult> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const path = '/api/v2/auth/access_token/get';
      
      // 🔧 CRITICAL FIX: Create signature for refresh token
      // Base string: partner_id + path + timestamp + refresh_token + shop_id
      const baseString = `${this.config.partnerId}${path}${timestamp}${refreshToken}${shopId}`;
      const sign = crypto.createHmac('sha256', this.config.partnerKey).update(baseString).digest('hex');

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_id: parseInt(this.config.partnerId),  // Must be integer
          refresh_token: refreshToken,
          shop_id: parseInt(shopId),  // Must be integer
          timestamp: timestamp,
          sign: sign
        })
      });

      const data = await response.json();

      // 🔧 FIXED: Handle Shopee API error structure
      if (data.error || !data.access_token) {
        return {
          success: false,
          error: data.message || data.error || 'Token refresh failed'
        };
      }

      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Keep old if not provided
        expiresAt: new Date(Date.now() + (data.expires_in || 14400) * 1000), // Default 4 hours
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
   * ENHANCED: Better error handling, logging, and 10-minute buffer
   */
  async ensureValidToken(shopId: string): Promise<string | null> {
    try {
      const account = await this.getBusinessAccount(shopId);
      
      if (!account || !account.accessToken) {
        console.log(`❌ No account or access token found for shop: ${shopId}`);
        return null;
      }

      // Check if token expires within next 10 minutes (enhanced buffer)
      const expiresAt = account.tokenExpiresAt;
      const now = Date.now();
      const tenMinutesFromNow = now + 10 * 60 * 1000;
      
      if (expiresAt && expiresAt.getTime() < tenMinutesFromNow) {
        console.log(`🔄 Token expires soon for shop ${shopId}, refreshing...`);
        
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
            
            console.log(`✅ Token refreshed successfully for shop: ${shopId}`);
            return refreshResult.accessToken;
          } else {
            console.error(`❌ Token refresh failed for shop ${shopId}:`, refreshResult.error);
          }
        } else {
          console.error(`❌ No refresh token available for shop: ${shopId}`);
        }
        
        return null; // Failed to refresh
      }

      // Token is still valid, return decrypted version
      const decryptedToken = decryptSecret(account.accessToken);
      console.log(`✅ Using valid token for shop: ${shopId} (expires: ${expiresAt?.toISOString()})`);
      return decryptedToken;
      
    } catch (error) {
      console.error(`❌ Error ensuring valid token for shop ${shopId}:`, error);
      return null;
    }
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

  /**
   * Make authenticated API call to Shopee
   * CRITICAL FIX: Proper URL construction and signature generation
   */
  async makeAuthenticatedRequest(
    endpoint: string, 
    shopId: string, 
    method: string = 'GET', 
    params?: Record<string, any>
  ): Promise<any> {
    const accessToken = await this.ensureValidToken(shopId);
    
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    
    // 🔧 CRITICAL FIX: Clean path without query string for signature
    const cleanPath = `/api/v2/${endpoint}`.split('?')[0];
    
    // 🔧 CRITICAL FIX: Sign using path only (no query string)
    // For API calls with access token: partner_id + path + timestamp + access_token + shop_id
    const sign = this.generateSign(cleanPath, timestamp, accessToken + shopId);

    // Combine auth params with user params
    const allParams = {
      partner_id: this.config.partnerId,
      timestamp: timestamp.toString(),
      access_token: accessToken,
      shop_id: shopId,
      sign: sign,
      ...(params || {})
    };

    const queryString = new URLSearchParams(allParams).toString();
    const url = `${this.baseUrl}${cleanPath}?${queryString}`;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopee API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    // 🔧 FIXED: Handle Shopee API error responses
    if (result.error) {
      throw new Error(`Shopee API error: ${result.message || result.error}`);
    }

    return result;
  }

  /**
   * Get shop information from Shopee API
   * Fixed for Shopee API v2 specification
   */
  async getShopInfo(shopId: string): Promise<any> {
    try {
      const result = await this.makeAuthenticatedRequest('shop/get_shop_info', shopId, 'GET');
      return result.shop_name ? result : null;
    } catch (error) {
      console.error('Failed to fetch shop info:', error);
      // Return fallback info if API call fails
      return {
        shop_id: shopId,
        shop_name: `Shopee Shop ${shopId}`,
        shop_type: 'normal',
        status: 'normal'
      };
    }
  }

  /**
   * Sync real shop data from Shopee API
   * Will be called after successful OAuth
   */
  async syncShopData(shopId: string): Promise<any> {
    try {
      // Get comprehensive shop information
      const [shopInfo, profileInfo] = await Promise.allSettled([
        this.makeAuthenticatedRequest('shop/get_shop_info', shopId, 'GET'),
        this.makeAuthenticatedRequest('shop/get_profile', shopId, 'GET')
      ]);

      const shop = shopInfo.status === 'fulfilled' ? shopInfo.value : null;
      const profile = profileInfo.status === 'fulfilled' ? profileInfo.value : null;

      return {
        shop_id: shopId,
        shop_name: shop?.shop_name || `Shop ${shopId}`,
        shop_logo: shop?.shop_logo || profile?.shop_logo,
        shop_type: shop?.shop_type || 'normal',
        status: shop?.status || 'normal',
        contact_email: profile?.email,
        contact_phone: profile?.phone,
        description: profile?.description,
        country: shop?.country || 'VN',
        region: shop?.region
      };
    } catch (error) {
      console.error('Failed to sync shop data:', error);
      // Return minimal fallback data
      return {
        shop_id: shopId,
        shop_name: `Shopee Shop ${shopId}`,
        shop_type: 'normal',
        status: 'normal'
      };
    }
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