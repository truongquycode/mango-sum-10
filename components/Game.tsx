// components/Game.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataConnection } from 'peerjs';
import { GRID_ROWS, GRID_COLS, TARGET_SUM, GAME_DURATION_SECONDS, BASE_SCORE } from '../constants';
import { Position, MangoCell, DragState, MultiPlayerMessage } from '../types';
import { MangoIcon } from './MangoIcon';

interface GameProps {
  onGameOver: (score: number) => void;
  isMultiplayer?: boolean;
  isHost?: boolean;
  connection?: DataConnection | null;
  myName?: string;
  opponentName?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- ÂM THANH BASE64 ---
const CORRECT_SFX = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840OTiOAf840OTiOAflGKZX0/gHRASI/W+D7K7s8v8wD9/D3/L/d/764f9/gH3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840OTiOAf840OTiOAflGKZX0/gHRASI/W+D7K7s8v8wD9/D3/L/d/764f9/gH3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840OTiOAf840OTiOAflGKZX0/gHRASI/W+D7K7s8v8wD9/D3/L/d/764f9/gH3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9";

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const generateSolvableValues = (totalCells: number): number[] => {
  const values: number[] = [];
  while (values.length < totalCells) {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = TARGET_SUM - num1;
    values.push(num1);
    values.push(num2);
  }
  return shuffleArray(values);
};

const createInitialGrid = (): MangoCell[][] => {
  const grid: MangoCell[][] = [];
  const totalCells = GRID_ROWS * GRID_COLS;
  const solvableValues = generateSolvableValues(totalCells);
  let valueIndex = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: MangoCell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        id: generateId(),
        value: solvableValues[valueIndex],
        isRemoved: false,
      });
      valueIndex++;
    }
    grid.push(row);
  }
  return grid;
};

