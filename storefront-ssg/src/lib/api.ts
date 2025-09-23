import { StorefrontData, StorefrontConfig, Product } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Build-time API client for static generation
export class StaticApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  async fetchStorefrontData(storefrontName: string): Promise<StorefrontData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/storefront/public/${storefrontName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch storefront data: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching storefront ${storefrontName}:`, error);
      return null;
    }
  }

  async fetchAllStorefronts(): Promise<StorefrontConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/storefront/config`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch storefront configs: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching all storefronts:', error);
      return [];
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/products`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
}

// Runtime API client for dynamic features (form submissions, etc.)
export class RuntimeApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000')
      : '';
  }

  async createOrder(orderData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/storefront/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Order creation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async sendChatMessage(message: string, sessionId?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rasa/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sender: sessionId || `user_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat message failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }
}

// Singleton instances
export const staticApi = new StaticApiClient();
export const runtimeApi = new RuntimeApiClient();