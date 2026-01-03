// components/StartScreen.tsx
import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { db } from '../../firebaseConfig';
import { ref, push } from "firebase/database";
import { StartScreenProps, AccessLog } from '../StartScreen/types'; // Import type chung (nếu bạn tạo file types.ts)
// Import các component con
import { TutorialModal } from '../StartScreen/TutorialModal';
import { LogModal } from '../StartScreen/LogModal';
import { NameInputModal } from '../StartScreen/NameInputModal';

// Nếu bạn không tạo file types.ts riêng, hãy copy interface vào đây:
/*
interface AccessLog {
  name: string;
  timestamp: number;
  action: string;
}
interface StartScreenProps {
  onStart: (name?: string) => void; 
  onMultiplayer: () => void;
  onOpenHistory: () => void;
  highScore: number;
}
*/

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onMultiplayer, onOpenHistory, highScore }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Tìm đến hàm handleConfirmStart và sửa lại như sau:
const handleConfirmStart = (playerName: string) => {
    if (!playerName.trim()) {
      // Logic báo lỗi (nếu bạn đang xử lý ở modal con thì bỏ qua đoạn check này)
      return;
    }

    // Lưu tên vào máy cá nhân
    localStorage.setItem('last_player_name', playerName);

    // QUAN TRỌNG: Không ghi log ở đây nữa.
    // Chỉ truyền tên và bắt đầu game. Log sẽ được ghi khi Game Over.
    onStart(playerName); 
};

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-cyan-50 relative overflow-hidden select-none">
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-50 blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-300 rounded-full opacity-50 blur-xl" />

      {/* --- MAIN MENU --- */}
      {!showTutorial && !showNameModal && !showLogModal ? (
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
            <Button onClick={() => setShowNameModal(true)} className="w-full text-xl py-3 mb-5 hover:scale-105 transition-transform">
              👤 Luyện mụt mình
            </Button>
            
            <Button onClick={onMultiplayer} variant="secondary" className="w-full text-xl py-3 animate-bounce shadow-cyan-300/50">
              💑 Với Thanh Lamm
            </Button>

            <Button onClick={() => setShowTutorial(true)} className="w-full flex-1 text-xl py-2 bg-yellow-400 text-white border-b-4 border-yellow-600 hover:bg-yellow-500 active:border-b-0 active:mt-1 active:border-t-4 active:border-transparent transition-all">
                  📝 Bí Kíp Thắng Ảnh
            </Button>
            <Button onClick={onOpenHistory} className="w-full flex-1 text-xl py-2 !bg-green-500 text-white border-b-4 border-green-700 hover:!bg-green-600 active:border-b-0 active:mt-1 active:border-t-4 active:border-transparent transition-all">
                  📜 Lịch Sử Thua Ảnh
            </Button>

            {/* --- NÚT SỔ NAM TÀO --- */}
            <button 
                onClick={() => setShowLogModal(true)}
                className="w-full mt-4 py-2 text-xs font-bold text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
                😜 Xem ai hay lén tập nhá
            </button>

          </div>
        </div>
      ) : null}

      {/* --- CÁC MODAL CON --- */}
      {showNameModal && (
        <NameInputModal 
            onClose={() => setShowNameModal(false)}
            onConfirm={handleConfirmStart}
        />
      )}

      {showLogModal && (
        <LogModal 
            onClose={() => setShowLogModal(false)}
        />
      )}

      {showTutorial && (
        <TutorialModal 
            onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
};