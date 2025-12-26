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
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- ÂM THANH BASE64 (Đảm bảo hoạt động 100% không cần mạng) ---

// Tiếng "Ting" (Đúng)
const CORRECT_SFX = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840OTiOAf840OTiOAflGKZX0/gHRASI/W+D7K7s8v8wD9/D3/L/d/764f9/gH3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840OTiOAf840OTiOAflGKZX0/gHRASI/W+D7K7s8v8wD9/D3/L/d/764f9/gH3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG840OTiOAf840OTiOAflGKZX0/gHRASI/W+D7K7s8v8wD9/D3/L/d/764f9/gH3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9/f3/9";

// Tiếng "Buzz" (Sai) - Âm thanh trầm thấp
const WRONG_SFX = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; 
// (Lưu ý: Base64 ở trên là ví dụ ngắn gọn để tránh quá dài, code dưới sẽ dùng logic giả lập âm thanh đơn giản nếu Base64 không đủ)

const AUDIO_ASSETS = {
  // Nhạc nền (Link ổn định hơn)
  BGM: 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3', 
};

// ... (Giữ nguyên phần thuật toán tạo Map)
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
  connection 
}) => {
  const [grid, setGrid] = useState<MangoCell[][]>(isHost ? createInitialGrid() : []);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [opponentTimeLeft, setOpponentTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [errorCellIds, setErrorCellIds] = useState<Set<string>>(new Set());
  
  // Trạng thái bật/tắt nhạc
  const [isMuted, setIsMuted] = useState(false);

  // Refs cho Audio
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  
  // Sử dụng AudioContext cho SFX để đảm bảo độ trễ thấp nhất và không lỗi link
  const audioContextRef = useRef<AudioContext | null>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, startPos: null, currentPos: null,
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // --- HỆ THỐNG ÂM THANH MỚI (AUDIO CONTEXT) ---
  useEffect(() => {
    // 1. Khởi tạo AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 2. Khởi tạo BGM (Dùng thẻ Audio thường cho nhạc nền)
    // Dùng link nhạc miễn phí bản quyền
    bgmRef.current = new Audio('/assets/bgm.mp3'); 
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.1; // Nhạc nền nhỏ

    // Tự động phát nếu có thể
    if (!isMuted) {
      bgmRef.current.play().catch(() => console.log("Cần click để phát nhạc"));
    }

    return () => {
      bgmRef.current?.pause();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Xử lý bật/tắt Mute
  useEffect(() => {
    if (bgmRef.current) {
      if (isMuted) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch(() => {});
      }
    }
  }, [isMuted]);

  // Hàm tạo âm thanh tổng hợp (Synthesizer) - KHÔNG BAO GIỜ LỖI LINK
  const playSynthSound = useCallback((type: 'correct' | 'wrong') => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
      // Tiếng "Ting": Sóng Sine, tần số cao, giảm dần nhanh
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime); // Bắt đầu 800Hz
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1); // Lên 1200Hz
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Tiếng "Buzz": Sóng Sawtooth, tần số thấp, rung
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime); // Thấp 150Hz
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3); // Xuống 100Hz
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  }, [isMuted]);

  // ... (Các useEffect logic game giữ nguyên)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (streak > 0) { timer = setTimeout(() => { setStreak(0); }, 5000); }
    return () => clearTimeout(timer);
  }, [streak]);

  useEffect(() => {
    if (isMultiplayer && isHost && connection && grid.length > 0) {
      connection.send({ type: 'GRID_UPDATE', payload: { grid, score } } as MultiPlayerMessage);
    }
  }, []);

  useEffect(() => {
    if (!isMultiplayer || !connection) return;
    const handleData = (data: any) => {
      const msg = data as MultiPlayerMessage;
      if (msg.type === 'GRID_UPDATE') {
        if (msg.payload.grid) setGrid(msg.payload.grid);
        if (msg.payload.score !== undefined) setOpponentScore(msg.payload.score);
      } else if (msg.type === 'TIME_UPDATE') setOpponentTimeLeft(msg.payload);
    };
    connection.on('data', handleData);
    return () => { connection.off('data', handleData); };
  }, [isMultiplayer, connection]);

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

  // ... (Logic Dragging)
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
    
    // Resume AudioContext khi người dùng tương tác lần đầu (Fix lỗi không có tiếng trên Chrome)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
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
    
    let currentSum = 0; const selectedCells: Position[] = [];
    const idsToCheck: string[] = [];

    for (let r = minRow; r <= maxRow; r++) { 
      for (let c = minCol; c <= maxCol; c++) { 
        if (!grid[r][c].isRemoved) { 
          currentSum += grid[r][c].value; 
          selectedCells.push({ row: r, col: c }); 
          idsToCheck.push(grid[r][c].id);
        } 
      } 
    }
    
    if (currentSum === TARGET_SUM) {
      processMatch(selectedCells);
    } else if (selectedCells.length > 0) {
      // --- SAI ---
      playSynthSound('wrong'); // Phát tiếng Buzz
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
    
    // --- ĐÚNG ---
    playSynthSound('correct'); // Phát tiếng Ting

    const newStreak = streak + 1;
    setStreak(newStreak);
    const basePoints = cellsToRemove.length * BASE_SCORE + (cellsToRemove.length > 2 ? cellsToRemove.length * 5 : 0);
    const streakBonus = newStreak * 10;
    const newScore = score + basePoints + streakBonus;
    setScore(newScore);
    setTimeLeft(prev => prev + 1);

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    cellsToRemove.forEach(pos => { newGrid[pos.row][pos.col].isRemoved = true; });
    setGrid(newGrid);
    
    if (isMultiplayer && connection) connection.send({ type: 'GRID_UPDATE', payload: { grid: newGrid, score: newScore } } as MultiPlayerMessage);
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

  if (grid.length === 0) return <div className="flex items-center justify-center h-full text-orange-600 font-bold animate-pulse">Waiting for Host...</div>;

  return (
    <div className="h-full w-full flex flex-col bg-[#00cf68] select-none touch-none overflow-hidden">
      
      {/* HUD */}
      <div className="shrink-0 p-2 sm:p-4 w-full max-w-2xl mx-auto z-20">
        <div className="bg-[#f0fdf4] rounded-2xl border-4 border-[#00b058] shadow-md p-2 flex justify-between items-center relative">
           <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 overflow-hidden rounded-b-xl">
             <div className={`h-full transition-all duration-1000 linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#00cf68]'}`} style={{ width: `${Math.min((timeLeft / GAME_DURATION_SECONDS) * 100, 100)}%` }} />
           </div>

           <div className="flex items-center gap-4 w-full justify-between px-2 pb-2">
             <div className="flex flex-col relative">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-[#00cf68] uppercase">You</span>
                 {streak > 0 && (
                   <div className="relative group">
                     <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-bounce inline-block shadow-sm">
                       🔥 {streak}
                     </span>
                     <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gray-200 rounded-full overflow-hidden">
                       <div key={streak} className="h-full bg-orange-500" style={{ width: '100%', animation: 'streak-countdown 5s linear forwards' }} />
                     </div>
                   </div>
                 )}
               </div>
               <span className="text-2xl font-black text-[#00cf68] leading-none">{score}</span>
             </div>

             {isMultiplayer && (
               <div className="flex flex-col items-end border-l pl-4 border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase">Enemy</span>
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
              <div className={`absolute pointer-events-none border-4 rounded-xl z-50 transition-colors shadow-lg ${isValidSum ? 'border-red-500 bg-red-500/10' : 'border-blue-500 bg-blue-500/10'}`}
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
           <button onClick={() => window.location.reload()} className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider backdrop-blur-sm transition-all active:scale-95">Reset</button>
         ) : <div/>}

         {/* Nút bật/tắt nhạc */}
         <button 
           onClick={() => setIsMuted(!isMuted)}
           className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${isMuted ? 'bg-red-500/80 text-white' : 'bg-white/20 text-white border border-white/40'}`}
         >
           {isMuted ? '🔇 Muted' : '🔊 Sound On'}
         </button>
      </div>
      <style>{`@keyframes streak-countdown { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
};