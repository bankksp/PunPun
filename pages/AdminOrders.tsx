import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders, updateOrderStatus } from '../services/dataService';
import { Order, OrderStatus } from '../types';
import { Clock, MapPin, Search, Edit2, CheckCircle, XCircle } from 'lucide-react';

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
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800';
      case OrderStatus.DELIVERING: return 'bg-purple-100 text-purple-800';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
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
                      <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                      {order.slipUrl && (
                        <a href={order.slipUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline hover:text-blue-800">
                          ดูสลิป
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {order.deliveryLocation}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 border p-1"
                      >
                        {Object.values(OrderStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
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
