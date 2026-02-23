import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders } from '../services/dataService';
import { Order, OrderStatus, UserType, PaymentStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Download, Calendar, CheckCircle, Clock, Wallet, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
const PAYMENT_COLORS = {
  PAID: '#10B981',
  PENDING: '#F43F5E',
  TOTAL: '#D97706'
};

const getFilterLabel = (f: string) => {
    switch(f) {
        case 'Day': return 'รายวัน';
        case 'Month': return 'รายเดือน';
        case 'Year': return 'รายปี';
        default: return f;
    }
}

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'Day' | 'Month' | 'Year'>('Day');

  useEffect(() => {
    // 1. Try to load from cache first for instant render
    const cached = localStorage.getItem('orders_cache');
    if (cached) {
      setOrders(JSON.parse(cached));
    }
    
    // 2. Fetch fresh data
    getOrders().then(data => {
      setOrders(data);
      localStorage.setItem('orders_cache', JSON.stringify(data));
    });
  }, []);

  // Filter Logic based on Date
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      if (filter === 'Day') {
        return orderDate.toDateString() === now.toDateString();
      } else if (filter === 'Month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      } else if (filter === 'Year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, filter]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const paid = filteredOrders.filter(o => o.paymentStatus === PaymentStatus.PAID);
    const pending = filteredOrders.filter(o => o.paymentStatus === PaymentStatus.PENDING);
    
    const totalRev = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const paidRev = paid.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingRev = pending.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalRevenue: totalRev,
      paidRevenue: paidRev,
      pendingRevenue: pendingRev,
      totalCount: filteredOrders.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      cancelledCount: filteredOrders.filter(o => o.status === OrderStatus.CANCELLED).length
    };
  }, [filteredOrders]);

  // Process data for charts
  const revenueByUserType = useMemo(() => {
    const teacher = filteredOrders.filter(o => o.userType === UserType.TEACHER).reduce((sum, o) => sum + o.totalAmount, 0);
    const student = filteredOrders.filter(o => o.userType === UserType.STUDENT).reduce((sum, o) => sum + o.totalAmount, 0);
    const general = filteredOrders.filter(o => o.userType === UserType.GENERAL).reduce((sum, o) => sum + o.totalAmount, 0);

    return [
      { name: 'ทั่วไป', amount: general, color: '#F59E0B' },
      { name: 'ครู', amount: teacher, color: '#3B82F6' },
      { name: 'นักเรียน', amount: student, color: '#10B981' },
    ];
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
    const processing = filteredOrders.filter(o => o.status === OrderStatus.PREPARING || o.status === OrderStatus.PENDING).length;
    const delivering = filteredOrders.filter(o => o.status === OrderStatus.DELIVERING).length;
    const cancelled = filteredOrders.filter(o => o.status === OrderStatus.CANCELLED).length;

    return [
      { name: 'สำเร็จ', value: completed, color: '#10B981' },
      { name: 'กำลังทำ', value: processing, color: '#F59E0B' },
      { name: 'กำลังส่ง', value: delivering, color: '#3B82F6' },
      { name: 'ยกเลิก', value: cancelled, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [filteredOrders]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Order ID,Customer,Type,Amount,Payment Status,Order Status\n"
      + filteredOrders.map(o => `${new Date(o.timestamp).toLocaleString()},${o.id},${o.customerName},${o.userType},${o.totalAmount},${o.paymentStatus},${o.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <Navbar isAdmin={true} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">แดชบอร์ดจัดการร้าน</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">ติดตามยอดขายและสถานะการชำระเงินของลูกค้า</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 overflow-hidden">
              {(['Day', 'Month', 'Year'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 ${
                    filter === f 
                    ? 'bg-amber-600 text-white font-bold shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {getFilterLabel(f)}
                </button>
              ))}
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 text-xs sm:text-sm font-bold transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              ส่งออก CSV
            </button>
          </div>
        </div>

        {/* Revenue Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform">
               <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-amber-600" />
            </div>
            <h3 className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">ยอดขายทั้งหมด</h3>
            <div className="flex items-baseline gap-2">
               <p className="text-2xl sm:text-4xl font-black text-gray-900">฿{stats.totalRevenue.toLocaleString()}</p>
               <span className="text-gray-400 text-[10px] sm:text-xs font-medium">/ {stats.totalCount} ออเดอร์</span>
            </div>
            <div className="mt-4 h-1 w-full bg-amber-100 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 w-full"></div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform">
               <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-600" />
            </div>
            <h3 className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">ชำระเงินแล้ว</h3>
            <div className="flex items-baseline gap-2">
               <p className="text-2xl sm:text-4xl font-black text-emerald-600">฿{stats.paidRevenue.toLocaleString()}</p>
               <span className="text-emerald-500/60 text-[10px] sm:text-xs font-medium">{Math.round((stats.paidRevenue / (stats.totalRevenue || 1)) * 100)}%</span>
            </div>
            <div className="mt-4 h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
               <div 
                className="h-full bg-emerald-50 transition-all duration-1000" 
                style={{ width: `${(stats.paidRevenue / (stats.totalRevenue || 1)) * 100}%` }}
               ></div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform">
               <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-rose-600" />
            </div>
            <h3 className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">รอชำระเงิน</h3>
            <div className="flex items-baseline gap-2">
               <p className="text-2xl sm:text-4xl font-black text-rose-600">฿{stats.pendingRevenue.toLocaleString()}</p>
               <span className="text-rose-500/60 text-[10px] sm:text-xs font-medium">{stats.pendingCount} รายการ</span>
            </div>
            <div className="mt-4 h-1 w-full bg-rose-100 rounded-full overflow-hidden">
               <div 
                className="h-full bg-rose-500 transition-all duration-1000" 
                style={{ width: `${(stats.pendingRevenue / (stats.totalRevenue || 1)) * 100}%` }}
               ></div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue By User Type Bar Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  ยอดขายแยกตามลูกค้า
               </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByUserType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`฿${value.toLocaleString()}`, 'ยอดขาย']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40}>
                    {revenueByUserType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Distribution Pie Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  สถานะคำสั่งซื้อ
               </h3>
            </div>
            <div className="h-64">
               {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <Calendar className="w-12 h-12 mb-2 opacity-20" />
                     <p>ยังไม่มีข้อมูลในช่วงเวลานี้</p>
                  </div>
               )}
            </div>
          </div>
        </div>

        {/* Detailed Insights */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-900">รายการล่าสุด ({getFilterLabel(filter)})</h3>
               <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  {filteredOrders.length} รายการ
               </span>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                     <tr>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">รหัสสั่งซื้อ</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ลูกค้า</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ยอดชำระ</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">การชำระเงิน</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">สถานะ</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {filteredOrders.slice(0, 10).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-8 py-5 text-sm font-bold text-gray-700">#{order.id}</td>
                           <td className="px-8 py-5">
                              <div className="text-sm font-bold text-gray-900">{order.customerName}</div>
                              <div className="text-[10px] text-gray-400 uppercase font-medium">{order.userType}</div>
                           </td>
                           <td className="px-8 py-5 text-sm font-black text-gray-900">฿{order.totalAmount}</td>
                           <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                 order.paymentStatus === PaymentStatus.PAID 
                                 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                 : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                 {order.paymentStatus}
                              </span>
                           </td>
                           <td className="px-8 py-5">
                              <span className="text-sm font-medium text-gray-600">{order.status}</span>
                           </td>
                        </tr>
                     ))}
                     {filteredOrders.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                              ไม่มีข้อมูลออเดอร์ในช่วงเวลานี้
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
        </div>
      </div>
    </div>
  );
};