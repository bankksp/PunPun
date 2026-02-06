import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { getProducts, saveProduct, deleteProduct } from '../services/dataService';
import { Product, ProductCategory, ServingType } from '../types';
import { Plus, Edit2, Trash2, X, Search, Upload, Image as ImageIcon, Flame, Snowflake, Wind, Cookie } from 'lucide-react';
import { LoadingModal } from '../components/LoadingModal';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // States for status
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Specifically for showing the cute modal
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({ 
      ...product,
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
      category: ProductCategory.COFFEE,
      prices: {},
      description: '',
      image: '',
      additionalImages: [],
      video: '',
      isPopular: false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
      setLoading(true);
      await deleteProduct(id);
      await fetchProducts();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.image) {
      alert("กรุณาอัพโหลดรูปปกสินค้า");
      return;
    }

    // Check if at least one price is set
    const hasPrice = Object.keys(editingProduct.prices).length > 0;
    if (!hasPrice) {
      alert("กรุณากำหนดราคาอย่างน้อย 1 ประเภท");
      return;
    }

    // Generate ID for new product if needed
    const productToSave = {
      ...editingProduct,
      id: editingProduct.id || `PROD-${Date.now()}`
    };

    setIsSaving(true); // Trigger cute modal
    await saveProduct(productToSave);
    
    // Show success for a moment
    setIsSaving(false);
    setSaveSuccess(true);
    
    // Delay closing to let user see success
    setTimeout(async () => {
      setSaveSuccess(false);
      setIsModalOpen(false);
      await fetchProducts();
    }, 1500);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingProduct) {
      const file = e.target.files[0];
      const base64 = await convertToBase64(file);
      setEditingProduct({ ...editingProduct, image: base64 });
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && editingProduct) {
      const files = Array.from(e.target.files);
      const base64Promises = files.map((file) => convertToBase64(file as File));
      const newImages = await Promise.all(base64Promises);
      setEditingProduct({ 
        ...editingProduct, 
        additionalImages: [...(editingProduct.additionalImages || []), ...newImages] 
      });
    }
  };

  const handleRemoveAdditionalImage = (index: number) => {
    if (editingProduct && editingProduct.additionalImages) {
      const newImages = [...editingProduct.additionalImages];
      newImages.splice(index, 1);
      setEditingProduct({ ...editingProduct, additionalImages: newImages });
    }
  };

  // Helper to handle price changes
  const updatePrice = (type: ServingType, userType: 'general' | 'teacher' | 'student', value: number) => {
    if (!editingProduct) return;
    
    const newPrices = { ...editingProduct.prices };
    
    if (!newPrices[type]) {
      newPrices[type] = { general: 0, teacher: 0, student: 0 };
    }
    
    newPrices[type]![userType] = value;
    
    // Cleanup if all are 0 (means remove this type)
    const p = newPrices[type]!;
    if (p.general === 0 && p.teacher === 0 && p.student === 0) {
      delete newPrices[type];
    }
    
    setEditingProduct({ ...editingProduct, prices: newPrices });
  };

  const getPriceValue = (type: ServingType, userType: 'general' | 'teacher' | 'student') => {
    return editingProduct?.prices[type]?.[userType] || 0;
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <Navbar isAdmin={true} />
      
      {/* Cute Modals */}
      <LoadingModal isOpen={isSaving} type="loading" message="กำลังบันทึกสินค้า..." />
      <LoadingModal isOpen={saveSuccess} type="success" message="บันทึกข้อมูลเรียบร้อยแล้ว" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">จัดการสินค้า</h1>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="ค้นหาสินค้า" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button 
              onClick={handleAddNew}
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-5 h-5 mr-1" />
              เพิ่มสินค้า
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-4 text-amber-600">กำลังดำเนินการ...</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group">
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">
                  {product.category}
                </span>
                
                {/* Variant Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  {product.prices[ServingType.HOT] && <div className="p-1 bg-red-500/80 rounded-full text-white"><Flame className="w-3 h-3"/></div>}
                  {product.prices[ServingType.ICED] && <div className="p-1 bg-blue-500/80 rounded-full text-white"><Snowflake className="w-3 h-3"/></div>}
                  {product.prices[ServingType.FRAPPE] && <div className="p-1 bg-purple-500/80 rounded-full text-white"><Wind className="w-3 h-3"/></div>}
                </div>

                {product.isPopular && (
                  <span className="absolute bottom-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs shadow-sm">
                    ขายดี
                  </span>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{product.name}</h3>
                <div className="mt-auto pt-2 border-t border-gray-100 flex gap-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-xs font-medium"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      แก้ไข
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 flex items-center justify-center py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-medium"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      ลบ
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-gray-800">
                {editingProduct.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Details */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                      <Edit2 className="w-4 h-4 mr-2" /> ข้อมูลทั่วไป
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
                        <input 
                          type="text" 
                          required
                          value={editingProduct.name}
                          onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                          <select 
                            value={editingProduct.category}
                            onChange={e => setEditingProduct({...editingProduct, category: e.target.value as ProductCategory})}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                          >
                            {Object.values(ProductCategory).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <input 
                            type="checkbox" 
                            id="isPopular"
                            checked={editingProduct.isPopular}
                            onChange={e => setEditingProduct({...editingProduct, isPopular: e.target.checked})}
                            className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                          />
                          <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">สินค้าขายดี (Popular)</label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                        <textarea 
                          rows={4}
                          value={editingProduct.description}
                          onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-4">กำหนดราคา (ใส่ 0 หากไม่มีขายในประเภทนั้น)</h4>
                    
                    {/* Render inputs based on category logic, but generally show all for coffee/tea */}
                    {(editingProduct.category === ProductCategory.SNACK) ? (
                        <div className="mb-4 bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold">
                             <Cookie className="w-4 h-4"/> ขนม (ชิ้น)
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                             <div>
                               <label className="text-xs text-gray-500">ราคาปกติ</label>
                               <input type="number" className="w-full p-1 border rounded text-center"
                                 value={getPriceValue(ServingType.SNACK, 'general')}
                                 onChange={e => updatePrice(ServingType.SNACK, 'general', Number(e.target.value))} />
                             </div>
                             <div>
                               <label className="text-xs text-blue-500">ราคาครู</label>
                               <input type="number" className="w-full p-1 border rounded text-center"
                                 value={getPriceValue(ServingType.SNACK, 'teacher')}
                                 onChange={e => updatePrice(ServingType.SNACK, 'teacher', Number(e.target.value))} />
                             </div>
                             <div>
                               <label className="text-xs text-green-500">ราคานร.</label>
                               <input type="number" className="w-full p-1 border rounded text-center"
                                 value={getPriceValue(ServingType.SNACK, 'student')}
                                 onChange={e => updatePrice(ServingType.SNACK, 'student', Number(e.target.value))} />
                             </div>
                          </div>
                        </div>
                    ) : (
                      <>
                        {[ServingType.HOT, ServingType.ICED, ServingType.FRAPPE].map((type) => (
                          <div key={type} className="mb-4 bg-white p-3 rounded-lg border border-gray-200">
                            <div className={`flex items-center gap-2 mb-2 font-bold ${
                              type === ServingType.HOT ? 'text-red-600' : 
                              type === ServingType.ICED ? 'text-blue-600' : 'text-purple-600'
                            }`}>
                               {type === ServingType.HOT && <Flame className="w-4 h-4"/>}
                               {type === ServingType.ICED && <Snowflake className="w-4 h-4"/>}
                               {type === ServingType.FRAPPE && <Wind className="w-4 h-4"/>}
                               {type}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                               <div>
                                 <label className="text-xs text-gray-500">ราคาปกติ</label>
                                 <input type="number" className="w-full p-1 border rounded text-center"
                                   value={getPriceValue(type, 'general')}
                                   onChange={e => updatePrice(type, 'general', Number(e.target.value))} />
                               </div>
                               <div>
                                 <label className="text-xs text-blue-500">ราคาครู</label>
                                 <input type="number" className="w-full p-1 border rounded text-center"
                                   value={getPriceValue(type, 'teacher')}
                                   onChange={e => updatePrice(type, 'teacher', Number(e.target.value))} />
                               </div>
                               <div>
                                 <label className="text-xs text-green-500">ราคานร.</label>
                                 <input type="number" className="w-full p-1 border rounded text-center"
                                   value={getPriceValue(type, 'student')}
                                   onChange={e => updatePrice(type, 'student', Number(e.target.value))} />
                               </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column: Media */}
                <div className="space-y-6">
                  
                  {/* Cover Image */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                      <span>รูปปกสินค้า (แนวตั้ง 3:4)</span>
                      <span className="text-xs font-normal text-red-500">*จำเป็น</span>
                    </label>
                    <div className="space-y-3">
                      <div className="relative aspect-[3/4] w-2/3 mx-auto bg-gray-200 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group">
                        {editingProduct.image ? (
                          <>
                            <img src={editingProduct.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <p className="text-white text-xs font-medium">คลิกเพื่อเปลี่ยนรูป</p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-gray-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-xs">ยังไม่มีรูปภาพ</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleCoverImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Images */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">รูปภาพเพิ่มเติม (Gallery)</label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {editingProduct.additionalImages?.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors text-gray-400 hover:text-amber-600">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">เพิ่มรูป</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImagesUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={loading || isSaving}
                  className="flex-1 py-3.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};