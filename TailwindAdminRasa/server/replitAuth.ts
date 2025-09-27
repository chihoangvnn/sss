import { NextFunction, Request, Response } from "express";
import { db } from "./db";
import { authUsers, customers } from "../shared/schema";
import { eq } from "drizzle-orm";

// 🔗 Extend Express Request to include Passport user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        profileImageUrl?: string;
      };
      logout(callback: (err?: any) => void): void;
    }
    
    interface User {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    }
  }
}

// 🔐 REPLIT AUTH CONFIGURATION
export const authConfig = {
  authorizationURL: "https://replit.com/auth/oauth2/auth",
  tokenURL: "https://replit.com/auth/oauth2/token",
  userInfoURL: "https://replit.com/auth/oauth2/userinfo",
  clientId: process.env.REPLIT_APP_ID!,
  clientSecret: process.env.REPLIT_APP_SECRET!,
};

// 🛡️ REPLIT OAUTH SERVICE - Full OAuth Flow Implementation
export class ReplitAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.REPLIT_APP_ID || '';
    this.clientSecret = process.env.REPLIT_APP_SECRET || '';
    this.redirectUri = process.env.REPLIT_REDIRECT_URI || `${process.env.REPL_URL || 'http://localhost:5000'}/auth/replit/callback`;

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ Replit OAuth credentials not found. Set REPLIT_APP_ID and REPLIT_APP_SECRET environment variables.');
    }
  }

  /**
   * Generate a secure state parameter for CSRF protection
   */
  generateState(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate the Replit OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: 'openid profile email',
      response_type: 'code',
    });

    return `${authConfig.authorizationURL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
  }> {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code,
        grant_type: 'authorization_code',
      });

      const response = await fetch(authConfig.tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

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
   * Get user profile information from Replit
   */
  async getUserProfile(accessToken: string): Promise<{
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    username?: string;
  }> {
    try {
      const response = await fetch(authConfig.userInfoURL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const profile = await response.json();
      
      return {
        id: profile.id || profile.sub,
        email: profile.email,
        firstName: profile.given_name || profile.name?.split(' ')[0],
        lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' '),
        profileImageUrl: profile.picture,
        username: profile.preferred_username || profile.username,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }
}

// Export singleton instance
export const replitAuth = new ReplitAuthService();

// 🎯 USER MANAGEMENT - Sync auth user with customer record
export async function upsertAuthUser(userData: {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}) {
  try {
    // 1. Upsert auth user
    const [authUser] = await db
      .insert(authUsers)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: authUsers.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    // 2. Check if customer already exists by email
    let customer = null;
    if (userData.email) {
      const existingCustomers = await db
        .select()
        .from(customers)
        .where(eq(customers.email, userData.email))
        .limit(1);

      if (existingCustomers.length > 0) {
        // Update existing customer with auth link
        customer = existingCustomers[0];
        if (!customer.authUserId) {
          await db
            .update(customers)
            .set({ authUserId: authUser.id })
            .where(eq(customers.id, customer.id));
        }
      } else {
        // Create new customer for this auth user
        const [newCustomer] = await db
          .insert(customers)
          .values({
            name: userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : userData.email?.split('@')[0] || 'Thành viên mới',
            email: userData.email,
            authUserId: authUser.id,
            membershipTier: 'member',
            totalSpent: '0',
            pointsBalance: 0,
            pointsEarned: 0,
            membershipData: {
              tierProgressPercent: 0,
              nextTierThreshold: 3000000, // 3M VND for Silver
              specialOffers: [],
              tierHistory: [{
                tier: 'member',
                date: new Date().toISOString(),
                reason: 'Đăng ký tài khoản'
              }]
            }
          })
          .returning();
        
        customer = newCustomer;
      }
    }

    return { authUser, customer };
  } catch (error) {
    console.error('❌ Error upserting auth user:', error);
    throw error;
  }
}

// 🛡️ AUTH MIDDLEWARE - Ensure user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// 👤 GET CURRENT USER - With customer membership data
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get auth user with linked customer data
    const authUser = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.id, req.user.id))
      .limit(1);

    if (authUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get linked customer if exists
    let customer = null;
    if (authUser[0].email) {
      const customerData = await db
        .select()
        .from(customers)
        .where(eq(customers.authUserId, authUser[0].id))
        .limit(1);

      if (customerData.length > 0) {
        customer = customerData[0];
      }
    }

    res.json({
      user: authUser[0],
      customer: customer,
      membership: customer ? {
        tier: customer.membershipTier,
        totalSpent: parseFloat(customer.totalSpent || '0'),
        pointsBalance: customer.pointsBalance,
        pointsEarned: customer.pointsEarned,
        metadata: customer.membershipData
      } : null
    });
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 🚪 LOGOUT
export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Session destroy error:', err);
      return res.status(500).json({ error: 'Session cleanup failed' });
    }
    res.clearCookie('admin.session'); // Match session name from index.ts
    res.json({ success: true, message: 'Logged out successfully' });
  });
}