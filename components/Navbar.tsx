import React from 'react';
import { ShoppingCart, LayoutDashboard, Coffee, LogOut, Menu, Lock, Package, ClipboardList, Store } from 'lucide-react';
import { LOGO_URL, APP_NAME } from '../constants';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  cartCount?: number;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount = 0, isAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isCart = location.pathname === '/cart';
  const isOrders = location.pathname === '/orders';

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/')}
          >
            <div className="relative">
              <img 
                className="h-10 w-10 rounded-full object-cover border-2 border-amber-800 shadow-md group-hover:scale-110 transition-transform duration-300" 
                src={LOGO_URL} 
                alt="Logo" 
              />
              <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none border border-black/5"></div>
            </div>
            <div className="ml-3 flex flex-col justify-center">
              <span className="text-lg font-bold text-amber-900 tracking-tight leading-none group-hover:text-amber-700 transition-colors">
                {APP_NAME}
              </span>
              {!isAdmin && <span className="text-[10px] text-amber-600 font-medium tracking-wider">PREMIUM COFFEE</span>}
            </div>
            {isAdmin && (
              <span className="ml-3 px-2 py-0.5 text-[10px] uppercase font-bold bg-red-100 text-red-700 rounded-full border border-red-200">
                Admin Mode
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isAdmin ? (
              <>
                <button 
                  onClick={() => navigate('/')}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${isHome ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-700'}`}
                  title="เมนูหลัก"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => navigate('/orders')}
                  className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 ${isOrders ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-700'}`}
                  title="ติดตามออเดอร์"
                >
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-xs font-bold hidden sm:block">ติดตามออเดอร์</span>
                </button>
                <button 
                  onClick={() => navigate('/cart')}
                  className={`relative p-2.5 rounded-xl transition-all duration-200 ${isCart ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-700'}`}
                  title="ตะกร้าสินค้า"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full shadow-sm border border-white">
                      {cartCount}
                    </span>
                  )}
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                <button 
                  onClick={() => navigate('/admin/login')}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                  title="เข้าสู่ระบบร้านค้า"
                >
                  <Lock className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/')}
                  className="text-sm font-medium px-3 py-2 rounded-lg flex items-center text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
                  title="กลับไปหน้าสั่งซื้อ"
                >
                  <Store className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">หน้าร้าน</span>
                </button>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                 <button 
                  onClick={() => navigate('/admin/dashboard')}
                  className={`text-sm font-medium px-3 py-2 rounded-lg flex items-center transition-colors ${location.pathname === '/admin/dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">ภาพรวม</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/orders')}
                  className={`text-sm font-medium px-3 py-2 rounded-lg flex items-center transition-colors ${location.pathname === '/admin/orders' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">ออเดอร์</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/products')}
                  className={`text-sm font-medium px-3 py-2 rounded-lg flex items-center transition-colors ${location.pathname === '/admin/products' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Package className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">สินค้า</span>
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('admin_token');
                    navigate('/');
                  }}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};