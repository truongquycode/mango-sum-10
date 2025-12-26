import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GRID_ROWS, GRID_COLS, TARGET_SUM, GAME_DURATION_SECONDS, BASE_SCORE } from '../constants';
import { Position, MangoCell, DragState } from '../types';
import { MangoIcon } from './MangoIcon';

interface GameProps {
  onGameOver: (score: number) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createInitialGrid = (): MangoCell[][] => {
  const grid: MangoCell[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: MangoCell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        id: generateId(),
        value: Math.floor(Math.random() * 9) + 1, // 1-9
        isRemoved: false,
      });
    }
    grid.push(row);
  }
  return grid;
};

export const Game: React.FC<GameProps> = ({ onGameOver }) => {
  const [grid, setGrid] = useState<MangoCell[][]>(createInitialGrid());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Selection State
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPos: null,
    currentPos: null,
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameOver(score);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onGameOver, score]);

  /**
   * Calculates the grid cell from screen coordinates.
   * @param clientX Mouse/Touch X
   * @param clientY Mouse/Touch Y
   * @param clampToEdge If true, coordinates outside the grid map to the nearest edge cell (for dragging).
   */
  const getCellFromCoords = useCallback((clientX: number, clientY: number, clampToEdge: boolean = false): Position | null => {
    if (!gridRef.current) return null;
    
    // Get grid bounding box (Inner container, no borders)
    const rect = gridRef.current.getBoundingClientRect();
    
    // Basic Bounds Check
    const isOutside = 
      clientX < rect.left || 
      clientX > rect.right || 
      clientY < rect.top || 
      clientY > rect.bottom;

    if (isOutside && !clampToEdge) {
      return null;
    }

    // Calculate relative position
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Use explicit dimensions from rect to ensure accuracy
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = rect.height / GRID_ROWS;

    let col = Math.floor(relX / cellWidth);
    let row = Math.floor(relY / cellHeight);

    // If clamping, force to valid range. 
    // If not clamping (start), we still clamp to handle minor floating point edge cases at exact boundaries.
    row = Math.max(0, Math.min(row, GRID_ROWS - 1));
    col = Math.max(0, Math.min(col, GRID_COLS - 1));

    return { row, col };
  }, []);

  // Check if a cell is within the current selection rectangle
  const isCellSelected = useCallback((r: number, c: number) => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) return false;
    
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);

    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  }, [dragState]);

  // Handle Input Start (Mouse Down / Touch Start)
  // We allow "starting" even on the border by using clampToEdge=true slightly leniently, 
  // or strictly inside. Let's use strict inside for start to avoid accidental swipes from UI,
  // BUT users often hit the border pixel.
  const handleStart = (clientX: number, clientY: number) => {
    if (isProcessing) return; 
    
    // We allow clicking slightly on the border by clamping, so it feels responsive
    const pos = getCellFromCoords(clientX, clientY, true); 
    
    // However, verify we are reasonably close to the grid (e.g. not clicking the score header)
    // The event listeners are on the container, so we are definitely in the game area.
    
    if (pos) {
      // Don't start dragging on empty cells
      if (grid[pos.row][pos.col].isRemoved) return;

      setDragState({
        isDragging: true,
        startPos: pos,
        currentPos: pos,
      });
    }
  };

  // Handle Input Move
  const handleMove = (clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;
    
    // Always clamp to edge while dragging. 
    // This allows the user to drag their finger OFF the grid and still select the edge row/col.
    const pos = getCellFromCoords(clientX, clientY, true);
    
    if (pos) {
      setDragState((prev) => ({ ...prev, currentPos: pos }));
    }
  };

  // Handle Input End
  const handleEnd = () => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) {
      setDragState({ isDragging: false, startPos: null, currentPos: null });
      return;
    }

    // 1. Identify selected cells
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);

    let currentSum = 0;
    const selectedCells: Position[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = grid[r][c];
        if (!cell.isRemoved) {
          currentSum += cell.value;
          selectedCells.push({ row: r, col: c });
        }
      }
    }

    // 2. Check Logic (Sum == 10)
    if (currentSum === TARGET_SUM) {
      processMatch(selectedCells);
    } 

    // Reset Drag
    setDragState({ isDragging: false, startPos: null, currentPos: null });
  };

  const processMatch = (cellsToRemove: Position[]) => {
    setIsProcessing(true); // Lock input

    // Calculate Score
    const points = cellsToRemove.length * BASE_SCORE + (cellsToRemove.length > 2 ? cellsToRemove.length * 5 : 0);
    setScore(prev => prev + points);

    // Step 1: Mark as removed immediately
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
      cellsToRemove.forEach(pos => {
        newGrid[pos.row][pos.col].isRemoved = true;
      });
      return newGrid;
    });

    // Step 2: Gravity & Refill Logic
    setTimeout(() => {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
        
        for (let c = 0; c < GRID_COLS; c++) {
          let writeRow = GRID_ROWS - 1;
          
          for (let r = GRID_ROWS - 1; r >= 0; r--) {
            if (!newGrid[r][c].isRemoved) {
              newGrid[writeRow][c] = newGrid[r][c];
              writeRow--;
            }
          }

          while (writeRow >= 0) {
            newGrid[writeRow][c] = {
              id: generateId(),
              value: Math.floor(Math.random() * 9) + 1,
              isRemoved: false,
            };
            writeRow--;
          }
        }
        return newGrid;
      });
      setIsProcessing(false);
    }, 350);
  };

  // Calculate current selection sum for UI feedback
  const getCurrentSelectionSum = () => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) return 0;
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);

    let sum = 0;
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (!grid[r][c].isRemoved) {
          sum += grid[r][c].value;
        }
      }
    }
    return sum;
  };

  const currentSum = getCurrentSelectionSum();
  const isValidSum = currentSum === TARGET_SUM;

  return (
    <div className="flex flex-col h-full w-full bg-orange-50 select-none touch-none">
      {/* HUD */}
      <div className="flex justify-between items-center p-4 bg-white shadow-md border-b-4 border-orange-200 z-20 shrink-0">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase">Score</span>
          <span className="text-2xl font-black text-orange-600 font-mono">{score}</span>
        </div>
        
        {/* Sum Indicator */}
        <div className={`
           px-4 py-1 rounded-full font-bold text-xl border-2 transition-opacity duration-200
           ${dragState.isDragging ? 'opacity-100' : 'opacity-0'}
           ${isValidSum 
             ? 'bg-green-100 text-green-700 border-green-500 scale-110' 
             : currentSum > TARGET_SUM 
               ? 'bg-red-100 text-red-500 border-red-300' 
               : 'bg-yellow-100 text-yellow-600 border-yellow-300'}
        `}>
          Sum: {currentSum}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-gray-500 uppercase">Time</span>
          <span className={`text-2xl font-black font-mono ${timeLeft < 10 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Grid Container Area */}
      <div className="flex-1 p-2 md:p-6 flex items-center justify-center overflow-hidden">
        {/* 
            Outer Wrapper: Visual Border & Event Listener Target.
            Events are attached here to capture swipes that start/end on the border or slightly outside cells.
        */}
        <div 
          // 1. Bỏ "w-full" và "max-w-4xl" để khung không bị ép buộc kích thước ngang
          className="relative bg-orange-100/50 rounded-xl border-4 border-orange-200 shadow-inner touch-none cursor-crosshair"
          style={{ 
            // 2. Giữ tỉ lệ khung hình chuẩn
            aspectRatio: `${GRID_COLS}/${GRID_ROWS}`,
            
            // 3. Logic mới: Tự động co giãn tối đa nhưng KHÔNG vượt quá khung cha
            maxWidth: '100%',
            maxHeight: '100%',
            
            // Mẹo: Đặt width/height lớn và để max-width/height cắt bớt theo tỉ lệ
            width: '100%', 
            height: 'auto', 
            
            // Căn giữa nếu cần (thường flex cha đã lo việc này)
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
          // ... giữ nguyên các dòng sự kiện onMouseDown, onTouchStart phía dưới ...
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          {/* Inner Grid: Purely for layout and coordinate reference */}
          <div
            ref={gridRef}
            className="w-full h-full relative"
            style={{
              display: 'grid', 
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, 
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            }}
          >
            {/* Selection Box Overlay */}
            {dragState.isDragging && dragState.startPos && dragState.currentPos && (
              <div 
                className={`absolute pointer-events-none border-4 rounded-lg z-30 transition-colors
                  ${isValidSum ? 'border-green-500 bg-green-500/20' : 'border-blue-500 bg-blue-500/20'}
                `}
                style={{
                  left: `${Math.min(dragState.startPos.col, dragState.currentPos.col) * (100 / GRID_COLS)}%`,
                  top: `${Math.min(dragState.startPos.row, dragState.currentPos.row) * (100 / GRID_ROWS)}%`,
                  width: `${(Math.abs(dragState.currentPos.col - dragState.startPos.col) + 1) * (100 / GRID_COLS)}%`,
                  height: `${(Math.abs(dragState.currentPos.row - dragState.startPos.row) + 1) * (100 / GRID_ROWS)}%`,
                }}
              />
            )}

            {/* Grid Cells */}
            {grid.map((row, r) => 
              row.map((cell, c) => (
                <div 
                  key={`${r}-${c}-${cell.id}`} 
                  className="w-full h-full p-[2px] md:p-1 pointer-events-none" // pointer-events-none on children ensures events bubble efficiently to container
                >
                  <MangoIcon 
                    value={cell.value} 
                    isSelected={isCellSelected(r, c)}
                    isRemoved={cell.isRemoved}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Footer / Hint */}
      <div className="bg-white/50 p-2 text-center text-xs text-gray-400 shrink-0">
        Drag to select sum of 10
      </div>
    </div>
  );
};