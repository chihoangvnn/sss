import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Performance Optimized Components & Hooks
import { useOptimizedQuery, useOptimizedProductQuery } from "@/hooks/useOptimizedQuery";
import { usePerformanceMonitor, useRenderPerformance, useInteractionPerformance } from "@/hooks/usePerformanceMonitor";
import { useOptimizedTabManager } from "@/components/OptimizedTabManager";
import { OptimizedProductGrid } from "@/components/OptimizedProductGrid";
import { VirtualizedProductList } from "@/components/VirtualizedProductList";
import { PerformanceOverlay, usePerformanceOverlayControl } from "@/components/PerformanceOverlay";
import { useMemoryMonitor, useComponentMemoryTracking, useMultiTabMemoryOptimization } from "@/hooks/useMemoryMonitor";

// Vietnamese Search Optimization
import { 
  vietnameseFilter, 
  createSearchCacheKey, 
  createSearchString,
  testVietnameseSearch 
} from "@/utils/vietnameseSearch";

import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard,
  QrCode,
  User,
  Users,
  Calculator,
  Camera,
  X,
  MoreVertical,
  CheckCircle,
  Circle,
  Clock,
  Printer,
  Settings,
  RotateCcw,
  Receipt,
  Filter,
  Tag,
  Grid3x3,
  Activity
} from "lucide-react";

// Default customer for walk-in customers (khách vãng lai)
const DEFAULT_CUSTOMER_ID = 'feefc007-c238-4758-bdbd-9b49ed89c11c';
import { CustomerSearchInput, CustomerSearchInputRef } from "@/components/CustomerSearchInput";
import { QRPayment } from "@/components/QRPayment";
import { QRScanner } from "@/components/QRScanner";
import { DecimalQuantityInput } from "@/components/DecimalQuantityInput";
import { ReceiptPrinter } from "@/components/ReceiptPrinter";
import { ReceiptSettings, useReceiptSettings } from "@/components/ReceiptSettings";
import { SplitOrderModal, type SplitOrderData } from "@/components/SplitOrderModal";
import type { Product, Customer, Order, OrderItem, ShopSettings, Category } from "@shared/schema";
import type { CartItem } from "@/components/OptimizedTabManager";

interface POSProps {}

const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice);
};

