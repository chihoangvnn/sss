import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  increment,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Collection names
export const COLLECTIONS = {
  CATALOGS: 'catalogs',
  SUB_CATALOGS: 'subCatalogs', 
  PRODUCTS: 'products',
  PRODUCT_VARIANTS: 'productVariants',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  ORDER_ITEMS: 'orderItems',
  INVENTORY: 'inventory',
  SOCIAL_ACCOUNTS: 'socialAccounts',
  CHATBOT_CONVERSATIONS: 'chatbotConversations',
  PRODUCT_LANDING_PAGES: 'productLandingPages'
} as const;

// Base interfaces for Firebase documents
export interface FirebaseDocument {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Catalog interfaces
export interface Catalog extends FirebaseDocument {
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  parentCatalogId?: string; // For nested catalogs
}

export interface SubCatalog extends FirebaseDocument {
  name: string;
  description?: string;
  catalogId: string;
  isActive: boolean;
  sortOrder: number;
}

// Product interfaces
export interface Product extends FirebaseDocument {
  name: string;
  description: string;
  catalogId: string;
  subCatalogId?: string;
  basePrice: number;
  unit: string; // kg, piece, etc.
  minOrderQuantity: number; // 0.01 for kg items
  isActive: boolean;
  images: string[]; // URLs to Firebase Storage
  videos: ProductVideo[];
  tags: string[];
  sku?: string; // Optional SKU
}

export interface ProductVideo {
  type: 'facebook' | 'youtube' | 'tiktok' | 'direct';
  url: string;
  title?: string;
}

export interface ProductVariant extends FirebaseDocument {
  productId: string;
  name: string; // Táo Nhỏ, Táo Lớn, Vòng Loại A
  price: number;
  sku: string;
  isActive: boolean;
  sortOrder: number;
}

// Inventory interface
export interface Inventory extends FirebaseDocument {
  productId: string;
  variantId?: string;
  currentStock: number;
  soldQuantity: number;
  reservedQuantity: number;
  lastUpdated: Timestamp;
  expiryDate?: Timestamp;
  location?: string;
}

// Customer interface with debt management
export interface Customer extends FirebaseDocument {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  customerType: 'retail' | 'wholesale';
  totalDebt: number;
  creditLimit: number;
  isActive: boolean;
  notes?: string;
}

export interface CustomerTransaction extends FirebaseDocument {
  customerId: string;
  orderId?: string;
  type: 'order' | 'payment' | 'refund' | 'adjustment';
  amount: number;
  description: string;
  paymentMethod?: string;
}

// Order interfaces with debt management
// Individual Product Landing Page interfaces  
export interface ProductLandingPage extends FirebaseDocument {
  // Basic info
  title: string;
  slug: string; // URL slug for the landing page (unique)
  description?: string;
  
  // Product connection
  productId: string;
  variantId?: string;
  
  // Pricing (can override product price)
  customPrice?: number; // If null, use product's base price
  originalPrice?: number; // For showing discount
  
  // Page customization
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  callToAction?: string; // Button text, default "Đặt hàng ngay"
  
  // Features & benefits
  features: string[]; // List of product features/benefits
  testimonials?: ProductTestimonial[];
  
  // Settings
  isActive: boolean;
  theme: 'light' | 'dark';
  primaryColor: string;
  
  // Contact info for this landing page
  contactInfo: {
    phone: string;
    email?: string;
    address?: string;
    businessName?: string;
  };
  
  // Tracking & Analytics
  viewCount: number;
  orderCount: number;
  conversionRate: number;
  
  // Payment methods
  paymentMethods: {
    cod: boolean; // Cash on delivery
    bankTransfer: boolean;
    online: boolean; // Credit card, e-wallet, etc.
  };
}

export interface ProductTestimonial {
  customerName: string;
  content: string;
  rating: number; // 1-5 stars
  avatar?: string;
}

export interface Order extends FirebaseDocument {
  customerId: string;
  orderNumber: string;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  total: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  shippingAddress?: string;
  notes?: string;
  dueDate?: Timestamp;
}

export interface OrderItem extends FirebaseDocument {
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Firebase Storage class
export class FirebaseStorage {
  
