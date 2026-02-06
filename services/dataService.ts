import { GOOGLE_SCRIPT_URL, INITIAL_PRODUCTS } from '../constants';
import { Product, Order, OrderStatus, ServingType, ProductCategory, PaymentMethod } from '../types';

/* 
  ===================================================================================
  !!! IMPORTANT: GOOGLE APPS SCRIPT BACKEND CODE !!!
  
  The backend expects a JSON string for prices or flattened columns.
  For this implementation, we will assume the data is being stored flexibly.
  If using real Google Sheets, you might need to stringify the 'prices' object 
  into a single cell or split it into 9 columns.
  ===================================================================================
*/

// Fallback in-memory storage used if API fails or for optimistic updates
let products: Product[] = [...INITIAL_PRODUCTS];
let orders: Order[] = [];

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
  const result = await apiRequest('getProducts');
  if (result && Array.isArray(result) && result.length > 0) {
    // Transform backend data to match new Product interface if necessary
    // Assuming backend returns valid JSON structure for prices
    products = result.map((p: any) => ({
      ...p,
      prices: p.prices || {} // Ensure prices object exists
    }));
    return products;
  }
  return products;
};

export const saveProduct = async (product: Product): Promise<void> => {
  // Optimistic update
  const index = products.findIndex(p => p.id === product.id);
  if (index > -1) {
    products[index] = product;
  } else {
    products.push(product);
  }

  await apiRequest('saveProduct', 'POST', {
    action: 'saveProduct',
    data: product
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  products = products.filter(p => p.id !== productId);

  await apiRequest('deleteProduct', 'POST', {
    action: 'deleteProduct',
    id: productId
  });
};

export const getOrders = async (): Promise<Order[]> => {
  const result = await apiRequest('getOrders');
  if (result && Array.isArray(result)) {
    orders = result.sort((a: Order, b: Order) => b.timestamp - a.timestamp);
    return orders;
  }
  return orders;
};

export const createOrder = async (order: Order, slipBase64?: string): Promise<void> => {
  orders.unshift(order);

  const payload = {
    action: 'createOrder',
    data: order,
    slipImage: slipBase64
  };
  
  await apiRequest('createOrder', 'POST', payload);
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex] = { ...orders[orderIndex], status };
  }

  const payload = {
    action: 'updateOrderStatus',
    id: orderId,
    status: status
  };

  await apiRequest('updateOrderStatus', 'POST', payload);
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
    }

    const payload = {
        action: 'updateOrderPayment',
        id: orderId,
        slipImage: slipBase64
    };

    await apiRequest('updateOrderPayment', 'POST', payload);
};