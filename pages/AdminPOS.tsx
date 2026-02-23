import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { getProducts, getCategories, createOrder } from '../services/dataService';
import { Product, Category, UserType, ServingType, PaymentMethod, PaymentStatus, OrderStatus, CartItem, Order } from '../types';
import { QR_CODE_URL, SWEETNESS_LEVELS } from '../constants';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle2, X, User, Coffee, Utensils, ShoppingCart } from 'lucide-react';

export const AdminPOS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<UserType>(UserType.GENERAL);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showSweetnessModal, setShowSweetnessModal] = useState<{product: Product, servingType: ServingType} | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setProducts(p);
      setCategories(c);
      
      // Default to Drink category if it exists
      const drinkCat = c.find(cat => cat.name.toLowerCase().includes('น้ำ') || cat.name.toLowerCase().includes('เครื่องดื่ม') || cat.name.toLowerCase().includes('drink'));
      if (drinkCat) {
        setSelectedCategory(drinkCat.name);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product, servingType: ServingType, sweetness: string = SWEETNESS_LEVELS[2]) => {
    const priceStructure = product.prices[servingType];
    if (!priceStructure) return;

    let appliedPrice = 0;
    if (selectedUserType === UserType.TEACHER) appliedPrice = priceStructure.teacher;
    else if (selectedUserType === UserType.STUDENT) appliedPrice = priceStructure.student;
    else appliedPrice = priceStructure.general;

    const cartId = `${product.id}-${servingType}-${Date.now()}`;
    const newItem: CartItem = {
      ...product,
      cartId,
      quantity: 1,
      sweetness: product.productType === 'drink' ? sweetness : 'N/A',
      appliedPrice,
      selectedUserType,
      selectedServingType: servingType
    };

    setCart([...cart, newItem]);
    setShowSweetnessModal(null);
  };

  const handleProductClick = (product: Product, servingType: ServingType) => {
    if (product.productType === 'drink') {
      setShowSweetnessModal({ product, servingType });
    } else {
      addToCart(product, servingType);
    }
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.appliedPrice * item.quantity), 0);
  }, [cart]);

  const changeAmount = useMemo(() => {
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - totalAmount);
  }, [cashReceived, totalAmount]);

  // Update prices in cart when user type changes
  useEffect(() => {
    setCart(prev => prev.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return item;
      
      const priceStructure = product.prices[item.selectedServingType];
      if (!priceStructure) return item;

      let appliedPrice = 0;
      if (selectedUserType === UserType.TEACHER) appliedPrice = priceStructure.teacher;
      else if (selectedUserType === UserType.STUDENT) appliedPrice = priceStructure.student;
      else appliedPrice = priceStructure.general;

      return { ...item, appliedPrice, selectedUserType };
    }));
  }, [selectedUserType, products]);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const order: Order = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        customerName: 'ลูกค้าหน้าร้าน',
        userType: selectedUserType,
        items: cart,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === PaymentMethod.CASH ? PaymentStatus.PAID : PaymentStatus.PENDING,
        deliveryLocation: 'หน้าร้าน',
        status: OrderStatus.COMPLETED,
        timestamp: Date.now()
      };

      await createOrder(order);
      setCart([]);
      setShowQR(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('เกิดข้อผิดพลาดในการสร้างออเดอร์');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar isAdmin={true} />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Product Selection */}
        <div className={`flex-1 flex flex-col p-2 sm:p-4 overflow-hidden ${showMobileCart ? 'hidden lg:flex' : 'flex'}`}>
          <div className="mb-4 flex gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowMobileCart(true)}
              className="lg:hidden relative p-2 bg-amber-600 text-white rounded-xl shadow-md"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              ทั้งหมด
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.name ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 pr-1">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-square relative group">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 sm:gap-2 p-1 sm:p-2">
                    {Object.entries(product.prices).map(([type, prices]) => (
                      <button
                        key={type}
                        onClick={() => handleProductClick(product, type as ServingType)}
                        className="bg-white text-amber-900 px-1.5 py-1 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold hover:bg-amber-50 transition-colors shadow-sm"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-2 sm:p-3">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">{product.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(product.prices).map(([type, prices]) => {
                      const p = prices as any;
                      return (
                        <span key={type} className="text-[8px] sm:text-[10px] text-gray-500 bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded">
                          {type}: ฿{selectedUserType === UserType.TEACHER ? p?.teacher : selectedUserType === UserType.STUDENT ? p?.student : p?.general}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Order Summary (Cart) */}
        <div className={`
          fixed inset-0 z-50 lg:relative lg:z-0 lg:flex lg:w-96 bg-white border-l border-gray-200 flex-col shadow-xl transition-transform duration-300
          ${showMobileCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-600" />
              รายการสั่งซื้อ
            </h2>
            <button 
              onClick={() => setShowMobileCart(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Customer Type Selection */}
          <div className="p-3 sm:p-4 bg-amber-50/50 border-b border-amber-100">
            <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2 block">ประเภทลูกค้า</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(UserType).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedUserType(type)}
                  className={`py-2 rounded-xl text-[10px] sm:text-xs font-bold border transition-all ${
                    selectedUserType === type 
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Coffee className="w-12 h-12 opacity-20" />
                <p className="text-sm">ยังไม่มีรายการสินค้า</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId} className="flex gap-3 bg-gray-50 p-2 sm:p-3 rounded-2xl border border-gray-100">
                  <img src={item.image} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.cartId)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-gray-500">{item.selectedServingType} | {item.sweetness}</p>
                    <div className="mt-1 sm:mt-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs sm:text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-amber-700">฿{item.appliedPrice * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary & Payment */}
          <div className="p-4 border-t border-gray-100 space-y-3 sm:space-y-4 bg-gray-50/50">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium text-sm sm:text-base">ยอดรวมทั้งหมด</span>
              <span className="text-xl sm:text-2xl font-black text-gray-900">฿{totalAmount.toLocaleString()}</span>
            </div>

            {paymentMethod === PaymentMethod.CASH && (
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">รับเงินมา</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm">฿</span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0"
                      className="w-20 sm:w-24 pl-5 sm:pl-6 pr-1 sm:pr-2 py-1 text-right font-bold text-gray-900 border-b-2 border-gray-200 focus:border-amber-500 outline-none bg-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">เงินทอน</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600">฿{changeAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setPaymentMethod(PaymentMethod.CASH);
                  setShowQR(false);
                }}
                className={`flex items-center justify-center gap-2 py-2 sm:py-3 rounded-2xl border-2 transition-all ${
                  paymentMethod === PaymentMethod.CASH 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                  : 'bg-white border-gray-100 text-gray-500'
                }`}
              >
                <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-xs sm:text-sm">เงินสด</span>
              </button>
              <button
                onClick={() => {
                  setPaymentMethod(PaymentMethod.TRANSFER);
                  setShowQR(true);
                }}
                className={`flex items-center justify-center gap-2 py-2 sm:py-3 rounded-2xl border-2 transition-all ${
                  paymentMethod === PaymentMethod.TRANSFER 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'bg-white border-gray-100 text-gray-500'
                }`}
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-xs sm:text-sm">สแกนจ่าย</span>
              </button>
            </div>

            <button
              disabled={cart.length === 0 || isProcessing}
              onClick={handleConfirmOrder}
              className="w-full bg-amber-600 text-white py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg shadow-amber-100 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              {isProcessing ? 'กำลังบันทึก...' : 'ยืนยันการสั่งซื้อ'}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative animate-pop-in">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">สแกนเพื่อชำระเงิน</h3>
              <p className="text-gray-500 text-sm mb-6">ยอดชำระ: <span className="text-amber-600 font-bold">฿{totalAmount}</span></p>
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 mb-6">
                <img src={QR_CODE_URL} alt="QR Payment" className="w-full aspect-square object-contain" />
              </div>
              <button
                onClick={handleConfirmOrder}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors"
              >
                ยืนยันการชำระเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-6 h-6" />
          <span className="font-bold">บันทึกออเดอร์สำเร็จ!</span>
        </div>
      )}

      {/* Sweetness Selection Modal */}
      {showSweetnessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full animate-pop-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">เลือกระดับความหวาน</h3>
            <div className="space-y-2">
              {SWEETNESS_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => addToCart(showSweetnessModal.product, showSweetnessModal.servingType, level)}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-amber-50 hover:border-amber-200 transition-colors text-left flex justify-between items-center"
                >
                  {level}
                  <Plus className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSweetnessModal(null)}
              className="w-full mt-4 py-2 text-gray-400 font-medium hover:text-gray-600"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
