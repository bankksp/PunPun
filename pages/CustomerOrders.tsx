
import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders, updateOrderPayment, compressImage } from '../services/dataService';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { Search, Clock, MapPin, User, Upload, CheckCircle, RefreshCcw, CreditCard, Banknote, XCircle, ClipboardList, X } from 'lucide-react';
import { QR_CODE_URL } from '../constants';
import { LoadingModal } from '../components/LoadingModal';
import { Footer } from '../components/Footer';

interface CustomerOrdersProps {
  cartCount: number;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ cartCount }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    getOrders().then(data => {
      setOrders(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
        getOrders().then(setOrders);
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.DELIVERING: return 'bg-purple-100 text-purple-800 border-purple-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return <Clock className="w-3 h-3 shrink-0" />;
      case OrderStatus.PREPARING: return <RefreshCcw className="w-3 h-3 shrink-0 animate-spin" style={{animationDuration: '3s'}} />;
      case OrderStatus.DELIVERING: return <MapPin className="w-3 h-3 shrink-0" />;
      case OrderStatus.COMPLETED: return <CheckCircle className="w-3 h-3 shrink-0" />;
      case OrderStatus.CANCELLED: return <XCircle className="w-3 h-3 shrink-0" />;
      default: return null;
    }
  };

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    setSlipFile(null);
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedOrder || !slipFile) return;
    
    setSubmittingPayment(true);
    try {
        const base64 = await compressImage(slipFile, 600, 0.6);
        await updateOrderPayment(selectedOrder.id, base64);
        
        setPaymentModalOpen(false);
        setSuccessModal(true);
        setSubmittingPayment(false);
        fetchOrders();
    } catch (e) {
        console.error(e);
        alert("เกิดข้อผิดพลาดในการอัพโหลดสลิป");
        setSubmittingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20 flex flex-col">
      <Navbar cartCount={cartCount} />

      <LoadingModal 
        isOpen={submittingPayment} 
        type="loading" 
        message="กำลังอัพเดทข้อมูลการชำระเงิน..." 
      />

       <LoadingModal 
        isOpen={successModal} 
        type="success" 
        message="แจ้งโอนเงินเรียบร้อยแล้ว"
        onClose={() => setSuccessModal(false)}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <ClipboardList className="w-7 h-7 mr-2 text-amber-600 shrink-0" />
              ติดตามออเดอร์
            </h1>
            <p className="text-sm text-gray-500 mt-1">ค้นหาออเดอร์ด้วยชื่อหรือเลข Order ID ของคุณ</p>
          </div>
          
          <div className="relative shadow-sm group">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              placeholder="เช่น ชื่อลูกค้า หรือ เลขออเดอร์" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
             <p className="font-medium">กำลังโหลดข้อมูล...</p>
           </div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-4" />
               <p className="text-gray-400 font-medium">ไม่พบข้อมูลออเดอร์ของคุณ</p>
               <button onClick={() => setSearchTerm('')} className="mt-2 text-amber-600 text-sm font-bold underline">ล้างคำค้นหา</button>
            </div>
        ) : (
            <div className="space-y-6">
               {filteredOrders.map(order => (
                 <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-5 sm:p-6">
                       <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-lg text-gray-800 break-words leading-tight">{order.customerName}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 font-bold whitespace-nowrap">#{order.id}</span>
                             </div>
                             <div className="flex items-center text-xs text-gray-400 gap-3 flex-wrap">
                                <span className="flex items-center"><User className="w-3 h-3 mr-1 shrink-0"/> {order.userType}</span>
                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1 shrink-0"/> {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             {/* Delivery Location - Enhanced wrap */}
                             <div className="flex items-start text-xs sm:text-sm text-amber-800 mt-3 font-bold bg-amber-50 px-2.5 py-1.5 rounded-xl w-max max-w-full">
                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0 mt-0.5" />
                                <span className="break-words leading-tight">{order.deliveryLocation}</span>
                             </div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border shrink-0 shadow-sm ${getStatusColor(order.status)}`}>
                             {getStatusIcon(order.status)}
                             <span className="whitespace-nowrap uppercase tracking-wide">{order.status}</span>
                          </div>
                       </div>

                       <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2.5 border border-gray-100">
                          {order.items.map((item, idx) => (
                             <div key={idx} className="flex justify-between items-start text-sm text-gray-700 gap-4">
                                <div className="leading-snug break-words">
                                    <span className="font-bold">{item.name}</span>
                                    <span className="text-amber-700 font-black ml-1">x{item.quantity}</span> 
                                    <div className="text-[11px] text-gray-400 font-medium">({item.sweetness})</div>
                                </div>
                                <span className="font-bold text-gray-800 shrink-0">฿{(item.appliedPrice * item.quantity).toLocaleString()}</span>
                             </div>
                          ))}
                          <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-3">
                             <span className="font-bold text-gray-500 text-xs uppercase tracking-widest">ยอดรวมสุทธิ</span>
                             <span className="font-black text-xl text-amber-800">฿{order.totalAmount.toLocaleString()}</span>
                          </div>
                       </div>

                       <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                          <div className="flex items-center text-sm font-bold w-full sm:w-auto">
                             {order.paymentMethod === PaymentMethod.CASH ? (
                                <span className="flex items-center text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 w-full sm:w-auto justify-center sm:justify-start">
                                    <Banknote className="w-4 h-4 mr-2 shrink-0"/> ชำระด้วยเงินสด
                                </span>
                             ) : (
                                <span className="flex items-center text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-full sm:w-auto justify-center sm:justify-start">
                                    <CreditCard className="w-4 h-4 mr-2 shrink-0"/> โอนชำระ {order.slipUrl ? '(แนบสลิปแล้ว)' : ''}
                                </span>
                             )}
                          </div>

                          {order.paymentMethod === PaymentMethod.CASH && (order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING) && (
                              <button 
                                onClick={() => handleOpenPayment(order)}
                                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 shadow-lg shadow-amber-100 flex items-center justify-center transition-all transform active:scale-95"
                              >
                                <Upload className="w-4 h-4 mr-2 shrink-0" />
                                เปลี่ยนเป็นโอนจ่ายแทน
                              </button>
                          )}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
        )}
      </div>
      <Footer />

      {/* Payment Modal */}
      {paymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setPaymentModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-pop-in">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/50">
                <h3 className="font-black text-amber-900">อัพเดทการชำระเงิน</h3>
                <button onClick={() => setPaymentModalOpen(false)} className="p-1 hover:bg-white rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                </button>
             </div>
             
             <div className="p-8">
                <div className="text-center mb-6">
                    <p className="text-gray-500 text-sm mb-1">ยอดชำระสำหรับออเดอร์ #{selectedOrder.id}</p>
                    <p className="text-3xl font-black text-gray-900">฿{selectedOrder.totalAmount.toLocaleString()}</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 mb-6">
                    <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">สแกน QR Code</p>
                    <div className="bg-white p-3 rounded-2xl shadow-sm w-max mx-auto mb-4 border border-gray-100">
                        <img src={QR_CODE_URL} alt="QR Code" className="w-40 h-40 rounded-lg mix-blend-multiply" />
                    </div>
                    
                    <label className="block w-full cursor-pointer">
                        <div className={`flex flex-col items-center justify-center px-4 py-4 bg-white border border-dashed rounded-2xl text-sm transition-all ${slipFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-amber-400'}`}>
                           {slipFile ? (
                               <>
                                <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
                                <span className="text-green-700 font-bold break-all text-center">{slipFile.name}</span>
                                <span className="text-[10px] text-gray-400 mt-1 uppercase font-black">คลิกเพื่อเปลี่ยนรูป</span>
                               </>
                           ) : (
                               <>
                                <Upload className="w-5 h-5 text-gray-400 mb-2" />
                                <span className="text-gray-600 font-bold">แนบสลิปโอนเงินที่นี่</span>
                               </>
                           )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSlipFile(e.target.files[0]);
                            }
                          }}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => setPaymentModalOpen(false)}
                    className="py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                   >
                     ยกเลิก
                   </button>
                   <button 
                    disabled={!slipFile || submittingPayment}
                    onClick={handleSubmitPayment}
                    className="py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-200 disabled:opacity-50 disabled:shadow-none hover:bg-amber-700 transition-all transform active:scale-95"
                   >
                     ยืนยันการแจ้งโอน
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
