import React from 'react';
import { Button } from './UI/Button';

interface StartScreenProps {
  onStart: () => void;
  // Thêm prop này
  onMultiplayer: () => void;
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onMultiplayer, highScore }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-orange-50 relative overflow-hidden">
      {/* Giữ nguyên các div trang trí background */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full opacity-50 blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-orange-300 rounded-full opacity-50 blur-xl" />

      <div className="z-10 text-center space-y-6 bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-4 border-orange-200 max-w-md w-full">
        <div>
          <h1 className="text-5xl font-black text-orange-600 drop-shadow-sm mb-2">
            Mango<br/>Sum 10
          </h1>
          <p className="text-gray-600 font-medium">The Sweetest Math Puzzle</p>
        </div>

        <div className="bg-orange-100 p-4 rounded-xl border border-orange-200">
          <p className="text-orange-800 font-bold text-sm uppercase tracking-wider mb-1">High Score</p>
          <p className="text-4xl font-black text-orange-600">{highScore.toLocaleString()}</p>
        </div>

        {/* Cập nhật phần nút bấm */}
        <div className="space-y-3 pt-2">
          <Button onClick={onStart} className="w-full text-xl py-3 animate-bounce">
            Solo Play
          </Button>
          <Button onClick={onMultiplayer} variant="secondary" className="w-full text-xl py-3">
            Play vs Friend
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 pt-4">Drag boxes to sum 10!</p>
      </div>
    </div>
  );
};