export default function POS({}: POSProps) {
  // Performance tracking for the entire POS component
  useRenderPerformance('POS');
  useComponentMemoryTracking('POS');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Performance and memory monitoring
  const { measureOperation, measureAsync } = usePerformanceMonitor();
  const { measureInteraction } = useInteractionPerformance();
  const { memoryStats } = useMemoryMonitor();
  const { shouldReduceMemoryUsage } = useMultiTabMemoryOptimization();
  const performanceOverlay = usePerformanceOverlayControl();
  
  // Refs for keyboard shortcuts
  const productSearchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<CustomerSearchInputRef>(null);
  
  // Optimized Tab Manager with performance tracking
  const tabManager = useOptimizedTabManager();
  
  // Get current tab data safely
  const activeTab = tabManager.activeTab;
  const setCategoryFilter = tabManager.setCategoryFilter;
  const selectedCategoryId = activeTab?.selectedCategoryId || null;
  
  // Receipt Settings
  const [receiptConfig, setReceiptConfig] = useReceiptSettings();
  
  // Global state (not tab-specific)
  const [searchTerm, setSearchTerm] = useState("");
  const [normalizedSearchTerm, setNormalizedSearchTerm] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<(OrderItem & { product: Product })[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [showReceiptPrinter, setShowReceiptPrinter] = useState(false);
  const [showSplitOrderModal, setShowSplitOrderModal] = useState(false);
  const [lastPrintedOrder, setLastPrintedOrder] = useState<{
    order: Order;
    orderItems: (OrderItem & { product: Product })[];
    customer?: Customer;
  } | null>(null);
  
  // Vietnamese search normalization with performance tracking
  useEffect(() => {
    const measure = measureOperation('vietnamese-search-normalize');
    const normalized = createSearchString(searchTerm);
    setNormalizedSearchTerm(normalized);
    measure.end();
  }, [searchTerm, measureOperation]);
  
  // Test Vietnamese search functionality in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      testVietnameseSearch();
    }
  }, []);

  // Optimized categories query with prefetching
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    prefetch: prefetchCategories 
  } = useOptimizedQuery<Category[]>(
    ['categories'],
    () => measureAsync('api-categories', () => 
      fetch('/api/categories').then(res => res.json())
    ),
    {
      prefetchOnMount: true,
      backgroundRefresh: true,
      backgroundRefreshInterval: 10 * 60 * 1000, // 10 minutes
      customerDataCaching: true, // Categories are stable data
    }
  );

  // Optimized products query with Vietnamese search and performance tracking
  const searchQueryKey = useMemo(() => 
    createSearchCacheKey(normalizedSearchTerm, { categoryId: selectedCategoryId }),
    [normalizedSearchTerm, selectedCategoryId]
  );

  const { 
    data: products = [], 
    isLoading: productsLoading,
    prefetch: prefetchProducts,
    backgroundRefresh: backgroundRefreshProducts 
  } = useOptimizedProductQuery<Product[]>(
    ['products', { categoryId: selectedCategoryId, search: searchQueryKey }],
    () => measureAsync('api-products-search', async () => {
      const params = new URLSearchParams();
      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId);
      }
      if (searchTerm.trim()) {
        // Use original search term for API call (server handles normalization)
        params.append('search', searchTerm.trim());
      }
      const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      return response.json();
    }),
    {
      deduplicationWindow: 500, // Deduplicate rapid searches
      enablePerformanceTracking: true,
    }
  );

  // Optimized shop settings query
  const { 
    data: shopSettings = [], 
    isLoading: shopSettingsLoading 
  } = useOptimizedQuery<ShopSettings[]>(
    ['shop-settings'],
    () => measureAsync('api-shop-settings', () =>
      fetch('/api/shop-settings').then(res => res.json())
    ),
    {
      customerDataCaching: true,
      prefetchOnMount: true,
    }
  );

  // Get default shop settings
  const defaultShopSettings = shopSettings.find(s => s.isDefault) || shopSettings[0] || {
    id: 'default',
    businessName: 'Cửa hàng POS',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: null,
    logo: null,
    isDefault: true,
    createdAt: null,
    updatedAt: null
  } as ShopSettings;

  // Intelligent prefetching on mount for better performance
  useEffect(() => {
    const prefetchCommonData = async () => {
      const measure = measureOperation('prefetch-common-data');
      try {
        // Prefetch all categories immediately
        await prefetchCategories();
        
        // Prefetch products for first category after a short delay
        if (categories.length > 0) {
          setTimeout(async () => {
            try {
              await prefetchProducts();
              // Prefetch products from the most popular category
              await queryClient.prefetchQuery({
                queryKey: ['products', { categoryId: categories[0]?.id }],
                queryFn: () => fetch(`/api/products?categoryId=${categories[0]?.id}`).then(res => res.json()),
                staleTime: 2 * 60 * 1000, // Cache for 2 minutes
              });
            } catch (error) {
              console.warn('Failed to prefetch products:', error);
            }
          }, 500);
        }
        
        // Background refresh every 5 minutes for inventory updates
        setTimeout(() => {
          backgroundRefreshProducts();
        }, 5 * 60 * 1000);
        
      } catch (error) {
        console.warn('Failed to prefetch common data:', error);
      } finally {
        measure.end();
      }
    };

    prefetchCommonData();
  }, [prefetchCategories, prefetchProducts, backgroundRefreshProducts, categories, queryClient, measureOperation]);

  // Ensure products is always an array with Vietnamese filtering fallback
  const safeProducts = Array.isArray(products) ? products : [];
  
  // Client-side Vietnamese search filtering as fallback for better search quality
  const filteredProducts = useMemo(() => {
    const measure = measureOperation('client-side-vietnamese-filter');
    
    let filtered = safeProducts.filter(product => product.status === 'active');
    
    // If we have a search term, apply Vietnamese-aware filtering
    if (normalizedSearchTerm.length > 0) {
      filtered = vietnameseFilter(filtered, searchTerm, ['name', 'description', 'sku', 'itemCode']);
    }
    
    measure.end();
    return filtered;
  }, [safeProducts, normalizedSearchTerm, searchTerm, measureOperation]);

  // Decimal-safe arithmetic functions
  const toIntegerCents = (price: string | number): number => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return Math.round(numPrice * 100); // Convert to cents (integer)
  };

  const toIntegerThousandths = (quantity: number): number => {
    return Math.round(quantity * 1000); // Convert to thousandths (integer) 
  };

  const fromIntegerCents = (cents: number): number => {
    return cents / 100; // Convert back to VND
  };

  // Get cart and customer data from activeTab with safety checks
  const cart = activeTab?.cart || [];
  const selectedCustomer = activeTab?.selectedCustomer || null;
  
  // Decimal-safe cart calculations using integer arithmetic
  const cartTotalCents = cart.reduce((totalCents, item) => {
    const priceCents = toIntegerCents(item.product.price);
    const quantityThousandths = toIntegerThousandths(item.quantity);
    
    // Calculate subtotal in cents * thousandths, then convert back
    const subtotalCents = Math.round((priceCents * quantityThousandths) / 1000);
    return totalCents + subtotalCents;
  }, 0);

  const roundedCartTotal = fromIntegerCents(cartTotalCents);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Helper function to get product unit settings
  const getProductUnitSettings = (product: Product) => {
    // Default values for backward compatibility
    const unitType = (product as any).unitType || 'count';
    const unit = (product as any).unit || 'cái';
    const allowDecimals = (product as any).allowDecimals || false;
    
    // Fix backward compatibility: count products should have minQuantity=1, weight products=0.001
    const defaultMinQuantity = allowDecimals ? '0.001' : '1.000';
    const defaultQuantityStep = allowDecimals ? '0.001' : '1.000';
    
    const minQuantity = parseFloat((product as any).minQuantity || defaultMinQuantity);
    const quantityStep = parseFloat((product as any).quantityStep || defaultQuantityStep);
    
    return {
      unitType,
      unit,
      allowDecimals,
      minQuantity,
      quantityStep
    };
  };

  // Performance-instrumented keyboard shortcuts with technical goals tracking
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default browser behavior for F2, F3, and 1-5
      if (event.key === 'F2' || event.key === 'F3' || ['1', '2', '3', '4', '5'].includes(event.key)) {
        // Only prevent default if not typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        
        if (!isTyping || event.key === 'F2' || event.key === 'F3') {
          event.preventDefault();
        }
      }

      // F2: Focus product search with performance tracking
      if (event.key === 'F2') {
        const searchMeasure = measureInteraction('search-focus', { source: 'keyboard-f2' });
        productSearchRef.current?.focus();
        const duration = searchMeasure.end();
        
        // Technical goal: Search operations < 200ms (focus is part of search UX)
        if (duration > 200) {
          console.warn(`🚨 Search focus slow: ${duration.toFixed(2)}ms > 200ms target`);
        }
        
        toast({
          title: "Tìm sản phẩm",
          description: "Đã chuyển đến ô tìm kiếm sản phẩm",
          duration: 1500,
        });
      }

      // F3: Focus customer search with performance tracking
      if (event.key === 'F3') {
        const customerMeasure = measureInteraction('customer-search-focus', { source: 'keyboard-f3' });
        customerSearchRef.current?.focus();
        const duration = customerMeasure.end();
        
        // Track customer search focus time
        if (duration > 100) {
          console.warn(`🚨 Customer search focus slow: ${duration.toFixed(2)}ms`);
        }
        
        toast({
          title: "Tìm khách hàng",
          description: "Đã chuyển đến ô tìm kiếm khách hàng", 
          duration: 1500,
        });
      }

      // 1-5: Switch tabs with technical goal instrumentation
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      if (!isTyping && ['1', '2', '3', '4', '5'].includes(event.key)) {
        // Technical goal: Tab switching < 100ms
        const tabSwitchMeasure = measureInteraction('tab-switch-keyboard', { 
          key: event.key,
          source: 'keyboard-shortcut',
          targetTab: `tab-${event.key}`
        });
        
        const tabIndex = parseInt(event.key) - 1;
        const targetTabId = `tab-${event.key}`;
        tabManager.switchToTab(targetTabId);
        
        const duration = tabSwitchMeasure.end();
        
        // Performance alert if tab switching exceeds 100ms threshold
        if (duration > 100) {
          console.warn(`🚨 Tab switch slow: ${duration.toFixed(2)}ms > 100ms target`);
        }
        
        toast({
          title: `Đã chuyển sang ${tabManager.tabs[tabIndex]?.name || 'tab'}`,
          description: `Phím tắt: ${event.key} (${duration.toFixed(1)}ms)`,
          duration: 1000,
        });
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toast, tabManager, measureInteraction]);

  // Performance-optimized add to cart with technical goals instrumentation
  const addToCart = useCallback((product: Product) => {
    // Technical goal: Cart operations < 50ms
    const cartMeasure = measureInteraction('cart-add-product', { 
      productId: product.id, 
      productName: product.name 
    });
    
    try {
      // Safety check: ensure tabManager and activeTab are available
      if (!tabManager || !activeTab) {
        toast({
          title: "Lỗi hệ thống",
          description: "Tab Manager chưa được khởi tạo",
          variant: "destructive",
        });
        return;
      }
      
      if (product.status === 'out-of-stock' || product.stock <= 0) {
        toast({
          title: "Hết hàng",
          description: "Sản phẩm này hiện đã hết hàng",
          variant: "destructive",
        });
        return;
      }

      const { quantityStep, minQuantity } = getProductUnitSettings(product);
      const existingItem = cart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantityStep;
        
        // Check if we have enough stock
        if (newQuantity > product.stock) {
          toast({
            title: "Không đủ hàng",
            description: `Chỉ còn ${product.stock} sản phẩm trong kho`,
            variant: "destructive",
          });
          return;
        }
        
        tabManager.updateQuantity(product.id, newQuantity);
      } else {
        // Use minimum quantity for initial add
        const initialQuantity = Math.max(quantityStep, minQuantity);
        tabManager.addToCart(product, initialQuantity);
      }

      toast({
        title: "Đã thêm vào giỏ",
        description: `${product.name} đã được thêm vào ${tabManager.activeTab?.name || 'giỏ hàng'}`,
      });
    } finally {
      const duration = cartMeasure.end();
      
      // Performance alert if cart operation exceeds 50ms threshold
      if (duration > 50) {
        console.warn(`🚨 Cart operation slow: ${duration.toFixed(2)}ms > 50ms target`);
      }
    }
  }, [tabManager, activeTab, cart, measureInteraction, toast]);

  // Update quantity with decimal support
  const updateQuantity = (productId: string, newQuantity: number) => {
    // Safety check: ensure tabManager is available
    if (!tabManager) {
      toast({
        title: "Lỗi hệ thống",
        description: "Tab Manager chưa được khởi tạo",
        variant: "destructive",
      });
      return;
    }
    
    const product = cart.find(item => item.product.id === productId)?.product;
    
    if (product) {
      const { minQuantity, allowDecimals } = getProductUnitSettings(product);
      
      // For count-based products, remove if quantity < 1
      if (!allowDecimals && newQuantity < 1) {
        tabManager.removeFromCart(productId);
        return;
      }
      
      // For decimal products, remove if quantity <= 0
      if (allowDecimals && newQuantity <= 0) {
        tabManager.removeFromCart(productId);
        return;
      }
      
      // Check minimum quantity
      if (newQuantity < minQuantity) {
        toast({
          title: "Số lượng không hợp lệ",
          description: `Số lượng tối thiểu: ${minQuantity}`,
          variant: "destructive",
        });
        return;
      }
      
      // Check stock availability
      if (newQuantity > product.stock) {
        toast({
          title: "Không đủ hàng",
          description: `Chỉ còn ${product.stock} sản phẩm trong kho`,
          variant: "destructive",
        });
        return;
      }
    }

    tabManager.updateQuantity(productId, newQuantity);
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    if (!tabManager) return;
    tabManager.removeFromCart(productId);
  };

  // Clear cart (full clear)
  const clearCart = () => {
    if (!tabManager) return;
    tabManager.clearActiveTab();
  };

  // Selective cart clearing - only remove specific items that were part of an order from specific tab
  const clearOrderItemsFromCart = (targetTabId: string, orderItems: CartItem[]) => {
    if (!tabManager || !orderItems.length) return;

    // Get the target tab's current cart at clearing time
    const targetTab = tabManager.tabs.find(tab => tab.id === targetTabId);
    if (!targetTab) return;

    // Prepare all cart mutations to batch them into a single state update
    const cartMutations: Array<{productId: string, action: 'remove' | 'update', quantity?: number}> = [];
    
    orderItems.forEach(orderItem => {
      const existingCartItem = targetTab.cart.find(item => item.product.id === orderItem.product.id);
      if (existingCartItem) {
        const remainingQuantity = existingCartItem.quantity - orderItem.quantity;
        
        if (remainingQuantity <= 0) {
          // Mark for removal if no quantity left
          cartMutations.push({
            productId: orderItem.product.id,
            action: 'remove'
          });
        } else {
          // Mark for quantity update if some quantity remains
          cartMutations.push({
            productId: orderItem.product.id,
            action: 'update',
            quantity: remainingQuantity
          });
        }
      }
    });

    // Apply all mutations in a single batched operation
    if (cartMutations.length > 0) {
      tabManager.updateTabCartBatch(targetTabId, cartMutations);
    }

    toast({
      title: "Đã dọn dẹp giỏ hàng",
      description: `Đã xóa ${orderItems.length} sản phẩm từ đơn hàng vừa lưu`,
    });
  };

  // Track items that were used to create the current order (scoped by tab)
  const [orderCartData, setOrderCartData] = useState<{
    tabId: string;
    cartItems: CartItem[];
  } | null>(null);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async ({ orderData, orderContext }: { orderData: any, orderContext: { tabId: string, cartItems: CartItem[] } }) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      const result = await response.json();
      return { order: result, orderContext };
    },
    onSuccess: ({ order, orderContext }) => {
      setCurrentOrder(order);
      
      // Store the order context (tab ID + cart items used for this order)
      setOrderCartData({
        tabId: orderContext.tabId,
        cartItems: orderContext.cartItems
      });
      
      // Prepare order items with product info for receipt printing
      const orderItemsWithProducts = orderContext.cartItems.map(cartItem => ({
        id: '', // Will be set after order items are created
        orderId: order.id,
        productId: cartItem.product.id,
        quantity: cartItem.quantity.toString(),
        price: cartItem.product.price,
        product: cartItem.product
      }));
      
      setCurrentOrderItems(orderItemsWithProducts);
      setShowPayment(true);
      
      // Clear only the items that were part of this order from the specific tab
      clearOrderItemsFromCart(orderContext.tabId, orderContext.cartItems);
      
      toast({
        title: "Đơn hàng đã tạo",
        description: `Đơn hàng ${order.id} đã được tạo thành công. Giỏ hàng đã được dọn dẹp.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tạo đơn hàng",
        description: error.message || "Không thể tạo đơn hàng",
        variant: "destructive",
      });
    },
  });

  // Process checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }

    // Capture current tab ID and cart snapshot BEFORE async mutation
    const currentTabId = tabManager.activeTabId;
    const cartSnapshot = [...cart]; // Create snapshot at submit time
    
    const orderData = {
      customerId: selectedCustomer?.id || DEFAULT_CUSTOMER_ID, // Use default customer for walk-in sales
      total: roundedCartTotal.toString(), // Convert to string for validation
      status: 'pending',
      items: cartSnapshot.map(item => ({
        productId: item.product.id,
        quantity: item.quantity, // Decimal quantities are supported
        price: parseFloat(item.product.price),
      })),
      source: 'pos', // Mark as POS order
    };

    // Store the order context for selective clearing
    const orderContext = {
      tabId: currentTabId,
      cartItems: cartSnapshot
    };

    createOrderMutation.mutate({ orderData, orderContext });
  };

  // Handle split order creation
  const handleSplitOrderComplete = async (splitOrders: SplitOrderData[]) => {
    try {
      const createdOrders: Order[] = [];
      
      // Create separate orders for each customer
      for (const splitOrder of splitOrders) {
        const orderData = {
          customerId: splitOrder.customer.id,
          total: splitOrder.total.toString(),
          status: 'pending',
          items: splitOrder.items.map(item => ({
            productId: item.cartItem.product.id,
            quantity: item.quantity,
            price: parseFloat(item.cartItem.product.price),
          })),
          source: 'pos',
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create order for ${splitOrder.customer.name}`);
        }

        const order = await response.json();
        createdOrders.push(order);
      }

      // Clear cart and show success
      clearCart();
      
      toast({
        title: "Đơn hàng đã được tách thành công",
        description: `Đã tạo ${createdOrders.length} đơn hàng riêng biệt cho từng khách hàng`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

    } catch (error: any) {
      toast({
        title: "Lỗi tách đơn hàng",
        description: error.message || "Không thể tách đơn hàng",
        variant: "destructive",
      });
    }
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    if (currentOrder && currentOrderItems.length > 0) {
      // Store last printed order for reprint functionality
      setLastPrintedOrder({
        order: currentOrder,
        orderItems: currentOrderItems,
        customer: selectedCustomer || undefined
      });
      
      // Auto-print receipt if enabled
      const shouldAutoPrint = localStorage.getItem('pos-auto-print') === 'true';
      if (shouldAutoPrint) {
        setShowReceiptPrinter(true);
      }
    }
    
    // Don't clear cart here anymore - items are already selectively cleared after order creation
    // Only clear order tracking states
    setOrderCartData(null);
    setCurrentOrder(null);
    setCurrentOrderItems([]);
    setShowPayment(false);
    
    toast({
      title: "Thanh toán thành công",
      description: "Đơn hàng đã được thanh toán. " + (localStorage.getItem('pos-auto-print') === 'true' ? 'In hóa đơn tự động.' : 'Nhấn In hóa đơn để in.'),
    });
  };

  // Handle manual receipt print
  const handlePrintReceipt = () => {
    if (currentOrder && currentOrderItems.length > 0) {
      setShowReceiptPrinter(true);
    } else {
      toast({
        title: "Không có đơn hàng",
        description: "Vui lòng tạo đơn hàng trước khi in hóa đơn",
        variant: "destructive",
      });
    }
  };

  // Handle reprint last receipt
  const handleReprintReceipt = () => {
    if (lastPrintedOrder) {
      setShowReceiptPrinter(true);
    } else {
      toast({
        title: "Không có hóa đơn",
        description: "Chưa có hóa đơn nào được in gần đây",
        variant: "destructive",
      });
    }
  };

  // Handle receipt print success
  const handleReceiptPrintSuccess = () => {
    setShowReceiptPrinter(false);
    
    // If there are remaining items from the order and they weren't cleared yet,
    // clear them after successful receipt print
    if (orderCartData) {
      const targetTab = tabManager.tabs.find(tab => tab.id === orderCartData.tabId);
      if (targetTab) {
        // Check if any of the order items are still in the target tab (might have been partially cleared)
        const remainingOrderItems = orderCartData.cartItems.filter(orderItem =>
          targetTab.cart.some(cartItem => cartItem.product.id === orderItem.product.id)
        );
        
        if (remainingOrderItems.length > 0) {
          clearOrderItemsFromCart(orderCartData.tabId, remainingOrderItems);
          toast({
            title: "In thành công",
            description: "Hóa đơn đã được in thành công. Giỏ hàng đã được dọn dẹp.",
          });
        } else {
          toast({
            title: "In thành công",
            description: "Hóa đơn đã được in thành công",
          });
        }
      } else {
        toast({
          title: "In thành công", 
          description: "Hóa đơn đã được in thành công",
        });
      }
    } else {
      toast({
        title: "In thành công",
        description: "Hóa đơn đã được in thành công",
      });
    }
  };

  // Handle receipt print error
  const handleReceiptPrintError = (error: string) => {
    toast({
      title: "Lỗi in hóa đơn",
      description: error,
      variant: "destructive",
    });
  };

  // Barcode scanner functionality  
  const handleBarcodeScanned = async (barcode: string) => {
    setIsSearchingBarcode(true);
    
    try {
      // Use the proven search endpoint which works reliably for barcode scanning
      const response = await fetch(`/api/products?search=${encodeURIComponent(barcode)}`);
      const products = await response.json();
      
      // Ensure products is always an array (defensive programming for API response)
      const safeProductsResponse = Array.isArray(products) ? products : [];
      
      // Find exact match by sku or itemCode for barcode scanning
      const matchedProduct = safeProductsResponse.find((product: Product) => 
        product.sku === barcode || product.itemCode === barcode
      );
      
      if (matchedProduct) {
        // Auto-add product to cart
        addToCart(matchedProduct);
        
        toast({
          title: "📷 Quét mã vạch thành công!",
          description: `${matchedProduct.name} đã được thêm vào ${tabManager.activeTab.name}`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Không tìm thấy sản phẩm",
          description: `Không tìm thấy sản phẩm với mã: ${barcode}`,
          variant: "destructive",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      toast({
        title: "Lỗi quét mã vạch",
        description: "Có lỗi xảy ra khi tìm kiếm sản phẩm",
        variant: "destructive",
      });
    } finally {
      setIsSearchingBarcode(false);
    }
  };

  const openBarcodeScanner = () => {
    setShowBarcodeScanner(true);
  };

  const closeBarcodeScanner = () => {
    setShowBarcodeScanner(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Performance Overlay - Dev Only */}
      <PerformanceOverlay 
        enabled={import.meta.env.DEV && performanceOverlay.isEnabled}
        position="bottom-right"
        minimized={false}
      />
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Bán Hàng</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cartItemCount} sản phẩm
            </Badge>
            <Badge className="text-lg px-3 py-1 bg-green-100 text-green-800">
              <Calculator className="h-4 w-4 mr-2" />
              {formatPrice(roundedCartTotal)}
            </Badge>
            
            {/* Receipt & Settings Actions */}
            <div className="flex items-center space-x-2">
              {lastPrintedOrder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReprintReceipt}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  In lại
                </Button>
              )}
              
              <ReceiptSettings 
                onConfigChange={setReceiptConfig}
                trigger={
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Cài đặt
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b px-6 py-2">
        <div className="flex items-center space-x-1">
          {tabManager.tabs.map((tab, index) => {
            const tabStats = tabManager.getTabStats(tab);
            const isActive = tab.id === tabManager.activeTabId;
            const shortcutKey = (index + 1).toString();
            
            // Get status icon
            const getStatusIcon = () => {
              switch (tab.status) {
                case 'empty':
                  return <Circle className="h-3 w-3 text-gray-400" />;
                case 'draft':
                  return <Clock className="h-3 w-3 text-orange-500" />;
                case 'pending':
                  return <CheckCircle className="h-3 w-3 text-green-500" />;
                default:
                  return <Circle className="h-3 w-3 text-gray-400" />;
              }
            };

            return (
              <button
                key={tab.id}
                onClick={() => {
                  // Technical goal: Tab switching < 100ms instrumentation
                  const tabSwitchMeasure = measureInteraction('tab-switch-click', {
                    fromTab: tabManager.activeTabId,
                    toTab: tab.id,
                    source: 'mouse-click'
                  });
                  
                  tabManager.switchToTab(tab.id);
                  
                  const duration = tabSwitchMeasure.end();
                  
                  // Performance alert if tab switching exceeds 100ms threshold
                  if (duration > 100) {
                    console.warn(`🚨 Tab switch click slow: ${duration.toFixed(2)}ms > 100ms target`);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const contextMenu = document.getElementById(`context-menu-${tab.id}`);
                  if (contextMenu) {
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = `${e.clientX}px`;
                    contextMenu.style.top = `${e.clientY}px`;
                    
                    // Close context menu when clicking outside
                    const closeMenu = (event: MouseEvent) => {
                      if (!contextMenu.contains(event.target as Node)) {
                        contextMenu.style.display = 'none';
                        document.removeEventListener('click', closeMenu);
                      }
                    };
                    setTimeout(() => document.addEventListener('click', closeMenu), 0);
                  }
                }}
                className={`
                  relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : tab.status === 'empty' 
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }
                `}
              >
                {/* Status Icon */}
                {getStatusIcon()}
                
                {/* Tab Name */}
                <span>{tab.name}</span>
                
                {/* Keyboard Shortcut */}
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${
                    isActive 
                      ? 'bg-white/20 text-white border-white/30' 
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {shortcutKey}
                </Badge>
                
                {/* Item Count Badge */}
                {tabStats.itemCount > 0 && (
                  <Badge 
                    className={`
                      ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold
                      ${isActive 
                        ? 'bg-white text-green-600' 
                        : 'bg-orange-500 text-white'
                      }
                    `}
                  >
                    {tabStats.itemCount > 99 ? '99+' : tabStats.itemCount}
                  </Badge>
                )}
                
                {/* Customer Indicator */}
                {tab.selectedCustomer && (
                  <User className="h-3 w-3 ml-1" />
                )}

                {/* Context Menu */}
                <div
                  id={`context-menu-${tab.id}`}
                  className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[150px] hidden"
                  style={{ display: 'none' }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tab.status !== 'empty') {
                        if (confirm(`Bạn có chắc muốn xóa ${tab.name}? Tất cả dữ liệu sẽ bị mất.`)) {
                          tabManager.clearTab(tab.id);
                          toast({
                            title: "Đã xóa tab",
                            description: `${tab.name} đã được làm sạch`,
                          });
                        }
                      } else {
                        tabManager.clearTab(tab.id);
                      }
                      document.getElementById(`context-menu-${tab.id}`)!.style.display = 'none';
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa tab</span>
                  </button>
                  
                  {tab.status !== 'empty' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const emptyTab = tabManager.tabs.find(t => t.status === 'empty');
                        if (emptyTab) {
                          tabManager.duplicateTab(tab.id, emptyTab.id);
                          tabManager.switchToTab(emptyTab.id);
                          toast({
                            title: "Đã sao chép tab",
                            description: `${tab.name} đã được sao chép sang ${emptyTab.name}`,
                          });
                        } else {
                          toast({
                            title: "Không thể sao chép",
                            description: "Không có tab trống để sao chép",
                            variant: "destructive",
                          });
                        }
                        document.getElementById(`context-menu-${tab.id}`)!.style.display = 'none';
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Sao chép sang tab mới</span>
                    </button>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* Tab Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={tabManager.switchToNewOrder}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Đơn mới
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa tất cả đơn hàng?')) {
                  tabManager.clearAllTabs();
                  toast({
                    title: "Đã xóa tất cả đơn hàng",
                    description: "Tất cả tab đã được làm sạch",
                  });
                }
              }}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa tất cả
            </Button>
          </div>
        </div>
        
        {/* Tab Status Summary */}
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Circle className="h-3 w-3 text-gray-400" />
            <span>Trống</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-orange-500" />
            <span>Nháp</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Sẵn sàng</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-blue-500" />
            <span>Có khách hàng</span>
          </div>
          <span className="ml-4 text-gray-400">• Phím 1-5: Chuyển tab • F2: Tìm sản phẩm • F3: Tìm khách hàng</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Search & Category Filter */}
          <div className="p-4 border-b space-y-3">
            {/* Search Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Tìm sản phẩm</label>
                <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border-blue-200">
                  F2
                </Badge>
              </div>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    ref={productSearchRef}
                    placeholder="Tìm sản phẩm theo tên hoặc mã SKU... (F2)"
                    value={searchTerm}
                    onChange={(e) => {
                  // Technical goal: Search response time < 200ms instrumentation
                  const searchMeasure = measureInteraction('search-input-change', {
                    query: e.target.value,
                    length: e.target.value.length
                  });
                  
                  setSearchTerm(e.target.value);
                  
                  const duration = searchMeasure.end();
                  
                  // Performance alert if search input handling exceeds threshold
                  if (duration > 50) {
                    console.warn(`🚨 Search input slow: ${duration.toFixed(2)}ms`);
                  }
                }}
                    className="pl-10 text-lg py-3"
                  />
                </div>
                <Button
                  onClick={openBarcodeScanner}
                  disabled={isSearchingBarcode}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 text-lg font-medium"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  📷 Quét mã vạch
                </Button>
              </div>
            </div>

            {/* Category Filter Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Danh mục sản phẩm</label>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Grid3x3 className="h-3 w-3" />
                  <span>{filteredProducts.length} sản phẩm</span>
                </div>
              </div>
              
              {/* Category Buttons */}
              <div className="flex flex-wrap gap-2">
                {categoriesLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse h-8 w-20 bg-gray-200 rounded-full"></div>
                    <div className="animate-pulse h-8 w-24 bg-gray-200 rounded-full"></div>
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {/* All Categories Button */}
                    <Button
                      variant={selectedCategoryId === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter(null)}
                      className={`
                        text-sm font-medium transition-all duration-200
                        ${selectedCategoryId === null 
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }
                      `}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Tất cả
                    </Button>
                    
                    {/* Individual Category Buttons */}
                    {categories.map((category) => {
                      const isSelected = selectedCategoryId === category.id;
                      return (
                        <Button
                          key={category.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCategoryFilter(category.id)}
                          className={`
                            text-sm font-medium transition-all duration-200
                            ${isSelected 
                              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 border-blue-600' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }
                          `}
                        >
                          <Filter className="h-4 w-4 mr-1" />
                          {category.name}
                        </Button>
                      );
                    })}
                    
                    {categories.length === 0 && (
                      <div className="text-sm text-gray-500 italic">
                        Chưa có danh mục nào
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Active Filter Info */}
              {selectedCategoryId && (
                <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  <Filter className="h-3 w-3" />
                  <span>
                    Đang lọc: {categories.find(c => c.id === selectedCategoryId)?.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoryFilter(null)}
                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Optimized Product Grid with Performance Monitoring */}
          <div className="flex-1 p-4 overflow-hidden">
            {productsLoading ? (
              // Skeleton loading states for better perceived performance
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="h-80 animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-square mb-3 bg-gray-200 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-8 bg-gray-200 rounded w-full mt-3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Use VirtualizedProductList for large product lists (>20 items) */}
                {filteredProducts.length > 20 ? (
                  <VirtualizedProductList
                    products={filteredProducts}
                    onAddToCart={addToCart}
                    containerHeight={600}
                    itemHeight={320}
                    className="h-full"
                  />
                ) : (
                  /* Use OptimizedProductGrid for smaller lists */
                  <OptimizedProductGrid
                    products={filteredProducts}
                    onAddToCart={addToCart}
                    selectedCategoryId={selectedCategoryId}
                    searchTerm={searchTerm}
                    className="h-full overflow-y-auto"
                    itemsPerRow={4}
                    enableVirtualization={false} // Disable for small lists
                  />
                )}
              </>
            )}

            {!productsLoading && filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Không tìm thấy sản phẩm</p>
                  <p className="text-sm">
                    {searchTerm 
                      ? `Không có sản phẩm nào phù hợp với "${searchTerm}". Thử tìm kiếm với từ khóa khác.`
                      : 'Danh mục này chưa có sản phẩm nào.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart & Checkout */}
        <div className="w-80 bg-white border-l flex flex-col">
          {/* Customer Selection */}
          <div className="p-4 border-b">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Khách hàng</label>
                <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-600 border-green-200">
                  F3
                </Badge>
              </div>
              <CustomerSearchInput
                ref={customerSearchRef}
                onSelect={tabManager.setCustomer}
                placeholder="Tìm khách hàng... (F3)"
                className="w-full"
              />
              {selectedCustomer && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  <User className="h-4 w-4" />
                  <span>{selectedCustomer.name}</span>
                  <button
                    onClick={() => tabManager.setCustomer(null)}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Giỏ hàng trống</p>
                  <p className="text-sm">Thêm sản phẩm để bắt đầu</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map((item) => {
                  const unitSettings = getProductUnitSettings(item.product);
                  const itemTotal = fromIntegerCents(Math.round((toIntegerCents(item.product.price) * toIntegerThousandths(item.quantity)) / 1000));
                  
                  return (
                  <Card key={`cart-item-${item.product.id}`} className="p-3">
                    <div className="flex items-start space-x-3">
                      {/* Product Image */}
                      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.product.image || (item.product.images && item.product.images.length > 0) ? (
                          <img
                            src={item.product.image || item.product.images![0].secure_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400">📦</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {item.product.name}
                        </h4>
                        <p className="text-blue-600 font-semibold text-sm">
                          {formatPrice(item.product.price)}
                        </p>

                        {/* Decimal Quantity Controls */}
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <div className="flex-1">
                            <DecimalQuantityInput
                              key={`quantity-${item.product.id}-${item.quantity}`}
                              value={item.quantity}
                              onChange={(newQuantity) => {
                                console.log('🔢 Quantity change:', {productId: item.product.id, oldQuantity: item.quantity, newQuantity});
                                updateQuantity(item.product.id, newQuantity);
                              }}
                              unitType={unitSettings.unitType as 'weight' | 'count' | 'volume'}
                              unit={unitSettings.unit}
                              allowDecimals={unitSettings.allowDecimals}
                              minQuantity={unitSettings.minQuantity}
                              quantityStep={unitSettings.quantityStep}
                              maxQuantity={item.product.stock}
                              size="sm"
                              className="w-full"
                            />
                          </div>

                          <div
                            onClick={() => {
                              console.log('🗑️ Remove from cart:', item.product.id);
                              removeFromCart(item.product.id);
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 flex-shrink-0 cursor-pointer flex items-center justify-center rounded hover:bg-red-50"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                removeFromCart(item.product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item Total with Unit Price Display */}
                    <div className="text-right mt-3 pt-2 border-t space-y-1">
                      <div className="text-xs text-gray-500">
                        {formatPrice(item.product.price)}/{unitSettings.unit}
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  </Card>
                )})}
              </div>
            )}
          </div>

          {/* Cart Summary & Checkout */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Tổng cộng:</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(roundedCartTotal)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {cartItemCount} sản phẩm
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {createOrderMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
                </Button>

                <Button
                  onClick={() => setShowSplitOrderModal(true)}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 py-3 text-lg"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Tách đơn hàng (nhiều khách)
                </Button>

                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full"
                >
                  Xóa giỏ hàng
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thanh toán đơn hàng</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPayment(false)}
              >
                ✕
              </Button>
            </div>
            
            <QRPayment
              order={currentOrder}
              onPaymentCreated={(payment) => {
                toast({
                  title: "QR thanh toán đã tạo",
                  description: "Vui lòng quét mã QR để thanh toán",
                });
              }}
            />

            <div className="mt-4 space-y-2">
              {/* Print Receipt Button */}
              <Button
                onClick={handlePrintReceipt}
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                In hóa đơn
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handlePaymentComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Hoàn tất thanh toán
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPayment(false)}
                  className="flex-1"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <QRScanner
        isOpen={showBarcodeScanner}
        onClose={closeBarcodeScanner}
        onScan={handleBarcodeScanned}
      />

      {/* Receipt Printer Modal */}
      {(showReceiptPrinter && ((currentOrder && currentOrderItems.length > 0) || lastPrintedOrder)) && (
        <ReceiptPrinter
          order={currentOrder || lastPrintedOrder!.order}
          orderItems={currentOrderItems.length > 0 ? currentOrderItems : lastPrintedOrder!.orderItems}
          shopSettings={defaultShopSettings}
          customer={selectedCustomer || lastPrintedOrder?.customer}
          onPrintSuccess={handleReceiptPrintSuccess}
          onPrintError={handleReceiptPrintError}
          autoPrint={localStorage.getItem('pos-auto-print') === 'true' && !!currentOrder}
          autoClose={true}
        />
      )}

      {/* Split Order Modal */}
      <SplitOrderModal
        isOpen={showSplitOrderModal}
        onClose={() => setShowSplitOrderModal(false)}
        cartItems={cart}
        onSplitComplete={handleSplitOrderComplete}
      />
    </div>
  );
}