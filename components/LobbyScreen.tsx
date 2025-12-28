// components/LobbyScreen.tsx
import React, { useState, useRef, useEffect } from 'react'; 
import { Button } from './UI/Button';
import { AVATARS } from '../constants';

interface LobbyScreenProps {
  displayId: string | null;
  onJoin: (hostId: string) => void;
  onBack: () => void;
  isConnecting: boolean;
  myName: string;
  setMyName: (name: string) => void;
  myAvatar: string;
  setMyAvatar: (avatar: string) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ 
  displayId, onJoin, onBack, isConnecting, 
  myName, setMyName, myAvatar, setMyAvatar 
}) => {
  const [remoteCode, setRemoteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'NAME' | 'LOBBY'>(myName && myName !== "Bạn" ? 'LOBBY' : 'NAME');

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
        if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const playSelectSound = () => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  };

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
       <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-cyan-200 rounded-full opacity-30 blur-2xl" />
       <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-200 rounded-full opacity-30 blur-2xl" />

      <div className="z-10 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border-4 border-cyan-200 max-w-md w-full space-y-6 max-h-[90vh] overflow-y-auto">
        
        {step === 'NAME' && (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-black text-cyan-600 mb-1">Hồ Sơ</h2>
              <p className="text-gray-500 text-sm">Chọn avatar và nhập tên</p>
            </div>
            
            <div className="grid grid-cols-5 gap-2 p-2 bg-gray-100 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                {AVATARS.map((av) => (
                    <button 
                        key={av}
                        onClick={() => {
                            setMyAvatar(av);
                            playSelectSound(); 
                        }}
                        className={`text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-all ${myAvatar === av ? 'bg-cyan-500 shadow-lg scale-110 border-2 border-white' : 'bg-white hover:bg-gray-200'}`}
                    >
                        {av}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center">
                  <div className="text-6xl mb-2 animate-bounce">{myAvatar}</div>
                  <input 
                    type="text" 
                    placeholder="Tên của em..." 
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:outline-none text-center font-bold text-gray-700 text-xl"
                    maxLength={12} // Tăng lên 12 ký tự (hoặc 15 nếu bạn muốn dài hơn nữa)
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmName()}
                  />
              </div>
              
              <Button onClick={handleConfirmName} disabled={!myName.trim()} variant="secondary" className="w-full">
                Tiếp Tục
              </Button>
              
              <Button onClick={onBack}  className="w-full">
                Quay Lại
              </Button>
            </div>
          </>
        )}

        {step === 'LOBBY' && (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-black text-cyan-600 mb-1">Phòng Chơi</h2>
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm bg-gray-100 py-1 px-3 rounded-full mx-auto w-fit">
                <span className="text-2xl">{myAvatar}</span>
                <span className="font-bold text-gray-700">{myName}</span>
                <button 
                  onClick={() => setStep('NAME')} 
                  className="ml-2 text-xs text-cyan-600 underline hover:text-cyan-800"
                >
                  Sửa
                </button>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200 text-center">
              <p className="text-xs font-bold text-cyan-500 uppercase tracking-wide mb-2">Mã Phòng Của Em</p>
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
              <p className="text-[10px] text-gray-400 mt-2">Gửi 4 số này cho ảnh/ẻm để chơi cùng.</p>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-bold">Hoặc</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="space-y-3">
              <input 
                type="number" 
                placeholder="Nhập mã 4 số của ảnh/ẻm..." 
                value={remoteCode}
                onChange={(e) => setRemoteCode(e.target.value.slice(0,4))}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-cyan-400 focus:outline-none font-mono text-center text-xl placeholder:text-base placeholder:font-sans transition-colors"
              />
              <Button 
                onClick={() => onJoin(remoteCode)} 
                disabled={remoteCode.length < 4 || isConnecting}
                className="w-full"
                variant="secondary"
              >
                {isConnecting ? 'Đang kết nối...' : 'Vào Phòng Ngay'}
              </Button>
            </div>

            <Button onClick={onBack} className="w-full mt-4">
              Quay Lại
            </Button>
          </>
        )}
      </div>
    </div>
  );
};