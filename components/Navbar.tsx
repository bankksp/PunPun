import React from 'react';
import { ShoppingCart, LayoutDashboard, Coffee, LogOut, Menu, Lock, Package, ClipboardList, Store, ChevronDown } from 'lucide-react';
import { LOGO_URL, APP_NAME } from '../constants';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  cartCount?: number;
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount = 0, isAdmin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isHome = location.pathname === '/';
  const isCart = location.pathname === '/cart';
  const isOrders = location.pathname === '/orders';

  const adminLinks = [
    { path: '/admin/pos', label: 'ขายหน้าร้าน', icon: Store },
    { path: '/admin/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { path: '/admin/orders', label: 'ออเดอร์', icon: Coffee },
    { path: '/admin/products', label: 'สินค้า', icon: Package },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/')}
          >
            <div className="relative flex-shrink-0">
              <img 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-amber-800 shadow-md group-hover:scale-110 transition-transform duration-300" 
                src={LOGO_URL} 
                alt="Logo" 
              />
              <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none border border-black/5"></div>
            </div>
            <div className="ml-2 sm:ml-3 flex flex-col justify-center overflow-hidden">
              <span className="text-sm sm:text-lg font-bold text-amber-900 tracking-tight leading-none group-hover:text-amber-700 transition-colors truncate">
                {APP_NAME}
              </span>
              {!isAdmin && <span className="text-[8px] sm:text-[10px] text-amber-600 font-medium tracking-wider truncate">กาแฟสดรสเยี่ยม</span>}
            </div>
            {isAdmin && (
              <span className="ml-2 px-1.5 py-0.5 text-[8px] sm:text-[10px] uppercase font-bold bg-red-100 text-red-700 rounded-full border border-red-200 flex-shrink-0">
                ADMIN
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            {!isAdmin ? (
              <>
                <button 
                  onClick={() => navigate('/')}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 ${isHome ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-700'}`}
                  title="เมนูหลัก"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => navigate('/orders')}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 ${isOrders ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-700'}`}
                  title="ติดตามออเดอร์"
                >
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-xs font-bold hidden md:block">ติดตามออเดอร์</span>
                </button>
                <button 
                  onClick={() => navigate('/cart')}
                  className={`relative p-2 sm:p-2.5 rounded-xl transition-all duration-200 ${isCart ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-700'}`}
                  title="ตะกร้าสินค้า"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full shadow-sm border border-white">
                      {cartCount}
                    </span>
                  )}
                </button>
                <div className="h-6 w-px bg-gray-200 mx-1 sm:mx-2"></div>
                <button 
                  onClick={() => navigate('/admin/login')}
                  className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                  title="เข้าสู่ระบบร้านค้า"
                >
                  <Lock className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                {/* Desktop Admin Links */}
                <div className="hidden lg:flex items-center space-x-1">
                  <button 
                    onClick={() => navigate('/')}
                    className="text-xs font-medium px-2 py-1.5 rounded-lg flex items-center text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors mr-2"
                  >
                    <Store className="h-4 w-4 mr-1.5" />
                    หน้าร้าน
                  </button>
                  {adminLinks.map(link => (
                    <button 
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`text-xs font-medium px-2 py-1.5 rounded-lg flex items-center transition-colors ${location.pathname === link.path ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <link.icon className="h-4 w-4 mr-1.5" />
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* Mobile Admin Menu */}
                <div className="lg:hidden relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-xl text-gray-700 font-bold text-xs"
                  >
                    เมนู
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[60] animate-pop-in">
                      <button 
                        onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-amber-700 flex items-center gap-3 hover:bg-amber-50"
                      >
                        <Store className="w-4 h-4" />
                        หน้าร้านลูกค้า
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      {adminLinks.map(link => (
                        <button 
                          key={link.path}
                          onClick={() => { navigate(link.path); setIsMenuOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-3 ${location.pathname === link.path ? 'bg-amber-50 text-amber-900' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          <link.icon className="w-4 h-4" />
                          {link.label}
                        </button>
                      ))}
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <button 
                        onClick={() => {
                          localStorage.removeItem('admin_token');
                          navigate('/');
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-500 flex items-center gap-3 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>

                <div className="hidden lg:block h-6 w-px bg-gray-200 mx-2"></div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('admin_token');
                    navigate('/');
                  }}
                  className="hidden lg:flex p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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