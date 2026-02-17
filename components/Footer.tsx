import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 mt-4">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-gray-400 font-light flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <span className="hover:text-amber-700 transition-colors cursor-default">พัฒนาโดย นันทพัทธ์ แสงสุดตา</span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="hover:text-amber-700 transition-colors cursor-default">โรงเรียนกาฬสินธุ์ปัญญานุกูล</span>
        </p>
      </div>
    </footer>
  );
};