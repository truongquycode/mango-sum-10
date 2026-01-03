// components/StartScreen/LogModal.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { ref, onValue, limitToLast, query } from "firebase/database";
import { AccessLog } from './types';

interface LogModalProps {
  onClose: () => void;
}

export const LogModal: React.FC<LogModalProps> = ({ onClose }) => {
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  // --- TỰ ĐỘNG NGHE DỮ LIỆU TỪ CLOUD ---
  useEffect(() => {
    const logsRef = query(ref(db, 'practice_logs'), limitToLast(50));
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedLogs: AccessLog[] = Object.values(data);
        loadedLogs.sort((a, b) => b.timestamp - a.timestamp);
        setAccessLogs(loadedLogs);
      } else {
        setAccessLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // [CẬP NHẬT] Thêm hiển thị Năm (year: 'numeric')
  const formatLogTime = (ts: number) => {
    return new Date(ts).toLocaleString('vi-VN', { 
        hour: '2-digit', minute: '2-digit', 
        day: '2-digit', month: '2-digit', year: 'numeric' 
    });
  };

  return (
    <div className="z-50 bg-white/95 backdrop-blur-md p-0 rounded-3xl shadow-2xl border-4 border-gray-400 max-w-md w-full h-[70vh] flex flex-col animate-zoom-in relative overflow-hidden">
        {/* Header Sổ */}
        <div className="bg-gray-700 p-4 text-center border-b-4 border-gray-800 shrink-0 relative">
            <button 
                onClick={onClose}
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
                                {/* Avatar Random */}
                                <span className="w-9 h-9 bg-cyan-100 rounded-full flex items-center justify-center text-base border border-cyan-200 shrink-0">
                                    {['🐭','🦊','🐻','🐼','🐨','🐯'][index % 6]}
                                </span>
                                
                                {/* Thông tin & Điểm */}
                                <div className="flex flex-col items-start">
                                    <p className="font-bold text-gray-700 text-sm">{log.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-gray-400 italic">Đã lén vào tập</p>
                                        
                                        {/* [CẬP NHẬT] Hiển thị điểm số */}
                                        {log.score !== undefined && log.score > 0 && (
                                            <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                                                🏆 {log.score}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Thời gian */}
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded">
                                    {formatLogTime(log.timestamp).split(' ')[1]} {/* Ngày tháng năm */}
                                </span>
                                <span className="text-[9px] text-gray-400 mt-0.5">
                                    {formatLogTime(log.timestamp).split(' ')[0]} {/* Giờ phút */}
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
  );
};