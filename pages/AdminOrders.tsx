import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders, updateOrderStatus } from '../services/dataService';
import { Order, OrderStatus } from '../types';
import { Clock, MapPin, Search, User, CreditCard, ChevronDown } from 'lucide-react';

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
                <div>
                   <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">#{order.id}</span>
                      <span className="text-xs text-gray-400">{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <div className="flex items-center text-sm font-medium text-gray-900 mt-1">
                      <User className="w-3 h-3 mr-1 text-gray-400" />
                      {order.customerName} <span className="text-gray-500 font-normal text-xs ml-1">({order.userType})</span>
                   </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className="mb-4 bg-gray-50 p-3 rounded-lg space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700 flex justify-between items-start">
                     <span>
                        {item.name} <span className="text-gray-500 text-xs">x{item.quantity}</span>
                     </span>
                     <span className="text-gray-400 text-xs">({item.sweetness})</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                     <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {order.deliveryLocation}
                     </div>
                     <div className="flex items-center">
                         <CreditCard className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                         {order.paymentMethod}
                         {order.slipUrl && (
                            <a href={order.slipUrl} target="_blank" rel="noreferrer" className="ml-1 text-xs text-blue-600 underline">
                              (สลิป)
                            </a>
                         )}
                     </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                     <div className="font-bold text-amber-700 text-lg">฿{order.totalAmount}</div>
                     <div className="relative">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="appearance-none pl-3 pr-8 py-2 bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID / เวลา</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">ลูกค้า</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">รายการ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">ยอดรวม / ชำระเงิน</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">จัดส่ง</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.id}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">({order.userType})</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx}>{item.name} x{item.quantity} <span className="text-gray-400 text-xs">({item.sweetness})</span></div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-amber-700">฿{order.totalAmount}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {order.paymentMethod}
                        {order.slipUrl && (
                          <a href={order.slipUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">
                            (สลิป)
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {order.deliveryLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className="appearance-none w-32 pl-3 pr-8 py-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 border bg-white"
                        >
                            {Object.values(OrderStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
             <div className="p-8 text-center text-gray-500">ไม่พบรายการออเดอร์</div>
          )}
        </div>
      </div>
    </div>
  );
};