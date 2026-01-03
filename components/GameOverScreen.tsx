// components/GameOverScreen.tsx
import React from 'react';
import { Button } from './UI/Button';

interface GameOverScreenProps {
  score: number;
  opponentScore?: number;
  highScore: number;
  onRestart: () => void;
  onHome: () => void;
  isMultiplayer?: boolean;
  isWaitingForOpponent?: boolean;
  myName?: string;
  opponentName?: string;
  duration?: number;
  itemsUsedCount?: number; 
  myAvatar?: string | { type: string, value: string };
  opponentAvatar?: string | { type: string, value: string };
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  opponentScore = 0,
  highScore, 
  onRestart, 
  onHome,
  isMultiplayer,
  isWaitingForOpponent,
  myName = "Bạn",
  opponentName = "Đối thủ",
  duration = 0,
  itemsUsedCount = 0,
  myAvatar,
  opponentAvatar
}) => {
  const isWin = score > opponentScore;
  const isDraw = score === opponentScore;
  const isNewHigh = !isMultiplayer && score > highScore;

  const renderAvatar = (avatar: any) => {
    // 1. Nếu là ảnh (Object type image)
    if (avatar && typeof avatar === 'object' && avatar.type === 'image') {
        return (
          <img 
            src={avatar.value} 
            alt="avatar" 
            className="w-full h-full object-cover" 
          />
        );
    }
    // 2. Nếu là Text/Icon
    const displayValue = (avatar && typeof avatar === 'object') ? avatar.value : (avatar || "👤");
    return <span>{displayValue}</span>;
  };

  let statusConfig = {
    title: "HẾT GIỜ GÒIII",
    message: "Cố gắng hơn nháaa cục dàng",
    icon: "⏰",
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-200"
  };

  if (isMultiplayer) {
    if (isWin) {
      statusConfig = {
        title: "XUẤT SẮC QUÁ ĐIII",
        message: "Chiến thắng quá thuyết phục 😝",
        icon: "🏆",
        color: "text-yellow-500",
        bg: "bg-yellow-50 border-yellow-200"
      };
    } else if (isDraw) {
      statusConfig = {
        title: "HÒA NHAU NÀAA",
        message: "Anh tám lạng, em lạng anh hí hí",
        icon: "😑",
        color: "text-purple-500",
        bg: "bg-purple-50 border-purple-200"
      };
    } else {
      statusConfig = {
        title: "TIẾC QUÁ ĐI THUIII",
        message: "Thua một xíu hoii, chơi lại chơi lại",
        icon: "🥺",
        color: "text-red-500",
        bg: "bg-red-50 border-red-200"
      };
    }
  } else {
    // Chế độ Solo
    if (isNewHigh) {
      statusConfig = {
        title: "KỶ LỤC MỚI LUNN",
        message: `${myName} đã vượt qua chính mình hihohiho`,
        icon: "👑",
        color: "text-yellow-500",
        bg: "bg-yellow-50 border-yellow-200"
      };
    } else {
      statusConfig = {
        title: "HOÀN THÀNH LUYỆN TẬP GÒI",
        message: `Chỉ còn thiếu ${Math.max(0, highScore - score)} điểm nữa thuii`,
        icon: "✨",
        color: "text-cyan-600",
        bg: "bg-cyan-50 border-cyan-200"
      };
    }
  }

  // Format thời gian (giây -> mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Background mờ đục cute */}
      <div className="absolute inset-0 bg-cyan-900/40 backdrop-blur-lg animate-fade-in"></div>
      
      {/* Main Card */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm border-[6px] border-white animate-zoom-in overflow-hidden">
        
        {/* Header Decor */}
        <div className={`absolute top-0 inset-x-0 h-32 ${statusConfig.bg} opacity-50 -z-10 rounded-t-[2rem]`}></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-100 rounded-full opacity-50 blur-3xl"></div>

        <div className="p-6 flex flex-col items-center text-center">
          
          {/* ICON CẢM XÚC */}
          <div className="text-7xl mb-2 drop-shadow-md animate-bounce transform origin-bottom hover:scale-110 transition-transform cursor-pointer">
            {statusConfig.icon}
          </div>

          {/* TIÊU ĐỀ KẾT QUẢ */}
          <h2 className={`text-3xl font-black mb-1 uppercase tracking-tight ${statusConfig.color}`}>
            {statusConfig.title}
          </h2>
          <p className="text-gray-500 text-sm font-medium mb-6 px-4">
            {statusConfig.message}
          </p>

          {/* --- BẢNG TỈ SỐ (VS) --- */}
          <div className="w-full bg-gray-50 rounded-3xl p-4 mb-6 border-2 border-gray-100 shadow-inner flex items-center justify-between relative">
             {/* Người chơi */}
             <div className="flex flex-col items-center w-1/3 z-10">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-cyan-200 shadow-sm flex items-center justify-center text-2xl mb-1 overflow-hidden">
                  {renderAvatar(myAvatar)}
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-full">{myName}</span>
                <span className="text-2xl font-black text-cyan-600">{score}</span>
             </div>

             {/* VS Badge */}
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full border-4 border-gray-100 flex items-center justify-center shadow-sm z-0">
                <span className="text-[10px] font-black text-gray-300 italic">VS</span>
             </div>

             {/* Đối thủ / Highscore */}
             <div className="flex flex-col items-center w-1/3 z-10">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-200 shadow-sm flex items-center justify-center text-2xl mb-1 overflow-hidden">
                  {isMultiplayer ? renderAvatar(opponentAvatar) : '🏆'}
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-full">
                  {isMultiplayer ? opponentName : "Kỷ Lục"}
                </span>
                <span className={`text-2xl font-black ${isMultiplayer && score < opponentScore ? 'text-orange-500' : 'text-gray-500'}`}>
                  {isMultiplayer ? opponentScore : highScore}
                </span>
             </div>
          </div>

          {/* --- THỐNG KÊ PHỤ (Duration & Items) --- */}
          {duration > 0 && (
            <div className="grid grid-cols-2 gap-3 w-full mb-6">
               <div className="bg-blue-50 rounded-2xl p-2 flex flex-col items-center border border-blue-100">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Thời gian</span>
                  <span className="text-lg font-black text-blue-600">{formatTime(duration)}</span>
               </div>
               <div className="bg-purple-50 rounded-2xl p-2 flex flex-col items-center border border-purple-100">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">Dùng đồ</span>
                  <span className="text-lg font-black text-purple-600">{itemsUsedCount || 0} <span className="text-xs font-normal">lần</span></span>
               </div>
            </div>
          )}

          {/* --- BUTTONS ACTION --- */}
          <div className="flex flex-col w-full gap-3">
            <Button 
              onClick={onRestart} 
              className={`w-full py-4 text-lg rounded-2xl shadow-lg shadow-cyan-200/50 border-b-4 border-cyan-600 active:border-b-0 active:mt-1 ${isWaitingForOpponent ? 'opacity-80 cursor-wait' : ''}`}
              disabled={isWaitingForOpponent}
              variant="secondary" 
            >
              {isWaitingForOpponent ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span>Đợi đối thủ xíu...</span>
                </div>
              ) : (
                "Chơi Lại Nha"
              )}
              
            </Button>
            
            <Button 
              onClick={onHome} 
              className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 hover:text-cyan-600 hover:border-cyan-200 bg-white hover:bg-cyan-50"
            >
              Về Menu Chính
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};