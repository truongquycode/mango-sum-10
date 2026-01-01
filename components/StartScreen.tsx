// components/StartScreen.tsx
import React, { useState } from 'react';
import { Button } from './UI/Button';

interface StartScreenProps {
  onStart: () => void;
  onMultiplayer: () => void;
  onOpenHistory: () => void;
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onMultiplayer, onOpenHistory, highScore }) => {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-cyan-50 relative overflow-hidden select-none">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-50 blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-300 rounded-full opacity-50 blur-xl" />

      {/* --- MAIN MENU CONTENT --- */}
      {!showTutorial ? (
        <div className="z-10 text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-2xl border-4 border-cyan-200 max-w-md w-full animate-fade-in">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 drop-shadow-md mb-2 leading-tight tracking-tight transform -rotate-2">
              Thanh Lam<br/>
              <span className="text-4xl md:text-5xl text-yellow-500 drop-shadow-none">Cộng lại 10 :33</span>
            </h1>
            <p className="text-gray-600 font-medium italic">"Chơi cùng Thanh Lam là vuiiii nhất"</p>
          </div>

          <div className="bg-cyan-100 p-4 rounded-xl border border-cyan-200 transform hover:scale-105 transition-transform duration-300">
            <p className="text-cyan-800 font-bold text-xs uppercase tracking-wider mb-1">Đỉnh cao luyện tập :3 🏆</p>
            <p className="text-4xl font-black text-cyan-600">{highScore.toLocaleString()}</p>
          </div>

          <div className="space-y-3 pt-2">
            <Button onClick={onStart} className="w-full text-xl py-3 mb-5 hover:scale-105 transition-transform">
              🎮 Luyện Tập (1 mình)
            </Button>
            <Button onClick={onMultiplayer} variant="secondary" className="w-full text-xl py-3 animate-bounce shadow-cyan-300/50">
              ⚔️ Đấu Với Thanh Lam
            </Button>
            <Button 
                  onClick={() => setShowTutorial(true)} 
                  className="w-full flex-1 text-xl py-2 bg-yellow-400 text-white border-b-4 border-yellow-600 hover:bg-yellow-500 active:border-b-0 active:mt-1 active:border-t-4 active:border-transparent transition-all"
                >
                  📖 Bí Kíp để thắng anh
                </Button>
                <Button 
                  onClick={onOpenHistory} 
                  className="w-full flex-1 text-xl py-2 !bg-green-500 text-white border-b-4 border-green-700 hover:!bg-green-600 active:border-b-0 active:mt-1 active:border-t-4 active:border-transparent transition-all"
                >
                📜 Lịch sử thắng ảnhh
                </Button>
            
          </div>
        </div>
      ) : (
        
        // --- TUTORIAL OVERLAY MODAL (NÂNG CẤP) ---
        // --- TUTORIAL OVERLAY MODAL (CYAN THEME) ---
        <div className="z-50 bg-white/95 backdrop-blur-xl p-0 rounded-3xl shadow-2xl border-4 border-cyan-400 max-w-md w-full h-[85vh] flex flex-col animate-fade-in relative overflow-hidden">
          
          {/* Header Fixed - Đổi sang màu Xanh */}
          <div className="bg-cyan-500 p-4 text-center border-b-4 border-cyan-600 shadow-sm shrink-0 z-10">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
                😝 Bí kíp thắng ảnh
            </h2>
            <p className="text-cyan-50 text-xs font-medium">Đọc kỹ để cho ảnh "hít khói" nhaaa</p>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-5 space-y-5 custom-scrollbar flex-1 pb-20">
            
            {/* 1. Gameplay Basics */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border-2 border-blue-200 relative overflow-hidden group hover:shadow-md transition-shadow">
               <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl select-none group-hover:scale-110 transition-transform">🔟</div>
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-3xl bg-white rounded-lg p-1 shadow-sm">👆</span>
                 <h3 className="font-bold text-blue-700 text-lg uppercase">Cơ bản nhập môn</h3>
               </div>
               <p className="text-gray-700 text-sm leading-relaxed">
                 Em thấy mấy con số chỗ mấy bé trái cây hông? Kéo một đường nối tụi nó lại, miễn sao <b className="text-blue-600">tổng bằng 10</b> là được nhaaa
               </p>
               <div className="mt-2 bg-white/60 p-4 rounded-lg text-left font-mono text-blue-900 text-sm border border-blue-200 leading-loose">
                 5 + 3 + 2 = 10<br/>
                 7 + 3 = 10 <br/>
                 6 + 4 = 10 <br/>
                 anh + em = em bé
               </div>
            </div>

            {/* 2. Combo System */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border-2 border-orange-200 relative overflow-hidden group hover:shadow-md transition-shadow">
               <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl select-none group-hover:rotate-12 transition-transform">🔥</div>
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-3xl bg-white rounded-lg p-1 shadow-sm">🚀</span>
                 <h3 className="font-bold text-orange-700 text-lg uppercase">Combo cháy máy</h3>
               </div>
               <p className="text-gray-700 text-sm leading-relaxed">
                 Ăn liên tục đừng có nghỉ nháa<br/>Thanh năng lượng đầy là <b className="text-orange-600">x2, x3 điểm</b>
                 <br/><span className="text-xs italic text-orange-800 opacity-75">(Lúc này là lúc bứt tốc vượt mặt ảnh nè)</span>
               </p>
            </div>

            {/* 3. Items */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border-2 border-purple-200 relative overflow-hidden">
               <div className="flex items-center gap-3 mb-3">
                 <span className="text-3xl bg-white rounded-lg p-1 shadow-sm">🎒</span>
                 <h3 className="font-bold text-purple-700 text-lg uppercase">Túi đồ chín thựt</h3>
               </div>
               <p className="text-gray-700 text-sm mb-3">
                 Nhặt mấy cái hộp quà để lấy "hàng nóng" xử lý ảnh:
               </p>
               
               <div className="grid grid-cols-2 gap-2">
                 {/* Item 1: BOMB */}
                 <div className="bg-white p-2 rounded-xl border border-red-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">💣</span>
                    <span className="text-xs font-bold text-red-600">Bom Nổ</span>
                    <span className="text-[10px] text-gray-500 leading-tight">-10s của ảnh (cho chừa)</span>
                 </div>
                 
                 {/* Item 2: MAGIC */}
                 <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">🌈</span>
                    <span className="text-xs font-bold text-purple-600">Thánh Rùa</span>
                    <span className="text-[10px] text-gray-500 leading-tight">chọn bừa cũng đúng nhưng 2x2 thui nhá</span>
                 </div>

                 {/* Item 3: FREEZE */}
                 <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">❄️</span>
                    <span className="text-xs font-bold text-blue-500">Đóng Băng</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Ngưng thời gian (để thở 5s)</span>
                 </div>

                 {/* Item 4: SPEED_UP */}
                 <div className="bg-white p-2 rounded-xl border border-yellow-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">⏩</span>
                    <span className="text-xs font-bold text-yellow-600">Tua Nhanh</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Giờ của ảnh chạy như chó đuổi (1.5x)</span>
                 </div>

                 {/* Item 5: STEAL */}
                 <div className="bg-white p-2 rounded-xl border border-pink-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">😈</span>
                    <span className="text-xs font-bold text-pink-600">Cướp Điểm</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Của anh là của em (hí hí)</span>
                 </div>

                 {/* Item 6: DEBUFF */}
                 <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">📉</span>
                    <span className="text-xs font-bold text-gray-600">Giảm Điểm</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Tụt tụt (ảnh chỉ nhận 50% điểm)</span>
                 </div>

                  {/* Item 7: BUFF (Spans 2 columns) */}
                  <div className="col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-xl border border-green-200 shadow-sm flex flex-row items-center justify-center gap-3">
                    <span className="text-3xl">🚀</span>
                    <div className="text-left">
                        <span className="block text-xs font-bold text-green-600">X2 Điểm (Buff)</span>
                        <span className="block text-[10px] text-gray-500 leading-tight">Bật mode hack điểm trong 10s</span>
                    </div>
                 </div>
               </div>
            </div>

            {/* 4. Social / Avatar */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-2xl border-2 border-pink-200 relative">
               <div className="flex items-center gap-3 mb-2">
                 <span className="text-3xl bg-white rounded-lg p-1 shadow-sm">😜</span>
                 <h3 className="font-bold text-pink-700 text-lg uppercase">Tâm lý chiến</h3>
               </div>
               <ul className="text-sm text-gray-700 space-y-2 list-disc pl-4">
                 <li>Bấm vào <b>Avatar của ảnh</b> để spam Emoji chọc tức (lêu lêu, quạu, khóc nhè...)</li>
                 <li>Khi thắng thì spam nhiều vào cho ảnh khỏi chơi luôn 😈</li>
               </ul>
            </div>

            {/* Footer Quote */}
            <div className="text-center pt-2 pb-6 opacity-60">
                <p className="text-xs font-mono">"Thắng thua hong quan trọng, quan trọng là em phải thực hiện giao kèo của anh"</p>
            </div>
          </div>

          {/* Footer Fixed Button - Đổi sang màu Xanh/Tím */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
            <Button 
              onClick={() => setShowTutorial(false)} 
              className="w-full text-lg py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-200 border-none hover:scale-[1.02] active:scale-95 transition-all rounded-2xl"
            >
              Đã hiểu, anh chít dới em 👿
            </Button>
          </div>

        </div>
      )}
    </div>
  );
};