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

// --- CÁC ĐƯỜNG DẪN ÂM THANH (Bạn có thể thay bằng file local trong thư mục public) ---
const AUDIO_URLS = {
  BGM: 'https://cdn.pixabay.com/audio/2022/03/24/audio_3070f7d544.mp3', // Nhạc nền vui tươi nhẹ
  CORRECT: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_274e797e97.mp3', // Tiếng 'Pop' hoặc 'Ding'
  WRONG: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3', // Tiếng 'Buzz' hoặc sai
};

// ... (Giữ nguyên phần thuật toán tạo Map shuffleArray, generateSolvableValues, createInitialGrid)
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

  // State cho hiệu ứng SAI (lưu ID của các cell bị sai)
  const [errorCellIds, setErrorCellIds] = useState<Set<string>>(new Set());

  // Refs cho Audio
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxCorrectRef = useRef<HTMLAudioElement | null>(null);
  const sfxWrongRef = useRef<HTMLAudioElement | null>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, startPos: null, currentPos: null,
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // --- INIT AUDIO ---
  useEffect(() => {
    // Khởi tạo Audio objects
    bgmRef.current = new Audio(AUDIO_URLS.BGM);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3; // Nhạc nền nhỏ thôi

    sfxCorrectRef.current = new Audio(AUDIO_URLS.CORRECT);
    sfxCorrectRef.current.volume = 0.6;

    sfxWrongRef.current = new Audio(AUDIO_URLS.WRONG);
    sfxWrongRef.current.volume = 0.5;

    // Phát nhạc nền (yêu cầu người dùng tương tác trước nếu trình duyệt chặn)
    const playBGM = () => {
      bgmRef.current?.play().catch(() => console.log("Cần tương tác để phát nhạc"));
    };
    document.addEventListener('click', playBGM, { once: true });
    playBGM();

    return () => {
      bgmRef.current?.pause();
      bgmRef.current = null;
    };
  }, []);

  // Hàm helper chơi âm thanh
  const playSound = (type: 'correct' | 'wrong') => {
    if (type === 'correct' && sfxCorrectRef.current) {
      sfxCorrectRef.current.currentTime = 0;
      sfxCorrectRef.current.play().catch(() => {});
    } else if (type === 'wrong' && sfxWrongRef.current) {
      sfxWrongRef.current.currentTime = 0;
      sfxWrongRef.current.play().catch(() => {});
    }
  };

  // ... (Logic Streak Timeout và Multiplayer giữ nguyên)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (streak > 0) {
      timer = setTimeout(() => { setStreak(0); }, 5000);
    }
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
      } else if (msg.type === 'TIME_UPDATE') {
        setOpponentTimeLeft(msg.payload);
      }
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

  // ... (Logic Dragging giữ nguyên)
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
      // --- XỬ LÝ KHI SAI (WRONG) ---
      playSound('wrong'); // Âm thanh sai
      setTimeLeft(prev => Math.max(0, prev - 10)); 
      setStreak(0);

      // Kích hoạt hiệu ứng "Phình bự" (Error)
      const newErrorSet = new Set(idsToCheck);
      setErrorCellIds(newErrorSet);
      
      // Tắt hiệu ứng sau 400ms
      setTimeout(() => {
        setErrorCellIds(new Set());
      }, 400);
    }
    setDragState({ isDragging: false, startPos: null, currentPos: null });
  };

  const processMatch = (cellsToRemove: Position[]) => {
    setIsProcessing(true);
    
    // --- XỬ LÝ KHI ĐÚNG (CORRECT) ---
    playSound('correct'); // Âm thanh đúng

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

  // ... (currentSum, isValidSum giữ nguyên)
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
                    // Truyền prop isError dựa trên ID
                    isError={errorCellIds.has(cell.id)} 
                  />
                </div>
            )))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 h-14 flex items-center justify-center pb-2">
         {!isMultiplayer && (
           <button onClick={() => window.location.reload()} className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider backdrop-blur-sm transition-all active:scale-95">Reset Game</button>
         )}
      </div>
      <style>{`@keyframes streak-countdown { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
};