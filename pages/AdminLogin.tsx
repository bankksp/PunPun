import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { LOGO_URL, APP_NAME } from '../constants';
import { Footer } from '../components/Footer';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-login check
    const token = localStorage.getItem('admin_token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock validation
    if (username === 'admin' && password === 'admin123') {
      if (remember) {
        localStorage.setItem('admin_token', 'mock_token');
      }
      navigate('/admin/dashboard');
    } else {
      alert('รหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-amber-800 to-amber-900 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full p-1 bg-white/20 backdrop-blur-sm">
                 <img src={LOGO_URL} alt="Logo" className="w-full h-full rounded-full border-2 border-white/50 shadow-lg object-cover" />
              </div>
              <h2 className="text-white text-2xl font-bold tracking-tight">{APP_NAME}</h2>
              <p className="text-amber-200/80 text-sm mt-1 font-light tracking-wide">ระบบจัดการร้านค้า</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-amber-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="ชื่อผู้ใช้งาน"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="group">
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-amber-600 transition-colors" />
                  <input 
                    type="password" 
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember" 
                  type="checkbox" 
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500" 
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-500">จำรหัสผ่าน</label>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};