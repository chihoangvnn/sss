import { Order } from '@/components/OrderHistory';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://766e6631-b60d-4ccf-85ca-3c49dcdde735-00-mhe9utjyvofo.sisko.replit.dev/api';

export interface ApiOrder {
  id: string;
  customerId: string;
  total: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  customer?: {
    name: string;
    email: string;
  };
  shippingAddress?: string;
  estimatedDelivery?: string;
}

export interface OrdersResponse {
  orders: ApiOrder[];
  total: number;
  page: number;
  limit: number;
}

// Transform API response to frontend Order interface
const transformApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  return {
    id: apiOrder.id,
    orderNumber: `DH${apiOrder.id.slice(-8).toUpperCase()}`,
    status: apiOrder.status as Order['status'],
    date: apiOrder.createdAt,
    total: parseInt(apiOrder.total),
    items: apiOrder.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image
    })),
    shippingAddress: apiOrder.shippingAddress,
    estimatedDelivery: apiOrder.estimatedDelivery
  };
};

// Get all orders for current user
export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const data: ApiOrder[] = await response.json();
    
    // Filter to only show shipped and delivered orders
    const filteredOrders = data.filter(order => 
      order.status === 'shipped' || order.status === 'delivered'
    );

    return filteredOrders.map(transformApiOrderToOrder);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Get specific order by ID
export const fetchOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    const data: ApiOrder = await response.json();
    return transformApiOrderToOrder(data);
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Update order status (admin function - may not be needed for customer view)
export const updateOrderStatus = async (orderId: string, status: ApiOrder['status']): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update order status: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};