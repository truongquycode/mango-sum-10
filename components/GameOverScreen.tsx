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
  opponentName = "Đối thủ"
}) => {
  const isNewHigh = !isMultiplayer && score > highScore;

  let resultTitle = "HẾT GIỜ!";
  let resultColor = "text-gray-800";
  
  if (isMultiplayer) {
    if (score > opponentScore) {
      resultTitle = "CHIẾN THẮNG!";
      resultColor = "text-green-600";
    } else if (score < opponentScore) {
      resultTitle = "THẤT BẠI";
      resultColor = "text-red-600";
    } else {
      resultTitle = "HÒA NHAU";
      resultColor = "text-yellow-600";
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-cyan-400">
        
        <h2 className={`text-4xl font-black mb-6 ${resultColor} drop-shadow-sm uppercase`}>
          {resultTitle}
        </h2>
        
        <div className="mb-8 space-y-4">
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">{myName}</p>
              <p className="text-4xl font-black text-cyan-600">{score}</p>
            </div>
            {isMultiplayer && (
              <div className="border-l border-gray-200 pl-8">
                <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">{opponentName}</p>
                <p className="text-4xl font-black text-gray-500">{opponentScore}</p>
              </div>
            )}
          </div>
          
          {isNewHigh && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold animate-pulse mt-2">
              🏆 Kỷ Lục Mới!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={onRestart} 
            variant="primary" 
            className="w-full relative"
            disabled={isWaitingForOpponent}
          >
            {isWaitingForOpponent ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                Đợi đối thủ...
              </span>
            ) : (
              "Chơi Lại"
            )}
          </Button>
          
          <Button onClick={onHome} variant="secondary" className="w-full">
            Về Menu Chính
          </Button>
        </div>
      </div>
    </div>
  );
};