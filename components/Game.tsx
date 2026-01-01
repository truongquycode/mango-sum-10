// components/Game.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataConnection } from 'peerjs';
import { GRID_ROWS, GRID_COLS, TARGET_SUM, GAME_DURATION_SECONDS, BASE_SCORE } from '../constants';
import { Position, MangoCell, DragState, MultiPlayerMessage, GameItem, ItemType } from '../types';
import { MangoIcon } from './MangoIcon';
import { ITEM_CONFIG, REACTION_EMOJIS } from '../constants';

interface GameProps {
  // Thêm tham số `opponentItemsUsed` vào cuối
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
// Trong Game.tsx

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

// Thay thế hàm createInitialGrid cũ bằng hàm này
const createInitialGrid = (): MangoCell[][] => {
  const grid: MangoCell[][] = [];
  const totalCells = GRID_ROWS * GRID_COLS;
  
  // 1. Tạo danh sách các số đảm bảo giải được (như cũ)
  const solvableValues = generateSolvableValues(totalCells);
  
  let valueIndex = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    const row: MangoCell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      
      // --- LOGIC MỚI: TRÁNH TRÙNG LẶP HÀNG XÓM (NEIGHBOR CHECK) ---
      
      // Lấy giá trị dự định đặt vào
      let currentValue = solvableValues[valueIndex];

      // Lấy giá trị của ô bên TRÁI (nếu có)
      const leftValue = c > 0 ? row[c - 1].value : -1;
      
      // Lấy giá trị của ô bên TRÊN (nếu có)
      const topValue = r > 0 ? grid[r - 1][c].value : -1;

      // Kiểm tra xem có bị trùng không?
      // Điều kiện: Trùng bên trái HOẶC trùng bên trên
      const isConflict = (currentValue === leftValue) || (currentValue === topValue);

      if (isConflict) {
        // Nếu bị trùng, hãy tìm trong danh sách các số còn lại (look-ahead)
        // để kiếm một số khác thế chỗ.
        let swapFound = false;
        
        for (let k = valueIndex + 1; k < solvableValues.length; k++) {
          const candidate = solvableValues[k];
          
          // Kiểm tra xem ứng viên này có ổn không (không trùng trái, không trùng trên)
          if (candidate !== leftValue && candidate !== topValue) {
            // ĐẶC BIỆT: Nếu ô bên cạnh là 5, ta rất hạn chế đặt số 5 vào cạnh nó
            // (Ưu tiên đẩy số 5 ra xa nhau hơn các số khác)
            if ((leftValue === 5 || topValue === 5) && candidate === 5) {
               continue; // Bỏ qua, tìm số khác
            }

            // Tìm thấy số hợp lý! Tráo đổi vị trí trong mảng nguồn
            [solvableValues[valueIndex], solvableValues[k]] = [solvableValues[k], solvableValues[valueIndex]];
            currentValue = solvableValues[valueIndex]; // Cập nhật lại giá trị hiện tại
            swapFound = true;
            break; // Dừng tìm kiếm
          }
        }
        
        // Nếu không tìm thấy số nào thay thế (trường hợp hiếm ở cuối mảng),
        // ta đành chấp nhận số hiện tại.
      }
      // -----------------------------------------------------------

      row.push({
        id: generateId(),
        value: currentValue || 5, // Fallback an toàn
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
  const [opponentItemsStats, setOpponentItemsStats] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(false);
  const startTimeRef = useRef(Date.now());

  const renderAvatar = (avatar: any) => {
    // Nếu chưa có avatar hoặc là string cũ (emoji text)
    if (!avatar) return <span>👤</span>;
    if (typeof avatar === 'string') return <span>{avatar}</span>;

    // Nếu là dạng Object mới (Hỗ trợ ảnh)
    if (avatar.type === 'image') {
      return (
        <img 
          src={avatar.value} 
          alt="avatar" 
          className="w-full h-full object-cover pointer-events-none" 
        />
      );
    }
    // Nếu là text
    return <span>{avatar.value}</span>;
  };
  
  // --- STATE MỚI ĐỂ QUẢN LÝ KẾT THÚC ---
  const [isLocalFinished, setIsLocalFinished] = useState(false);
  const [isOpponentFinished, setIsOpponentFinished] = useState(false);
  const isGameEndedRef = useRef(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false, startPos: null, currentPos: null,
  });
  const gridRef = useRef<HTMLDivElement>(null);

  // --- AUDIO ---
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

  // --- SYNTH SOUND ---
  const playSynthSound = useCallback((type: string, variant?: string) => {
    if (isMuted || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    const currTime = ctx.currentTime;
    
    // Logic âm thanh (giản lược để gọn, giữ nguyên logic cũ của bạn)
    switch (type) {
        case 'correct': osc.type = 'sine'; osc.frequency.setValueAtTime(800 + (streak*50), currTime); break;
        case 'wrong': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, currTime); break;
        default: osc.type = 'triangle'; osc.frequency.setValueAtTime(400, currTime); break;
    }
    gainNode.gain.setValueAtTime(0.1, currTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.3);
    osc.start(); osc.stop(currTime + 0.3);
  }, [isMuted, streak]);

  // --- LOGIC MAP ---
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
    if (grid.length === 0 || isLocalFinished) return; // Không shuffle nếu đã xong
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

  // --- XỬ LÝ NHẬN DATA (Update logic PLAYER_FINISHED) ---
  useEffect(() => {
    if (!isMultiplayer || !connection) return;
    const handleData = (data: any) => {
      const msg = data as MultiPlayerMessage;
      
      // LOGIC MỚI: Đối thủ báo đã xong
      if (msg.type === 'PLAYER_FINISHED') {
         setIsOpponentFinished(true);
         if (msg.payload?.score !== undefined) setOpponentScore(msg.payload.score);
         if (msg.payload?.itemsUsed) {
             setOpponentItemsStats(msg.payload.itemsUsed);
         }
         return;
      }
      
      // Legacy support
      if (msg.type === 'GAME_OVER') {
         setIsOpponentFinished(true);
         if (msg.payload?.score !== undefined) setOpponentScore(msg.payload.score);
         return;
      }

      if (msg.type === 'REQUEST_MAP' && isHost) {
        connection.send({ type: 'GRID_UPDATE', payload: { grid, score, opponentName: myName, opponentAvatar: myAvatar } } as MultiPlayerMessage);
      }
      if (msg.type === 'SEND_EMOJI') {
          // Nhận cả payload (gồm type và value)
          setIncomingEmoji({ ...msg.payload, id: Date.now() });
          setTimeout(() => setIncomingEmoji(null), 3000);
      }
      if (msg.type === 'ITEM_ATTACK') {
          const { effect } = msg.payload;
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
             const stolen = Math.floor(score * 0.1);
             setScore(prev => prev - stolen);
             setEffectMessage({ text: "Bị Cướp!", icon: "😈", subText: `Mất ${stolen} điểm` });
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

  // --- CHECK KẾT THÚC GAME TOÀN CỤC ---
  // --- CHECK KẾT THÚC GAME TOÀN CỤC ---
  useEffect(() => {
    if (isGameEndedRef.current) return;

    // Tính thời gian thực tế
    const actualDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    // Lấy thời gian bắt đầu
    const startTime = startTimeRef.current; // <--- LẤY GIÁ TRỊ NÀY

    // Solo: Hết giờ là xong
    if (!isMultiplayer && isLocalFinished) {
        isGameEndedRef.current = true;
        // Truyền thêm startTime vào cuối
        onGameOver(score, itemsUsedStats, 0, {}, actualDuration, startTime); 
    } 
    // Multiplayer: CẢ 2 PHẢI CÙNG XONG
    else if (isMultiplayer && isLocalFinished && isOpponentFinished) {
        isGameEndedRef.current = true;
        setTimeout(() => {
            // Truyền thêm startTime vào cuối
            onGameOver(score, itemsUsedStats, opponentScore, opponentItemsStats, actualDuration, startTime);
        }, 1000);
    }
  }, [isLocalFinished, isOpponentFinished, isMultiplayer, score, itemsUsedStats, opponentScore, opponentItemsStats, onGameOver]);

  // --- XỬ LÝ HẾT GIỜ CỤC BỘ ---
  useEffect(() => {
    if (timeLeft <= 0) { 
        if (isLocalFinished) return;
        
        // Đánh dấu mình đã xong
        setIsLocalFinished(true);

        // Gửi tin báo cho đối thủ
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
      // Đặt hẹn giờ 5 giây (khớp với animation CSS)
      const timer = setTimeout(() => {
        setStreak(0);
      }, 5000);

      // Nếu streak thay đổi (ăn thêm) trước khi hết giờ,
      // thì hủy hẹn giờ cũ để đếm lại từ đầu
      return () => clearTimeout(timer);
    }
  }, [streak]);

  // --- INTERACTION ---
  const handleStart = (clientX: number, clientY: number) => {
    // CHẶN THAO TÁC KHI ĐÃ HẾT GIỜ (NHƯNG KHÔNG CHE MÀN HÌNH)
    if (isProcessing || shuffleMessage || isLocalFinished) return; 

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

  const processMatch = (cellsToRemove: Position[]) => {
    if (isLocalFinished) return; // Chặn ghi điểm nếu đã xong
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
      // Giữ nguyên logic item
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
        case 'STEAL': connection?.send({ type: 'ITEM_ATTACK', payload: { effect: 'STEAL', amount: Math.floor(opponentScore * 0.1) } } as MultiPlayerMessage); break;
      }
  };

  const sendEmoji = (item: { type: string, value: string }) => {
      playSynthSound('pop');
      setShowEmojiPicker(false);
      
      // Gửi nguyên object { type, value } qua mạng
      connection?.send({ type: 'SEND_EMOJI', payload: item } as MultiPlayerMessage);
      
      // Hiển thị ở máy mình
      setIncomingEmoji({ ...item, id: Date.now() });
      setTimeout(() => setIncomingEmoji(null), 3000);
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

  if (grid.length === 0) return <div className="flex items-center justify-center h-full text-white font-bold animate-pulse text-xl">Đang tải bản đồ...</div>;

  return (
    <div className="h-full w-full flex flex-col bg-[#06b6d4] select-none touch-none overflow-hidden relative">
      
      {/* SHUFFLE MESSAGE */}
      {shuffleMessage && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce border-4 border-cyan-500">
            <span className="text-4xl mb-2">🔄</span>
            <span className="text-cyan-600 font-black text-xl">{shuffleMessage}</span>
          </div>
        </div>
      )}

      {/* SCREEN EFFECTS */}
      {isFrozen && <div className="absolute inset-0 bg-blue-500/20 pointer-events-none z-40 animate-pulse border-4 border-blue-300"></div>}
      {speedMultiplier > 1 && <div className="absolute inset-0 bg-red-500/10 pointer-events-none z-40 border-4 border-red-400"></div>}
      {magicActive && <div className="absolute inset-0 pointer-events-none z-40 border-8 border-purple-400 opacity-50 animate-pulse"></div>}

      {/* INCOMING EMOJI ANIMATION */}
      {incomingEmoji && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-none drop-shadow-2xl animate-emoji-pop">
              {incomingEmoji.type === 'image' ? (
                // Nếu là ẢNH: Render thẻ img
                <img 
                  src={incomingEmoji.value} 
                  alt="reaction" 
                  className="w-32 h-32 sm:w-48 sm:h-48 object-contain" // Chỉnh kích thước ảnh tại đây
                />
              ) : (
                // Nếu là TEXT: Render chữ như cũ
                <span className="text-6xl sm:text-9xl whitespace-nowrap font-black text-white stroke-black" style={{ textShadow: '4px 4px 0 #000' }}>
                  {incomingEmoji.value}
                </span>
              )}
          </div>
      )}

      {/* HUD (Giữ nguyên) */}
      <div className="shrink-0 p-2 sm:p-4 w-full max-w-2xl mx-auto z-50">
        <div className="bg-[#e0f7fa] rounded-2xl border-4 border-[#00838f] shadow-md p-2 relative min-h-[90px] flex items-center">
           <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 overflow-hidden rounded-b-xl">
             <div className={`h-full transition-all duration-1000 linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-[#00bcd4]'}`} style={{ width: `${Math.min((timeLeft / GAME_DURATION_SECONDS) * 100, 100)}%` }} />
           </div>
           <div className="flex items-center w-full justify-between px-2 pb-1 relative z-10">
             
             {/* LEFT: PLAYER */}
             <div className="flex flex-col items-center relative min-w-[80px] w-32 sm:w-44">
               <span className="text-[10px] sm:text-xs font-bold text-[#00838f] uppercase truncate max-w-[100px] text-center leading-tight mb-1">
                 {myName}
               </span>
               <div className="relative">
                 <div className="text-3xl filter drop-shadow-md w-12 h-12 flex items-center justify-center overflow-hidden rounded-full bg-white/20 border-2 border-white/50">
                    {renderAvatar(myAvatar)}
                 </div>
                 {streak > 0 && (
                   <div className="absolute right-12 top-full mt-2 flex flex-col items-center animate-bounce z-50">
                     <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border-2 border-white">
                       🔥 x{streak}
                     </span>
                     <div className="w-10 h-1 bg-gray-300 mt-1 rounded-full overflow-hidden shadow-inner border border-white/50">
                        <div key={streak} className="h-full bg-orange-500" style={{ width: '100%', animation: 'streak-countdown 5s linear forwards' }} />
                     </div>
                   </div>
                 )}
               </div>
               <div className="relative mt-1">
                 <span className="text-2xl font-black text-[#006064] leading-none">{score}</span>
                 {bonusText && <span key={bonusText.id} className={`absolute -top-6 left-1/2 -translate-x-1/2 ${bonusText.color || 'text-yellow-400'} font-black text-2xl animate-float-up pointer-events-none drop-shadow-md whitespace-nowrap z-50`}>{bonusText.text}</span>}
               </div>
             </div>

             {/* CENTER: INVENTORY */}
             {isMultiplayer && (
               <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center z-50 pointer-events-auto">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(index => {
                      const item = inventory[index];
                      return (
                        <div key={index} className="relative group">
                          <button disabled={!item} onClick={() => item && handleUseItem(item)} className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg shadow-sm transition-all active:scale-95 ${item ? `${ITEM_CONFIG[item.type].color} border-white text-white cursor-pointer hover:scale-110 shadow-md` : 'bg-black/5 border-black/10 cursor-default'}`}>{item ? ITEM_CONFIG[item.type].icon : ''}</button>
                          {item && <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"><circle cx="18" cy="18" r="16" stroke="white" strokeWidth="2" fill="none" strokeDasharray="100" strokeDashoffset={100 * ((Date.now() - item.receivedAt)/60000)} className="opacity-40" /></svg>}
                        </div>
                      );
                    })}
                  </div>
                  {effectMessage && <div className="absolute top-full mt-2 bg-black/80 text-white px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm border border-white/20 animate-fade-in flex items-center gap-2 min-w-max z-50"><span className="text-xl">{effectMessage.icon}</span><div className="flex flex-col items-start"><span className="text-xs font-bold text-yellow-300 uppercase">{effectMessage.text}</span>{effectMessage.subText && <span className="text-[10px] text-gray-200">{effectMessage.subText}</span>}</div></div>}
               </div>
             )}

             {/* RIGHT: OPPONENT */}
             {isMultiplayer && (
               <div className="flex flex-col items-center relative min-w-[80px] w-32 sm:w-44 relative overflow-visible">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase truncate max-w-[100px] text-center leading-tight mb-1">{opponentName}</span>
                  <div className="relative">
                      <button 
                        onClick={() => { setShowEmojiPicker(!showEmojiPicker); playSynthSound('pop'); }} 
                        className="text-3xl filter drop-shadow-md hover:scale-110 transition-transform cursor-pointer relative z-50 outline-none active:scale-95 w-12 h-12 flex items-center justify-center overflow-hidden rounded-full bg-white/20 border-2 border-white/50"
                      >
                         {renderAvatar(opponentAvatar)}
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border-4 border-cyan-500 p-2 grid grid-cols-4 gap-2 w-72 z-[100] animate-fade-in max-h-60 overflow-y-auto">
                          {REACTION_EMOJIS.map((item, index) => (
                            <button 
                              key={index} 
                              onClick={() => sendEmoji(item)} // Truyền cả object item
                              className="hover:bg-gray-100 p-1 rounded-lg transition-colors active:scale-90 flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16"
                            >
                              {item.type === 'image' ? (
                                <img src={item.value} alt="icon" className="w-full h-full object-contain pointer-events-none" />
                              ) : (
                                <span className="text-xl sm:text-2xl font-bold leading-none break-words text-center">{item.value}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-gray-600 leading-none">{opponentScore}</span>
                    <span className={`text-[10px] font-mono ${opponentTimeLeft < 10 ? 'text-red-500' : 'text-gray-400'}`}>{Math.ceil(opponentTimeLeft)}s</span>
                  </div>
               </div>
             )}
           </div>
        </div>
      </div>

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
              <div className={`absolute pointer-events-none border-4 rounded-xl z-50 transition-colors shadow-lg ${isValidSum || magicActive ? 'border-red-500 bg-red-500/10' : 'border-cyan-200 bg-cyan-100/30'}`}
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
      <style>{`
        @keyframes streak-countdown { from { width: 100%; } to { width: 0%; } }
        @keyframes float-up { 
          0% { opacity: 1; transform: translate(-50%, 0) scale(1); } 
          100% { opacity: 0; transform: translate(-50%, -40px) scale(1.5); } 
        }
        .animate-float-up { animation: float-up 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes emoji-pop {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        .animate-emoji-pop { animation: emoji-pop 2s ease-out forwards; }
      `}</style>
    </div>
  );
};