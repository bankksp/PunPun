import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { getOrders } from '../services/dataService';
import { Order, OrderStatus, UserType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Download, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'Day' | 'Month' | 'Year'>('Day');

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const teacherOrders = orders.filter(o => o.userType === UserType.TEACHER).length;
  const studentOrders = orders.filter(o => o.userType === UserType.STUDENT).length;
  const generalOrders = orders.filter(o => o.userType === UserType.GENERAL).length;

  // Process data for charts
  const statusData = [
    { name: 'Pending', value: orders.filter(o => o.status === OrderStatus.PENDING).length },
    { name: 'Preparing', value: orders.filter(o => o.status === OrderStatus.PREPARING).length },
    { name: 'Completed', value: orders.filter(o => o.status === OrderStatus.COMPLETED).length },
    { name: 'Cancelled', value: orders.filter(o => o.status === OrderStatus.CANCELLED).length },
  ].filter(d => d.value > 0);

  const revenueData = [
    { name: 'ทั่วไป', amount: orders.filter(o => o.userType === UserType.GENERAL).reduce((s, o) => s + o.totalAmount, 0) },
    { name: 'ครู', amount: orders.filter(o => o.userType === UserType.TEACHER).reduce((s, o) => s + o.totalAmount, 0) },
    { name: 'นักเรียน', amount: orders.filter(o => o.userType === UserType.STUDENT).reduce((s, o) => s + o.totalAmount, 0) },
  ];

  const handleExport = () => {
    // Simulation of export
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
          <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ดภาพรวม</h1>
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm mb-1">ยอดขายรวม</h3>
            <p className="text-3xl font-bold text-gray-800">฿{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm mb-1">จำนวนออเดอร์</h3>
            <p className="text-3xl font-bold text-amber-600">{orders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm mb-1">ลูกค้า (ทั่วไป/ครู)</h3>
            <p className="text-3xl font-bold text-blue-600">{generalOrders + teacherOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm mb-1">ลูกค้า (นักเรียน)</h3>
            <p className="text-3xl font-bold text-green-600">{studentOrders}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-800 mb-6">สถานะการสั่งซื้อ</h3>
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
            <h3 className="text-lg font-bold text-gray-800 mb-6">ยอดขายแยกตามประเภทลูกค้า</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={revenueData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};