export const Game: React.FC<GameProps> = ({ 
  onGameOver, 
  isMultiplayer = false, 
  isHost = true, 
  connection,
  myName = "Bạn",
  opponentName = "Đối thủ"
}) => {
  // Client (người join) ban đầu sẽ có grid rỗng, chờ Host gửi map sang
  const [grid, setGrid] = useState<MangoCell[][]>(isHost ? createInitialGrid() : []);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [opponentTimeLeft, setOpponentTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [errorCellIds, setErrorCellIds] = useState<Set<string>>(new Set());
  
  const [isMuted, setIsMuted] = useState(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, startPos: null, currentPos: null,
  });
  const gridRef = useRef<HTMLDivElement>(null);

  // --- HỆ THỐNG ÂM THANH ---
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const audio = new Audio('/assets/bgm.mp3'); 
    audio.loop = true;
    audio.volume = 0.3; 
    bgmRef.current = audio;

    const forcePlayMusic = () => {
      if (bgmRef.current && !isMuted && bgmRef.current.paused) {
        bgmRef.current.play()
          .then(() => {
            document.removeEventListener('click', forcePlayMusic);
            document.removeEventListener('touchstart', forcePlayMusic);
          })
          .catch(e => console.error("Chờ tương tác...", e));
      }
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    if (!isMuted) {
      const playPromise = bgmRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          document.addEventListener('click', forcePlayMusic);
          document.addEventListener('touchstart', forcePlayMusic);
        });
      }
    }

    return () => {
      bgmRef.current?.pause();
      if (audioContextRef.current) audioContextRef.current.close();
      document.removeEventListener('click', forcePlayMusic);
      document.removeEventListener('touchstart', forcePlayMusic);
    };
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      if (isMuted) bgmRef.current.pause();
      else bgmRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  const playSynthSound = useCallback((type: 'correct' | 'wrong') => {
    if (isMuted || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  }, [isMuted]);

  // --- LOGIC GAME & MULTIPLAYER ---
  
  // Xử lý đếm ngược chuỗi thắng
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (streak > 0) { timer = setTimeout(() => { setStreak(0); }, 5000); }
    return () => clearTimeout(timer);
  }, [streak]);

  // 1. Gửi Map ban đầu (Chỉ Host làm việc này 1 lần)
  useEffect(() => {
    if (isMultiplayer && isHost && connection && grid.length > 0) {
      connection.send({ 
        type: 'GRID_UPDATE', 
        payload: { 
          grid, // Gửi Map ban đầu
          score, 
          opponentScore: score, 
          opponentName: myName 
        } 
      } as MultiPlayerMessage);
    }
  }, []);

  // 2. Lắng nghe dữ liệu từ đối thủ
  useEffect(() => {
    if (!isMultiplayer || !connection) return;
    
    const handleData = (data: any) => {
      const msg = data as MultiPlayerMessage;
      
      if (msg.type === 'GRID_UPDATE') {
        // QUAN TRỌNG: Chỉ cập nhật Grid nếu mình chưa có Grid (lần đầu vào)
        // Điều này ngăn việc reset map khi đối thủ chơi
        if (msg.payload.grid && grid.length === 0) {
          setGrid(msg.payload.grid);
        }
        
        // Luôn cập nhật điểm số
        if (msg.payload.score !== undefined) {
          setOpponentScore(msg.payload.score);
        }
      } else if (msg.type === 'TIME_UPDATE') {
        setOpponentTimeLeft(msg.payload);
      }
    };
    
    connection.on('data', handleData);
    return () => { connection.off('data', handleData); };
  }, [isMultiplayer, connection, grid.length]); // Thêm grid.length vào dependency

  useEffect(() => {
    if (timeLeft <= 0) { onGameOver(score); return; }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (isMultiplayer && connection) connection.send({ type: 'TIME_UPDATE', payload: newTime } as MultiPlayerMessage);
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onGameOver, score, isMultiplayer, connection]);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    if (gridRef.current) gridRef.current.addEventListener('touchmove', preventDefault, { passive: false });
    return () => { if (gridRef.current) gridRef.current.removeEventListener('touchmove', preventDefault); };
  }, []);

  const getCellFromCoords = useCallback((clientX: number, clientY: number, clampToEdge: boolean = false): Position | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const isOutside = clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
    if (isOutside && !clampToEdge) return null;
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = rect.height / GRID_ROWS;
    return { 
      row: Math.max(0, Math.min(Math.floor((clientY - rect.top) / cellHeight), GRID_ROWS - 1)),
      col: Math.max(0, Math.min(Math.floor((clientX - rect.left) / cellWidth), GRID_COLS - 1))
    };
  }, []);

  const isCellSelected = useCallback((r: number, c: number) => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) return false;
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);
    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  }, [dragState]);

  const handleStart = (clientX: number, clientY: number) => {
    if (isProcessing) return; 
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    const pos = getCellFromCoords(clientX, clientY, true); 
    if (pos && !grid[pos.row][pos.col].isRemoved) setDragState({ isDragging: true, startPos: pos, currentPos: pos });
  };
  
  const handleMove = (clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;
    const pos = getCellFromCoords(clientX, clientY, true);
    if (pos) setDragState((prev) => ({ ...prev, currentPos: pos }));
  };

  const handleEnd = () => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) { setDragState({ isDragging: false, startPos: null, currentPos: null }); return; }
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);
    let currentSum = 0; const selectedCells: Position[] = []; const idsToCheck: string[] = [];
    for (let r = minRow; r <= maxRow; r++) { for (let c = minCol; c <= maxCol; c++) { if (!grid[r][c].isRemoved) { currentSum += grid[r][c].value; selectedCells.push({ row: r, col: c }); idsToCheck.push(grid[r][c].id); } } }
    
    if (currentSum === TARGET_SUM) {
      processMatch(selectedCells);
    } else if (selectedCells.length > 0) {
      playSynthSound('wrong'); 
      setTimeLeft(prev => Math.max(0, prev - 10)); 
      setStreak(0);
      const newErrorSet = new Set(idsToCheck);
      setErrorCellIds(newErrorSet);
      setTimeout(() => { setErrorCellIds(new Set()); }, 400);
    }
    setDragState({ isDragging: false, startPos: null, currentPos: null });
  };

  const processMatch = (cellsToRemove: Position[]) => {
    setIsProcessing(true);
    playSynthSound('correct'); 
    
    const newStreak = streak + 1;
    setStreak(newStreak);
    const basePoints = cellsToRemove.length * BASE_SCORE + (cellsToRemove.length > 2 ? cellsToRemove.length * 5 : 0);
    const streakBonus = newStreak * 10;
    const newScore = score + basePoints + streakBonus;
    setScore(newScore);
    setTimeLeft(prev => prev + 1);
    
    // Cập nhật Grid cục bộ
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    cellsToRemove.forEach(pos => { newGrid[pos.row][pos.col].isRemoved = true; });
    setGrid(newGrid);
    
    // SỬA LỖI: Chỉ gửi ĐIỂM SỐ cho đối thủ, KHÔNG gửi Grid
    // Điều này ngăn chặn việc reset map của đối thủ
    if (isMultiplayer && connection) {
      connection.send({ 
        type: 'GRID_UPDATE', 
        payload: { 
          // Không gửi 'grid' ở đây nữa để tránh ghi đè map của đối thủ
          score: newScore, 
          opponentName: myName 
        } 
      } as MultiPlayerMessage);
    }
    
    setTimeout(() => setIsProcessing(false), 150);
  };

  const currentSum = (() => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) return 0;
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);
    let sum = 0; for (let r = minRow; r <= maxRow; r++) { for (let c = minCol; c <= maxCol; c++) { if (!grid[r][c].isRemoved) sum += grid[r][c].value; } }
    return sum;
  })();
  const isValidSum = currentSum === TARGET_SUM;

  if (grid.length === 0) return <div className="flex items-center justify-center h-full text-white font-bold animate-pulse text-xl">Đang đợi chủ phòng...</div>;

  return (
    <div className="h-full w-full flex flex-col bg-[#06b6d4] select-none touch-none overflow-hidden">
      
      {/* HUD */}
      <div className="shrink-0 p-2 sm:p-4 w-full max-w-2xl mx-auto z-20">
        <div className="bg-[#e0f7fa] rounded-2xl border-4 border-[#00838f] shadow-md p-2 flex justify-between items-center relative">
           <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 overflow-hidden rounded-b-xl">
             <div className={`h-full transition-all duration-1000 linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#00bcd4]'}`} style={{ width: `${Math.min((timeLeft / GAME_DURATION_SECONDS) * 100, 100)}%` }} />
           </div>

           <div className="flex items-center gap-4 w-full justify-between px-2 pb-2">
             
             {/* BÊN MÌNH (YOU) */}
             <div className="flex flex-col relative w-24 sm:w-32 truncate">
               <div className="flex items-center relative">
                 <span className="text-xs font-bold text-[#00838f] uppercase truncate">{myName}</span>
                 
                 {/* Streak Icon (Absolute) */}
                 <div className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 transition-all duration-300 ${streak > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                   <div className="relative group whitespace-nowrap">
                     <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-bounce inline-block shadow-sm">
                       🔥 {streak}
                     </span>
                     {streak > 0 && (
                        <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gray-200 rounded-full overflow-hidden">
                          <div key={streak} className="h-full bg-orange-500" style={{ width: '100%', animation: 'streak-countdown 5s linear forwards' }} />
                        </div>
                     )}
                   </div>
                 </div>
               </div>
               
               <span className="text-2xl font-black text-[#006064] leading-none">{score}</span>
             </div>

             {/* ĐỐI THỦ (OPPONENT) */}
             {isMultiplayer && (
               <div className="flex flex-col items-end border-l pl-4 border-gray-200 w-24 sm:w-32 truncate">
                  <span className="text-xs font-bold text-gray-500 uppercase truncate">{opponentName}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-600 leading-none">{opponentScore}</span>
                    <span className={`text-xs font-mono ${opponentTimeLeft < 10 ? 'text-red-500' : 'text-gray-400'}`}>{opponentTimeLeft}s</span>
                  </div>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Grid Game */}
      <div className="flex-1 flex items-center justify-center p-2 w-full overflow-hidden relative">
        <div 
          className="relative z-10"
          style={{ aspectRatio: `${GRID_COLS}/${GRID_ROWS}`, height: '100%', width: '100%', maxHeight: '100%', maxWidth: '100%' }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          <div ref={gridRef} className="w-full h-full" style={{ display: 'grid', gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: '2px' }}>
            {dragState.isDragging && dragState.startPos && dragState.currentPos && (
              <div className={`absolute pointer-events-none border-4 rounded-xl z-50 transition-colors shadow-lg ${isValidSum ? 'border-red-500 bg-red-500/10' : 'border-cyan-200 bg-cyan-100/30'}`}
                style={{
                  left: `${Math.min(dragState.startPos.col, dragState.currentPos.col) * (100 / GRID_COLS)}%`,
                  top: `${Math.min(dragState.startPos.row, dragState.currentPos.row) * (100 / GRID_ROWS)}%`,
                  width: `${(Math.abs(dragState.currentPos.col - dragState.startPos.col) + 1) * (100 / GRID_COLS)}%`,
                  height: `${(Math.abs(dragState.currentPos.row - dragState.startPos.row) + 1) * (100 / GRID_ROWS)}%`,
                }}
              />
            )}
            
            {grid.map((row, r) => row.map((cell, c) => (
                <div key={`${r}-${c}-${cell.id}`} className="w-full h-full relative">
                  <MangoIcon 
                    value={cell.value} 
                    isSelected={isCellSelected(r, c)} 
                    isRemoved={cell.isRemoved}
                    isError={errorCellIds.has(cell.id)} 
                  />
                </div>
            )))}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="shrink-0 h-14 flex items-center justify-between px-6 pb-2 w-full max-w-lg mx-auto">
         {!isMultiplayer ? (
           <button onClick={() => window.location.reload()} className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider backdrop-blur-sm transition-all active:scale-95">Chơi Lại</button>
         ) : <div/>}

         <button 
           onClick={() => setIsMuted(!isMuted)}
           className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${isMuted ? 'bg-red-500/80 text-white' : 'bg-white/20 text-white border border-white/40'}`}
         >
           {isMuted ? '🔇 Tắt Nhạc' : '🔊 Bật Nhạc'}
         </button>
      </div>
      <style>{`@keyframes streak-countdown { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
};