import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerSearchInput } from "@/components/CustomerSearchInput";
import { User, Plus, Minus, Trash2, Users, Receipt } from "lucide-react";
import type { Customer, Product } from "@shared/schema";
import type { CustomerWithAnalytics } from "@/components/CustomerSearchInput";
import type { CartItem } from "@/components/OptimizedTabManager";

export interface SplitOrderData {
  customer: CustomerWithAnalytics;
  items: { cartItem: CartItem; quantity: number }[];
  total: number;
}

interface SplitOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onSplitComplete: (splitOrders: SplitOrderData[]) => void;
}

const formatPrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numPrice);
};

export function SplitOrderModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onSplitComplete 
}: SplitOrderModalProps) {
  const [splitOrders, setSplitOrders] = useState<SplitOrderData[]>([]);
  const [unassignedItems, setUnassignedItems] = useState<{ cartItem: CartItem; quantity: number }[]>([]);

  // Initialize unassigned items when modal opens
  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      setUnassignedItems(
        cartItems.map(item => ({
          cartItem: item,
          quantity: item.quantity
        }))
      );
      setSplitOrders([]);
    }
  }, [isOpen, cartItems]);

  // Add a new customer split
  const addCustomerSplit = () => {
    setSplitOrders(prev => [...prev, {
      customer: null as any,
      items: [],
      total: 0
    }]);
  };

  // Remove a customer split
  const removeCustomerSplit = (index: number) => {
    const splitToRemove = splitOrders[index];
    
    // Return items to unassigned
    setUnassignedItems(prev => [
      ...prev,
      ...splitToRemove.items
    ]);

    // Remove the split
    setSplitOrders(prev => prev.filter((_, i) => i !== index));
  };

  // Set customer for a split
  const setCustomerForSplit = (index: number, customer: CustomerWithAnalytics | null) => {
    if (!customer) return;
    setSplitOrders(prev => prev.map((split, i) => 
      i === index ? { ...split, customer } : split
    ));
  };

  // Move item from unassigned to a customer split
  const moveItemToCustomer = (itemIndex: number, customerIndex: number, quantity: number) => {
    const unassignedItem = unassignedItems[itemIndex];
    if (!unassignedItem || quantity <= 0 || quantity > unassignedItem.quantity) return;

    // Add to customer split
    setSplitOrders(prev => prev.map((split, i) => {
      if (i === customerIndex) {
        const existingItemIndex = split.items.findIndex(
          item => item.cartItem.product.id === unassignedItem.cartItem.product.id
        );
        
        let newItems;
        if (existingItemIndex >= 0) {
          // Update existing item
          newItems = split.items.map((item, idx) => 
            idx === existingItemIndex 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item
          newItems = [...split.items, { 
            cartItem: unassignedItem.cartItem, 
            quantity 
          }];
        }

        const total = newItems.reduce((sum, item) => 
          sum + (parseFloat(item.cartItem.product.price) * item.quantity), 0
        );

        return { ...split, items: newItems, total };
      }
      return split;
    }));

    // Remove from unassigned
    setUnassignedItems(prev => prev.map((item, i) => 
      i === itemIndex 
        ? { ...item, quantity: item.quantity - quantity }
        : item
    ).filter(item => item.quantity > 0));
  };

  // Move item back from customer to unassigned
  const moveItemToUnassigned = (customerIndex: number, itemIndex: number, quantity: number) => {
    const customerSplit = splitOrders[customerIndex];
    const splitItem = customerSplit.items[itemIndex];
    if (!splitItem || quantity <= 0 || quantity > splitItem.quantity) return;

    // Add back to unassigned
    setUnassignedItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.cartItem.product.id === splitItem.cartItem.product.id
      );
      
      if (existingIndex >= 0) {
        return prev.map((item, i) => 
          i === existingIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { 
          cartItem: splitItem.cartItem, 
          quantity 
        }];
      }
    });

    // Remove from customer split
    setSplitOrders(prev => prev.map((split, i) => {
      if (i === customerIndex) {
        const newItems = split.items.map((item, idx) => 
          idx === itemIndex 
            ? { ...item, quantity: item.quantity - quantity }
            : item
        ).filter(item => item.quantity > 0);

        const total = newItems.reduce((sum, item) => 
          sum + (parseFloat(item.cartItem.product.price) * item.quantity), 0
        );

        return { ...split, items: newItems, total };
      }
      return split;
    }));
  };

  // Check if we can complete the split
  const canCompleteSplit = () => {
    return unassignedItems.length === 0 && 
           splitOrders.length > 0 && 
           splitOrders.every(split => split.customer && split.items.length > 0);
  };

  // Handle split completion
  const handleCompleteSplit = () => {
    if (canCompleteSplit()) {
      onSplitComplete(splitOrders);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Tách đơn hàng cho nhiều khách hàng</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Unassigned Items */}
          {unassignedItems.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Sản phẩm chưa phân chia ({unassignedItems.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {unassignedItems.map((item, itemIndex) => (
                  <Card key={`${item.cartItem.product.id}-${itemIndex}`} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                          {item.cartItem.product.image || (item.cartItem.product.images && item.cartItem.product.images.length > 0) ? (
                            <img
                              src={item.cartItem.product.image || item.cartItem.product.images![0].secure_url}
                              alt={item.cartItem.product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">📦</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.cartItem.product.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.cartItem.product.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(parseFloat(item.cartItem.product.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 space-x-1">
                        {splitOrders.map((split, customerIndex) => (
                          <Button
                            key={customerIndex}
                            size="sm"
                            variant="outline"
                            onClick={() => moveItemToCustomer(itemIndex, customerIndex, item.quantity)}
                            disabled={!split.customer}
                            className="text-xs"
                          >
                            → KH{customerIndex + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Customer Splits */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Chia theo khách hàng</h3>
              <Button
                onClick={addCustomerSplit}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm khách hàng</span>
              </Button>
            </div>

            <div className="space-y-4">
              {splitOrders.map((split, customerIndex) => (
                <Card key={customerIndex} className="p-4">
                  <div className="space-y-3">
                    {/* Customer Selection */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <Label className="text-sm font-medium">
                          Khách hàng {customerIndex + 1}:
                        </Label>
                        <div className="flex-1">
                          <CustomerSearchInput
                            onSelect={(customer) => setCustomerForSplit(customerIndex, customer)}
                            placeholder="Chọn khách hàng..."
                            className="w-full"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => removeCustomerSplit(customerIndex)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Selected Customer Info */}
                    {split.customer && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        <User className="h-4 w-4" />
                        <span>{split.customer.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {formatPrice(split.total)}
                        </Badge>
                      </div>
                    )}

                    {/* Customer's Items */}
                    {split.items.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">
                          Sản phẩm ({split.items.length}):
                        </p>
                        {split.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="text-sm">{item.cartItem.product.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {item.quantity}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {formatPrice(parseFloat(item.cartItem.product.price) * item.quantity)}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveItemToUnassigned(customerIndex, itemIndex, item.quantity)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {unassignedItems.length > 0 && (
                <p className="text-amber-600">
                  Còn {unassignedItems.length} sản phẩm chưa được phân chia
                </p>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                onClick={handleCompleteSplit}
                disabled={!canCompleteSplit()}
                className="bg-green-600 hover:bg-green-700"
              >
                Tạo {splitOrders.length} đơn hàng riêng biệt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SplitOrderModal;