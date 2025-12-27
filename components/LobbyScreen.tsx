// components/LobbyScreen.tsx
import React, { useState } from 'react';
import { Button } from './UI/Button';

interface LobbyScreenProps {
  displayId: string | null;
  onJoin: (hostId: string) => void;
  onBack: () => void;
  isConnecting: boolean;
  myName: string;
  setMyName: (name: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ displayId, onJoin, onBack, isConnecting, myName, setMyName }) => {
  const [remoteCode, setRemoteCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Nếu chưa có tên thì ở bước NAME, có rồi thì vào LOBBY
  const [step, setStep] = useState<'NAME' | 'LOBBY'>(myName && myName !== "Bạn" ? 'LOBBY' : 'NAME');

  const handleCopy = () => {
    if (displayId) {
      navigator.clipboard.writeText(displayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmName = () => {
    if (myName.trim()) {
      setStep('LOBBY');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-cyan-50 relative overflow-hidden">
       {/* Background Decor */}
       <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-cyan-200 rounded-full opacity-30 blur-2xl" />
       <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-200 rounded-full opacity-30 blur-2xl" />

      <div className="z-10 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border-4 border-cyan-200 max-w-md w-full space-y-6">
        
        {/* --- BƯỚC 1: NHẬP TÊN --- */}
        {step === 'NAME' && (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-black text-cyan-600 mb-2">Nhập Tên</h2>
              <p className="text-gray-500 text-sm">Hãy chọn một cái tên thật ngầu!</p>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Tên của bạn..." 
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:outline-none text-center font-bold text-gray-700 text-xl"
                maxLength={10}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmName()}
              />
              
              <Button onClick={handleConfirmName} disabled={!myName.trim()} className="w-full">
                Tiếp Tục
              </Button>
              
              <Button onClick={onBack} variant="secondary" className="w-full">
                Quay Lại
              </Button>
            </div>
          </>
        )}

        {/* --- BƯỚC 2: SẢNH CHỜ --- */}
        {step === 'LOBBY' && (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-black text-cyan-600 mb-1">Phòng Chơi</h2>
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <span>Xin chào, <b className="text-cyan-600">{myName}</b></span>
                <button 
                  onClick={() => setStep('NAME')} 
                  className="text-xs underline hover:text-cyan-500 bg-gray-100 px-2 py-0.5 rounded"
                >
                  Sửa tên
                </button>
              </div>
            </div>

            {/* Mã Phòng */}
            <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200 text-center">
              <p className="text-xs font-bold text-cyan-500 uppercase tracking-wide mb-2">Mã Phòng Của Bạn</p>
              {displayId ? (
                <div 
                  onClick={handleCopy}
                  className="font-mono text-4xl font-black text-gray-800 bg-white py-4 px-4 rounded-lg border border-dashed border-cyan-300 cursor-pointer hover:bg-cyan-50 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  {displayId}
                  <span className="text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-500 font-sans font-normal">
                    {copied ? 'Đã chép' : 'Chép'}
                  </span>
                </div>
              ) : (
                <div className="animate-pulse text-gray-400 font-mono">Đang tạo mã...</div>
              )}
              <p className="text-[10px] text-gray-400 mt-2">Gửi 4 số này cho bạn bè để chơi cùng.</p>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-bold">Hoặc</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Nhập mã bạn bè */}
            <div className="space-y-3">
              <input 
                type="number" 
                placeholder="Nhập mã 4 số của bạn" 
                value={remoteCode}
                onChange={(e) => setRemoteCode(e.target.value.slice(0,4))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-cyan-400 focus:outline-none font-mono text-center text-xl placeholder:text-base placeholder:font-sans transition-colors"
              />
              <Button 
                onClick={() => onJoin(remoteCode)} 
                disabled={remoteCode.length < 4 || isConnecting}
                className="w-full"
              >
                {isConnecting ? 'Đang kết nối...' : 'Vào Phòng Ngay'}
              </Button>
            </div>

            <Button onClick={onBack} variant="secondary" className="w-full mt-4">
              Quay Lại
            </Button>
          </>
        )}
      </div>
    </div>
  );
};