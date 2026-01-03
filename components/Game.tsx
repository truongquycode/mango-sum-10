// components/Game.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataConnection } from 'peerjs';
import { GRID_ROWS, GRID_COLS, TARGET_SUM, GAME_DURATION_SECONDS, BASE_SCORE } from '../constants';
import { Position, MangoCell, DragState, MultiPlayerMessage, GameItem, ItemType } from '../types';
import { MangoIcon } from './MangoIcon';
import { ITEM_CONFIG, REACTION_EMOJIS } from '../constants';

interface GameProps {
  onGameOver: (
    score: number, 
    itemsUsed: Record<string, number>, 
    finalOpponentScore?: number, 
    opponentItemsUsed?: Record<string, number>,
    duration?: number,
    startTime?: number
  ) => void; 
  
  isMultiplayer?: boolean;
  isHost?: boolean;
  connection?: DataConnection | null;
  myName?: string;
  opponentName?: string;
  myAvatar?: string | { type: string, value: string };
  opponentAvatar?: string | { type: string, value: string };
}

// --- LOGIC GAME (GIỮ NGUYÊN) ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const getRandomItemType = (exclude: ItemType[] = []): ItemType | null => {
  const items: ItemType[] = ['BOMB', 'MAGIC', 'FREEZE', 'SPEED_UP', 'STEAL', 'DEBUFF_SCORE', 'BUFF_SCORE'];
  const available = items.filter(i => !exclude.includes(i));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

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
  let currentCount = 0;
  while (currentCount < totalCells) {
    const remaining = totalCells - currentCount;
    const wantTriplet = (Math.random() < 0.35 || remaining === 3) && remaining >= 3;
    if (wantTriplet) {
       const a = Math.floor(Math.random() * 5) + 1; 
       const maxB = 9 - a; 
       const b = Math.floor(Math.random() * (maxB - 1)) + 1; 
       const c = 10 - a - b;
       values.push(a, b, c);
       currentCount += 3;
    } else {
       if (remaining >= 2) {
         let a = Math.floor(Math.random() * 9) + 1;
         if ((a === 1 || a === 9) && Math.random() > 0.5) a = 5;
         const b = 10 - a;
         values.push(a, b);
         currentCount += 2;
       } else {
         values.push(5);
         currentCount += 1;
       }
    }
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
      let currentValue = solvableValues[valueIndex];
      const leftValue = c > 0 ? row[c - 1].value : -1;
      const topValue = r > 0 ? grid[r - 1][c].value : -1;
      const isConflict = (currentValue === leftValue) || (currentValue === topValue);

      if (isConflict) {
        let swapFound = false;
        for (let k = valueIndex + 1; k < solvableValues.length; k++) {
          const candidate = solvableValues[k];
          if (candidate !== leftValue && candidate !== topValue) {
            if ((leftValue === 5 || topValue === 5) && candidate === 5) continue;
            [solvableValues[valueIndex], solvableValues[k]] = [solvableValues[k], solvableValues[valueIndex]];
            currentValue = solvableValues[valueIndex]; 
            swapFound = true;
            break; 
          }
        }
      }
      row.push({
        id: generateId(),
        value: currentValue || 5, 
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
  opponentName = "Đối thủ",
  myAvatar = "😎",
  opponentAvatar = "👤"
}) => {
  const [grid, setGrid] = useState<MangoCell[][]>(isHost ? createInitialGrid() : []);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [opponentTimeLeft, setOpponentTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [streak, setStreak] = useState(0);
  const [bonusText, setBonusText] = useState<{ text: string, id: number, color?: string } | null>(null);
  const [errorCellIds, setErrorCellIds] = useState<Set<string>>(new Set());
  
  const [inventory, setInventory] = useState<GameItem[]>([]); 
  const [magicActive, setMagicActive] = useState(false); 
  const [isFrozen, setIsFrozen] = useState(false); 
  const [speedMultiplier, setSpeedMultiplier] = useState(1); 
  const [scoreMultiplier, setScoreMultiplier] = useState(1); 
  const [scoreDebuff, setScoreDebuff] = useState(1); 
  
  const [itemsUsedStats, setItemsUsedStats] = useState<Record<string, number>>({});
  const [effectMessage, setEffectMessage] = useState<{text: string, icon: string, subText?: string} | null>(null);
  const [shuffleMessage, setShuffleMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [incomingEmoji, setIncomingEmoji] = useState<{ type: string, value: string, id: number } | null>(null);
  const emojiTimerRef = useRef<NodeJS.Timeout | null>(null); 

  const [opponentItemsStats, setOpponentItemsStats] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(false);
  const startTimeRef = useRef(Date.now());

  const [isLocalFinished, setIsLocalFinished] = useState(false);
  const [isOpponentFinished, setIsOpponentFinished] = useState(false);
  const isGameEndedRef = useRef(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, startPos: null, currentPos: null,
  });
  const gridRef = useRef<HTMLDivElement>(null);
  
  const gridRectRef = useRef<DOMRect | null>(null);

  // --- HELPER RENDER AVATAR ---
  const renderAvatar = (avatar: any) => {
    if (avatar && typeof avatar === 'object' && avatar.type === 'image') {
        return (
          <img 
            src={avatar.value} 
            alt="avatar" 
            className="w-full h-full object-cover pointer-events-none" 
          />
        );
    }
    const displayValue = (avatar && typeof avatar === 'object') ? avatar.value : (avatar || "👤");
    return (
        <div className="w-full h-full flex items-center justify-center bg-white text-3xl pb-1">
            {displayValue}
        </div>
    );
  };

  // --- AUDIO SETUP ---
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const totalTracks = 5; 
    const randomTrackId = Math.floor(Math.random() * totalTracks) + 1;
    const audioPath = `/assets/${randomTrackId}.mp3`;
    
    const audio = new Audio(audioPath);
    audio.loop = true;
    audio.volume = 0.3;
    bgmRef.current = audio;

    const tryPlayMusic = async () => {
      if (!bgmRef.current || isMuted) return;
      try {
        await bgmRef.current.play();
      } catch (err) {
        const resumeAudio = () => {
          if (bgmRef.current && !isMuted) {
            bgmRef.current.play().catch(() => {});
            if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume();
            }
          }
          document.removeEventListener('click', resumeAudio);
        };
        document.addEventListener('click', resumeAudio);
      }
    };
    if (!isMuted) tryPlayMusic();
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []); 

  useEffect(() => {
    if (bgmRef.current) {
      if (isMuted) bgmRef.current.pause();
      else {
        bgmRef.current.play().catch(() => {});
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
      }
    }
  }, [isMuted]);

  const playSynthSound = useCallback((type: string, variant?: string) => {
    if (isMuted || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    const currTime = ctx.currentTime;
    
    switch (type) {
        case 'correct': osc.type = 'sine'; osc.frequency.setValueAtTime(800 + (streak*50), currTime); break;
        case 'wrong': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, currTime); break;
        default: osc.type = 'triangle'; osc.frequency.setValueAtTime(400, currTime); break;
    }
    gainNode.gain.setValueAtTime(0.1, currTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.3);
    osc.start(); osc.stop(currTime + 0.3);
  }, [isMuted, streak]);

  const playStickerSound = useCallback((item: { type: string, value: string }) => {
    if (isMuted || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // Helper tạo nốt nhạc
    const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    if (item.type === 'image') {
        // GIF/Ảnh: Âm thanh "Ta-da" hoặc "Bling" (Arpeggio đi lên)
        playTone(523.25, now, 0.3, 'triangle'); // C5
        playTone(659.25, now + 0.1, 0.3, 'triangle'); // E5
        playTone(783.99, now + 0.2, 0.5, 'triangle'); // G5
        playTone(1046.50, now + 0.3, 0.6, 'sine'); // C6 (Chốt hạ)
    } else {
        // Sticker Text
        if (item.value.length > 5) {
            // Chữ dài: Âm thanh "Ding-dong" (Thông báo)
            playTone(600, now, 0.4, 'sine');
            playTone(800, now + 0.2, 0.6, 'sine');
        } else {
            // Chữ ngắn/Icon: Âm thanh "Pop" hoặc "Bloop" dễ thương
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); // Pitch trượt lên
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    }
  }, [isMuted]);

  // --- GAMEPLAY LOGIC ---
  const hasValidMoves = (currentGrid: MangoCell[][]): boolean => {
    for (let r1 = 0; r1 < GRID_ROWS; r1++) {
        for (let c1 = 0; c1 < GRID_COLS; c1++) {
            for (let r2 = r1; r2 < GRID_ROWS; r2++) {
                for (let c2 = c1; c2 < GRID_COLS; c2++) {
                    let sum = 0;
                    for(let i = r1; i <= r2; i++) {
                        for(let j = c1; j <= c2; j++) {
                            if (!currentGrid[i][j].isRemoved) sum += currentGrid[i][j].value;
                        }
                    }
                    if (sum === TARGET_SUM) return true;
                    if (sum > TARGET_SUM) break; 
                }
            }
        }
    }
    return false;
  };

  useEffect(() => {
    if (grid.length === 0 || isLocalFinished) return;
    if (isMultiplayer && !isHost) return; 
    const movesAvailable = hasValidMoves(grid);
    if (!movesAvailable) {
      let remainingSum = 0;
      const remainingValues: number[] = [];
      grid.forEach(row => row.forEach(cell => {
        if (!cell.isRemoved) { remainingSum += cell.value; remainingValues.push(cell.value); }
      }));
      if (remainingSum < TARGET_SUM) return; 

      setShuffleMessage("Hết đường! Xáo trộn...");
      playSynthSound('shuffle');
      const shuffledValues = shuffleArray(remainingValues);
      let valIdx = 0;
      const newGrid = grid.map(row => row.map(cell => {
        if (cell.isRemoved) return cell;
        const newVal = shuffledValues[valIdx++];
        return { ...cell, value: newVal };
      }));
      setTimeout(() => {
        setGrid(newGrid);
        setShuffleMessage(null);
        if (isMultiplayer && connection) {
          connection.send({ 
            type: 'GRID_UPDATE', 
            payload: { grid: newGrid, score, opponentName: myName, opponentAvatar: myAvatar } 
          } as MultiPlayerMessage);
        }
      }, 1500);
    }
  }, [grid, isHost, isMultiplayer, connection, isLocalFinished]);

  useEffect(() => {
    if (isMultiplayer && !isHost && grid.length === 0 && connection) {
      const interval = setInterval(() => {
        if (grid.length === 0) connection.send({ type: 'REQUEST_MAP' } as MultiPlayerMessage);
        else clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isMultiplayer, isHost, grid.length, connection]);

  const handleShowEmoji = (payload: { type: string, value: string }) => {
      if (emojiTimerRef.current) {
          clearTimeout(emojiTimerRef.current);
      }
      setIncomingEmoji({ ...payload, id: Date.now() });
      
      // GỌI HÀM PHÁT ÂM THANH MỚI
      playStickerSound(payload);

      emojiTimerRef.current = setTimeout(() => {
          setIncomingEmoji(null);
          emojiTimerRef.current = null;
      }, 3500);
  };

  useEffect(() => {
    if (!isMultiplayer || !connection) return;
    const handleData = (data: any) => {
      const msg = data as MultiPlayerMessage;
      
      if (msg.type === 'PLAYER_FINISHED') {
         setIsOpponentFinished(true);
         if (msg.payload?.score !== undefined) setOpponentScore(msg.payload.score);
         if (msg.payload?.itemsUsed) {
             setOpponentItemsStats(msg.payload.itemsUsed);
         }
         return;
      }
      if (msg.type === 'GAME_OVER') {
         setIsOpponentFinished(true);
         if (msg.payload?.score !== undefined) setOpponentScore(msg.payload.score);
         return;
      }

      if (msg.type === 'REQUEST_MAP' && isHost) {
        connection.send({ type: 'GRID_UPDATE', payload: { grid, score, opponentName: myName, opponentAvatar: myAvatar } } as MultiPlayerMessage);
      }
      if (msg.type === 'SEND_EMOJI') {
          handleShowEmoji(msg.payload);
      }
      if (msg.type === 'ITEM_ATTACK') {
          const { effect, amount } = msg.payload; // Lấy amount từ payload gửi sang
          if (effect === 'BOMB') {
             setTimeLeft(prev => Math.max(0, prev - 10));
             setEffectMessage({ text: "Dính Bom! -10s", icon: "💣", subText: "Đau quá!" });
          } else if (effect === 'SPEED_UP') {
             setSpeedMultiplier(1.5);
             setEffectMessage({ text: "Tua Nhanh", icon: "⏩", subText: "Thời gian trôi 1.5x" });
             setTimeout(() => { setSpeedMultiplier(1); setEffectMessage(null); }, 10000);
          } else if (effect === 'DEBUFF_SCORE') {
             setScoreDebuff(0.5);
             setEffectMessage({ text: "Giảm Điểm", icon: "📉", subText: "Chỉ nhận 50% điểm" });
             setTimeout(() => { setScoreDebuff(1); setEffectMessage(null); }, 10000);
          } else if (effect === 'STEAL') {
             // Tính số điểm bị mất (ưu tiên lấy số từ đối thủ gửi sang để đồng bộ)
             const stolen = amount || Math.floor(score * 0.1);
             
             setScore(prev => {
                 const newScore = Math.max(0, prev - stolen);
                 // Gửi điểm mới của mình cho đối thủ thấy ngay
                 connection.send({ type: 'UPDATE_SCORE', payload: { score: newScore } } as MultiPlayerMessage);
                 return newScore;
             });

             setEffectMessage({ text: "Bị Cướp!", icon: "😭", subText: `Mất ${stolen} điểm` });
             setTimeout(() => setEffectMessage(null), 2000);
          }
      }
      if (msg.type === 'GRID_UPDATE') {
        const remoteGrid = msg.payload.grid;
        if (grid.length === 0 && remoteGrid) setGrid(remoteGrid);
        else if (remoteGrid) {
          setGrid(prev => prev.map((row, r) => row.map((c, idx) => ({
            ...c, 
            isRemoved: c.isRemoved || remoteGrid[r][idx].isRemoved,
            value: !c.isRemoved && !remoteGrid[r][idx].isRemoved ? remoteGrid[r][idx].value : c.value
          }))));
        }
        if (msg.payload.score !== undefined) setOpponentScore(msg.payload.score);
      } else if (msg.type === 'UPDATE_SCORE') {
        if (msg.payload.score !== undefined) setOpponentScore(msg.payload.score);
      } else if (msg.type === 'TIME_UPDATE') {
        setOpponentTimeLeft(msg.payload);
      }
    };
    connection.on('data', handleData);
    return () => { connection.off('data', handleData); };
  }, [isMultiplayer, connection, grid, score, isHost]);

  useEffect(() => {
    if (isGameEndedRef.current) return;
    const actualDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const startTime = startTimeRef.current;

    if (!isMultiplayer && isLocalFinished) {
        isGameEndedRef.current = true;
        onGameOver(score, itemsUsedStats, 0, {}, actualDuration, startTime); 
    } 
    else if (isMultiplayer && isLocalFinished && isOpponentFinished) {
        isGameEndedRef.current = true;
        setTimeout(() => {
            onGameOver(score, itemsUsedStats, opponentScore, opponentItemsStats, actualDuration, startTime);
        }, 1000);
    }
  }, [isLocalFinished, isOpponentFinished, isMultiplayer, score, itemsUsedStats, opponentScore, opponentItemsStats, onGameOver]);

  useEffect(() => {
    if (timeLeft <= 0) { 
        if (isLocalFinished) return;
        setIsLocalFinished(true);
        if (isMultiplayer && connection) {
            connection.send({ 
                type: 'PLAYER_FINISHED', 
                payload: { score: score, itemsUsed: itemsUsedStats} 
            } as MultiPlayerMessage);
        }
        return; 
    }
    const interval = setInterval(() => {
      if (!isFrozen && !isLocalFinished) {
        setTimeLeft((prev) => {
          const reduction = 1 * speedMultiplier;
          const newTime = Math.max(0, prev - reduction);
          if (isMultiplayer && connection) {
             connection.send({ type: 'TIME_UPDATE', payload: Math.ceil(newTime) } as MultiPlayerMessage);
          }
          return newTime;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, isMultiplayer, connection, isFrozen, speedMultiplier, score, isLocalFinished]); 

  useEffect(() => {
    if (streak > 0) {
      const timer = setTimeout(() => {
        setStreak(0);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  const getCellFromCoords = useCallback((clientX: number, clientY: number, clampToEdge: boolean = false): Position | null => {
    if (!gridRef.current || !gridRectRef.current) return null;
    const rect = gridRectRef.current;
    const isOutside = clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
    if (isOutside && !clampToEdge) return null;
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = rect.height / GRID_ROWS;
    return { 
      row: Math.max(0, Math.min(Math.floor((clientY - rect.top) / cellHeight), GRID_ROWS - 1)),
      col: Math.max(0, Math.min(Math.floor((clientX - rect.left) / cellWidth), GRID_COLS - 1))
    };
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    if (isProcessing || shuffleMessage || isLocalFinished) return; 
    if (gridRef.current) gridRectRef.current = gridRef.current.getBoundingClientRect();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    const pos = getCellFromCoords(clientX, clientY, true); 
    if (pos && !grid[pos.row][pos.col].isRemoved) setDragState({ isDragging: true, startPos: pos, currentPos: pos });
  };
  
  const handleMove = (clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;
    const pos = getCellFromCoords(clientX, clientY, true);
    if (pos) {
        if (pos.row !== dragState.currentPos?.row || pos.col !== dragState.currentPos?.col) {
            setDragState((prev) => ({ ...prev, currentPos: pos }));
        }
    }
  };

  const handleEnd = () => {
     if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) { setDragState({ isDragging: false, startPos: null, currentPos: null }); return; }
     
     const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
     const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
     const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
     const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);
     
     let currentSum = 0; 
     const selectedCells: Position[] = []; 
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
     
     const isMagicValid = magicActive && selectedCells.length > 0 && selectedCells.length <= 4;
 
     if (isMagicValid || currentSum === TARGET_SUM) {
       if (magicActive && isMagicValid) { setMagicActive(false); setEffectMessage(null); }
       processMatch(selectedCells);
     } else if (selectedCells.length > 0) {
       playSynthSound('wrong'); 
       setTimeLeft(prev => Math.max(0, prev - 5)); 
       setStreak(0);
       const newErrorSet = new Set(idsToCheck);
       setErrorCellIds(newErrorSet);
       setTimeout(() => { setErrorCellIds(new Set()); }, 400);
     }
     setDragState({ isDragging: false, startPos: null, currentPos: null });
  };

  const isCellSelected = useCallback((r: number, c: number) => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.currentPos) return false;
    const minRow = Math.min(dragState.startPos.row, dragState.currentPos.row);
    const maxRow = Math.max(dragState.startPos.row, dragState.currentPos.row);
    const minCol = Math.min(dragState.startPos.col, dragState.currentPos.col);
    const maxCol = Math.max(dragState.startPos.col, dragState.currentPos.col);
    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  }, [dragState]);

  const processMatch = (cellsToRemove: Position[]) => {
    if (isLocalFinished) return; 
    setIsProcessing(true);
    playSynthSound('correct'); 
    
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    const basePoints = cellsToRemove.length * BASE_SCORE;
    const streakBonus = newStreak * 10; 
    let totalAdded = (basePoints + streakBonus);
    totalAdded = Math.floor(totalAdded * scoreMultiplier * scoreDebuff);

    const newScore = score + totalAdded;
    setScore(newScore);
    setTimeLeft(prev => prev + 1); 
    setBonusText({ text: `+${totalAdded}`, id: Date.now(), color: scoreMultiplier > 1 ? 'text-green-400' : 'text-yellow-400' });
    setTimeout(() => setBonusText(null), 1000);

    if (isMultiplayer && inventory.length < 3 && Math.random() < 0.3) {
      const currentItemTypes = inventory.map(i => i.type);
      const newItemType = getRandomItemType(currentItemTypes);
      if (newItemType) {
        const newItem: GameItem = { id: generateId(), type: newItemType, receivedAt: Date.now() };
        setInventory(prev => [...prev, newItem]);
        playSynthSound('powerup');
        const itemConfig = ITEM_CONFIG[newItemType];
        setEffectMessage({ text: `Nhận: ${itemConfig.name}`, icon: itemConfig.icon, subText: itemConfig.desc });
        setTimeout(() => setEffectMessage(null), 2500); 
      }
    }

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    cellsToRemove.forEach(pos => { newGrid[pos.row][pos.col].isRemoved = true; });
    setGrid(newGrid);
    
    if (isMultiplayer && connection) {
      connection.send({ type: 'UPDATE_SCORE', payload: { score: newScore } } as MultiPlayerMessage);
      connection.send({ type: 'GRID_UPDATE', payload: { grid: newGrid, opponentName: myName, opponentAvatar: myAvatar } } as MultiPlayerMessage);
    }
    setTimeout(() => setIsProcessing(false), 150);
  };
  
  const handleUseItem = (item: GameItem) => {
      setInventory(prev => prev.filter(i => i.id !== item.id));
      playSynthSound(item.type); 
      setItemsUsedStats(prev => ({...prev, [item.type]: (prev[item.type] || 0) + 1}));
      switch (item.type) {
        case 'MAGIC': setMagicActive(true); setEffectMessage({ text: "Xoài Thần Kỳ", icon: "🌈", subText: "Chọn bừa cũng đúng!" }); setTimeout(() => setEffectMessage(null), 2000); break;
        case 'FREEZE': setIsFrozen(true); setEffectMessage({ text: "Đóng Băng", icon: "❄️", subText: "Dừng giờ 5s" }); setTimeout(() => { setIsFrozen(false); setEffectMessage(null); }, 5000); break;
        case 'BUFF_SCORE': setScoreMultiplier(2); setEffectMessage({ text: "X2 Điểm", icon: "🚀", subText: "Nhân đôi điểm 10s" }); setTimeout(() => { setScoreMultiplier(1); setEffectMessage(null); }, 10000); break;
        case 'BOMB': connection?.send({ type: 'ITEM_ATTACK', payload: { effect: 'BOMB' } } as MultiPlayerMessage); break;
        case 'SPEED_UP': connection?.send({ type: 'ITEM_ATTACK', payload: { effect: 'SPEED_UP' } } as MultiPlayerMessage); break;
        case 'DEBUFF_SCORE': connection?.send({ type: 'ITEM_ATTACK', payload: { effect: 'DEBUFF_SCORE' } } as MultiPlayerMessage); break;
        case 'STEAL': 
             // 1. Tính số điểm cướp được (10% điểm đối thủ hoặc ít nhất 100 điểm)
             const amountToSteal = Math.max(100, Math.floor(opponentScore * 0.1));
             
             // 2. Gửi lệnh tấn công sang đối thủ (kèm số điểm muốn cướp)
             connection?.send({ 
                 type: 'ITEM_ATTACK', 
                 payload: { effect: 'STEAL', amount: amountToSteal } 
             } as MultiPlayerMessage); 
             
             // 3. [FIX] Tự cộng điểm cho mình ngay lập tức
             setScore(prev => {
                 const newScore = prev + amountToSteal;
                 // 4. [FIX] Báo cho đối thủ biết điểm mình đã tăng
                 connection?.send({ type: 'UPDATE_SCORE', payload: { score: newScore } } as MultiPlayerMessage);
                 return newScore;
             });
             
             // Hiệu ứng thông báo
             setEffectMessage({ text: "Đã Cướp!", icon: "😈", subText: `+${amountToSteal} điểm` });
             setTimeout(() => setEffectMessage(null), 2000); 
             break;
      }
  };

  const sendEmoji = (item: { type: string, value: string }) => {
      playSynthSound('pop');
      setShowEmojiPicker(false);
      connection?.send({ type: 'SEND_EMOJI', payload: item } as MultiPlayerMessage);
      handleShowEmoji(item);
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

  if (grid.length === 0) return <div className="flex items-center justify-center h-full text-cyan-600 font-bold animate-pulse text-xl bg-cyan-50">Đang tải bản đồ...</div>;

  return (
    <div className="h-full w-full flex flex-col bg-cyan-50 relative overflow-hidden font-sans select-none">
      
      {/* 1. ANIMATED BACKGROUND BLOBS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* SHUFFLE MESSAGE */}
      {shuffleMessage && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center animate-bounce border-4 border-cyan-300">
            <span className="text-5xl mb-3">🔄</span>
            <span className="text-cyan-600 font-black text-2xl">{shuffleMessage}</span>
          </div>
        </div>
      )}

      {/* SCREEN EFFECTS */}
      {isFrozen && <div className="absolute inset-0 bg-blue-300/10 pointer-events-none z-40 border-[6px] border-blue-200 rounded-lg m-1 animate-pulse"></div>}
      {speedMultiplier > 1 && <div className="absolute inset-0 bg-red-300/10 pointer-events-none z-40 border-[6px] border-red-300 rounded-lg m-1"></div>}
      {magicActive && <div className="absolute inset-0 pointer-events-none z-40 border-[6px] border-purple-300/40 opacity-50 animate-pulse rounded-lg m-1"></div>}

      {/* EMOJI DISPLAY (Sửa lại: Bo góc, thêm nền cho sticker chữ) */}
      {incomingEmoji && (
          <div 
             key={incomingEmoji.id} 
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none animate-emoji-pop max-w-[90vw] flex justify-center"
          >
              {incomingEmoji.type === 'image' ? (
                // Sticker ảnh: Bo góc + Viền trắng + Bóng đổ
                <img 
                  src={incomingEmoji.value} 
                  alt="reaction" 
                  className="w-48 h-48 object-contain rounded-[2rem] shadow-2xl border-4 border-white bg-white/20 backdrop-blur-sm" 
                />
              ) : (
                // Sticker chữ: Đóng khung bubble bo tròn
                <div className="bg-white/95 backdrop-blur-md px-8 py-6 rounded-[3rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border-4 border-cyan-100 flex items-center justify-center transform rotate-[-2deg]">
                    <span 
                      className="block font-black text-cyan-500 break-words leading-tight text-center text-4xl sm:text-6xl"
                      style={{ textShadow: '2px 2px 0px #ecfeff' }}
                    >
                      {incomingEmoji.value}
                    </span>
                </div>
              )}
          </div>
      )}

      {/* --- HUD HEADER --- */}
      <div className="relative z-50 pt-2 px-1 pb-1 shrink-0 w-full max-w-2xl mx-auto">
         {/* Top Bar: Time Tube */}
         <div className="w-full max-w-md mx-auto h-2 mb-2 bg-gray-200 rounded-full overflow-hidden shadow-inner relative border border-white/50">
            <div 
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft < 10 ? 'bg-red-400' : 'bg-cyan-400'}`} 
              style={{ width: `${Math.min((timeLeft / GAME_DURATION_SECONDS) * 100, 100)}%` }} 
            />
         </div>

         <div className="flex items-end justify-between w-full gap-0 px-0">
             
             {/* --- LEFT: PLAYER CARD (BỰ HƠN) --- */}
             <div className="flex flex-col items-center bg-white/60 backdrop-blur-md rounded-2xl p-2 border-2 border-white/60 shadow-lg w-28 sm:w-36 min-h-[120px] sm:min-h-[160px] relative transition-transform hover:scale-105 shrink-0">
                 <div className="relative">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-cyan-100 shadow-sm bg-white">
                        {renderAvatar(myAvatar)}
                    </div>
                 </div>
                 <span className="text-[10px] sm:text-xs font-bold text-cyan-700 mt-1 w-full text-center truncate px-1">{myName}</span>
                 
                 {/* SCORE & STREAK ROW */}
                 <div className="flex items-center justify-center gap-1 flex-1 w-full mt-1 min-h-[24px]">
                     <span className="text-xl sm:text-3xl font-black text-cyan-600 leading-none drop-shadow-sm">{score}</span>
                     {streak > 0 && (
                        <div className="flex flex-col items-center w-6 sm:w-8">
                           <span className="text-[8px] sm:text-[10px] font-bold text-orange-500 whitespace-nowrap">🔥x{streak}</span>
                           <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden border border-white/50 shadow-sm">
                              <div key={streak} className="h-full bg-gradient-to-r from-yellow-400 to-red-500" style={{ width: '100%', animation: 'streak-countdown 5s linear forwards' }} />
                           </div>
                        </div>
                     )}
                     {bonusText && <span key={bonusText.id} className={`absolute top-0 left-1/2 -translate-x-1/2 ${bonusText.color || 'text-yellow-400'} font-black text-lg animate-float-up pointer-events-none whitespace-nowrap z-50 drop-shadow-sm`}>{bonusText.text}</span>}
                 </div>
             </div>

             {/* --- CENTER: HEARTBEAT (TOP) + INVENTORY (BOTTOM) --- */}
             <div className="flex-1 flex flex-col items-center justify-end h-full pb-1 gap-1 overflow-hidden">
                 {/* Heartbeat Line (FULL CONNECTED) */}
                 <div className="w-full flex items-center justify-center gap-0 opacity-80 mb-auto mt-2">
                     {/* Left Line: 0 -> 100 */}
                     <svg className="flex-1 h-6 text-red-400" preserveAspectRatio="none" viewBox="0 0 100 20">
                         <path d="M0,10 L70,10 L75,0 L80,20 L85,10 L100,10" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
                     </svg>
                     <div className="text-xl sm:text-2xl animate-heartbeat text-red-500 drop-shadow-sm z-10 -mx-1">❤️</div>
                     {/* Right Line: 0 -> 100 */}
                     <svg className="flex-1 h-6 text-red-400" preserveAspectRatio="none" viewBox="0 0 100 20">
                        <path d="M0,10 L15,10 L20,0 L25,20 L30,10 L100,10" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
                     </svg>
                 </div>

                 {/* INVENTORY */}
                 {isMultiplayer ? (
                   <div className="flex flex-col items-center w-full relative">
                     <div className="flex gap-1 bg-black/5 backdrop-blur-sm p-1 rounded-full border border-white/20">
                        {[0, 1, 2].map(index => {
                          const item = inventory[index];
                          return (
                            <div key={index} className="relative group">
                               <button 
                                 disabled={!item} 
                                 onClick={() => item && handleUseItem(item)} 
                                 className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-lg shadow-sm transition-all active:scale-90 ${item ? `${ITEM_CONFIG[item.type].color} text-white border-2 border-white hover:scale-110 shadow-md` : 'bg-white/40 border-2 border-white/20'}`}
                               >
                                 {item ? ITEM_CONFIG[item.type].icon : ''}
                               </button>
                               {item && <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"><circle cx="50%" cy="50%" r="40%" stroke="white" strokeWidth="2" fill="none" strokeDasharray="100" strokeDashoffset={100 * ((Date.now() - item.receivedAt)/60000)} className="opacity-50" /></svg>}
                            </div>
                          );
                        })}
                     </div>
                     {effectMessage && (
                       <div className="absolute bottom-full mb-2 bg-white/90 backdrop-blur-md text-cyan-800 px-2 py-1 rounded-xl shadow-lg border border-cyan-100 animate-fade-in flex items-center gap-1 z-50 whitespace-nowrap">
                          <span className="text-sm">{effectMessage.icon}</span>
                          <div className="flex flex-col items-start leading-tight">
                             <span className="text-[10px] font-black uppercase text-cyan-600">{effectMessage.text}</span>
                          </div>
                       </div>
                     )}
                   </div>
                 ) : (
                    <div className="opacity-30 text-2xl sm:text-3xl animate-pulse pb-2">🍋</div>
                 )}
             </div>

             {/* --- RIGHT: OPPONENT CARD (BỰ HƠN) --- */}
             <div className="flex flex-col items-center bg-white/60 backdrop-blur-md rounded-2xl p-2 border-2 border-white/60 shadow-lg w-28 sm:w-36 min-h-[120px] sm:min-h-[160px] relative transition-transform hover:scale-105 shrink-0">
                   <div className="relative">
                      <button 
                         onClick={() => { setShowEmojiPicker(!showEmojiPicker); playSynthSound('pop'); }}
                         className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm bg-white active:scale-95 transition-transform"
                      >
                         {renderAvatar(opponentAvatar)}
                      </button>
                      {/* Emoji Picker Dropdown */}
                      {showEmojiPicker && (
                        <div className="absolute top-full right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border-4 border-cyan-200 p-2 grid grid-cols-4 gap-1 w-56 sm:w-64 z-[100] animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                           {REACTION_EMOJIS.map((item, index) => (
                              <button 
                                key={index} 
                                onClick={() => sendEmoji(item)}
                                className="bg-gray-50 hover:bg-cyan-100 p-1 rounded-xl transition-all active:scale-90 flex items-center justify-center aspect-square shadow-sm"
                              >
                                {item.type === 'image' ? (
                                  <img src={item.value} alt="icon" className="w-full h-full object-contain pointer-events-none" />
                                ) : (
                                  <span className="text-lg sm:text-xl font-bold">{item.value}</span>
                                )}
                              </button>
                           ))}
                        </div>
                      )}
                   </div>
                   <span className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1 w-full text-center truncate px-1">{opponentName}</span>
                   
                   {/* SCORE & TIME ROW (Cân bằng với bên trái) */}
                   <div className="flex items-center justify-center gap-2 flex-1 w-full mt-1 min-h-[24px]">
                      <span className="text-xl sm:text-3xl font-black text-gray-600 drop-shadow-sm">{opponentScore}</span>
                      <span className={`text-[9px] sm:text-[10px] font-bold ${opponentTimeLeft < 10 ? 'text-red-400' : 'text-gray-400'} whitespace-nowrap flex flex-col items-center leading-none`}>
                          <span>⏳</span>
                          {Math.ceil(opponentTimeLeft)}s
                      </span>
                   </div>
                </div>
         </div>
      </div>

      {/* --- MAIN GAME GRID --- */}
      <div className="flex-1 flex items-center justify-center p-1 w-full overflow-hidden relative z-10">
        <div 
          className="relative bg-white/30 backdrop-blur-xl rounded-[2rem] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border-4 border-white/40"
          style={{ aspectRatio: `${GRID_COLS}/${GRID_ROWS}`, maxHeight: '100%', maxWidth: '100%' }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          {/* GRID CELLS */}
          <div ref={gridRef} className="w-full h-full" style={{ display: 'grid', gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: '3px' }}>
            
            {/* SELECTION LINE/BOX */}
            {dragState.isDragging && dragState.startPos && dragState.currentPos && (
              <div 
                className={`absolute pointer-events-none border-[5px] rounded-2xl z-50 shadow-[0_0_15px_rgba(255,255,255,0.6)] ${isValidSum || magicActive ? 'border-yellow-400 bg-yellow-300/20' : 'border-cyan-300 bg-cyan-200/20'}`}
                style={{
                  left: `${Math.min(dragState.startPos.col, dragState.currentPos.col) * (100 / GRID_COLS)}%`,
                  top: `${Math.min(dragState.startPos.row, dragState.currentPos.row) * (100 / GRID_ROWS)}%`,
                  width: `${(Math.abs(dragState.currentPos.col - dragState.startPos.col) + 1) * (100 / GRID_COLS)}%`,
                  height: `${(Math.abs(dragState.currentPos.row - dragState.startPos.row) + 1) * (100 / GRID_ROWS)}%`,
                }}
              />
            )}
            
            {grid.map((row, r) => row.map((cell, c) => (
                <div key={`${r}-${c}-${cell.id}`} className="w-full h-full relative p-[1px]">
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

      {/* --- FOOTER CONTROLS --- */}
      <div className="shrink-0 h-14 flex items-center justify-center px-4 pb-2 w-full relative z-50 gap-4">
         {!isMultiplayer && (
           <button onClick={() => window.location.reload()} className="bg-white/80 hover:bg-white text-cyan-600 shadow-lg shadow-cyan-100/50 border-b-4 border-cyan-200 active:border-b-0 active:translate-y-1 px-6 py-2 rounded-2xl font-black text-sm uppercase tracking-wider backdrop-blur-sm transition-all">
             Chơi Lại
           </button>
         )}

         <button 
           onClick={() => setIsMuted(!isMuted)}
           className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 border-b-4 active:border-b-0 active:translate-y-1 ${isMuted ? 'bg-red-100 text-red-500 border-red-200' : 'bg-white/80 text-cyan-600 border-cyan-200'}`}
         >
           {isMuted ? '🔇' : '🔊'}
         </button>
      </div>

      {/* --- GLOBAL STYLES --- */}
      <style>{`
        @keyframes streak-countdown { from { width: 100%; } to { width: 0%; } }
        @keyframes float-up { 
          0% { opacity: 1; transform: translate(-50%, 0) scale(1); } 
          100% { opacity: 0; transform: translate(-50%, -50px) scale(1.5); } 
        }
        .animate-float-up { animation: float-up 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        @keyframes emoji-pop {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(-45deg); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(10deg); }
            70% { transform: translate(-50%, -50%) scale(1.0) rotate(-5deg); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5) rotate(0deg); }
        }
        .animate-emoji-pop { animation: emoji-pop 3.5s ease-out forwards; }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        .animate-heartbeat { animation: heartbeat 1.5s infinite ease-in-out; }
      `}</style>
    </div>
  );
};