import { GOOGLE_SCRIPT_URL, INITIAL_PRODUCTS } from '../constants';
import { Product, Order, OrderStatus, ServingType, ProductCategory, PaymentMethod } from '../types';

/* 
  ===================================================================================
  !!! IMPORTANT: GOOGLE APPS SCRIPT BACKEND CODE !!!
  
  Updated for SPEED: We now use "Optimistic Updates". 
  We update the local cache/state immediately and send the API request in the background.
  This makes the app feel "Instant" to the user.
  ===================================================================================
*/

// Cache keys
const CACHE_KEY_PRODUCTS = 'products_cache';
const CACHE_KEY_ORDERS = 'orders_cache';

// Initialize in-memory storage from Cache if available to speed up first load
let products: Product[] = [];
try {
    const cachedProducts = localStorage.getItem(CACHE_KEY_PRODUCTS);
    if (cachedProducts) {
        products = JSON.parse(cachedProducts);
    } else {
        products = [...INITIAL_PRODUCTS];
    }
} catch (e) {
    products = [...INITIAL_PRODUCTS];
}

let orders: Order[] = [];
try {
    const cachedOrders = localStorage.getItem(CACHE_KEY_ORDERS);
    if (cachedOrders) {
        orders = JSON.parse(cachedOrders);
    }
} catch (e) {
    orders = [];
}

// Helper to make API requests
const apiRequest = async (action: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
  try {
    const options: RequestInit = {
      method,
      redirect: "follow", // Important for Google Apps Script Web App redirects
    };

    if (method === 'POST' && body) {
      // Send as text/plain to avoid CORS preflight issues with Google Apps Script
      options.body = JSON.stringify(body);
      options.headers = {
        'Content-Type': 'text/plain;charset=utf-8',
      };
    }

    // Always append action to query params for better routing reliability
    const separator = GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?';
    const url = `${GOOGLE_SCRIPT_URL}${separator}action=${action}&t=${Date.now()}`;
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    // Return undefined to indicate failure, caller should handle or use fallback
    return undefined;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  // If we have products in memory (from cache), we return them implicitly, 
  // but we also trigger a background fetch to update freshness.
  
  // Strategy: The caller (CustomerHome) should check cache first. 
  // Here we fetch fresh data.
  const result = await apiRequest('getProducts');
  if (result && Array.isArray(result) && result.length > 0) {
    // Transform backend data to match new Product interface if necessary
    // Assuming backend returns valid JSON structure for prices
    products = result.map((p: any) => ({
      ...p,
      prices: p.prices || {} // Ensure prices object exists
    }));
    
    // Update Cache
    localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));
    
    return products;
  }
  return products;
};

export const saveProduct = async (product: Product): Promise<void> => {
  // 1. Optimistic update (Instant UI update)
  const index = products.findIndex(p => p.id === product.id);
  if (index > -1) {
    products[index] = product;
  } else {
    products.push(product);
  }
  
  // Update Cache
  localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));

  // 2. Background Sync (Fire and Forget - don't await to block UI)
  apiRequest('saveProduct', 'POST', {
    action: 'saveProduct',
    data: product
  }).catch(err => console.error("Background sync failed:", err));
};

export const deleteProduct = async (productId: string): Promise<void> => {
  // 1. Optimistic Update
  products = products.filter(p => p.id !== productId);
  // Update Cache
  localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));

  // 2. Background Sync
  apiRequest('deleteProduct', 'POST', {
    action: 'deleteProduct',
    id: productId
  }).catch(err => console.error("Background sync failed:", err));
};

export const getOrders = async (): Promise<Order[]> => {
  // We return the cached orders immediately if the component uses them from the exported 'orders' variable.
  // This function fetches fresh data.
  const result = await apiRequest('getOrders');
  if (result && Array.isArray(result)) {
    orders = result.sort((a: Order, b: Order) => b.timestamp - a.timestamp);
    // Update Cache
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
    return orders;
  }
  return orders;
};

export const createOrder = async (order: Order, slipBase64?: string): Promise<void> => {
  // 1. Optimistic Update (Instant UI update)
  // We treat the order as success immediately
  orders.unshift(order);
  localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));

  // 2. Background Sync (Fire and Forget)
  // We do NOT await this. The UI proceeds to "Success" screen immediately.
  const payload = {
    action: 'createOrder',
    data: order,
    slipImage: slipBase64
  };
  
  apiRequest('createOrder', 'POST', payload)
    .then(res => console.log("Order synced to cloud", res))
    .catch(err => console.error("Order sync failed", err));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  // 1. Optimistic Update
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex] = { ...orders[orderIndex], status };
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
  }

  // 2. Background Sync
  const payload = {
    action: 'updateOrderStatus',
    id: orderId,
    status: status
  };

  apiRequest('updateOrderStatus', 'POST', payload).catch(console.error);
};

export const updateOrderPayment = async (orderId: string, slipBase64: string): Promise<void> => {
    // 1. Optimistic Update
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders[orderIndex] = { 
          ...orders[orderIndex], 
          paymentMethod: PaymentMethod.TRANSFER,
          slipUrl: 'pending_upload...' // Placeholder until refreshed
      };
      localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
    }

    // 2. Background Sync
    const payload = {
        action: 'updateOrderPayment',
        id: orderId,
        slipImage: slipBase64
    };

    // Note: For image uploads, we might ideally want to wait, but to be fast, we return.
    // However, for payment slips, user might want confirmation. 
    // But consistent with "Faster", we return immediately.
    apiRequest('updateOrderPayment', 'POST', payload).catch(console.error);
};