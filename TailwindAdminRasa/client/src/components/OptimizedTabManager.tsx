import { useState, useEffect, useCallback, useMemo } from "react";
import type { Product, Customer } from "@shared/schema";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type TabStatus = 'empty' | 'draft' | 'pending';

export interface TabState {
  id: string;
  name: string;
  defaultName: string; // Original tab name ("Đơn 1", "Đơn 2", etc)
  cart: CartItem[];
  selectedCustomer: Customer | null;
  selectedCategoryId: string | null;
  status: TabStatus;
  lastModified: Date;
}

interface TabManagerState {
  tabs: TabState[];
  activeTabId: string;
}

const createEmptyTab = (id: string, name: string): TabState => ({
  id,
  name,
  defaultName: name,
  cart: [],
  selectedCustomer: null,
  selectedCategoryId: null,
  status: 'empty',
  lastModified: new Date(),
});

const STORAGE_KEY = 'pos-tabs-state';

// Performance optimization: Debounced localStorage save
let saveTimeout: NodeJS.Timeout | undefined;
const debouncedSave = (state: TabManagerState) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (import.meta.env.DEV) {
        console.log('📝 Tab state saved to localStorage');
      }
    } catch (error) {
      console.error('Failed to save tab state to localStorage:', error);
    }
  }, 1000); // Save after 1 second of inactivity
};

