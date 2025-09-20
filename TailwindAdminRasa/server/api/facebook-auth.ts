import { Router } from 'express';
import { DatabaseStorage } from '../storage';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();
const storage = new DatabaseStorage();

// Store for OAuth state validation (in production, use Redis or database)
const oauthStates = new Map<string, { timestamp: number; sessionId?: string }>();

// Clean expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  oauthStates.forEach((data, state) => {
    if (now - data.timestamp > 600000) { // 10 minutes
      oauthStates.delete(state);
    }
  });
}, 600000);

// Environment variables check
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const BASE_URL = process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : 'http://localhost:5000';

interface FacebookUserToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookPageToken {
  access_token: string;
  category: string;
  category_list: Array<{
    id: string;
    name: string;
  }>;
  name: string;
  id: string;
  tasks: string[];
}

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * GET /auth/facebook
 * Redirect user to Facebook for OAuth authorization
 */
router.get('/facebook', async (req, res) => {
  try {
    if (!FACEBOOK_APP_ID) {
      return res.status(500).json({ 
        error: 'Facebook App ID not configured. Please set FACEBOOK_APP_ID environment variable.' 
      });
    }

    // Generate secure random state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with timestamp for validation
    oauthStates.set(state, {
      timestamp: Date.now(),
      sessionId: req.sessionID || req.ip // Simple session tracking
    });
    const redirectUri = `${BASE_URL}/api/auth/facebook/callback`;
    
    // Required permissions for posting to pages
    const scope = [
      'pages_manage_posts',     // Post content to pages
      'pages_show_list',        // Get list of pages
      'pages_read_engagement',  // Read page insights
      'business_management'     // Manage business assets
    ].join(',');

    // Facebook OAuth URL
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${state}`;

    console.log(`🔐 Facebook OAuth redirect: ${authUrl}`);
    
    // Store state in session or temporary storage for validation
    // For simplicity, we'll validate it in the callback
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Facebook OAuth initiation error:', error);
    res.status(500).json({ 
      error: 'Failed to initiate Facebook OAuth',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /auth/facebook/callback
 * Handle Facebook OAuth callback with authorization code
 */
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('Facebook OAuth error:', error, error_description);
      return res.status(400).json({ 
        error: 'Facebook OAuth failed',
        details: error_description || error
      });
    }

    // Validate required parameters
    if (!code) {
      return res.status(400).json({ 
        error: 'Authorization code missing from Facebook response' 
      });
    }

    // CRITICAL: Validate state parameter to prevent CSRF attacks
    if (!state) {
      console.error('🚨 OAuth callback missing state parameter - possible CSRF attack');
      return res.status(400).json({ 
        error: 'Security error: state parameter missing' 
      });
    }

    const storedState = oauthStates.get(state as string);
    if (!storedState) {
      console.error('🚨 OAuth callback with invalid/expired state - possible CSRF attack');
      return res.status(400).json({ 
        error: 'Security error: invalid or expired state parameter' 
      });
    }

    // Check state age (10 minutes max)
    if (Date.now() - storedState.timestamp > 600000) {
      console.error('🚨 OAuth callback with expired state');
      oauthStates.delete(state as string);
      return res.status(400).json({ 
        error: 'Security error: expired state parameter' 
      });
    }

    // Remove used state
    oauthStates.delete(state as string);

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return res.status(500).json({ 
        error: 'Facebook App credentials not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.' 
      });
    }

    console.log(`🔄 Processing Facebook OAuth callback with code: ${code}`);

    // Step 1: Exchange authorization code for user access token
    const userToken = await exchangeCodeForToken(code as string);
    
    // Step 2: Get user's Facebook pages
    const pages = await getUserPages(userToken.access_token);
    
    // Step 3: Get long-lived page access tokens
    const pageTokens = await getPageTokens(pages, userToken.access_token);
    
    // Step 4: Save tokens to database
    const socialAccount = await saveFacebookAccount(userToken, pageTokens);
    
    console.log(`✅ Facebook OAuth successful for ${pages.length} pages`);
    
    // Redirect to success page with results
    const successUrl = `/social-media?success=facebook_connected&pages=${pages.length}&account=${socialAccount.id}`;
    res.redirect(successUrl);
    
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    const errorUrl = `/social-media?error=${encodeURIComponent(error instanceof Error ? error.message : 'authentication_failed')}`;
    res.redirect(errorUrl);
  }
});

/**
 * GET /auth/facebook/status
 * Check current Facebook authentication status
 */
router.get('/facebook/status', async (req, res) => {
  try {
    // Get all Facebook social accounts
    const facebookAccounts = await storage.getSocialAccountsByPlatform('facebook');
    
    const status = {
      configured: !!(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET),
      accounts: facebookAccounts.map(account => ({
        id: account.id,
        name: account.name,
        connected: account.connected,
        pages: Array.isArray(account.pageAccessTokens) ? account.pageAccessTokens.length : 0,
        lastSync: account.lastSync,
        isActive: account.isActive
      }))
    };
    
    res.json(status);
  } catch (error) {
    console.error('Facebook status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check Facebook status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /auth/facebook/account/:accountId/pages
 * Get detailed page information for a specific Facebook account
 */
router.get('/facebook/account/:accountId/pages', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const account = await storage.getSocialAccountById(accountId);
    if (!account || account.platform !== 'facebook') {
      return res.status(404).json({ error: 'Facebook account not found' });
    }
    
    // Return the pageAccessTokens stored in the account
    const pages = Array.isArray(account.pageAccessTokens) ? account.pageAccessTokens : [];
    
    res.json({ 
      success: true,
      accountId,
      accountName: account.name,
      pages: pages.map(page => ({
        pageId: page.pageId,
        pageName: page.pageName,
        accessToken: '***', // Don't expose the actual token
        permissions: page.permissions || [],
        status: page.status || 'active',
        expiresAt: page.expiresAt
      })),
      totalPages: pages.length
    });
  } catch (error) {
    console.error('Facebook account pages error:', error);
    res.status(500).json({ 
      error: 'Failed to get Facebook account pages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /auth/facebook/refresh/:accountId
 * Refresh tokens for a specific Facebook account
 */
router.post('/facebook/refresh/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const account = await storage.getSocialAccountById(accountId);
    if (!account || account.platform !== 'facebook') {
      return res.status(404).json({ error: 'Facebook account not found' });
    }
    
    // Refresh page tokens
    if (account.accessToken) {
      const pages = await getUserPages(account.accessToken);
      const pageTokens = await getPageTokens(pages, account.accessToken);
      
      await storage.updateSocialAccount(accountId, {
        pageAccessTokens: pageTokens,
        lastSync: new Date(),
        connected: true
      });
      
      res.json({ 
        success: true, 
        pages: pageTokens.length,
        message: 'Facebook tokens refreshed successfully'
      });
    } else {
      res.status(400).json({ error: 'No access token available for refresh' });
    }
  } catch (error) {
    console.error('Facebook token refresh error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh Facebook tokens',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper Functions

/**
 * Exchange authorization code for user access token
 */
async function exchangeCodeForToken(code: string): Promise<FacebookUserToken> {
  const redirectUri = `${BASE_URL}/api/auth/facebook/callback`;
  
  const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${FACEBOOK_APP_ID}&` +
    `client_secret=${FACEBOOK_APP_SECRET}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `code=${code}`;

  const response = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${errorData.error?.message || response.statusText}`);
  }

  const tokenData: FacebookTokenResponse = await response.json();
  
  return {
    access_token: tokenData.access_token,
    token_type: tokenData.token_type || 'bearer',
    expires_in: tokenData.expires_in
  };
}

