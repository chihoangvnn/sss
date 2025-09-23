import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard,
  QrCode,
  User,
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
  Receipt
} from "lucide-react";
import { CustomerSearchInput, CustomerSearchInputRef } from "@/components/CustomerSearchInput";
import { QRPayment } from "@/components/QRPayment";
import { QRScanner } from "@/components/QRScanner";
import { DecimalQuantityInput } from "@/components/DecimalQuantityInput";
import { ReceiptPrinter } from "@/components/ReceiptPrinter";
import { ReceiptSettings, useReceiptSettings } from "@/components/ReceiptSettings";
import { useTabManager, type CartItem } from "@/components/TabManager";
import type { Product, Customer, Order, OrderItem, ShopSettings } from "@shared/schema";

interface POSProps {}

const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice);
};

export default function POS({}: POSProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs for keyboard shortcuts
  const productSearchRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<CustomerSearchInputRef>(null);
  
  // Tab Manager
  const tabManager = useTabManager();
  
  // Receipt Settings
  const [receiptConfig, setReceiptConfig] = useReceiptSettings();
  
  // Global state (not tab-specific)
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<(OrderItem & { product: Product })[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  const [showReceiptPrinter, setShowReceiptPrinter] = useState(false);
  const [lastPrintedOrder, setLastPrintedOrder] = useState<{
    order: Order;
    orderItems: (OrderItem & { product: Product })[];
    customer?: Customer;
  } | null>(null);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
  });

  // Fetch shop settings
  const { data: shopSettings = [], isLoading: shopSettingsLoading } = useQuery<ShopSettings[]>({
    queryKey: ['/api/shop-settings'],
    queryFn: () => fetch('/api/shop-settings').then(res => res.json()),
  });

  // Get default shop settings
  const defaultShopSettings = shopSettings.find(s => s.isDefault) || shopSettings[0] || {
    businessName: 'Cửa hàng POS',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: ''
  } as ShopSettings;

  // Ensure products is always an array (defensive programming)
  const safeProducts = Array.isArray(products) ? products : [];

  // Filter products by search
  const filteredProducts = safeProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  // Get current tab data
  const { activeTab } = tabManager;
  const cart = activeTab.cart;
  const selectedCustomer = activeTab.selectedCustomer;
  
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

  // Keyboard shortcuts for F2, F3, and 1-5 for tab switching
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

      // F2: Focus product search
      if (event.key === 'F2') {
        productSearchRef.current?.focus();
        toast({
          title: "Tìm sản phẩm",
          description: "Đã chuyển đến ô tìm kiếm sản phẩm",
          duration: 1500,
        });
      }

      // F3: Focus customer search  
      if (event.key === 'F3') {
        customerSearchRef.current?.focus();
        toast({
          title: "Tìm khách hàng",
          description: "Đã chuyển đến ô tìm kiếm khách hàng", 
          duration: 1500,
        });
      }

      // 1-5: Switch tabs (only when not typing)
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      if (!isTyping && ['1', '2', '3', '4', '5'].includes(event.key)) {
        const tabIndex = parseInt(event.key) - 1;
        const targetTabId = `tab-${event.key}`;
        tabManager.switchToTab(targetTabId);
        toast({
          title: `Đã chuyển sang ${tabManager.tabs[tabIndex].name}`,
          description: `Phím tắt: ${event.key}`,
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
  }, [toast, tabManager]);

  // Add to cart with decimal support
  const addToCart = (product: Product) => {
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
      description: `${product.name} đã được thêm vào ${tabManager.activeTab.name}`,
    });
  };

  // Update quantity with decimal support
  const updateQuantity = (productId: string, newQuantity: number) => {
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
    tabManager.removeFromCart(productId);
  };

  // Clear cart
  const clearCart = () => {
    tabManager.clearActiveTab();
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: (order) => {
      setCurrentOrder(order);
      
      // Prepare order items with product info for receipt printing
      const orderItemsWithProducts = cart.map(cartItem => ({
        id: '', // Will be set after order items are created
        orderId: order.id,
        productId: cartItem.product.id,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
        product: cartItem.product
      }));
      
      setCurrentOrderItems(orderItemsWithProducts);
      setShowPayment(true);
      
      toast({
        title: "Đơn hàng đã tạo",
        description: `Đơn hàng ${order.id} đã được tạo thành công`,
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

    const orderData = {
      customerId: selectedCustomer?.id || null,
      total: roundedCartTotal, // Use decimal-safe rounded total
      status: 'pending',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity, // Decimal quantities are supported
        price: parseFloat(item.product.price),
      })),
      source: 'pos', // Mark as POS order
    };

    createOrderMutation.mutate(orderData);
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    if (currentOrder && currentOrderItems.length > 0) {
      // Store last printed order for reprint functionality
      setLastPrintedOrder({
        order: currentOrder,
        orderItems: currentOrderItems,
        customer: selectedCustomer
      });
      
      // Auto-print receipt if enabled
      const shouldAutoPrint = localStorage.getItem('pos-auto-print') === 'true';
      if (shouldAutoPrint) {
        setShowReceiptPrinter(true);
      }
    }
    
    clearCart();
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
    toast({
      title: "In thành công",
      description: "Hóa đơn đã được in thành công",
    });
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
                onClick={() => tabManager.switchToTab(tab.id)}
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
                        const emptyTab = tabManager.findEmptyTab();
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
          {/* Search */}
          <div className="p-4 border-b">
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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
          </div>

          {/* Product Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {product.image || (product.images && product.images.length > 0) ? (
                          <img
                            src={product.image || product.images![0].secure_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-4xl">📦</div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(product.price)}
                          </span>
                          <Badge 
                            variant={product.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {product.status === 'active' ? 'Còn hàng' : 'Hết hàng'}
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-500">
                          Kho: {product.stock}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!productsLoading && filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Không tìm thấy sản phẩm</p>
                  <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart & Checkout */}
        <div className="w-96 bg-white border-l flex flex-col">
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
                {cart.map((item) => (
                  <Card key={item.product.id} className="p-3">
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
                              value={item.quantity}
                              onChange={(newQuantity) => updateQuantity(item.product.id, newQuantity)}
                              unitType={getProductUnitSettings(item.product).unitType as 'weight' | 'count' | 'volume'}
                              unit={getProductUnitSettings(item.product).unit}
                              allowDecimals={getProductUnitSettings(item.product).allowDecimals}
                              minQuantity={getProductUnitSettings(item.product).minQuantity}
                              quantityStep={getProductUnitSettings(item.product).quantityStep}
                              maxQuantity={item.product.stock}
                              size="sm"
                              className="w-full"
                            />
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Item Total with Unit Price Display */}
                    <div className="text-right mt-3 pt-2 border-t space-y-1">
                      <div className="text-xs text-gray-500">
                        {formatPrice(item.product.price)}/{getProductUnitSettings(item.product).unit}
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatPrice(fromIntegerCents(Math.round((toIntegerCents(item.product.price) * toIntegerThousandths(item.quantity)) / 1000)))}
                      </span>
                    </div>
                  </Card>
                ))}
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
    </div>
  );
}