// components/HistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { Button } from './UI/Button';
import { MatchRecord, ItemType } from '../types';
import { ITEM_CONFIG } from '../constants';

interface HistoryScreenProps {
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<MatchRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mango-match-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sắp xếp mới nhất lên đầu
        setHistory(parsed.sort((a: MatchRecord, b: MatchRecord) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Lỗi đọc lịch sử", e);
      }
    }
  }, []);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getResult = (record: MatchRecord) => {
    if (record.mode === 'SOLO') return { text: 'CHƠI ĐƠN', color: 'text-gray-500', bg: 'bg-gray-100' };
    
    // Nếu chơi đôi mà không có điểm đối thủ (lỗi mạng, thoát giữa chừng)
    if (record.opponentScore === undefined) return { text: '???', color: 'text-gray-500', bg: 'bg-gray-100' };
    
    if (record.myScore > record.opponentScore) return { text: 'THẮNG', color: 'text-green-600', bg: 'bg-green-100' };
    if (record.myScore < record.opponentScore) return { text: 'THUA', color: 'text-red-600', bg: 'bg-red-100' };
    return { text: 'HÒA', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  };

  return (
    <div className="flex flex-col items-center h-full w-full p-4 bg-cyan-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-50 blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-300 rounded-full opacity-50 blur-xl" />

      <div className="z-10 w-full max-w-lg h-full flex flex-col">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-4 border-cyan-200 flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b-2 border-gray-100 flex items-center justify-between bg-white shrink-0">
            <h2 className="text-2xl font-black text-cyan-600 uppercase">Lịch Sử Đấu 📜</h2>
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-2">📭</span>
                <p>Chưa có trận nào...</p>
              </div>
            ) : (
              history.map((match) => {
                const result = getResult(match);
                const hasItems = match.itemsUsed && Object.keys(match.itemsUsed).length > 0;

                return (
                  <div key={match.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-3 hover:border-cyan-200 transition-colors">
                    {/* Top Row: Date & Result */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-gray-400 font-mono">{formatDate(match.timestamp)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${result.bg} ${result.color}`}>
                        {result.text}
                      </span>
                    </div>

                    {/* Score Row */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 mb-2">
                      <div className="flex flex-col items-start w-1/3">
                        <span className="text-[10px] font-bold text-gray-500 truncate w-full">{match.myName}</span>
                        <span className="text-xl font-black text-cyan-600">{match.myScore}</span>
                      </div>
                      <div className="text-gray-300 font-black text-xl italic">VS</div>
                      <div className="flex flex-col items-end w-1/3">
                        <span className="text-[10px] font-bold text-gray-500 truncate w-full text-right">{match.opponentName || '---'}</span>
                        <span className="text-xl font-black text-gray-600">{match.opponentScore ?? '-'}</span>
                      </div>
                    </div>

                    {/* Items Stats */}
                    {hasItems && (
                      <div className="border-t border-gray-100 pt-2 mt-1">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Bảo bối đã dùng:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(match.itemsUsed).map(([type, count]) => (
                            <div key={type} className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200" title={ITEM_CONFIG[type as ItemType]?.name}>
                              <span className="text-xs">{ITEM_CONFIG[type as ItemType]?.icon}</span>
                              <span className="text-[10px] font-bold text-gray-600">x{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
             <Button onClick={onBack} className="w-full py-3" variant="secondary">Quay Lại</Button>
          </div>
        </div>
      </div>
    </div>
  );
};