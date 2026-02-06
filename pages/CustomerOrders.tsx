import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders, updateOrderPayment, compressImage } from '../services/dataService';
import { verifySlipWithAI } from '../services/aiService';
import { Order, OrderStatus, PaymentMethod } from '../types';
import { Search, Clock, MapPin, User, Upload, CheckCircle, RefreshCcw, CreditCard, Banknote, XCircle, ClipboardList, Loader2, AlertCircle } from 'lucide-react';
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
  const [slipImage, setSlipImage] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Verification
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; reason: string } | null>(null);

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

  useEffect(() => {
      const checkSlip = async () => {
        if (slipImage && selectedOrder) {
          setVerifying(true);
          setVerificationResult(null);
          
          const result = await verifySlipWithAI(slipImage, selectedOrder.totalAmount);
          
          setVerifying(false);
          setVerificationResult({
            isValid: result.isValid,
            reason: result.reason
          });
        } else {
            setVerificationResult(null);
        }
      };
  
      if (slipImage) {
        checkSlip();
      }
    }, [slipImage, selectedOrder]);

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
      case OrderStatus.PENDING: return <Clock className="w-3 h-3" />;
      case OrderStatus.PREPARING: return <RefreshCcw className="w-3 h-3 animate-spin" style={{animationDuration: '3s'}} />;
      case OrderStatus.DELIVERING: return <MapPin className="w-3 h-3" />;
      case OrderStatus.COMPLETED: return <CheckCircle className="w-3 h-3" />;
      case OrderStatus.CANCELLED: return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    setSlipImage(null);
    setVerificationResult(null);
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedOrder || !slipImage) return;

    if (verificationResult && !verificationResult.isValid) {
        alert("กรุณาอัพโหลดสลิปที่ถูกต้อง");
        return;
    }
    
    setSubmittingPayment(true);
    try {
        const base64 = await compressImage(slipImage, 600, 0.6);
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
              <ClipboardList className="w-7 h-7 mr-2 text-amber-600" />
              ติดตามสถานะออเดอร์
            </h1>
            <p className="text-sm text-gray-500 mt-1">ค้นหาออเดอร์ของคุณเพื่อดูสถานะ หรือแจ้งโอนเงิน</p>
          </div>
          
          <div className="relative shadow-sm">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาด้วย ชื่อ หรือ เลขออเดอร์ (Order ID)" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
            />
          </div>
        </div>

        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
             <p>กำลังโหลดข้อมูล...</p>
           </div>
        ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-3" />
               <p className="text-gray-400">ไม่พบข้อมูลออเดอร์</p>
            </div>
        ) : (
            <div className="space-y-4">
               {filteredOrders.map(order => (
                 <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg text-gray-800">{order.customerName}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{order.id}</span>
                             </div>
                             <div className="flex items-center text-xs text-gray-500 gap-3">
                                <span className="flex items-center"><User className="w-3 h-3 mr-1"/> {order.userType}</span>
                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${getStatusColor(order.status)}`}>
                             {getStatusIcon(order.status)}
                             {order.status}
                          </div>
                       </div>

                       <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                          {order.items.map((item, idx) => (
                             <div key={idx} className="flex justify-between text-sm text-gray-600">
                                <span>{item.name} x{item.quantity} <span className="text-xs text-gray-400">({item.sweetness})</span></span>
                                <span className="font-medium text-gray-800">฿{item.appliedPrice * item.quantity}</span>
                             </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 flex justify-between items-center mt-2">
                             <span className="font-bold text-gray-700">ยอดรวม</span>
                             <span className="font-bold text-lg text-amber-700">฿{order.totalAmount}</span>
                          </div>
                       </div>

                       <div className="flex justify-between items-center">
                          <div className="flex items-center text-sm text-gray-600">
                             {order.paymentMethod === PaymentMethod.CASH ? (
                                <span className="flex items-center text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                    <Banknote className="w-4 h-4 mr-1"/> เงินสด
                                </span>
                             ) : (
                                <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                    <CreditCard className="w-4 h-4 mr-1"/> โอนชำระ {order.slipUrl ? '(แนบสลิปแล้ว)' : ''}
                                </span>
                             )}
                          </div>

                          {order.paymentMethod === PaymentMethod.CASH && (order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING) && (
                              <button 
                                onClick={() => handleOpenPayment(order)}
                                className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 shadow-sm flex items-center transition-colors"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                เปลี่ยนเป็นโอนจ่าย
                              </button>
                          )}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
        )}
      </div>

      {paymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-pop-in overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">ชำระเงิน (โอนจ่าย)</h3>
                
                <div className="bg-amber-50 p-4 rounded-2xl mb-6 text-center border border-amber-100">
                    <p className="text-sm text-gray-600 mb-2">ยอดชำระ</p>
                    <p className="text-3xl font-bold text-amber-700">฿{selectedOrder?.totalAmount}</p>
                </div>

                <div className="flex flex-col items-center mb-6">
                     <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-4">
                        <img src={QR_CODE_URL} className="w-40 h-40 mix-blend-multiply" alt="QR Code" />
                     </div>
                     <p className="text-sm text-gray-500 mb-4">ธนาคารกสิกรไทย - ปันปันสูข คอฟฟี่</p>
                     
                     <label className="w-full cursor-pointer group">
                        <div className={`flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-xl transition-all ${verificationResult?.isValid ? 'border-green-400 bg-green-50' : verificationResult?.isValid === false ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'}`}>
                          {verifying ? (
                             <>
                               <Loader2 className="w-8 h-8 text-amber-500 mb-2 animate-spin" />
                               <span className="text-sm font-bold text-amber-700">กำลังตรวจสอบสลิป...</span>
                             </>
                          ) : slipImage ? (
                              <>
                                {verificationResult?.isValid ? (
                                    <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                                ) : (
                                    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                                )}
                                <span className="text-sm font-bold text-gray-700">{slipImage.name}</span>
                              </>
                          ) : (
                              <>
                                <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-amber-500" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-amber-700">คลิกเพื่ออัพโหลดสลิป</span>
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

                       {slipImage && !verifying && verificationResult && (
                         <div className={`mt-3 w-full p-3 rounded-lg flex items-start text-xs font-medium border ${verificationResult.isValid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                           {verificationResult.isValid ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                <div>
                                  <p className="font-bold">สลิปถูกต้อง</p>
                                  <p>{verificationResult.reason}</p>
                                </div>
                              </>
                           ) : (
                              <>
                                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                <div>
                                  <p className="font-bold">สลิปไม่ผ่านการตรวจสอบ</p>
                                  <p>{verificationResult.reason}</p>
                                </div>
                              </>
                           )}
                         </div>
                      )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setPaymentModalOpen(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSubmitPayment}
                        disabled={!slipImage || verifying || (verificationResult && !verificationResult.isValid)}
                        className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
                    >
                        ยืนยันการโอน
                    </button>
                </div>
            </div>
        </div>
      )}
      <Footer />
    </div>
  );
};