  // Catalog management
  async createCatalog(data: Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.CATALOGS), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async getCatalogs(): Promise<Catalog[]> {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.CATALOGS), orderBy('sortOrder'))
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalog));
  }

  async getCatalogById(id: string): Promise<Catalog | null> {
    const docRef = doc(db, COLLECTIONS.CATALOGS, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Catalog : null;
  }

  async getActiveCatalogs(): Promise<Catalog[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.CATALOGS), 
        where('isActive', '==', true),
        orderBy('sortOrder')
      )
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalog));
  }

  // Sub-catalog management
  async createSubCatalog(data: Omit<SubCatalog, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.SUB_CATALOGS), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async getSubCatalogsByCatalogId(catalogId: string): Promise<SubCatalog[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.SUB_CATALOGS),
        where('catalogId', '==', catalogId),
        where('isActive', '==', true),
        orderBy('sortOrder')
      )
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubCatalog));
  }

  // Product management with variants
  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async getProductsByCatalog(catalogId: string, subCatalogId?: string): Promise<Product[]> {
    const constraints: QueryConstraint[] = [
      where('catalogId', '==', catalogId),
      where('isActive', '==', true)
    ];
    
    if (subCatalogId) {
      constraints.push(where('subCatalogId', '==', subCatalogId));
    }

    const snapshot = await getDocs(query(collection(db, COLLECTIONS.PRODUCTS), ...constraints));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Product : null;
  }

  async searchProducts(searchTerm: string, limitCount = 20): Promise<Product[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia or similar for production
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('isActive', '==', true),
        limit(limitCount)
      )
    );
    
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Product variants
  async createProductVariant(data: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCT_VARIANTS), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.PRODUCT_VARIANTS),
        where('productId', '==', productId),
        where('isActive', '==', true),
        orderBy('sortOrder')
      )
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductVariant));
  }

  // Inventory management
  async updateInventory(productId: string, variantId: string | undefined, stockChange: number, soldChange: number = 0): Promise<void> {
    const inventoryQuery = variantId 
      ? query(collection(db, COLLECTIONS.INVENTORY), where('productId', '==', productId), where('variantId', '==', variantId))
      : query(collection(db, COLLECTIONS.INVENTORY), where('productId', '==', productId), where('variantId', '==', null));
    
    const snapshot = await getDocs(inventoryQuery);
    
    if (snapshot.empty) {
      // Create new inventory record
      await addDoc(collection(db, COLLECTIONS.INVENTORY), {
        productId,
        variantId: variantId || null,
        currentStock: Math.max(0, stockChange),
        soldQuantity: Math.max(0, soldChange),
        reservedQuantity: 0,
        lastUpdated: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      // Update existing inventory
      const inventoryDoc = snapshot.docs[0];
      await updateDoc(inventoryDoc.ref, {
        currentStock: increment(stockChange),
        soldQuantity: increment(soldChange),
        lastUpdated: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
  }

  async getInventoryByProduct(productId: string, variantId?: string): Promise<Inventory | null> {
    const inventoryQuery = variantId 
      ? query(collection(db, COLLECTIONS.INVENTORY), where('productId', '==', productId), where('variantId', '==', variantId))
      : query(collection(db, COLLECTIONS.INVENTORY), where('productId', '==', productId), where('variantId', '==', null));
    
    const snapshot = await getDocs(inventoryQuery);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Inventory;
  }

  // Get inventory reports for warehouse management
  async getLowStockItems(threshold: number = 10): Promise<Inventory[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.INVENTORY),
        where('currentStock', '<=', threshold)
      )
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inventory));
  }

  async getOutOfStockItems(): Promise<Inventory[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.INVENTORY),
        where('currentStock', '==', 0)
      )
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inventory));
  }

  async getExpiredItems(): Promise<Inventory[]> {
    const now = Timestamp.now();
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.INVENTORY),
        where('expiryDate', '<=', now)
      )
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inventory));
  }

  // Order management with debt tracking
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>[]): Promise<string> {
    const batch = writeBatch(db);
    
    // Create order
    const orderRef = doc(collection(db, COLLECTIONS.ORDERS));
    batch.set(orderRef, {
      ...orderData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Create order items
    for (const item of items) {
      const itemRef = doc(collection(db, COLLECTIONS.ORDER_ITEMS));
      batch.set(itemRef, {
        ...item,
        orderId: orderRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Update inventory (reduce stock, increase sold quantity)
      await this.updateInventory(item.productId, item.variantId, -item.quantity, item.quantity);
    }

    // Update customer debt if any
    if (orderData.debtAmount > 0) {
      const customerRef = doc(db, COLLECTIONS.CUSTOMERS, orderData.customerId);
      batch.update(customerRef, {
        totalDebt: increment(orderData.debtAmount),
        updatedAt: Timestamp.now()
      });
    }

    await batch.commit();
    return orderRef.id;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const docRef = doc(db, COLLECTIONS.ORDERS, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Order : null;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ORDER_ITEMS), where('orderId', '==', orderId))
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderItem));
  }

  // Customer management
  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Customer : null;
  }

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  async getCustomerTopProducts(customerId: string, limitCount: number = 10): Promise<any[]> {
    // Get all orders for this customer
    const ordersSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.ORDERS), where('customerId', '==', customerId))
    );
    
    const orderIds = ordersSnapshot.docs.map(doc => doc.id);
    
    if (orderIds.length === 0) return [];

    // Get all order items for these orders
    const productCounts: { [productId: string]: { count: number, productName: string, variantName?: string } } = {};
    
    for (const orderId of orderIds) {
      const itemsSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.ORDER_ITEMS), where('orderId', '==', orderId))
      );
      
      itemsSnapshot.docs.forEach(doc => {
        const item = doc.data() as OrderItem;
        const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
        
        if (!productCounts[key]) {
          productCounts[key] = {
            count: 0,
            productName: item.productName,
            variantName: item.variantName
          };
        }
        productCounts[key].count += item.quantity;
      });
    }

    return Object.entries(productCounts)
      .map(([key, data]) => ({
        productKey: key,
        productName: data.productName,
        variantName: data.variantName,
        totalQuantity: data.count
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limitCount);
  }

  // Product Landing Pages Management
  async getAllProductLandingPages(): Promise<ProductLandingPage[]> {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.PRODUCT_LANDING_PAGES), orderBy('createdAt', 'desc'))
    );
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductLandingPage));
  }

  async getProductLandingPageBySlug(slug: string): Promise<ProductLandingPage | null> {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.PRODUCT_LANDING_PAGES), where('slug', '==', slug), limit(1))
    );
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ProductLandingPage;
  }

  async getProductLandingPageById(id: string): Promise<ProductLandingPage | null> {
    const docRef = doc(db, COLLECTIONS.PRODUCT_LANDING_PAGES, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return { id: snapshot.id, ...snapshot.data() } as ProductLandingPage;
  }

  async createProductLandingPage(data: Omit<ProductLandingPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Check if slug already exists
    const existing = await this.getProductLandingPageBySlug(data.slug);
    if (existing) {
      throw new Error('Slug already exists');
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCT_LANDING_PAGES), {
      ...data,
      viewCount: 0,
      orderCount: 0,
      conversionRate: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return docRef.id;
  }

  async updateProductLandingPage(id: string, data: Partial<ProductLandingPage>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRODUCT_LANDING_PAGES, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async deleteProductLandingPage(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRODUCT_LANDING_PAGES, id);
    await deleteDoc(docRef);
  }

  async incrementLandingPageView(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRODUCT_LANDING_PAGES, id);
    await updateDoc(docRef, {
      viewCount: increment(1),
      updatedAt: Timestamp.now()
    });
  }

  async incrementLandingPageOrder(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRODUCT_LANDING_PAGES, id);
    await updateDoc(docRef, {
      orderCount: increment(1),
      updatedAt: Timestamp.now()
    });
    
    // Update conversion rate
    const landingPage = await this.getProductLandingPageById(id);
    if (landingPage && landingPage.viewCount > 0) {
      const newConversionRate = ((landingPage.orderCount + 1) / landingPage.viewCount) * 100;
      await updateDoc(docRef, {
        conversionRate: newConversionRate
      });
    }
  }

  // Get landing page with product details
  async getProductLandingPageWithDetails(idOrSlug: string): Promise<any> {
    let landingPage: ProductLandingPage | null;
    
    // Try to get by slug first, then by ID
    if (idOrSlug.includes('-')) {
      landingPage = await this.getProductLandingPageBySlug(idOrSlug);
    } else {
      landingPage = await this.getProductLandingPageById(idOrSlug);
    }
    
    if (!landingPage) return null;

    // Get product details
    const product = await this.getProductById(landingPage.productId);
    if (!product) return null;

    let variant: ProductVariant | null = null;
    if (landingPage.variantId) {
      const variantDoc = await getDoc(doc(db, COLLECTIONS.PRODUCT_VARIANTS, landingPage.variantId));
      if (variantDoc.exists()) {
        variant = { id: variantDoc.id, ...variantDoc.data() } as ProductVariant;
      }
    }

    // Get inventory info
    const inventory = await this.getInventoryByProduct(landingPage.productId, landingPage.variantId);

    return {
      ...landingPage,
      product,
      variant,
      inventory,
      availableStock: inventory?.currentStock || 0,
      finalPrice: landingPage.customPrice || variant?.price || product.basePrice,
      displayName: landingPage.title || product.name,
      displayDescription: landingPage.description || product.description,
      displayImage: landingPage.heroImage || (product.images && product.images[0])
    };
  }
}

// Create and export singleton instance
const firebaseStorageInstance = new FirebaseStorage();
export { firebaseStorageInstance as firebaseStorage };