import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { getProducts, saveProduct, deleteProduct, getCategories, saveCategory, deleteCategory, compressImage } from '../services/dataService';
import { Product, ProductCategory, ServingType, Category } from '../types';
import { Plus, Edit2, Trash2, X, Search, Upload, Image as ImageIcon, Flame, Snowflake, Wind, Cookie, ThumbsUp, Sparkles, FolderPlus, Tag, Coffee } from 'lucide-react';
import { LoadingModal } from '../components/LoadingModal';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([getProducts(), getCategories()]);
    setProducts(p);
    setCategories(c);
    setLoading(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({ 
      ...product,
      // Backward compatibility: infer productType if missing
      productType: product.productType || (product.category === 'ขนม' ? 'snack' : 'drink'),
      prices: product.prices || {},
      additionalImages: product.additionalImages || [],
      video: product.video || ''
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct({
      id: '',
      name: '',
      category: categories.length > 0 ? categories[0].name : '',
      productType: 'drink', // Default to drink
      prices: {},
      description: '',
      image: '',
      additionalImages: [],
      video: '',
      isPopular: false,
      isRecommended: false
    });
    setIsModalOpen(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const cat: Category = { id: `cat-${Date.now()}`, name: newCategoryName.trim() };
    await saveCategory(cat);
    setNewCategoryName('');
    const fresh = await getCategories();
    setCategories(fresh);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('ลบหมวดหมู่นี้อาจส่งผลต่อการกรองสินค้า ยืนยันหรือไม่?')) {
      await deleteCategory(id);
      const fresh = await getCategories();
      setCategories(fresh);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.image) { alert("กรุณาอัพโหลดรูปปกสินค้า"); return; }
    
    setIsSaving(true);
    try {
      await saveProduct({ ...editingProduct, id: editingProduct.id || `PROD-${Date.now()}` });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
        fetchData();
      }, 1000);
    } catch (error) {
      setIsSaving(false);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && editingProduct) {
      const base64 = await compressImage(e.target.files[0], 800, 0.7);
      setEditingProduct({ ...editingProduct, image: base64 });
    }
  };

  const updatePrice = (type: ServingType, userType: 'general' | 'teacher' | 'student', value: number) => {
    if (!editingProduct) return;
    const newPrices = { ...editingProduct.prices };
    if (!newPrices[type]) newPrices[type] = { general: 0, teacher: 0, student: 0 };
    newPrices[type]![userType] = value;
    if (newPrices[type]!.general === 0 && newPrices[type]!.teacher === 0 && newPrices[type]!.student === 0) delete newPrices[type];
    setEditingProduct({ ...editingProduct, prices: newPrices });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navbar isAdmin={true} />
      <LoadingModal isOpen={isSaving} type="loading" message="กำลังบันทึก..." />
      <LoadingModal isOpen={saveSuccess} type="success" message="สำเร็จ!" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-10 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">คลังสินค้า</h1>
            <p className="text-gray-500 text-xs sm:text-sm">จัดการรายการเมนูและหมวดหมู่ทั้งหมด</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64 shadow-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อสินค้า..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm text-xs sm:text-sm"
              >
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-600" />
                หมวดหมู่
              </button>
              <button 
                onClick={handleAddNew}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 sm:px-6 py-2.5 bg-amber-800 text-white rounded-xl hover:bg-amber-900 shadow-lg shadow-amber-200 font-bold transition-all whitespace-nowrap text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                เพิ่มเมนู
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group transition-all hover:shadow-xl">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                   <span className="bg-white/90 backdrop-blur px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase text-amber-900 shadow-sm">{product.category}</span>
                </div>
              </div>
              <div className="p-2 sm:p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1">{product.name}</h3>
                <div className="mt-auto flex gap-1.5 sm:gap-2">
                    <button onClick={() => handleEdit(product)} className="flex-1 py-1.5 sm:py-2 bg-amber-50 text-amber-700 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black hover:bg-amber-100 transition-colors flex items-center justify-center"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => deleteProduct(product.id).then(fetchData)} className="flex-1 py-1.5 sm:py-2 bg-rose-50 text-rose-600 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black hover:bg-rose-100 transition-colors flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-pop-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-xl font-black text-gray-900">จัดการหมวดหมู่</h3>
                 <button onClick={() => setIsCategoryModalOpen(false)}><X className="w-6 h-6 text-gray-400"/></button>
              </div>
              <div className="p-6 space-y-6">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ชื่อหมวดหมู่ใหม่"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button onClick={handleAddCategory} className="bg-amber-800 text-white px-4 py-3 rounded-xl font-bold"><Plus className="w-5 h-5"/></button>
                 </div>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                    {categories.map(cat => (
                       <div key={cat.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <span className="font-bold text-gray-700">{cat.name}</span>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-zoom-in">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <h3 className="text-2xl font-black text-gray-900">{editingProduct.id ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ชื่อสินค้า</label>
                      <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-amber-500 outline-none font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">หมวดหมู่</label>
                        <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-amber-500 outline-none font-bold bg-white">
                          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 pt-1 justify-center">
                         <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 border-transparent hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={editingProduct.isPopular} onChange={e => setEditingProduct({...editingProduct, isPopular: e.target.checked})} className="w-5 h-5 accent-rose-500" />
                            <span className="text-sm font-bold text-gray-700">ขายดี</span>
                         </label>
                         <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 border-transparent hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={editingProduct.isRecommended} onChange={e => setEditingProduct({...editingProduct, isRecommended: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                            <span className="text-sm font-bold text-gray-700">แนะนำ</span>
                         </label>
                      </div>
                    </div>
                  </div>

                  {/* Product Type Selector */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">ประเภทสินค้า</label>
                      <div className="flex gap-4">
                          <button
                              type="button"
                              onClick={() => setEditingProduct({...editingProduct, productType: 'drink'})}
                              className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                  editingProduct.productType === 'drink'
                                  ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold shadow-md'
                                  : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                              }`}
                          >
                              <Coffee className="w-5 h-5" />
                              <span>เครื่องดื่ม (ร้อน/เย็น/ปั่น)</span>
                          </button>
                          <button
                              type="button"
                              onClick={() => setEditingProduct({...editingProduct, productType: 'snack'})}
                              className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                                  editingProduct.productType === 'snack'
                                  ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold shadow-md'
                                  : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                              }`}
                          >
                              <Cookie className="w-5 h-5" />
                              <span>ขนม/อาหาร (รายชิ้น)</span>
                          </button>
                      </div>
                  </div>

                  <div className="bg-amber-50/50 p-6 rounded-[2rem] border-2 border-amber-100/50">
                    <h4 className="font-black text-amber-900 mb-6 flex items-center gap-2"><Tag className="w-5 h-5"/> กำหนดราคาสินค้า</h4>
                    {/* Conditional Rendering based on Product Type */}
                    {(editingProduct.productType === 'snack') ? (
                       <div className="bg-white p-5 rounded-2xl border-2 border-amber-100 shadow-sm animate-pop-in">
                          <div className="flex items-center gap-2 mb-4 font-black text-amber-800"><Cookie className="w-5 h-5"/> ราคาขนม (ต่อชิ้น)</div>
                          <div className="grid grid-cols-3 gap-3">
                             {['general', 'teacher', 'student'].map(ut => (
                               <div key={ut}>
                                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">{ut}</label>
                                 <input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl text-center font-bold focus:border-amber-500 outline-none transition-colors" value={editingProduct.prices[ServingType.SNACK]?.[ut as any] || 0} onChange={e => updatePrice(ServingType.SNACK, ut as any, Number(e.target.value))} />
                               </div>
                             ))}
                          </div>
                       </div>
                    ) : (
                      <div className="space-y-4 animate-pop-in">
                        {[ServingType.HOT, ServingType.ICED, ServingType.FRAPPE].map(type => (
                          <div key={type} className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 font-black text-gray-800">
                               {type === ServingType.HOT && <Flame className="w-5 h-5 text-rose-500"/>}
                               {type === ServingType.ICED && <Snowflake className="w-5 h-5 text-blue-500"/>}
                               {type === ServingType.FRAPPE && <Wind className="w-5 h-5 text-purple-500"/>}
                               {type}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                               {['general', 'teacher', 'student'].map(ut => (
                                 <div key={ut}>
                                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">{ut}</label>
                                   <input type="number" className="w-full p-3 border-2 border-gray-100 rounded-xl text-center font-bold focus:border-amber-500 outline-none transition-colors" value={editingProduct.prices[type]?.[ut as any] || 0} onChange={e => updatePrice(type, ut as any, Number(e.target.value))} />
                                 </div>
                               ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
                    <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">รูปปกสินค้า (3:4)</label>
                    <div className="relative aspect-[3/4] w-2/3 mx-auto rounded-[2rem] overflow-hidden shadow-2xl bg-white border-2 border-gray-100 flex items-center justify-center group">
                        {editingProduct.image ? (
                          <img src={editingProduct.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="text-gray-300 flex flex-col items-center"><ImageIcon className="w-12 h-12 mb-2"/><span className="text-xs font-bold">เลือกรูปภาพ</span></div>
                        )}
                        <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100">
                    <label className="block text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">รูปแกลเลอรี</label>
                    <div className="grid grid-cols-3 gap-3">
                       {editingProduct.additionalImages?.map((img, i) => (
                         <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setEditingProduct({...editingProduct, additionalImages: editingProduct.additionalImages?.filter((_, idx) => idx !== i)})} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full"><X className="w-3 h-3"/></button>
                         </div>
                       ))}
                       <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:text-amber-600 hover:border-amber-200 cursor-pointer transition-all">
                          <Upload className="w-6 h-6 mb-1"/>
                          <span className="text-[10px] font-bold">เพิ่มรูป</span>
                          <input type="file" accept="image/*" multiple onChange={async (e) => {
                             if (!e.target.files) return;
                             const imgs = await Promise.all(Array.from(e.target.files).map(f => compressImage(f as File, 800, 0.7)));
                             setEditingProduct({...editingProduct, additionalImages: [...(editingProduct.additionalImages || []), ...imgs]});
                          }} className="hidden" />
                       </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-10 border-t border-gray-100 mt-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-500 font-black hover:bg-gray-50 rounded-2xl">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-amber-800 text-white rounded-2xl font-black shadow-2xl shadow-amber-200 hover:bg-amber-900 transition-all">บันทึกข้อมูลเมนู</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};