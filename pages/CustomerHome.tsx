import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { UserType, Product, ProductCategory, CartItem, ServingType } from '../types';
import { getProducts } from '../services/dataService';
import { Plus, Sparkles, Star, Flame, Snowflake, Wind, Cookie, X, ChevronLeft, ChevronRight, ZoomIn, ThumbsUp } from 'lucide-react';
import { SWEETNESS_LEVELS, LOGO_URL } from '../constants';
import { Footer } from '../components/Footer';

interface CustomerHomeProps {
  addToCart: (item: CartItem) => void;
  cartCount: number;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ addToCart, cartCount }) => {
  // Initialize with cached products if available (instant load)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('products_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sweetness, setSweetness] = useState<string>(SWEETNESS_LEVELS[2]); // Default 50%
  const [selectedUserType, setSelectedUserType] = useState<UserType>(UserType.GENERAL);
  
  // Selection State
  const [selectedServingType, setSelectedServingType] = useState<ServingType | null>(null);

  // Loading state is only true if we have NO products at all
  const [loading, setLoading] = useState(products.length === 0);

  // Gallery State for Modal
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  
  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    // Fetch fresh data in background
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
      // Update cache handled in dataService
    });
  }, []);

  // Reset modal state when product changes
  useEffect(() => {
    if (selectedProduct) {
      setSweetness(SWEETNESS_LEVELS[2]);
      setSelectedUserType(UserType.GENERAL);
      setActiveMedia(selectedProduct.image);
      
      // Determine default serving type
      if (selectedProduct.category === ProductCategory.SNACK) {
        setSelectedServingType(ServingType.SNACK);
      } else {
        // Default to Iced if available, then Hot, then Frappe
        if (selectedProduct.prices[ServingType.ICED]) setSelectedServingType(ServingType.ICED);
        else if (selectedProduct.prices[ServingType.HOT]) setSelectedServingType(ServingType.HOT);
        else if (selectedProduct.prices[ServingType.FRAPPE]) setSelectedServingType(ServingType.FRAPPE);
        else setSelectedServingType(null);
      }
    }
  }, [selectedProduct]);

  // Categories with "Recommended" added
  const categories = ['All', 'Recommended', ...Object.values(ProductCategory)];

  // Filtering and Sorting Logic
  const getFilteredAndSortedProducts = () => {
    let result: Product[] = [];

    // 1. Filter
    if (activeCategory === 'All') {
      result = [...products];
    } else if (activeCategory === 'Recommended') {
      result = products.filter(p => p.isRecommended);
    } else {
      result = products.filter(p => p.category === activeCategory);
    }

    // 2. Sort (Only for 'All' or specific categories, usually we want Recommended -> Popular -> Others)
    if (activeCategory !== 'Recommended') { // If specifically in Recommended tab, no need to sort by recommendation again
        result.sort((a, b) => {
            // Priority 1: Recommended
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            
            // Priority 2: Popular
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;

            return 0; // Default order
        });
    }

    return result;
  };

  const filteredProducts = getFilteredAndSortedProducts();

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

  // Helper to get minimum starting price for card display
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
      
      const item: CartItem = {
        ...selectedProduct,
        cartId: Date.now().toString(),
        quantity: 1,
        sweetness: selectedProduct.category === ProductCategory.SNACK ? '-' : sweetness,
        appliedPrice: finalPrice,
        selectedUserType: selectedUserType,
        selectedServingType: selectedServingType
      };
      addToCart(item);
      setSelectedProduct(null); // Close modal
    }
  };

  // Lightbox Helpers
  const getAllImages = () => {
    if (!selectedProduct) return [];
    return [selectedProduct.image, ...(selectedProduct.additionalImages || [])];
  };

  const openLightbox = () => {
    const images = getAllImages();
    const currentIndex = images.findIndex(img => img === activeMedia);
    setLightboxIndex(currentIndex >= 0 ? currentIndex : 0);
    setIsLightboxOpen(true);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const images = getAllImages();
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const images = getAllImages();
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getServingTypeIcon = (type: ServingType) => {
    switch(type) {
      case ServingType.HOT: return <Flame className="w-5 h-5" />;
      case ServingType.ICED: return <Snowflake className="w-5 h-5" />;
      case ServingType.FRAPPE: return <Wind className="w-5 h-5" />;
      case ServingType.SNACK: return <Cookie className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      <Navbar cartCount={cartCount} />

      {/* Hero Section */}
      <div className="relative bg-amber-900 overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative max-w-7xl mx-auto py-10 px-6 flex flex-col items-center text-center">
          
          {/* Logo with Glow Effect */}
          <div className="relative mb-6 transform hover:scale-105 transition-transform duration-500">
             <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
             <img 
               src={LOGO_URL} 
               alt="Logo" 
               className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-amber-100/20 shadow-2xl relative z-10 object-cover"
             />
          </div>

          <div className="text-white z-10">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-amber-50 leading-tight drop-shadow-md">
              ปัญ ปันสุข คอฟฟี่
            </h2>
            <p className="text-amber-200/90 mt-3 text-sm sm:text-lg font-light flex items-center justify-center gap-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
              <span>ความสุข... ในทุกแก้วที่ดื่ม</span>
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-6 bg-[#FDFBF7] rounded-t-[2rem]"></div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 -mt-2 mb-8 relative z-20">
        <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide justify-start md:justify-center">
          {categories.map(cat => {
            let label = cat;
            let icon = null;
            if (cat === 'All') label = 'ทั้งหมด';
            if (cat === 'Recommended') {
                label = 'เมนูแนะนำ';
                icon = <ThumbsUp className="w-3 h-3 mr-1" />;
            }

            return (
                <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 shadow-sm ${
                    activeCategory === cat 
                    ? 'bg-amber-800 text-white shadow-amber-200 scale-105' 
                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200'
                }`}
                >
                {icon}
                {label}
                </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
            <p className="font-light">กำลังชงเมนูอร่อย...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400">
             <p>ไม่พบรายการสินค้า</p>
          </div>
        ) : filteredProducts.map(product => (
          <div 
            key={product.id} 
            onClick={() => setSelectedProduct(product)}
            className="group relative bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer transform hover:-translate-y-2 border border-gray-100"
          >
            {/* Vertical Image Aspect Ratio */}
            <div className="relative aspect-[4/5] overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
              
              {/* Top Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                {product.isRecommended && (
                  <div className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
                    <ThumbsUp className="w-3 h-3 fill-current" />
                    <span>แนะนำ</span>
                  </div>
                )}
                {product.isPopular && (
                  <div className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>ขายดี</span>
                  </div>
                )}
              </div>

              {/* Available Types Indicators */}
              <div className="absolute top-3 right-3 flex flex-col gap-1">
                 {product.prices[ServingType.HOT] && <div className="p-1 bg-red-500/80 backdrop-blur rounded-full text-white" title="ร้อน"><Flame className="w-3 h-3"/></div>}
                 {product.prices[ServingType.ICED] && <div className="p-1 bg-blue-500/80 backdrop-blur rounded-full text-white" title="เย็น"><Snowflake className="w-3 h-3"/></div>}
                 {product.prices[ServingType.FRAPPE] && <div className="p-1 bg-purple-500/80 backdrop-blur rounded-full text-white" title="ปั่น"><Wind className="w-3 h-3"/></div>}
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 text-white">
                 <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-bold text-lg mb-1 leading-snug shadow-black drop-shadow-md">{product.name}</h3>
                  <p className="text-xs text-gray-200 line-clamp-1 mb-3 font-light opacity-90">{product.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-300 uppercase tracking-wider">ราคาเริ่ม</span>
                      <span className="text-xl font-bold text-amber-300">฿{getStartPrice(product)}</span>
                    </div>
                    <button className="bg-white/20 hover:bg-white text-white hover:text-amber-800 p-2 rounded-full backdrop-blur-sm transition-all duration-300">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Footer />

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedProduct(null)}
          ></div>
          
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up sm:animate-zoom-in max-h-[90vh] overflow-y-auto">
            {/* Header with Gallery */}
            <div className="mb-6 flex gap-4">
              <div 
                className="w-1/3 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex-shrink-0 cursor-zoom-in relative group"
                onClick={openLightbox}
              >
                 <img 
                  src={activeMedia || selectedProduct.image} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt={selectedProduct.name}
                 />
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="text-white w-6 h-6 drop-shadow-md" />
                 </div>
              </div>
              <div className="flex-1 flex flex-col">
                 <div className="flex flex-wrap gap-2 mb-1">
                    {selectedProduct.isRecommended && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-200 flex items-center w-max">
                            <ThumbsUp className="w-3 h-3 mr-1" /> แนะนำ
                        </span>
                    )}
                    {selectedProduct.isPopular && (
                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold border border-red-200 flex items-center w-max">
                            <Sparkles className="w-3 h-3 mr-1" /> ขายดี
                        </span>
                    )}
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{selectedProduct.name}</h3>
                 <p className="text-gray-500 text-sm leading-relaxed font-light flex-1 overflow-y-auto max-h-24 scrollbar-hide">
                    {selectedProduct.description}
                 </p>

                 {/* Thumbnails */}
                 {(selectedProduct.video || (selectedProduct.additionalImages && selectedProduct.additionalImages.length > 0)) && (
                  <div className="flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-hide">
                    <button 
                      onClick={() => { setActiveMedia(selectedProduct.image); }}
                      className={`w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border-2 ${activeMedia === selectedProduct.image ? 'border-amber-600' : 'border-transparent'}`}
                    >
                      <img src={selectedProduct.image} className="w-full h-full object-cover" />
                    </button>
                    {selectedProduct.additionalImages?.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setActiveMedia(img); }}
                        className={`w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border-2 ${activeMedia === img ? 'border-amber-600' : 'border-transparent'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Serving Type Selector (Hot/Iced/Frappe) - HIDING for snacks */}
              {selectedProduct.category !== ProductCategory.SNACK && (
                <div>
                   <label className="block text-sm font-bold text-gray-800 mb-3">เลือกประเภท</label>
                   <div className="flex gap-3">
                      {[ServingType.HOT, ServingType.ICED, ServingType.FRAPPE].map((type) => {
                        const isAvailable = !!selectedProduct.prices[type];
                        if (!isAvailable) return null;

                        const isSelected = selectedServingType === type;
                        let colorClass = "";
                        if (isSelected) {
                          if (type === ServingType.HOT) colorClass = "bg-red-500 text-white border-red-500 shadow-red-200";
                          if (type === ServingType.ICED) colorClass = "bg-blue-500 text-white border-blue-500 shadow-blue-200";
                          if (type === ServingType.FRAPPE) colorClass = "bg-purple-500 text-white border-purple-500 shadow-purple-200";
                        } else {
                           colorClass = "bg-white text-gray-600 border-gray-200 hover:bg-gray-50";
                        }

                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedServingType(type)}
                            className={`flex-1 py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all shadow-sm ${colorClass} ${isSelected ? 'shadow-lg scale-105' : ''}`}
                          >
                             {getServingTypeIcon(type)}
                             <span className="text-xs font-bold">{type}</span>
                          </button>
                        );
                      })}
                   </div>
                </div>
              )}

              {/* User Type Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">ประเภทลูกค้า</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                 {[UserType.GENERAL, UserType.TEACHER, UserType.STUDENT].map((type) => (
                   <button
                    key={type}
                    onClick={() => setSelectedUserType(type)}
                    className={`py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      selectedUserType === type 
                        ? 'bg-white text-amber-800 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                   >
                     {type}
                   </button>
                 ))}
               </div>
               
               {/* Dynamic Price Display */}
               <div className="mt-4 flex justify-between items-center px-4 py-3 bg-amber-50/50 rounded-xl border border-amber-100">
                 <span className="text-sm text-gray-500 font-medium">ราคาที่ต้องชำระ</span>
                 <div className="flex flex-col items-end">
                    <span className="text-3xl font-bold text-amber-600">
                      ฿{getPrice(selectedProduct, selectedUserType, selectedServingType)}
                    </span>
                    {selectedProduct.category !== ProductCategory.SNACK && selectedServingType && (
                      <span className="text-[10px] text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full border border-gray-100">
                        {selectedServingType}
                      </span>
                    )}
                 </div>
               </div>
              </div>

              {/* Sweetness Selector */}
              {selectedProduct.category !== ProductCategory.SNACK && (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">ระดับความหวาน</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SWEETNESS_LEVELS.map(level => (
                      <button
                        key={level}
                        onClick={() => setSweetness(level)}
                        className={`py-3 px-4 rounded-xl text-sm border transition-all duration-200 ${
                          sweetness === level 
                            ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500/20 font-medium' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3 pt-6 border-t border-gray-100">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-3.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleAddToCart}
                className="flex-[2] py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold hover:from-amber-700 hover:to-amber-800 shadow-lg shadow-amber-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                เพิ่มลงตะกร้า <span>•</span> ฿{getPrice(selectedProduct, selectedUserType, selectedServingType)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer */}
      {isLightboxOpen && selectedProduct && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-pop-in" onClick={() => setIsLightboxOpen(false)}>
           <button 
             onClick={() => setIsLightboxOpen(false)}
             className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
           >
             <X className="w-8 h-8" />
           </button>

           <div className="relative w-full h-full flex items-center justify-center p-4">
              {getAllImages().length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 z-10 text-white/70 hover:text-white bg-black/50 p-3 rounded-full hover:scale-110 transition-all"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 z-10 text-white/70 hover:text-white bg-black/50 p-3 rounded-full hover:scale-110 transition-all"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
              
              <img 
                src={getAllImages()[lightboxIndex]} 
                alt={selectedProduct.name}
                className="max-w-full max-h-screen object-contain shadow-2xl rounded-sm"
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
              />

              {/* Dots Indicator */}
              {getAllImages().length > 1 && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
                   {getAllImages().map((_, idx) => (
                     <div 
                       key={idx}
                       className={`w-2 h-2 rounded-full transition-all ${idx === lightboxIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                     />
                   ))}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};