export const useOptimizedTabManager = () => {
  const [state, setState] = useState<TabManagerState>(() => {
    // Initialize with 5 empty tabs
    const defaultTabs: TabState[] = [
      createEmptyTab('tab-1', 'Đơn 1'),
      createEmptyTab('tab-2', 'Đơn 2'),
      createEmptyTab('tab-3', 'Đơn 3'),
      createEmptyTab('tab-4', 'Đơn 4'),
      createEmptyTab('tab-5', 'Đơn 5'),
    ];

    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects and migrate tab names
        const tabs = parsed.tabs.map((tab: any, index: number) => {
          // Migration: Ensure defaultName exists for backward compatibility
          let defaultName = tab.defaultName;
          if (!defaultName) {
            // Extract base name from existing name or generate from index
            if (tab.name && tab.name.includes(' - ')) {
              defaultName = tab.name.split(' - ')[0];
            } else {
              defaultName = `Đơn ${index + 1}`;
            }
          }
          
          // Ensure name is properly formatted
          let displayName = tab.name;
          if (!displayName || displayName === 'undefined') {
            displayName = defaultName;
          }
          
          return {
            ...tab,
            name: displayName,
            defaultName,
            lastModified: new Date(tab.lastModified),
          };
        });
        
        // Save the migrated state back to localStorage
        const migratedState = { tabs, activeTabId: parsed.activeTabId || 'tab-1' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedState));
        
        return migratedState;
      }
    } catch (error) {
      console.error('Failed to load tab state from localStorage:', error);
    }

    return {
      tabs: defaultTabs,
      activeTabId: 'tab-1',
    };
  });

  // Optimized localStorage persistence - debounced to prevent excessive writes
  useEffect(() => {
    debouncedSave(state);
  }, [state]);

  // Memoized active tab - prevents recalculation on each render
  const activeTab = useMemo(() => 
    state.tabs.find(tab => tab.id === state.activeTabId) || state.tabs[0],
    [state.tabs, state.activeTabId]
  );

  // Memoized tab status calculation
  const calculateTabStatus = useCallback((cart: CartItem[], customer: Customer | null): TabStatus => {
    if (cart.length === 0 && !customer) return 'empty';
    if (cart.length > 0 && customer) return 'pending';
    return 'draft';
  }, []);

  // Optimized update tab function - uses functional updates and minimal re-renders
  const updateTab = useCallback((tabId: string, updates: Partial<Omit<TabState, 'id' | 'name'>>) => {
    setState(prevState => {
      const tabIndex = prevState.tabs.findIndex(tab => tab.id === tabId);
      if (tabIndex === -1) return prevState;

      const currentTab = prevState.tabs[tabIndex];
      const updatedTab = {
        ...currentTab,
        ...updates,
        lastModified: new Date(),
      };
      
      // Recalculate status efficiently
      updatedTab.status = calculateTabStatus(updatedTab.cart, updatedTab.selectedCustomer);

      // Only update if there are actual changes (performance optimization)
      const hasChanges = 
        JSON.stringify(currentTab.cart) !== JSON.stringify(updatedTab.cart) ||
        currentTab.selectedCustomer?.id !== updatedTab.selectedCustomer?.id ||
        currentTab.selectedCategoryId !== updatedTab.selectedCategoryId ||
        currentTab.status !== updatedTab.status;

      if (!hasChanges) return prevState;

      // Create new tabs array with updated tab
      const newTabs = [...prevState.tabs];
      newTabs[tabIndex] = updatedTab;

      return {
        ...prevState,
        tabs: newTabs,
      };
    });
  }, [calculateTabStatus]);

  // Optimized switch to tab - early return if already active
  const switchToTab = useCallback((tabId: string) => {
    setState(prevState => {
      if (prevState.activeTabId === tabId) return prevState;
      
      const startTime = performance.now();
      const newState = {
        ...prevState,
        activeTabId: tabId,
      };
      
      // Performance tracking in development
      if (import.meta.env.DEV) {
        const endTime = performance.now();
        console.log(`🔄 Tab switch took ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      return newState;
    });
  }, []);

  // Optimized add to cart with performance tracking
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const startTime = performance.now();
    
    setState(prevState => {
      const currentTab = prevState.tabs.find(tab => tab.id === prevState.activeTabId);
      if (!currentTab) return prevState;

      const existingItemIndex = currentTab.cart.findIndex(item => item.product.id === product.id);
      let newCart: CartItem[];

      if (existingItemIndex !== -1) {
        // Update existing item
        newCart = [...currentTab.cart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item
        newCart = [...currentTab.cart, { product, quantity }];
      }

      const updatedTab = {
        ...currentTab,
        cart: newCart,
        lastModified: new Date(),
        status: calculateTabStatus(newCart, currentTab.selectedCustomer),
      };

      const newTabs = prevState.tabs.map(tab => 
        tab.id === prevState.activeTabId ? updatedTab : tab
      );

      // Performance tracking
      if (import.meta.env.DEV) {
        const endTime = performance.now();
        console.log(`🛒 Add to cart took ${(endTime - startTime).toFixed(2)}ms`);
      }

      return {
        ...prevState,
        tabs: newTabs,
      };
    });
  }, [calculateTabStatus]);

  // Optimized update quantity with minimal re-renders
  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    const startTime = performance.now();
    
    setState(prevState => {
      const currentTab = prevState.tabs.find(tab => tab.id === prevState.activeTabId);
      if (!currentTab) return prevState;

      let newCart: CartItem[];

      if (newQuantity <= 0) {
        newCart = currentTab.cart.filter(item => item.product.id !== productId);
      } else {
        newCart = currentTab.cart.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // Early return if no changes
      if (JSON.stringify(currentTab.cart) === JSON.stringify(newCart)) {
        return prevState;
      }

      const updatedTab = {
        ...currentTab,
        cart: newCart,
        lastModified: new Date(),
        status: calculateTabStatus(newCart, currentTab.selectedCustomer),
      };

      const newTabs = prevState.tabs.map(tab => 
        tab.id === prevState.activeTabId ? updatedTab : tab
      );

      // Performance tracking
      if (import.meta.env.DEV) {
        const endTime = performance.now();
        console.log(`🔢 Update quantity took ${(endTime - startTime).toFixed(2)}ms`);
      }

      return {
        ...prevState,
        tabs: newTabs,
      };
    });
  }, [calculateTabStatus]);

  // Optimized remove from cart
  const removeFromCart = useCallback((productId: string) => {
    updateQuantity(productId, 0);
  }, [updateQuantity]);

  // Optimized set customer with dynamic tab naming
  const setCustomer = useCallback((customer: Customer | null) => {
    setState(prevState => {
      const currentTab = prevState.tabs.find(tab => tab.id === prevState.activeTabId);
      if (!currentTab) return prevState;

      // Generate new tab name based on customer
      const newName = customer 
        ? `${currentTab.defaultName} - ${customer.name}`
        : currentTab.defaultName;

      const updatedTab = {
        ...currentTab,
        selectedCustomer: customer,
        name: newName,
        lastModified: new Date(),
        status: calculateTabStatus(currentTab.cart, customer),
      };

      const newTabs = prevState.tabs.map(tab => 
        tab.id === prevState.activeTabId ? updatedTab : tab
      );

      return {
        ...prevState,
        tabs: newTabs,
      };
    });
  }, [state.activeTabId, calculateTabStatus]);

  // Optimized clear active tab
  const clearActiveTab = useCallback(() => {
    updateTab(state.activeTabId, {
      cart: [],
      selectedCustomer: null,
      selectedCategoryId: null,
      status: 'empty',
    });
  }, [state.activeTabId, updateTab]);

  // Optimized clear specific tab
  const clearTab = useCallback((tabId: string) => {
    updateTab(tabId, {
      cart: [],
      selectedCustomer: null,
      selectedCategoryId: null,
      status: 'empty',
    });
  }, [updateTab]);

  // Optimized clear all tabs
  const clearAllTabs = useCallback(() => {
    const startTime = performance.now();
    
    setState(prevState => ({
      ...prevState,
      tabs: prevState.tabs.map(tab => ({
        ...tab,
        cart: [],
        selectedCustomer: null,
        selectedCategoryId: null,
        status: 'empty' as TabStatus,
        lastModified: new Date(),
      })),
    }));
    
    // Performance tracking
    if (import.meta.env.DEV) {
      const endTime = performance.now();
      console.log(`🗑️ Clear all tabs took ${(endTime - startTime).toFixed(2)}ms`);
    }
  }, []);

  // Memoized find empty tab
  const findEmptyTab = useMemo(() => {
    return state.tabs.find(tab => tab.status === 'empty');
  }, [state.tabs]);

  // Optimized switch to new order
  const switchToNewOrder = useCallback(() => {
    if (findEmptyTab) {
      switchToTab(findEmptyTab.id);
    } else {
      // If no empty tabs, switch to tab 1 and clear it
      clearTab('tab-1');
      switchToTab('tab-1');
    }
  }, [findEmptyTab, switchToTab, clearTab]);

  // Memoized tab statistics - expensive calculation cached
  const getTabStats = useCallback((tab: TabState) => {
    const itemCount = tab.cart.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = tab.cart.reduce((total, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price) 
        : item.product.price;
      return total + (price * item.quantity);
    }, 0);
    
    return {
      itemCount,
      totalAmount,
      productCount: tab.cart.length,
    };
  }, []);

  // Optimized set category filter
  const setCategoryFilter = useCallback((categoryId: string | null) => {
    updateTab(state.activeTabId, { selectedCategoryId: categoryId });
  }, [state.activeTabId, updateTab]);

  // Optimized duplicate tab
  const duplicateTab = useCallback((sourceTabId: string, targetTabId: string) => {
    const sourceTab = state.tabs.find(tab => tab.id === sourceTabId);
    if (!sourceTab) return;

    updateTab(targetTabId, {
      cart: [...sourceTab.cart], // Deep copy array
      selectedCustomer: sourceTab.selectedCustomer,
      selectedCategoryId: sourceTab.selectedCategoryId,
    });
  }, [state.tabs, updateTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, []);

  return {
    // State (memoized)
    tabs: state.tabs,
    activeTab,
    activeTabId: state.activeTabId,

    // Actions (memoized with useCallback)
    switchToTab,
    addToCart,
    updateQuantity,
    removeFromCart,
    setCustomer,
    setCategoryFilter,
    clearActiveTab,
    clearTab,
    clearAllTabs,
    switchToNewOrder,
    duplicateTab,

    // Utilities (memoized)
    getTabStats,
    findEmptyTab,
  };
};