import { GOOGLE_SCRIPT_URL, INITIAL_PRODUCTS } from '../constants';
import { Product, Order, OrderStatus, ServingType, ProductCategory, PaymentMethod } from '../types';

/* 
  ===================================================================================
  !!! IMPORTANT: GOOGLE APPS SCRIPT BACKEND CODE !!!
  
  Updated for SPEED: 
  1. Optimistic Updates (Instant UI)
  2. Image Compression (Fast Upload)
  ===================================================================================
*/

// Cache keys
const CACHE_KEY_PRODUCTS = 'products_cache';
const CACHE_KEY_ORDERS = 'orders_cache';

// --- NEW: Image Compression Utility ---
export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
        }
        
        // Fill white background (for PNGs with transparency converting to JPEG)
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with reduced quality
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
// --------------------------------------

// Initialize in-memory storage from Cache
let products: Product[] = [];
try {
    const cachedProducts = localStorage.getItem(CACHE_KEY_PRODUCTS);
    products = cachedProducts ? JSON.parse(cachedProducts) : [...INITIAL_PRODUCTS];
} catch (e) {
    products = [...INITIAL_PRODUCTS];
}

let orders: Order[] = [];
try {
    const cachedOrders = localStorage.getItem(CACHE_KEY_ORDERS);
    orders = cachedOrders ? JSON.parse(cachedOrders) : [];
} catch (e) {
    orders = [];
}

const apiRequest = async (action: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
  try {
    const options: RequestInit = {
      method,
      redirect: "follow",
    };

    if (method === 'POST' && body) {
      options.body = JSON.stringify(body);
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    }

    const separator = GOOGLE_SCRIPT_URL.includes('?') ? '&' : '?';
    const url = `${GOOGLE_SCRIPT_URL}${separator}action=${action}&t=${Date.now()}`;
    
    const response = await fetch(url, options);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    return undefined;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  // Always return cached data first implies instant load for UI
  // Background fetch to refresh
  apiRequest('getProducts').then(result => {
    if (result && Array.isArray(result) && result.length > 0) {
      products = result.map((p: any) => ({
        ...p,
        prices: p.prices || {}
      }));
      localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));
    }
  });
  
  return products;
};

export const saveProduct = async (product: Product): Promise<void> => {
  // Optimistic Update
  const index = products.findIndex(p => p.id === product.id);
  if (index > -1) products[index] = product;
  else products.push(product);
  
  localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));

  // Background Sync
  await apiRequest('saveProduct', 'POST', { action: 'saveProduct', data: product });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  // Optimistic Update
  products = products.filter(p => p.id !== productId);
  localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));

  // Background Sync
  await apiRequest('deleteProduct', 'POST', { action: 'deleteProduct', id: productId });
};

export const getOrders = async (): Promise<Order[]> => {
  const result = await apiRequest('getOrders');
  if (result && Array.isArray(result)) {
    orders = result.sort((a: Order, b: Order) => b.timestamp - a.timestamp);
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
    return orders;
  }
  return orders;
};

export const createOrder = async (order: Order, slipBase64?: string): Promise<void> => {
  // Optimistic Update
  orders.unshift(order);
  localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));

  // Background Sync
  const payload = {
    action: 'createOrder',
    data: order,
    slipImage: slipBase64
  };
  
  // We don't await to keep UI fast, but we log result
  apiRequest('createOrder', 'POST', payload)
    .then(res => console.log("Order synced", res))
    .catch(err => console.error("Order sync failed", err));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  // Optimistic Update
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex] = { ...orders[orderIndex], status };
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
  }

  await apiRequest('updateOrderStatus', 'POST', { action: 'updateOrderStatus', id: orderId, status });
};

export const updateOrderPayment = async (orderId: string, slipBase64: string): Promise<void> => {
    // Optimistic Update
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders[orderIndex] = { 
          ...orders[orderIndex], 
          paymentMethod: PaymentMethod.TRANSFER,
          slipUrl: 'pending_upload...' 
      };
      localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
    }

    await apiRequest('updateOrderPayment', 'POST', { action: 'updateOrderPayment', id: orderId, slipImage: slipBase64 });
};