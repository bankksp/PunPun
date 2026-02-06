import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders } from '../services/dataService';
import { Order, OrderStatus, UserType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Download, Calendar, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444']; // Green, Amber, Blue, Red

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

  // Filter only COMPLETED orders for Revenue and Success Count
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING);

  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const teacherRevenue = completedOrders.filter(o => o.userType === UserType.TEACHER).reduce((sum, o) => sum + o.totalAmount, 0);
  const studentRevenue = completedOrders.filter(o => o.userType === UserType.STUDENT).reduce((sum, o) => sum + o.totalAmount, 0);
  const generalRevenue = completedOrders.filter(o => o.userType === UserType.GENERAL).reduce((sum, o) => sum + o.totalAmount, 0);

  // Process data for charts
  const statusData = [
    { name: 'สำเร็จ (Completed)', value: completedOrders.length },
    { name: 'รอดำเนินการ (Pending)', value: pendingOrders.length },
    { name: 'กำลังส่ง (Delivering)', value: orders.filter(o => o.status === OrderStatus.DELIVERING).length },
    { name: 'ยกเลิก (Cancelled)', value: orders.filter(o => o.status === OrderStatus.CANCELLED).length },
  ].filter(d => d.value > 0);

  const revenueData = [
    { name: 'ทั่วไป', amount: generalRevenue },
    { name: 'ครู', amount: teacherRevenue },
    { name: 'นักเรียน', amount: studentRevenue },
  ];

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Order ID,Customer,Type,Amount,Status\n"
      + orders.map(o => `${new Date(o.timestamp).toLocaleDateString()},${o.id},${o.customerName},${o.userType},${o.totalAmount},${o.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar isAdmin={true} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ดภาพรวม (เฉพาะรายการสำเร็จ)</h1>
          <div className="flex gap-2">
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              {['Day', 'Month', 'Year'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === f ? 'bg-amber-100 text-amber-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {f === 'Day' ? 'รายวัน' : f === 'Month' ? 'รายเดือน' : 'รายปี'}
                </button>
              ))}
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 text-sm font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
            <h3 className="text-gray-500 text-sm mb-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500"/> ยอดขาย (ส่งสำเร็จ)
            </h3>
            <p className="text-3xl font-bold text-gray-800">฿{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-2">จากออเดอร์ที่ส่งมอบแล้วเท่านั้น</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
            <h3 className="text-gray-500 text-sm mb-1">จำนวนออเดอร์ (ส่งสำเร็จ)</h3>
            <p className="text-3xl font-bold text-blue-600">{completedOrders.length} <span className="text-sm text-gray-400 font-normal">รายการ</span></p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
            <h3 className="text-gray-500 text-sm mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-yellow-500"/> รอดำเนินการ
            </h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingOrders.length} <span className="text-sm text-gray-400 font-normal">รายการ</span></p>
            <p className="text-xs text-gray-400 mt-2">ต้องรีบจัดทำ!</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-gray-500 text-sm mb-1">ลูกค้า (สำเร็จ)</h3>
             <div className="flex justify-between items-end mt-1">
                <div className="text-center">
                   <span className="block text-xl font-bold text-gray-700">{teacherRevenue > 0 ? 'ครู' : '-'}</span>
                   <span className="text-xs text-gray-400">฿{teacherRevenue.toLocaleString()}</span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center">
                   <span className="block text-xl font-bold text-gray-700">{studentRevenue > 0 ? 'นร.' : '-'}</span>
                   <span className="text-xs text-gray-400">฿{studentRevenue.toLocaleString()}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-800 mb-6">สัดส่วนสถานะออเดอร์</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-800 mb-6">ยอดขาย (ส่งสำเร็จ) แยกตามลูกค้า</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={revenueData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#d97706" radius={[4, 4, 0, 0]}>
                   {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 ? '#3B82F6' : index === 2 ? '#10B981' : '#F59E0B'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};