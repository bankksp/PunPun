
import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { UserType, Product, Category, CartItem, ServingType } from '../types';
import { getProducts, getCategories } from '../services/dataService';
import { Plus, Sparkles, Flame, Snowflake, Wind, ThumbsUp, Tag, Coffee, RefreshCcw, Search } from 'lucide-react';
import { SWEETNESS_LEVELS, LOGO_URL } from '../constants';
import { Footer } from '../components/Footer';

interface CustomerHomeProps {
  addToCart: (item: CartItem) => void;
  cartCount: number;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ addToCart, cartCount }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sweetness, setSweetness] = useState<string>(SWEETNESS_LEVELS[2]); 
  const [selectedUserType, setSelectedUserType] = useState<UserType>(UserType.GENERAL);
  const [selectedServingType, setSelectedServingType] = useState<ServingType | null>(null);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getProducts(),
      getCategories(),
    ]).then(([productsData, categoriesData]) => {
      setProducts(productsData);
      setCategories(categoriesData);
    }).catch((err) => {
      console.error("Error fetching initial app data:", err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    if (selectedProduct) {
      setSweetness(SWEETNESS_LEVELS[2]);
      setSelectedUserType(UserType.GENERAL);
      setActiveMedia(selectedProduct.image);
      // Logic update: check productType if available, fallback to category
      const isSnack = selectedProduct.productType === 'snack' || selectedProduct.category === 'ขนม';
      if (isSnack) {
        setSelectedServingType(ServingType.SNACK);
      } else {
        if (selectedProduct.prices[ServingType.ICED]) setSelectedServingType(ServingType.ICED);
        else if (selectedProduct.prices[ServingType.HOT]) setSelectedServingType(ServingType.HOT);
        else if (selectedProduct.prices[ServingType.FRAPPE]) setSelectedServingType(ServingType.FRAPPE);
        else setSelectedServingType(null);
      }
    }
  }, [selectedProduct]);

  const categoryOptions = ['All', 'Recommended', ...categories.map(c => c.name)];

  const filteredProducts = products.filter(p => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Recommended') return p.isRecommended;
    return p.category === activeCategory;
  }).sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    return 0;
  });

  const getPrice = (product: Product, userType: UserType, servingType: ServingType | null) => {
    if (!servingType || !product.prices[servingType]) return 0;
    const priceStruct = product.prices[servingType];
    if (!priceStruct) return 0;
    switch (userType) {
      case UserType.TEACHER: return priceStruct.teacher;
      case UserType.STUDENT: return priceStruct.student;
      default: return priceStruct.general;
    }
  };

  const getStartPrice = (product: Product) => {
    let minPrice = Infinity;
    const types = [ServingType.HOT, ServingType.ICED, ServingType.FRAPPE, ServingType.SNACK];
    types.forEach(type => {
      if (product.prices[type]) {
        if (product.prices[type]!.student < minPrice) minPrice = product.prices[type]!.student;
      }
    });
    return minPrice === Infinity ? 0 : minPrice;
  };

  const handleAddToCart = () => {
    if (selectedProduct && selectedServingType) {
      const finalPrice = getPrice(selectedProduct, selectedUserType, selectedServingType);
      const isSnack = selectedProduct.productType === 'snack' || selectedProduct.category === 'ขนม';
      const item: CartItem = {
        ...selectedProduct,
        cartId: Date.now().toString(),
        quantity: 1,
        sweetness: isSnack ? '-' : sweetness,
        appliedPrice: finalPrice,
        selectedUserType: selectedUserType,
        selectedServingType: selectedServingType
      };
      addToCart(item);
      setSelectedProduct(null);
    }
  };

  const getAllImages = () => selectedProduct ? [selectedProduct.image, ...(selectedProduct.additionalImages || [])] : [];

  const openLightbox = () => {
    const images = getAllImages();
    const currentIndex = images.findIndex(img => img === activeMedia);
    setLightboxIndex(currentIndex >= 0 ? currentIndex : 0);
    setIsLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
      <Navbar cartCount={cartCount} />

      {/* Hero Section */}
      <div className="relative w-full h-[380px] bg-gray-900 overflow-hidden">
        {/* Background Image with Parallax-like feel */}
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-60 scale-105"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop')" }}
        ></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf9f6] via-transparent to-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-8">
            <div className="relative group mb-6">
                <div className="absolute -inset-1 bg-amber-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative p-1.5 bg-white/10 backdrop-blur-md rounded-full ring-1 ring-white/30 shadow-2xl">
                    <img 
                        src={LOGO_URL} 
                        alt="Logo" 
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-white/90 shadow-lg"
                    />
                </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2 tracking-tight drop-shadow-sm animate-pop-in">
                ปัญ ปันสุข <span className="text-amber-700">คอฟฟี่</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-lg font-medium max-w-lg mx-auto bg-white/60 backdrop-blur-sm py-1 px-4 rounded-full shadow-sm mt-2">
                "ความสุขที่สัมผัสได้... ในทุกหยดของกาแฟ"
            </p>
        </div>
      </div>

      {/* Categories Sticky Bar */}
      <div className="sticky top-[64px] z-30 bg-[#faf9f6]/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex space-x-2 overflow-x-auto pb-1 pt-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categoryOptions.map(cat => (
                <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                    activeCategory === cat 
                    ? 'bg-amber-800 text-white border-amber-800 shadow-lg shadow-amber-800/20 transform scale-105' 
                    : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50'
                }`}
                >
                {cat === 'All' ? 'ทั้งหมด' : cat === 'Recommended' ? <><ThumbsUp className="w-3.5 h-3.5 mr-1.5" />แนะนำ</> : cat}
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        
        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
            {loading ? (
            <div className="col-span-full py-32 text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-amber-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-400 font-medium animate-pulse">กำลังจัดเตรียมร้าน...</p>
            </div>
            ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-24 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200 mx-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                    <Coffee className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-gray-600 mb-1">ไม่พบรายการสินค้า</h3>
                <p className="text-gray-400 text-sm mb-6">ลองเปลี่ยนหมวดหมู่หรือโหลดข้อมูลใหม่</p>
                <button 
                onClick={loadData}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-bold hover:bg-amber-100 transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" /> โหลดข้อมูลใหม่
                </button>
            </div>
            ) : filteredProducts.map(product => (
            <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className="group relative bg-white rounded-[1.5rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 overflow-hidden cursor-pointer border border-gray-100 flex flex-col h-full hover:-translate-y-1.5"
            >
                {/* Image Area */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                    <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                        loading="lazy"
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                        {product.isRecommended && (
                        <div className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center shadow-lg backdrop-blur-md bg-opacity-90">
                            <ThumbsUp className="w-3 h-3 mr-1" /> แนะนำ
                        </div>
                        )}
                        {product.isPopular && (
                        <div className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center shadow-lg backdrop-blur-md bg-opacity-90">
                            <Sparkles className="w-3 h-3 mr-1" /> ขายดี
                        </div>
                        )}
                    </div>

                    {/* Quick Category Tag */}
                    <div className="absolute bottom-3 right-3 z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/20">
                            {product.category}
                        </span>
                    </div>
                </div>
                
                {/* Details */}
                <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1 group-hover:text-amber-700 transition-colors leading-tight">
                        {product.name}
                    </h3>
                    
                    <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-50">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">เริ่มต้น</span>
                            <span className="text-xl font-black text-amber-900 leading-none">฿{getStartPrice(product)}</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            <Plus className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      <Footer />

      {/* Product Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedProduct(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-slide-up sm:animate-zoom-in max-h-[90vh] overflow-y-auto overflow-x-hidden">
            
            {/* Close Handle Mobile */}
            <div className="sticky top-0 right-0 left-0 z-20 flex justify-center p-4 pointer-events-none sm:hidden">
                 <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>

            <div className="flex flex-col sm:flex-row">
                {/* Image Section - Updated to aspect-ratio for full image visibility */}
                <div className="sm:w-2/5 relative aspect-[3/4] sm:aspect-auto sm:h-auto bg-gray-100 shrink-0">
                    <img 
                        src={activeMedia || selectedProduct.image} 
                        className="w-full h-full object-cover cursor-zoom-in" 
                        alt={selectedProduct.name}
                        onClick={openLightbox}
                    />
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-bold text-amber-900 shadow-sm flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {selectedProduct.category}
                        </span>
                    </div>
                </div>

                {/* Details Section */}
                <div className="sm:w-3/5 p-6 sm:p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-full">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h2>
                                <button onClick={() => setSelectedProduct(null)} className="hidden sm:block p-2 text-gray-400 hover:text-gray-600">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{selectedProduct.description || "เครื่องดื่มรสชาติดี คัดสรรวัตถุดิบคุณภาพ"}</p>
                        </div>
                    </div>

                    {/* Image Thumbnails */}
                    {selectedProduct.additionalImages && selectedProduct.additionalImages.length > 0 && (
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            <button 
                                onClick={() => setActiveMedia(selectedProduct.image)} 
                                className={`w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeMedia === selectedProduct.image ? 'border-amber-600 ring-2 ring-amber-100' : 'border-transparent'}`}
                            >
                                <img src={selectedProduct.image} className="w-full h-full object-cover" />
                            </button>
                            {selectedProduct.additionalImages.map((img, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setActiveMedia(img)} 
                                    className={`w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeMedia === img ? 'border-amber-600 ring-2 ring-amber-100' : 'border-transparent'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-6 mb-8 flex-1">
                        {/* Serving Type */}
                        {!(selectedProduct.productType === 'snack' || selectedProduct.category === 'ขนม') && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">รูปแบบการเสิร์ฟ</label>
                            <div className="flex gap-3">
                                {[ServingType.HOT, ServingType.ICED, ServingType.FRAPPE].map((type) => {
                                    if (!selectedProduct.prices[type]) return null;
                                    const isSelected = selectedServingType === type;
                                    return (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedServingType(type)}
                                        className={`flex-1 py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                                        isSelected 
                                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500 shadow-sm' 
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-amber-200 hover:bg-amber-50/50'
                                        }`}
                                    >
                                        {type === ServingType.HOT && <Flame className={`w-4 h-4 ${isSelected ? 'text-rose-500' : 'text-gray-400'}`} />}
                                        {type === ServingType.ICED && <Snowflake className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />}
                                        {type === ServingType.FRAPPE && <Wind className={`w-4 h-4 ${isSelected ? 'text-purple-500' : 'text-gray-400'}`} />}
                                        <span className="text-xs font-bold">{type}</span>
                                    </button>
                                    );
                                })}
                            </div>
                        </div>
                        )}

                        {/* User Type */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">สถานะลูกค้า</label>
                            <div className="grid grid-cols-3 gap-3 p-1 bg-gray-100 rounded-xl">
                                {[UserType.GENERAL, UserType.TEACHER, UserType.STUDENT].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedUserType(type)}
                                    className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
                                    selectedUserType === type 
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {type}
                                </button>
                                ))}
                            </div>
                        </div>

                        {/* Sweetness */}
                        {!(selectedProduct.productType === 'snack' || selectedProduct.category === 'ขนม') && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">ระดับความหวาน</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SWEETNESS_LEVELS.map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setSweetness(level)}
                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                                        sweetness === level 
                                            ? 'bg-amber-50 border-amber-500 text-amber-900' 
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-gray-100 mt-auto">
                        <button 
                            onClick={() => setSelectedProduct(null)} 
                            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleAddToCart}
                            className="flex-[2] py-3.5 bg-amber-800 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 hover:bg-amber-900 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>ใส่ตะกร้า</span>
                            <span className="bg-amber-900/40 px-2 py-0.5 rounded text-amber-100 text-sm">
                                ฿{getPrice(selectedProduct, selectedUserType, selectedServingType)}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal icon for modal close
const XCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
);
