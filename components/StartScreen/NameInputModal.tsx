import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';

interface NameInputModalProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export const NameInputModal: React.FC<NameInputModalProps> = ({ onClose, onConfirm }) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  // Load tên cũ từ máy
  useEffect(() => {
    const lastPlayer = localStorage.getItem('last_player_name');
    if (lastPlayer) setPlayerName(lastPlayer);
  }, []);

  const handleSubmit = () => {
    if (!playerName.trim()) {
      setError('Hong bé ơi, chưa nhập tên mà đòi chơi à? 😝');
      return;
    }
    // Logic lưu tên và xử lý tiếp theo
    localStorage.setItem('last_player_name', playerName);
    onConfirm(playerName);
  };

  return (
    <div className="z-50 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-4 border-cyan-400 max-w-sm w-full animate-zoom-in relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 w-8 h-8 flex items-center justify-center font-bold">✕</button>
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Nhập tên của bé..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:outline-none bg-cyan-50 text-center font-bold text-lg text-cyan-800 placeholder-cyan-300"
                    autoFocus
                />
                {error && <p className="text-red-500 text-xs font-bold animate-shake">{error}</p>}
            </div>
            <Button onClick={handleSubmit} className="w-full py-3 mt-2 text-lg shadow-cyan-200">Xong gòi, Vào Hoy! 🚀</Button>
        </div>
    </div>
  );
};