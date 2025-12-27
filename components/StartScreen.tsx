// components/StartScreen.tsx
import React from 'react';
import { Button } from './UI/Button';

interface StartScreenProps {
  onStart: () => void;
  onMultiplayer: () => void;
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onMultiplayer, highScore }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-cyan-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-50 blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-300 rounded-full opacity-50 blur-xl" />

      <div className="z-10 text-center space-y-6 bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-4 border-cyan-200 max-w-md w-full">
        <div>
          <h1 className="text-5xl font-black text-cyan-600 drop-shadow-sm mb-2">
            Thanh Lam<br/>Cộng lại 10 :33
          </h1>
          <p className="text-gray-600 font-medium">Trò chơi toán học với em Thanh Lam</p>
        </div>

        <div className="bg-cyan-100 p-4 rounded-xl border border-cyan-200">
          <p className="text-cyan-800 font-bold text-sm uppercase tracking-wider mb-1">Điểm Cao Nhất</p>
          <p className="text-4xl font-black text-cyan-600">{highScore.toLocaleString()}</p>
        </div>

        <div className="space-y-3 pt-2">
          <Button onClick={onStart} className="w-full text-xl py-3 mb-3">
            Chơi mụt mình bùn lắm
          </Button>
          <Button onClick={onMultiplayer} variant="secondary" className="animate-bounce w-full text-xl py-3">
            Chơi với Thanh Lam
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 pt-4">Kéo các ô sao cho tổng bằng 10 nha cục dàng</p>
      </div>
    </div>
  );
};