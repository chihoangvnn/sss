// Shared types for SSG storefront
export interface StorefrontData {
  name: string;
  theme: string;
  primaryColor: string;
  contactInfo: {
    phone: string;
    email: string;
    businessName: string;
    address: string;
  };
  products: Product[];
  storefrontConfigId: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  categoryId?: string;
  images?: CloudinaryImage[];
  videos?: CloudinaryVideo[];
  inventory?: {
    currentStock: number;
    lowStockThreshold: number;
  };
}

export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  resource_type: 'image';
  format: string;
  width: number;
  height: number;
  alt?: string;
}

export interface CloudinaryVideo {
  public_id: string;
  secure_url: string;
  resource_type: 'video';
  format: string;
  duration: number;
  thumbnail_url?: string;
  alt?: string;
}

export interface OrderFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  quantity: number;
  paymentMethod: 'cod' | 'bank_transfer' | 'online';
  notes: string;
}

export interface StorefrontOrder {
  storefrontConfigId: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  total: string;
  paymentMethod: 'cod' | 'bank_transfer' | 'online';
  deliveryType?: 'home_delivery' | 'store_pickup';
  notes?: string;
}

export interface StorefrontConfig {
  id: string;
  name: string;
  topProductsCount: number;
  displayMode: 'auto' | 'manual';
  selectedProductIds?: string[];
  isActive: boolean;
  theme: string;
  primaryColor: string;
  contactInfo: {
    phone: string;
    email: string;
    businessName: string;
    address: string;
  };
  createdAt?: string;
  updatedAt?: string;
}