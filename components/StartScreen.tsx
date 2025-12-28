// components/StartScreen.tsx
import React, { useState } from 'react';
import { Button } from './UI/Button';

interface StartScreenProps {
  onStart: () => void;
  onMultiplayer: () => void;
  onOpenHistory: () => void; // Thêm prop này
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onMultiplayer, onOpenHistory, highScore }) => {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-cyan-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-50 blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-300 rounded-full opacity-50 blur-xl" />

      {/* Main Menu Content */}
      {!showTutorial ? (
        <div className="z-10 text-center space-y-6 bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-4 border-cyan-200 max-w-md w-full animate-fade-in">
          <div>
            {/* TIÊU ĐỀ */}
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 drop-shadow-md mb-2 leading-tight tracking-tight transform -rotate-2">
              Thanh Lam<br/>
              <span className="text-4xl md:text-5xl text-yellow-500 drop-shadow-none">Cộng lại 10 :33</span>
            </h1>
            
            <p className="text-gray-600 font-medium">Chơi cùng Thanh Lam là vui nhất</p>
          </div>

          <div className="bg-cyan-100 p-4 rounded-xl border border-cyan-200">
            <p className="text-cyan-800 font-bold text-sm uppercase tracking-wider mb-1">Cao thủ võ lâm 🏆</p>
            <p className="text-4xl font-black text-cyan-600">{highScore.toLocaleString()}</p>
          </div>

          <div className="space-y-3 pt-2">
            <Button onClick={onStart} className="w-full text-xl py-3 mb-5 ">
              🎮 Chơi Mụt Mình
            </Button>
            <Button onClick={onMultiplayer} variant="secondary" className="w-full text-xl py-3 animate-bounce shadow-cyan-300/50">
              ⚔️ Với Thanh Lam
            </Button>

            <div className="space-y-3 pt-0">
                <Button 
                  onClick={() => setShowTutorial(true)} 
                  className="w-full flex-1 text-lg py-2 bg-yellow-400 text-white border-b-4 border-yellow-600 hover:bg-yellow-500 active:border-b-0 active:mt-1"
                >
                  📖 Hướng Dẫn
                </Button>
                {/* NÚT LỊCH SỬ MỚI */}
                <Button 
                  onClick={onOpenHistory} 
                  className="w-full flex-1 text-lg py-2 !bg-green-400 text-white border-b-4 border-green-600 hover:bg-green-500 active:border-b-0 active:mt-1"
                >
                  📜 Lịch Sử
                </Button>
            </div>
          </div>
          
          {/* <p className="text-xs text-gray-400 pt-4">Kéo các ô cho tổng bằng 10 nhá cục dàng 😝</p> */}
        </div>
      ) : (
        // Tutorial Overlay Modal
        <div className="z-20 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-4 border-yellow-400 max-w-md w-full max-h-[85vh] overflow-y-auto animate-fade-in relative custom-scrollbar">
          {/* <button 
            onClick={() => setShowTutorial(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
          >
            ✕
          </button> */}
          
          <h2 className="text-3xl font-black text-yellow-500 text-center mb-6 uppercase tracking-wide drop-shadow-sm">
             anh dạy nhá 🎓
          </h2>

          <div className="space-y-4 text-gray-600">
            {/* Step 1: Gameplay */}
            <div className="flex gap-4 items-start bg-green-50 p-3 rounded-2xl border border-green-100">
              <div className="text-4xl bg-white p-2 rounded-xl shadow-sm">👆</div>
              <div>
                <h3 className="font-bold text-lg text-green-600">Kéo & Nối</h3>
                <p className="text-sm">Kéo qua các quả xoài sao cho tổng các số bằng <b className="text-red-500 text-lg">10</b></p>
                <div className="flex gap-1 mt-2 text-xs font-mono bg-white p-2 rounded border border-green-200 text-gray-500">
                  <span className="bg-green-100 px-1 rounded">5</span> + <span className="bg-green-100 px-1 rounded">3</span> + <span className="bg-green-100 px-1 rounded">2</span> = 🔟
                </div>
              </div>
            </div>

            {/* Step 2: Combo */}
            <div className="flex gap-4 items-start bg-orange-50 p-3 rounded-2xl border border-orange-100">
              <div className="text-4xl bg-white p-2 rounded-xl shadow-sm">🔥</div>
              <div>
                <h3 className="font-bold text-lg text-orange-600">Chuỗi Combo</h3>
                <p className="text-sm">Ăn liên tục thật nhanh để tích <b className="text-orange-500">Chuỗi Lửa</b> Chuỗi càng cao điểm cộng thêm càng khủng</p>
              </div>
            </div>

            {/* Step 3: Items */}
            <div className="flex gap-4 items-start bg-purple-50 p-3 rounded-2xl border border-purple-100">
              <div className="text-4xl bg-white p-2 rounded-xl shadow-sm">🎁</div>
              <div>
                <h3 className="font-bold text-lg text-purple-600">Bảo Bối (Chơi Đôi)</h3>
                <p className="text-sm mb-2">Nhặt vật phẩm ngẫu nhiên để chọc ảnh:</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-purple-100"><span className="text-xl">💣</span> -10s của ảnh</div>
                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-purple-100"><span className="text-xl">❄️</span> Đóng băng thời gian của mình</div>
                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-purple-100"><span className="text-xl">🌈</span> Chọn bừa trong 2x2</div>
                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-purple-100"><span className="text-xl">😈</span> Cướp điểm của ảnh</div>
                </div>
              </div>
            </div>

            {/* Step 4: Avatar (NEW) */}
            <div className="flex gap-4 items-start bg-pink-50 p-3 rounded-2xl border border-pink-100">
              <div className="text-4xl bg-white p-2 rounded-xl shadow-sm">😝</div>
              <div>
                <h3 className="font-bold text-lg text-pink-600">Avatar & Emoji</h3>
                <p className="text-sm">
                  Chọn Avatar đại diện khi nhập tên nhá Trong lúc chơi, hãy bấm vào <b className="text-pink-500">Avatar của ảnh</b> để thả Emoji chọc tức ảnh nhá 😜
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={() => setShowTutorial(false)} 
              className="w-full flex-1 text-lg py-2 bg-yellow-400 text-white border-b-4 border-yellow-600 hover:bg-yellow-500 active:border-b-0 active:mt-1"
            >
              Hiểu gòi, chít với em 🚀
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};