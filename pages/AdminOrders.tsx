import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders, updateOrderStatus, updatePaymentStatus } from '../services/dataService';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { Clock, MapPin, Search, User, CreditCard, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = () => {
    getOrders().then(setOrders);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
    fetchOrders();
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    await updatePaymentStatus(orderId, newStatus);
    fetchOrders();
  };

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

  const getPaymentStatusColor = (status: PaymentStatus) => {
      return status === PaymentStatus.PAID ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar isAdmin={true} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">จัดการออเดอร์</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรือ เลขออเดอร์" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-4">
          {filteredOrders.length === 0 && (
             <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">ไม่พบรายการออเดอร์</div>
          )}
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                <div className="pr-2">
                   <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 break-all">#{order.id}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <div className="flex items-center text-sm font-medium text-gray-900 mt-1 flex-wrap">
                      <User className="w-3 h-3 mr-1 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{order.customerName}</span> 
                      <span className="text-gray-500 font-normal text-xs ml-1 whitespace-nowrap">({order.userType})</span>
                   </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className="mb-4 bg-gray-50 p-3 rounded-lg space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700 flex justify-between items-start gap-2">
                     <span className="leading-tight break-words">
                        {item.name} <span className="text-gray-500 text-xs font-bold">x{item.quantity}</span>
                     </span>
                     <span className="text-gray-400 text-[11px] shrink-0 text-right">({item.sweetness})</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                     <div className="flex items-start">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 mt-0.5 shrink-0" />
                        <span className="leading-tight break-words">{order.deliveryLocation}</span>
                     </div>
                     <div className="flex items-center flex-wrap gap-1">
                         <CreditCard className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
                         <span className="font-medium">{order.paymentMethod}</span>
                         {order.slipUrl && (
                            <a href={order.slipUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline whitespace-nowrap">
                              (ดูสลิป)
                            </a>
                         )}
                     </div>
                  </div>

                   <div className="flex justify-between items-center py-2">
                     <span className="text-xs text-gray-500">การชำระเงิน:</span>
                     <div className="relative">
                        <select 
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(order.id, e.target.value as PaymentStatus)}
                          className={`appearance-none pl-3 pr-8 py-1 text-xs font-bold rounded-full focus:outline-none border shadow-sm ${getPaymentStatusColor(order.paymentStatus)}`}
                        >
                          {Object.values(PaymentStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                     </div>
                   </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                     <div className="font-bold text-amber-700 text-lg whitespace-nowrap">฿{order.totalAmount}</div>
                     <div className="relative">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="appearance-none pl-3 pr-8 py-2 bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        >
                          {Object.values(OrderStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-amber-700 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                     </div>
                  </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-[15%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">รหัสสั่งซื้อ / เวลา</th>
                  <th className="w-[15%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">รายการ</th>
                  <th className="w-[15%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ยอดรวม / ชำระเงิน</th>
                  <th className="w-[15%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">จัดส่ง</th>
                  <th className="w-[10%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">สถานะ</th>
                  <th className="w-[10%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 break-all leading-none mb-1">{order.id}</div>
                      <div className="text-[11px] text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1 shrink-0" />
                        {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 break-words leading-tight">{order.customerName}</div>
                      <div className="text-[11px] text-gray-500 font-medium">({order.userType})</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="leading-snug break-words border-b border-gray-50 pb-1 last:border-0 last:pb-0">
                            <span className="font-medium text-gray-800">{item.name}</span> 
                            <span className="text-amber-700 font-bold ml-1">x{item.quantity}</span> 
                            <div className="text-[10px] text-gray-400 mt-0.5">({item.sweetness})</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-amber-800 text-base leading-none mb-2 whitespace-nowrap">฿{order.totalAmount.toLocaleString()}</div>
                      <div className="space-y-2">
                        <div className="text-[11px] text-gray-500 flex items-center flex-wrap gap-1">
                            <span className="font-medium">{order.paymentMethod}</span>
                            {order.slipUrl && (
                            <a href={order.slipUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 font-bold">
                                (ดูสลิป)
                            </a>
                            )}
                        </div>
                        <div className="relative w-max">
                            <select 
                            value={order.paymentStatus}
                            onChange={(e) => handlePaymentStatusChange(order.id, e.target.value as PaymentStatus)}
                            className={`appearance-none pl-2 pr-6 py-0.5 text-[10px] font-bold rounded-md focus:outline-none border shadow-sm ${getPaymentStatusColor(order.paymentStatus)}`}
                            >
                            {Object.values(PaymentStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-gray-500 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start text-xs text-gray-600 leading-tight break-words">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0 mt-0.5" />
                        {order.deliveryLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block w-full">
                        <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className="appearance-none w-full pl-2 pr-6 py-1 text-xs border-gray-300 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500 border bg-white font-medium text-gray-700"
                        >
                            {Object.values(OrderStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
             <div className="p-8 text-center text-gray-500 font-medium">ไม่พบรายการออเดอร์</div>
          )}
        </div>
      </div>
    </div>
  );
};