/**
 * Get user's Facebook pages
 */
async function getUserPages(userToken: string): Promise<FacebookPageToken[]> {
  const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`;
  
  const response = await fetch(pagesUrl);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to get pages: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get long-lived page access tokens
 */
async function getPageTokens(pages: FacebookPageToken[], userToken: string): Promise<any[]> {
  const pageTokens = [];
  
  for (const page of pages) {
    try {
      // Get long-lived page access token
      const longLivedTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${FACEBOOK_APP_ID}&` +
        `client_secret=${FACEBOOK_APP_SECRET}&` +
        `fb_exchange_token=${page.access_token}`;
      
      const tokenResponse = await fetch(longLivedTokenUrl);
      const tokenData = await tokenResponse.json();
      
      pageTokens.push({
        pageId: page.id,
        pageName: page.name,
        accessToken: tokenData.access_token || page.access_token,
        permissions: page.tasks || [],
        expiresAt: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
          undefined,
        status: 'active'
      });
    } catch (error) {
      console.warn(`Failed to get long-lived token for page ${page.name}:`, error);
      // Use short-lived token as fallback
      pageTokens.push({
        pageId: page.id,
        pageName: page.name,
        accessToken: page.access_token,
        permissions: page.tasks || [],
        status: 'active'
      });
    }
  }
  
  return pageTokens;
}

/**
 * Save Facebook account and tokens to database
 */
async function saveFacebookAccount(userToken: FacebookUserToken, pageTokens: any[]): Promise<any> {
  // Check if account already exists
  const existingAccounts = await storage.getSocialAccountsByPlatform('facebook');
  const realAccount = existingAccounts.find(acc => acc.accountId !== 'webhook_config');
  
  const accountData = {
    platform: 'facebook' as const,
    name: pageTokens.length > 0 ? `Facebook Pages (${pageTokens.length})` : 'Facebook Account',
    accountId: pageTokens[0]?.pageId || 'unknown',
    accessToken: userToken.access_token,
    tokenExpiresAt: userToken.expires_in ? 
      new Date(Date.now() + userToken.expires_in * 1000) : 
      null,
    pageAccessTokens: pageTokens,
    connected: true,
    lastSync: new Date(),
    isActive: true
  };
  
  if (realAccount) {
    // Update existing account
    return await storage.updateSocialAccount(realAccount.id, accountData);
  } else {
    // Create new account
    return await storage.createSocialAccount(accountData);
  }
}

export default router;