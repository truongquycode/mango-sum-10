// components/StartScreen.tsx
import React, { useState, useEffect } from 'react';
import { Button } from './UI/Button';
// --- IMPORT FIREBASE ---
import { db } from '../firebaseConfig'; // Đảm bảo đường dẫn đúng
import { ref, push, onValue, limitToLast, query, orderByKey } from "firebase/database";

interface StartScreenProps {
  onStart: (name?: string) => void; 
  onMultiplayer: () => void;
  onOpenHistory: () => void;
  highScore: number;
}

interface AccessLog {
  name: string;
  timestamp: number;
  action: string;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onMultiplayer, onOpenHistory, highScore }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  
  // --- STATE NHẬP TÊN ---
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  // --- STATE SỔ NAM TÀO (LOG) ---
  const [showLogModal, setShowLogModal] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  // Load tên cũ từ máy (Tên thì vẫn lưu ở máy cá nhân cho tiện)
  useEffect(() => {
    const lastPlayer = localStorage.getItem('last_player_name');
    if (lastPlayer) setPlayerName(lastPlayer);
  }, []);

  // --- LOGIC MỚI: TỰ ĐỘNG NGHE DỮ LIỆU TỪ CLOUD (CẢ 2 BÊN ĐỀU THẤY) ---
  useEffect(() => {
    // Kết nối tới nhánh 'practice_logs' trên database
    const logsRef = query(ref(db, 'practice_logs'), limitToLast(50));

    // Lắng nghe sự thay đổi (Real-time)
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Chuyển đổi object thành array và sắp xếp mới nhất lên đầu
        const loadedLogs: AccessLog[] = Object.values(data);
        loadedLogs.sort((a, b) => b.timestamp - a.timestamp);
        setAccessLogs(loadedLogs);
      } else {
        setAccessLogs([]);
      }
    });

    // Cleanup khi component unmount
    return () => unsubscribe();
  }, []);

  const handleSoloClick = () => {
    setShowNameModal(true);
  };

  const handleConfirmStart = () => {
    if (!playerName.trim()) {
      setError('Hong bé ơi, chưa nhập tên mà đòi chơi à? 😝');
      return;
    }

    // Lưu tên vào máy cá nhân để lần sau đỡ nhập
    localStorage.setItem('last_player_name', playerName);

    // Ghi log LÊN MẠNG (Firebase) thay vì localStorage
    const logEntry: AccessLog = {
      name: playerName,
      timestamp: Date.now(),
      action: 'SOLO_PRACTICE'
    };
    
    // Đẩy dữ liệu lên Cloud
    push(ref(db, 'practice_logs'), logEntry)
      .then(() => {
         // Thành công thì vào game
         onStart(playerName); 
      })
      .catch((err) => {
         console.error("Lỗi ghi log:", err);
         // Lỗi mạng vẫn cho chơi, nhưng không ghi log được
         onStart(playerName);
      });
  };

  const formatLogTime = (ts: number) => {
    return new Date(ts).toLocaleString('vi-VN', { 
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
    });
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
              Thanh Lamm<br/>
              <span className="text-4xl md:text-5xl text-yellow-500 drop-shadow-none">Cộng lại 10 :33</span>
            </h1>
            <p className="text-gray-600 font-medium italic">"Chơi cùng Thanh Lam là vuiiii nhất"</p>
          </div>

          <div className="bg-cyan-100 p-4 rounded-xl border border-cyan-200 transform hover:scale-105 transition-transform duration-300">
            <p className="text-cyan-800 font-bold text-xs uppercase tracking-wider mb-1">Đỉnh cao luyện tập :3 🏆</p>
            <p className="text-4xl font-black text-cyan-600">{highScore.toLocaleString()}</p>
          </div>

          <div className="space-y-3 pt-2">
            <Button onClick={handleSoloClick} className="w-full text-xl py-3 mb-5 hover:scale-105 transition-transform">
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

            

            {/* --- NÚT SỔ NAM TÀO MỚI --- */}
            <button 
                onClick={() => {
                    // Không cần gọi loadLogs() thủ công nữa vì useEffect đã tự làm realtime rồi
                    setShowLogModal(true);
                }}
                className="w-full mt-4 py-2 text-xs font-bold text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
                😜 Xem ai hay lén tập nhá
            </button>

          </div>
        </div>
      ) : null}

      {/* --- POPUP NHẬP TÊN (Giữ nguyên) --- */}
      {showNameModal && (
        <div className="z-50 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-4 border-cyan-400 max-w-sm w-full animate-zoom-in relative">
            <button onClick={() => setShowNameModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 w-8 h-8 flex items-center justify-center font-bold">✕</button>
            <div className="text-center space-y-4 pt-2">
                <div className="text-5xl animate-bounce">🕵️</div>
                <div>
                    <h3 className="text-xl font-black text-cyan-600 uppercase">Ai đang lén luyện tập dợ?</h3>
                    <p className="text-xs text-gray-500 mt-1">Khai tên đi để tui ghi vào sổ đầu bài!</p>
                </div>
                <div className="space-y-2">
                    <input 
                        type="text" value={playerName}
                        onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmStart()}
                        placeholder="Nhập tên của bé..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:outline-none bg-cyan-50 text-center font-bold text-lg text-cyan-800 placeholder-cyan-300"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-xs font-bold animate-shake">{error}</p>}
                </div>
                <Button onClick={handleConfirmStart} className="w-full py-3 mt-2 text-lg shadow-cyan-200">Xong gòi, Vào Hoy! 🚀</Button>
            </div>
        </div>
      )}

      {/* --- POPUP SỔ NAM TÀO (LOG MODAL) --- */}
      {showLogModal && (
        <div className="z-50 bg-white/95 backdrop-blur-md p-0 rounded-3xl shadow-2xl border-4 border-gray-400 max-w-md w-full h-[70vh] flex flex-col animate-zoom-in relative overflow-hidden">
            {/* Header Sổ */}
            <div className="bg-gray-700 p-4 text-center border-b-4 border-gray-800 shrink-0 relative">
                <button 
                    onClick={() => setShowLogModal(false)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white font-bold"
                >✕</button>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                    📓 Sổ Ghi Tội
                </h2>
                <p className="text-gray-400 text-[10px]">Danh sách các thành phần lén lút</p>
            </div>

            {/* List Log */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50">
                {accessLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">👻</span>
                        <p>Sổ sạch trơn, chưa ai dám bén mảng!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {accessLogs.map((log, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:scale-[1.02] transition-transform">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center text-sm border border-cyan-200">
                                        {['🐭','🦊','🐻','🐼','🐨','🐯'][index % 6]}
                                    </span>
                                    <div>
                                        <p className="font-bold text-gray-700 text-sm">{log.name}</p>
                                        <p className="text-[10px] text-gray-400 italic">Đã lén vào tập luyện</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded">
                                        {formatLogTime(log.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
             <div className="p-2 bg-gray-100 text-center text-[10px] text-gray-400">
                *Dữ liệu được trích xuất từ camera chạy bằng cơm
            </div>
        </div>
      )}

      {/* --- TUTORIAL MODAL (Giữ nguyên code cũ) --- */}
      {showTutorial && (
        <div className="z-50 bg-white/95 backdrop-blur-xl p-0 rounded-3xl shadow-2xl border-4 border-cyan-400 max-w-md w-full h-[85vh] flex flex-col animate-fade-in relative overflow-hidden">
          
          {/* Header Fixed */}
          <div className="bg-cyan-500 p-4 text-center border-b-4 border-cyan-600 shadow-sm shrink-0 z-10">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
                😝 Bí kíp thắng ảnh
            </h2>
            <p className="text-cyan-50 text-xs font-medium">Đọc kỹ để cho ảnh "hít khói" nhaaa</p>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-5 space-y-5 custom-scrollbar flex-1 pb-20">
            {/* ... (Nội dung hướng dẫn giữ nguyên như cũ) ... */}
            
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
                 <div className="bg-white p-2 rounded-xl border border-red-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">💣</span>
                    <span className="text-xs font-bold text-red-600">Bom Nổ</span>
                    <span className="text-[10px] text-gray-500 leading-tight">-10s của ảnh (cho chừa)</span>
                 </div>
                 <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">🌈</span>
                    <span className="text-xs font-bold text-purple-600">Thánh Rùa</span>
                    <span className="text-[10px] text-gray-500 leading-tight">chọn bừa cũng đúng nhưng 2x2 thui nhá</span>
                 </div>
                 <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">❄️</span>
                    <span className="text-xs font-bold text-blue-500">Đóng Băng</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Ngưng thời gian (để thở 5s)</span>
                 </div>
                 <div className="bg-white p-2 rounded-xl border border-yellow-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">⏩</span>
                    <span className="text-xs font-bold text-yellow-600">Tua Nhanh</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Giờ của ảnh chạy như chó đuổi (1.5x)</span>
                 </div>
                 <div className="bg-white p-2 rounded-xl border border-pink-100 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">😈</span>
                    <span className="text-xs font-bold text-pink-600">Cướp Điểm</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Của anh là của em (hí hí)</span>
                 </div>
                 <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <span className="text-3xl mb-1">📉</span>
                    <span className="text-xs font-bold text-gray-600">Giảm Điểm</span>
                    <span className="text-[10px] text-gray-500 leading-tight">Tụt tụt (ảnh chỉ nhận 50% điểm)</span>
                 </div>
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

            <div className="text-center pt-2 pb-6 opacity-60">
                <p className="text-xs font-mono">"Thắng thua hong quan trọng, quan trọng là em phải thực hiện giao kèo của anh"</p>
            </div>
          </div>

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