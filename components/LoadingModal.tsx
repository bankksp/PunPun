import React from 'react';
import { Coffee, CheckCircle, Sparkles, Heart } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  type: 'loading' | 'success';
  message?: string;
  onClose?: () => void;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, type, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"></div>
      
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-pop-in border-4 border-amber-100">
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          
          {type === 'loading' && (
            <>
              <div className="relative mb-6 mt-2">
                {/* Cute Animated Coffee */}
                <div className="w-28 h-28 bg-amber-50 rounded-full flex items-center justify-center animate-pulse shadow-inner border border-amber-100">
                  <Coffee className="w-14 h-14 text-amber-600 animate-bounce" />
                </div>
                <div className="absolute -top-1 -right-1">
                   <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -bottom-1 -left-1">
                   <Heart className="w-6 h-6 text-pink-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">กำลังปรุงความอร่อย...</h3>
              <p className="text-gray-500 font-medium animate-pulse">{message || 'กรุณารอสักครู่'}</p>
            </>
          )}

          {type === 'success' && (
             <>
              <div className="relative mb-6 mt-2">
                <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center shadow-inner border border-green-100">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 transform rotate-12">
                   <span className="text-4xl">🎉</span>
                </div>
                <div className="absolute -top-2 -left-2 transform -rotate-12">
                   <span className="text-4xl">✨</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">เรียบร้อยแล้ว!</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">{message || 'บันทึกข้อมูลสำเร็จ'}</p>
              
              {onClose && (
                <button 
                  onClick={onClose}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-amber-700 transition-all transform hover:scale-105 hover:-translate-y-0.5"
                >
                  ตกลง
                </button>
              )}
             </>
          )}
        </div>
      </div>
    </div>
  );
};