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

const createInitialGrid = (): MangoCell[][] => {
  const grid: MangoCell[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: MangoCell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        id: generateId(),
        value: Math.floor(Math.random() * 9) + 1,
        isRemoved: false,
      });
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
  
  // Thời gian
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [opponentTimeLeft, setOpponentTimeLeft] = useState(GAME_DURATION_SECONDS);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, startPos: null, currentPos: null,
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // --- MULTIPLAYER SYNC ---
  useEffect(() => {
    // Sửa lỗi VXgrid -> grid
    if (isMultiplayer && isHost && connection && grid.length > 0) {
      connection.send({ 
        type: 'GRID_UPDATE', 
        payload: { grid, score } 
      } as MultiPlayerMessage);
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
        // Cập nhật thời gian đối thủ
        setOpponentTimeLeft(msg.payload);
      }
    };

    connection.on('data', handleData);
    return () => { connection.off('data', handleData); };
  }, [isMultiplayer, connection]);

  // --- TIMER LOOP ---
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameOver(score);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Gửi thời gian cho đối thủ mỗi giây
        if (isMultiplayer && connection) {
          connection.send({ type: 'TIME_UPDATE', payload: newTime } as MultiPlayerMessage);
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onGameOver, score, isMultiplayer, connection]);

  // Prevent default touch actions on mobile
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
    return { 
      row: Math.max(0, Math.min(Math.floor((clientY - rect.top) / (rect.height / GRID_ROWS)), GRID_ROWS - 1)),
      col: Math.max(0, Math.min(Math.floor((clientX - rect.left) / (rect.width / GRID_COLS)), GRID_COLS - 1))
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
    if (pos && !grid[pos.row][pos.col].isRemoved) {
      setDragState({ isDragging: true, startPos: pos, currentPos: pos });
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;
    const pos = getCellFromCoords(clientX, clientY, true);
    if (pos) setDragState((prev) => ({ ...prev, currentPos: pos }));
  };

  const handleEnd = () => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) {
      setDragState({ isDragging: false, startPos: null, currentPos: null });
      return;
    }
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);

    let currentSum = 0;
    const selectedCells: Position[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (!grid[r][c].isRemoved) {
          currentSum += grid[r][c].value;
          selectedCells.push({ row: r, col: c });
        }
      }
    }

    if (currentSum === TARGET_SUM) processMatch(selectedCells);
    else if (selectedCells.length > 0) setTimeLeft(prev => Math.max(0, prev - 5));

    setDragState({ isDragging: false, startPos: null, currentPos: null });
  };

  const processMatch = (cellsToRemove: Position[]) => {
    setIsProcessing(true);
    const points = cellsToRemove.length * BASE_SCORE + (cellsToRemove.length > 2 ? cellsToRemove.length * 5 : 0);
    const newScore = score + points;
    setScore(newScore);
    setTimeLeft(prev => prev + 3);

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    cellsToRemove.forEach(pos => { newGrid[pos.row][pos.col].isRemoved = true; });
    setGrid(newGrid);

    if (isMultiplayer && connection) {
      connection.send({
        type: 'GRID_UPDATE',
        payload: { grid: newGrid, score: newScore }
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
    let sum = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (!grid[r][c].isRemoved) sum += grid[r][c].value;
      }
    }
    return sum;
  })();

  const isValidSum = currentSum === TARGET_SUM;
  const isWinning = score > opponentScore;
  const isTied = score === opponentScore;

  if (grid.length === 0) return <div className="flex items-center justify-center h-full text-orange-600 font-bold animate-pulse">Waiting for Host...</div>;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#00cf68] p-2 select-none touch-none overflow-hidden">
      <div className="flex flex-col gap-2 w-full max-w-4xl h-full max-h-full">
        <div className="flex-1 min-h-0 relative bg-[#f0fdf4] rounded-2xl border-4 border-[#00b058] shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] p-3 flex gap-3 overflow-hidden">
          <div className="flex-1 relative flex items-center justify-center">
             <div 
              className="relative touch-none cursor-crosshair z-10"
              style={{ aspectRatio: `${GRID_COLS}/${GRID_ROWS}`, width: '100%', height: '100%', maxHeight: '100%', maxWidth: '90%', margin: 'auto' }}
              onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={handleEnd}
            >
              <div ref={gridRef} className="w-full h-full relative" style={{ display: 'grid', gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
                {dragState.isDragging && dragState.startPos && dragState.currentPos && (
                  <div className={`absolute pointer-events-none border-2 rounded-md z-30 transition-colors ${isValidSum ? 'border-red-500 bg-red-500/20' : 'border-blue-500 bg-blue-500/20'}`}
                    style={{
                      left: `${Math.min(dragState.startPos.col, dragState.currentPos.col) * (100 / GRID_COLS)}%`,
                      top: `${Math.min(dragState.startPos.row, dragState.currentPos.row) * (100 / GRID_ROWS)}%`,
                      width: `${(Math.abs(dragState.currentPos.col - dragState.startPos.col) + 1) * (100 / GRID_COLS)}%`,
                      height: `${(Math.abs(dragState.currentPos.row - dragState.startPos.row) + 1) * (100 / GRID_ROWS)}%`,
                    }}
                  />
                )}
                {grid.map((row, r) => row.map((cell, c) => (
                    <div key={`${r}-${c}-${cell.id}`} className="w-full h-full p-[1px] pointer-events-none">
                      <MangoIcon value={cell.value} isSelected={isCellSelected(r, c)} isRemoved={cell.isRemoved} />
                    </div>
                )))}
              </div>
            </div>

            {/* Score Overlay */}
            <div className="absolute top-0 right-0 p-2 z-20 flex flex-col items-end pointer-events-none">
               <span className="text-xs font-bold text-[#00cf68]/80">YOU</span>
               <span className="text-[#00cf68] font-bold text-3xl font-mono drop-shadow-sm leading-none">{score}</span>
               
               {isMultiplayer && (
                 <div className="mt-2 text-right opacity-80 bg-white/50 p-1 rounded backdrop-blur-sm">
                   <span className="text-xs font-bold text-gray-500 block">OPPONENT</span>
                   <span className="text-xl font-bold text-gray-600 font-mono leading-none">{opponentScore}</span>
                   <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-400">TIME:</span>
                      <span className={`text-sm font-bold font-mono ${opponentTimeLeft < 10 ? 'text-red-500' : 'text-gray-600'}`}>
                        {opponentTimeLeft}s
                      </span>
                   </div>
                 </div>
               )}
            </div>

            {/* Multiplayer Progress Bar */}
            {isMultiplayer && (
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-2 bg-gray-200 rounded-full overflow-hidden z-20 border border-white/50 pointer-events-none">
                  <div className={`h-full transition-all duration-500 ${isWinning ? 'bg-green-500' : isTied ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${(score / (score + opponentScore + 1)) * 100}%` }} />
               </div>
            )}
          </div>

          {/* Time Bar */}
          <div className="w-4 bg-white/50 rounded-full border border-green-200 relative overflow-hidden hidden sm:block">
            <div className={`absolute bottom-0 w-full transition-all duration-1000 ease-linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#00cf68]'}`} style={{ height: `${Math.min((timeLeft / GAME_DURATION_SECONDS) * 100, 100)}%` }} />
          </div>
        </div>
        
        <div className="flex justify-between items-center px-4 py-2 text-white shrink-0 h-12">
           <button onClick={() => window.location.reload()} className="border-2 border-white/50 rounded px-4 py-1 hover:bg-white/20 font-bold text-sm uppercase tracking-wider">Reset</button>
           <div className="flex items-center gap-4 text-sm font-medium">
             <label className="flex items-center gap-2 cursor-pointer">
               <div className="w-4 h-4 border border-white bg-white rounded-sm"></div>
               <span>Light Colors</span>
             </label>
           </div>
        </div>
      </div>
    </div>
  );
};