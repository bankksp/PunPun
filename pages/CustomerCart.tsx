
import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { CartItem, PaymentMethod, Order, OrderStatus, UserType, PaymentStatus } from '../types';
import { QR_CODE_URL } from '../constants';
import { createOrder, compressImage } from '../services/dataService';
import { Trash2, MapPin, Upload, CreditCard, Banknote, ArrowLeft, User, ShoppingBag, CheckCircle, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingModal } from '../components/LoadingModal';
import { Footer } from '../components/Footer';

interface CustomerCartProps {
  cart: CartItem[];
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  updateQuantity: (cartId: string, delta: number) => void;
}

export const CustomerCart: React.FC<CustomerCartProps> = ({ cart, removeFromCart, clearCart, updateQuantity }) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [slipImage, setSlipImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Calculate total based on quantity
  const total = cart.reduce((sum, item) => sum + (item.appliedPrice * item.quantity), 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (paymentMethod === PaymentMethod.TRANSFER) {
      if (!slipImage) {
        alert("กรุณาแนบสลิปโอนเงิน");
        return;
      }
    }

    setSubmitting(true);

    try {
      const representativeUserType = cart.length > 0 ? cart[0].selectedUserType : UserType.GENERAL;

      let slipBase64 = undefined;
      let slipUrl = undefined;

      if (slipImage) {
        // Compress the slip image before sending (max width 600px is enough for slips)
        slipBase64 = await compressImage(slipImage, 600, 0.6);
        slipUrl = URL.createObjectURL(slipImage);
      }

      const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        customerName,
        userType: representativeUserType,
        items: [...cart],
        totalAmount: total,
        paymentMethod,
        paymentStatus: PaymentStatus.PENDING, // Default status
        deliveryLocation,
        status: OrderStatus.PENDING,
        timestamp: Date.now(),
        slipUrl: slipUrl
      };

      await createOrder(newOrder, slipBase64);
      
      setSubmitting(false);
      setOrderComplete(true);
      clearCart();
    } catch (error) {
      console.error("Order failed", error);
      alert("เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-10 relative flex flex-col">
      <Navbar cartCount={cart.length} />

      <LoadingModal 
        isOpen={submitting} 
        type="loading" 
        message="กำลังส่งออเดอร์ไปที่ร้าน..." 
      />

      <LoadingModal 
        isOpen={orderComplete} 
        type="success" 
        message="ขอบคุณที่ใช้บริการค่ะ กรุณารอรับเครื่องดื่มที่จุดนัดหมาย"
        onClose={() => {
          setOrderComplete(false);
          navigate('/');
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
        <button onClick={() => navigate('/')} className="group flex items-center text-gray-500 hover:text-amber-800 mb-8 transition-colors">
          <div className="p-1 rounded-full bg-white shadow-sm border border-gray-100 mr-2 group-hover:border-amber-200 group-hover:bg-amber-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium">เลือกสินค้าต่อ</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center">
          <ShoppingBag className="w-8 h-8 mr-3 text-amber-600" />
          ตะกร้าสินค้า
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">ยังไม่มีสินค้าในตะกร้า</p>
            <button 
              onClick={() => navigate('/')} 
              className="mt-4 text-amber-600 hover:text-amber-800 font-semibold"
            >
              ไปเลือกสินค้ากันเถอะ
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-6">
                  {cart.map((item) => (
                    <div key={item.cartId} className="flex gap-5 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-sm">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                {item.selectedServingType}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                {item.selectedUserType}
                              </span>
                              {item.sweetness !== '-' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  หวาน {item.sweetness}
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.cartId)} 
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="mt-auto flex justify-between items-end">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button
                                onClick={() => updateQuantity(item.cartId, -1)}
                                disabled={item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-gray-800 w-6 text-center text-sm">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.cartId, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs text-gray-400 mb-0.5 font-medium">฿{item.appliedPrice} / หน่วย</div>
                            <span className="text-xl font-bold text-amber-800">฿{(item.appliedPrice * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50/50 p-6 flex justify-between items-center border-t border-dashed border-gray-200">
                  <span className="text-gray-600 font-bold">ยอดรวมทั้งหมด</span>
                  <span className="text-3xl font-bold text-amber-900">฿{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <form onSubmit={handlePlaceOrder} className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-6 text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-amber-600" />
                  ข้อมูลการจัดส่ง
                </h3>
                
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">ชื่อผู้สั่ง</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                        placeholder="เช่น ครูสมชาย"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">สถานที่จัดส่ง</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={deliveryLocation}
                        onChange={e => setDeliveryLocation(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                        placeholder="ระบุห้อง/อาคาร"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">วิธีการชำระเงิน</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                           setPaymentMethod(PaymentMethod.CASH);
                           setSlipImage(null);
                        }}
                        className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center text-sm font-medium transition-all ${
                          paymentMethod === PaymentMethod.CASH 
                            ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500/20 shadow-sm' 
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <Banknote className="w-6 h-6 mb-1.5" />
                        เงินสด
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod(PaymentMethod.TRANSFER)}
                        className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center text-sm font-medium transition-all ${
                          paymentMethod === PaymentMethod.TRANSFER 
                            ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500/20 shadow-sm' 
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mb-1.5" />
                        โอนชำระ
                      </button>
                    </div>
                  </div>

                  {paymentMethod === PaymentMethod.TRANSFER && (
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 animate-slide-down">
                      <p className="text-center text-sm text-gray-600 mb-4 font-medium">สแกน QR Code เพื่อจ่ายเงิน</p>
                      <div className="bg-white p-3 rounded-xl shadow-sm w-max mx-auto mb-4 border border-gray-100">
                        <img src={QR_CODE_URL} alt="QR Code" className="w-32 h-32 rounded-lg mix-blend-multiply" />
                      </div>
                      
                      <label className="block w-full cursor-pointer group">
                        <div className={`flex flex-col items-center justify-center px-4 py-3 bg-white border border-dashed rounded-xl text-sm transition-all ${slipImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-amber-400'}`}>
                           {slipImage ? (
                               <>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500 mb-1" />
                                <span className="text-green-700 font-medium break-all text-center">{slipImage.name}</span>
                                <span className="text-[10px] text-gray-400 mt-1">คลิกเพื่อเปลี่ยนรูป</span>
                               </>
                           ) : (
                               <>
                                <Upload className="w-4 h-4 mr-2 text-gray-400 mb-1" />
                                <span className="text-gray-600">คลิกเพื่อแนบสลิป</span>
                               </>
                           )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSlipImage(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {slipImage && (
                          <div className="mt-3 text-center">
                              <p className="text-xs text-green-600 flex items-center justify-center gap-1 font-medium">
                                  <CheckCircle className="w-3 h-3"/> สลิปพร้อมส่ง
                              </p>
                          </div>
                      )}
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={submitting || (paymentMethod === PaymentMethod.TRANSFER && !slipImage)}
                  className="w-full mt-8 py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 shadow-xl shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {`ยืนยันการสั่งซื้อ • ฿${total.toLocaleString()}`}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
