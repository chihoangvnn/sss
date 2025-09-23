import { useState, useEffect, useCallback } from "react";
import type { Product, Customer } from "@shared/schema";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type TabStatus = 'empty' | 'draft' | 'pending';

export interface TabState {
  id: string;
  name: string;
  cart: CartItem[];
  selectedCustomer: Customer | null;
  selectedCategoryId: string | null; // Add category filter state
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
  cart: [],
  selectedCustomer: null,
  selectedCategoryId: null, // Initialize category filter as null (All Categories)
  status: 'empty',
  lastModified: new Date(),
});

const STORAGE_KEY = 'pos-tabs-state';

export const useTabManager = () => {
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
        // Convert date strings back to Date objects
        const tabs = parsed.tabs.map((tab: any) => ({
          ...tab,
          lastModified: new Date(tab.lastModified),
        }));
        return { tabs, activeTabId: parsed.activeTabId || 'tab-1' };
      }
    } catch (error) {
      console.error('Failed to load tab state from localStorage:', error);
    }

    return {
      tabs: defaultTabs,
      activeTabId: 'tab-1',
    };
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save tab state to localStorage:', error);
    }
  }, [state]);

  // Get current active tab
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId) || state.tabs[0];

  // Calculate tab status based on cart and customer
  const calculateTabStatus = (cart: CartItem[], customer: Customer | null): TabStatus => {
    if (cart.length === 0 && !customer) return 'empty';
    if (cart.length > 0 && customer) return 'pending';
    return 'draft';
  };

  // Update tab state helper
  const updateTab = useCallback((tabId: string, updates: Partial<Omit<TabState, 'id' | 'name'>>) => {
    setState(prevState => ({
      ...prevState,
      tabs: prevState.tabs.map(tab => {
        if (tab.id === tabId) {
          const updatedTab = {
            ...tab,
            ...updates,
            lastModified: new Date(),
          };
          // Recalculate status
          updatedTab.status = calculateTabStatus(updatedTab.cart, updatedTab.selectedCustomer);
          return updatedTab;
        }
        return tab;
      }),
    }));
  }, []);

  // Switch to a specific tab
  const switchToTab = useCallback((tabId: string) => {
    setState(prevState => ({
      ...prevState,
      activeTabId: tabId,
    }));
  }, []);

  // Add item to active tab's cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const activeTabId = state.activeTabId;
    const currentTab = state.tabs.find(tab => tab.id === activeTabId);
    if (!currentTab) return;

    const existingItem = currentTab.cart.find(item => item.product.id === product.id);
    let newCart: CartItem[];

    if (existingItem) {
      newCart = currentTab.cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...currentTab.cart, { product, quantity }];
    }

    updateTab(activeTabId, { cart: newCart });
  }, [state.activeTabId, state.tabs, updateTab]);

  // Update quantity in active tab's cart
  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    const activeTabId = state.activeTabId;
    const currentTab = state.tabs.find(tab => tab.id === activeTabId);
    if (!currentTab) return;

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

    updateTab(activeTabId, { cart: newCart });
  }, [state.activeTabId, state.tabs, updateTab]);

  // Remove item from active tab's cart
  const removeFromCart = useCallback((productId: string) => {
    const activeTabId = state.activeTabId;
    const currentTab = state.tabs.find(tab => tab.id === activeTabId);
    if (!currentTab) return;

    const newCart = currentTab.cart.filter(item => item.product.id !== productId);
    updateTab(activeTabId, { cart: newCart });
  }, [state.activeTabId, state.tabs, updateTab]);

  // Set customer for active tab
  const setCustomer = useCallback((customer: Customer | null) => {
    updateTab(state.activeTabId, { selectedCustomer: customer });
  }, [state.activeTabId, updateTab]);

  // Clear active tab
  const clearActiveTab = useCallback(() => {
    updateTab(state.activeTabId, {
      cart: [],
      selectedCustomer: null,
      selectedCategoryId: null, // Reset category filter
      status: 'empty',
    });
  }, [state.activeTabId, updateTab]);

  // Clear specific tab
  const clearTab = useCallback((tabId: string) => {
    updateTab(tabId, {
      cart: [],
      selectedCustomer: null,
      selectedCategoryId: null, // Reset category filter
      status: 'empty',
    });
  }, [updateTab]);

  // Clear all tabs
  const clearAllTabs = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      tabs: prevState.tabs.map(tab => ({
        ...tab,
        cart: [],
        selectedCustomer: null,
        selectedCategoryId: null, // Reset category filter
        status: 'empty' as TabStatus,
        lastModified: new Date(),
      })),
    }));
  }, []);

  // Find next empty tab
  const findEmptyTab = useCallback(() => {
    return state.tabs.find(tab => tab.status === 'empty');
  }, [state.tabs]);

  // Switch to next empty tab or create one
  const switchToNewOrder = useCallback(() => {
    const emptyTab = findEmptyTab();
    if (emptyTab) {
      switchToTab(emptyTab.id);
    } else {
      // If no empty tabs, switch to tab 1 and clear it
      clearTab('tab-1');
      switchToTab('tab-1');
    }
  }, [findEmptyTab, switchToTab, clearTab]);

  // Get tab statistics
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

  // Set category filter for active tab
  const setCategoryFilter = useCallback((categoryId: string | null) => {
    updateTab(state.activeTabId, { selectedCategoryId: categoryId });
  }, [state.activeTabId, updateTab]);

  // Duplicate tab to another tab
  const duplicateTab = useCallback((sourceTabId: string, targetTabId: string) => {
    const sourceTab = state.tabs.find(tab => tab.id === sourceTabId);
    if (!sourceTab) return;

    updateTab(targetTabId, {
      cart: [...sourceTab.cart],
      selectedCustomer: sourceTab.selectedCustomer,
      selectedCategoryId: sourceTab.selectedCategoryId, // Duplicate category filter
    });
  }, [state.tabs, updateTab]);

  return {
    // State
    tabs: state.tabs,
    activeTab,
    activeTabId: state.activeTabId,

    // Actions
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

    // Utilities
    getTabStats,
    findEmptyTab,
  };
};