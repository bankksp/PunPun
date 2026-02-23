

import { GOOGLE_SCRIPT_URL } from '../constants';
import { Product, Order, OrderStatus, Category, PaymentMethod, PaymentStatus } from '../types';

const CACHE_KEY_PRODUCTS = 'products_cache';
const CACHE_KEY_ORDERS = 'orders_cache';
const CACHE_KEY_CATEGORIES = 'categories_cache';

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
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error("Failed to get canvas context")); return; }
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

let products: Product[] = [];
try {
    const cached = localStorage.getItem(CACHE_KEY_PRODUCTS);
    if (cached) products = JSON.parse(cached);
} catch (e) { 
    console.error("Failed to parse cached products, clearing cache.");
    localStorage.removeItem(CACHE_KEY_PRODUCTS);
}

let categories: Category[] = [];
try {
    const cached = localStorage.getItem(CACHE_KEY_CATEGORIES);
    if (cached) categories = JSON.parse(cached);
} catch (e) {
    console.error("Failed to parse cached categories, clearing cache.");
    localStorage.removeItem(CACHE_KEY_CATEGORIES);
}

let orders: Order[] = [];
try {
    const cached = localStorage.getItem(CACHE_KEY_ORDERS);
    if (cached) orders = JSON.parse(cached);
} catch (e) {
    console.error("Failed to parse cached orders, clearing cache.");
    localStorage.removeItem(CACHE_KEY_ORDERS);
}

const apiGetRequest = async (action: string) => {
  try {
    const scriptUrl = GOOGLE_SCRIPT_URL.trim();
    if (!scriptUrl) throw new Error("Google Script URL is not configured.");

    const url = new URL(scriptUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const textResponse = await response.text();
    
    // Check for HTML response (often means script error/crash)
    if (textResponse.trim().startsWith('<')) {
        console.error(`API Error (${action}): Received HTML instead of JSON.`, textResponse);
        throw new Error("Invalid response from server (HTML).");
    }

    try {
      return JSON.parse(textResponse);
    } catch (e) {
      console.error(`API Error (${action}): Failed to parse JSON response.`, textResponse);
      throw new Error("Invalid response from server.");
    }
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    return undefined;
  }
};

const apiPostRequest = async (payload: { action: string; [key: string]: any }) => {
  try {
    const scriptUrl = GOOGLE_SCRIPT_URL.trim();
    const url = `${scriptUrl}?t=${Date.now()}`;
    
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }
    
    const textResponse = await response.text();
    if (textResponse.trim().startsWith('<')) {
        console.error(`API Error (${payload.action}): Received HTML instead of JSON.`, textResponse);
        throw new Error("Invalid response from server (HTML).");
    }

    try {
      return JSON.parse(textResponse);
    } catch (e) {
      console.error(`API Error (${payload.action}): Failed to parse JSON response.`, textResponse);
      throw new Error("Invalid response from server.");
    }
  } catch (error) {
    console.error(`API Error (${payload.action}):`, error);
    return undefined;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  const result = await apiGetRequest('getProducts');
  if (result && Array.isArray(result)) {
    products = result.map((p: any) => ({ 
        ...p, 
        // Handle potential parsing issues if backend returns stringified JSON
        prices: typeof p.prices === 'string' ? JSON.parse(p.prices) : (p.prices || {}) 
    }));
    localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));
  } else {
    console.warn("getProducts failed or returned invalid data, using cache.");
  }
  return products;
};

export const saveProduct = async (product: Product): Promise<void> => {
  const index = products.findIndex(p => p.id === product.id);
  if (index > -1) products[index] = product;
  else products.push(product);
  localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));
  await apiPostRequest({ action: 'saveProduct', data: product });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  products = products.filter(p => p.id !== productId);
  localStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(products));
  await apiPostRequest({ action: 'deleteProduct', id: productId });
};

export const getCategories = async (): Promise<Category[]> => {
  const result = await apiGetRequest('getCategories');
  if (result && Array.isArray(result)) {
    categories = result;
    localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(categories));
  }
  return categories;
};

export const saveCategory = async (category: Category): Promise<void> => {
  const index = categories.findIndex(c => c.id === category.id);
  if (index > -1) categories[index] = category;
  else categories.push(category);
  localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(categories));
  await apiPostRequest({ action: 'saveCategory', data: category });
};

export const deleteCategory = async (id: string): Promise<void> => {
  categories = categories.filter(c => c.id !== id);
  localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(categories));
  await apiPostRequest({ action: 'deleteCategory', id });
};

export const getOrders = async (): Promise<Order[]> => {
  const result = await apiGetRequest('getOrders');
  if (result && Array.isArray(result)) {
    orders = result.map((o: any) => ({
      ...o,
      paymentStatus: o.paymentStatus || PaymentStatus.PENDING 
    })).sort((a: Order, b: Order) => b.timestamp - a.timestamp);
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
    return orders;
  }
  return orders;
};

export const createOrder = async (order: Order, slipBase64?: string): Promise<void> => {
  orders.unshift(order);
  localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
  await apiPostRequest({ action: 'createOrder', data: order, slipImage: slipBase64 });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex] = { ...orders[orderIndex], status };
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
  }
  await apiPostRequest({ action: 'updateOrderStatus', id: orderId, status });
};

export const updatePaymentStatus = async (orderId: string, status: PaymentStatus): Promise<void> => {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex] = { ...orders[orderIndex], paymentStatus: status };
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
  }
  await apiPostRequest({ action: 'updatePaymentStatus', id: orderId, status });
};

export const updateOrderPayment = async (orderId: string, slipBase64: string): Promise<void> => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
      orders[orderIndex] = { 
          ...orders[orderIndex], 
          paymentMethod: PaymentMethod.TRANSFER,
          slipUrl: 'pending_upload...' 
      };
      localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(orders));
    }
    await apiPostRequest({ action: 'updateOrderPayment', id: orderId, slipImage: slipBase64 });
};
