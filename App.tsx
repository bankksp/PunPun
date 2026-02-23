
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { CustomerHome } from './pages/CustomerHome';
import { CustomerCart } from './pages/CustomerCart';
import { CustomerOrders } from './pages/CustomerOrders';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminOrders } from './pages/AdminOrders';
import { AdminProducts } from './pages/AdminProducts';
import { AdminLogin } from './pages/AdminLogin';
import { AdminPOS } from './pages/AdminPOS';
import { CartItem } from './types';

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId === cartId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <CustomerHome 
              addToCart={addToCart}
              cartCount={cart.length}
            />
          } 
        />
        <Route 
          path="/cart" 
          element={
            <CustomerCart 
              cart={cart} 
              removeFromCart={removeFromCart} 
              clearCart={clearCart}
              updateQuantity={updateQuantity}
            />
          } 
        />
        <Route 
          path="/orders" 
          element={
            <CustomerOrders 
              cartCount={cart.length}
            />
          } 
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        {/* In a real app, these would be ProtectedRoutes checking for auth token */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/pos" element={<AdminPOS />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
