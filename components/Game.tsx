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

// --- THUẬT TOÁN TẠO MAP CÓ LỜI GIẢI (Giữ nguyên từ bước trước) ---
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
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, startPos: null, currentPos: null,
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // --- MULTIPLAYER SYNC ---
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
    for (let r = minRow; r <= maxRow; r++) { 
      for (let c = minCol; c <= maxCol; c++) { 
        if (!grid[r][c].isRemoved) { 
          currentSum += grid[r][c].value; 
          selectedCells.push({ row: r, col: c }); 
        } 
      } 
    }
    
    if (currentSum === TARGET_SUM) {
      processMatch(selectedCells);
    } else if (selectedCells.length > 0) {
      // --- CHỈNH SỬA: TĂNG HÌNH PHẠT KHI SAI ---
      // Trước đây là -5, giờ tăng lên -10 giây
      setTimeLeft(prev => Math.max(0, prev - 10));
    }
    setDragState({ isDragging: false, startPos: null, currentPos: null });
  };

  const processMatch = (cellsToRemove: Position[]) => {
    setIsProcessing(true);
    const points = cellsToRemove.length * BASE_SCORE + (cellsToRemove.length > 2 ? cellsToRemove.length * 5 : 0);
    const newScore = score + points; 
    setScore(newScore);
    
    // --- CHỈNH SỬA: GIẢM THỜI GIAN CỘNG THÊM ---
    // Trước đây là +3, giờ giảm xuống còn +1 giây
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
      
      {/* HUD (Score & Time) */}
      <div className="shrink-0 p-2 sm:p-4 w-full max-w-2xl mx-auto z-20">
        <div className="bg-[#f0fdf4] rounded-2xl border-4 border-[#00b058] shadow-md p-2 flex justify-between items-center relative">
           {/* Time Bar */}
           <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 overflow-hidden rounded-b-xl">
             <div className={`h-full transition-all duration-1000 linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#00cf68]'}`} style={{ width: `${Math.min((timeLeft / GAME_DURATION_SECONDS) * 100, 100)}%` }} />
           </div>

           {/* Score Info */}
           <div className="flex items-center gap-4 w-full justify-between px-2 pb-2">
             <div className="flex flex-col">
               <span className="text-xs font-bold text-[#00cf68] uppercase">You</span>
               <span className="text-2xl font-black text-[#00cf68] leading-none">{score}</span>
             </div>

             {/* Đối thủ */}
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
          style={{ 
            aspectRatio: `${GRID_COLS}/${GRID_ROWS}`,
            height: '100%',
            width: '100%',
            maxHeight: '100%', 
            maxWidth: '100%',
          }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          {/* Lưới Grid */}
          <div 
            ref={gridRef} 
            className="w-full h-full"
            style={{ 
              display: 'grid', 
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, 
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gap: '2px' 
            }}
          >
            {/* Vùng chọn (Selection Box) */}
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
            
            {/* Các ô Mango */}
            {grid.map((row, r) => row.map((cell, c) => (
                <div key={`${r}-${c}-${cell.id}`} className="w-full h-full relative">
                  <MangoIcon value={cell.value} isSelected={isCellSelected(r, c)} isRemoved={cell.isRemoved} />
                </div>
            )))}
          </div>
        </div>
      </div>

      {/* Footer (Nút Reset) */}
      <div className="shrink-0 h-14 flex items-center justify-center pb-2">
         {!isMultiplayer && (
           <button 
             onClick={() => window.location.reload()} 
             className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider backdrop-blur-sm transition-all active:scale-95"
           >
             Reset Game
           </button>
         )}
         {!isMultiplayer && (
            <div className="absolute right-4 text-white text-xs opacity-60 font-medium">
               Light Mode: Auto
            </div>
         )}
      </div>
    </div>
  );
};