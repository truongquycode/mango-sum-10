// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { GameState, MultiPlayerMessage, MatchRecord } from './types';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameOverScreen } from './components/GameOverScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { AVATARS } from './constants';

// Firebase Imports
import { db } from './firebaseConfig';
import { ref, set, update, onValue, push, remove, onDisconnect, child, get } from "firebase/database";

// Giả lập đối tượng DataConnection để không phải sửa Game.tsx
interface MockConnection {
  send: (data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  connectionId: string;
  close: () => void;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [conn, setConn] = useState<MockConnection | null>(null);
  
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Tên & Avatar
  const [myName, setMyName] = useState("Bạn");
  const [myAvatar, setMyAvatar] = useState(AVATARS[0]);
  const [opponentName, setOpponentName] = useState("Đối thủ");
  const [opponentAvatar, setOpponentAvatar] = useState("👤");

  const [isMeReady, setIsMeReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Load dữ liệu cũ
  useEffect(() => {
    const saved = localStorage.getItem('mango-sum10-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
    
    const savedName = localStorage.getItem('mango-player-name');
    if (savedName) setMyName(savedName);

    const savedAvatar = localStorage.getItem('mango-player-avatar');
    if (savedAvatar && AVATARS.includes(savedAvatar)) setMyAvatar(savedAvatar);
  }, []);

  // Tự động start khi cả 2 ready
  useEffect(() => {
    if (isMultiplayer && gameState === GameState.GAME_OVER) {
      if (isMeReady && isOpponentReady) {
        startMultiplayerMatch();
      }
    }
  }, [isMeReady, isOpponentReady, isMultiplayer, gameState]);

  const startMultiplayerMatch = () => {
    setGameState(GameState.PLAYING);
    setOpponentScore(0);
    setFinalScore(0);
    setIsMeReady(false);
    setIsOpponentReady(false);
  };

  const generateRandom4Digit = () => Math.floor(1000 + Math.random() * 9000).toString();

  // --- HÀM TẠO KẾT NỐI FIREBASE (Giả lập PeerJS) ---
  const createFirebaseConnection = (currentRoomId: string, role: 'host' | 'guest') => {
    const messagesRef = ref(db, `rooms/${currentRoomId}/messages`);
    
    // Đối tượng lắng nghe sự kiện
    const listeners: Record<string, Function[]> = {
      data: [],
      close: [],
      open: [] // Thêm open để Game.tsx không bị lỗi nếu có lắng nghe
    };

    // 1. Lắng nghe tin nhắn từ Firebase
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Lấy tin nhắn mới nhất
        const msgKeys = Object.keys(data);
        const lastKey = msgKeys[msgKeys.length - 1];
        const lastMsg = data[lastKey];

        // Chỉ xử lý tin nhắn từ NGƯỜI KHÁC (tránh tự mình nghe mình nói)
        if (lastMsg && lastMsg.sender !== role) {
           // Gọi tất cả hàm đã đăng ký sự kiện 'data'
           listeners['data']?.forEach(cb => cb(lastMsg.payload));
        }
      }
    });

    // 2. Tạo đối tượng Connection giả
    const mockConn: MockConnection = {
      connectionId: currentRoomId,
      
      // Hàm gửi: Đẩy dữ liệu lên Firebase
      send: (payload: any) => {
        push(messagesRef, {
          sender: role,
          payload: payload,
          timestamp: Date.now()
        });
      },

      // Hàm đăng ký sự kiện (giống PeerJS)
      on: (event: string, callback: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      },

      off: (event: string) => {
        listeners[event] = [];
      },

      // Hàm đóng kết nối
      close: () => {
        unsubscribe(); // Hủy lắng nghe Firebase
        // Gọi các hàm on('close') nếu có
        listeners['close']?.forEach(cb => cb());
        setConn(null);
      }
    };

    return mockConn;
  };

  // --- LOGIC TẠO PHÒNG (HOST) ---
  const handleOpenLobby = async () => {
    setIsMultiplayer(true);
    setGameState(GameState.LOBBY);
    
    const newRoomId = generateRandom4Digit();
    setRoomId(newRoomId);
    setIsHost(true);

    // Tạo phòng trên Firebase
    const roomRef = ref(db, `rooms/${newRoomId}`);
    
    // Set dữ liệu ban đầu
    await set(roomRef, {
      createdAt: Date.now(),
      host: { name: myName, avatar: myAvatar, status: 'WAITING' },
      status: 'OPEN'
    });

    // Xóa phòng khi ngắt kết nối (để không rác database)
    onDisconnect(roomRef).remove();

    // Lắng nghe xem có Guest vào không
    const guestRef = child(roomRef, 'guest');
    onValue(guestRef, (snapshot) => {
      const guest = snapshot.val();
      if (guest) {
        // Có người vào!
        setOpponentName(guest.name);
        setOpponentAvatar(guest.avatar);
        
        // Tạo kết nối giả để giao tiếp
        const connection = createFirebaseConnection(newRoomId, 'host');
        setConn(connection);
        
        // Gửi thông tin của mình lại cho Guest
        connection.send({ 
            type: 'START', 
            payload: { name: myName, avatar: myAvatar } 
        } as MultiPlayerMessage);

        setupGameListeners(connection);
        setGameState(GameState.PLAYING);
      }
    });
  };

  // --- LOGIC VÀO PHÒNG (GUEST) ---
  const handleJoinGame = async (inputRoomId: string) => {
    if (inputRoomId.length !== 4) return alert("Mã phòng phải là 4 số!");
    
    setIsConnecting(true);
    const roomRef = ref(db, `rooms/${inputRoomId}`);
    
    try {
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) {
            setIsConnecting(false);
            return alert("Phòng không tồn tại!");
        }

        const roomData = snapshot.val();
        if (roomData.status !== 'OPEN' && !roomData.guest) {
             setIsConnecting(false);
             return alert("Phòng đã đầy hoặc đang chơi!");
        }

        // Lưu thông tin Host
        if (roomData.host) {
            setOpponentName(roomData.host.name);
            setOpponentAvatar(roomData.host.avatar);
        }

        // Cập nhật mình là Guest
        await update(roomRef, {
            guest: { name: myName, avatar: myAvatar, status: 'JOINED' },
            status: 'PLAYING' // Đổi trạng thái phòng
        });

        // Tạo kết nối giả
        const connection = createFirebaseConnection(inputRoomId, 'guest');
        setConn(connection);
        setIsHost(false);
        setRoomId(inputRoomId);

        setupGameListeners(connection);
        setIsConnecting(false);
        setGameState(GameState.PLAYING);

    } catch (error) {
        console.error(error);
        setIsConnecting(false);
        alert("Lỗi kết nối Firebase!");
    }
  };

  // --- LẮNG NGHE SỰ KIỆN GAME (Chung cho cả Host/Guest) ---
  const setupGameListeners = (connection: MockConnection) => {
    connection.on('data', (msg: MultiPlayerMessage) => {
      // Xử lý các tin nhắn game y hệt như cũ
      if (msg.type === 'START') {
        if (msg.payload?.name) setOpponentName(msg.payload.name);
        if (msg.payload?.avatar) setOpponentAvatar(msg.payload.avatar);
      } else if (msg.type === 'UPDATE_SCORE') {
        if (msg.payload.score !== undefined) setOpponentScore(msg.payload.score);
      } else if (msg.type === 'SYNC_MAP') {
        // ... Logic sync map cũ
      } else if (msg.type === 'GRID_UPDATE') {
        // ... Logic grid update cũ
      } else if (msg.type === 'GAME_OVER') {
        setOpponentScore(msg.payload.score);
      } else if (msg.type === 'READY') {
        setIsOpponentReady(true);
      } else if (msg.type === 'REQUEST_MAP' && isHost) {
        // Host gửi map lại (cần xử lý trong Game.tsx thực ra)
        // Vì logic này nằm ở App, ta chỉ chuyển tiếp message thôi
      }
    });
  };

  // --- CÁC HÀM XỬ LÝ KHÁC (Giữ nguyên) ---
  const handleStartSolo = () => {
    setIsMultiplayer(false);
    setIsHost(true);
    setGameState(GameState.PLAYING);
    if (conn) conn.close();
  };

  const handleGameOver = (score: number, itemsUsedStats: Record<string, number>) => {
    setFinalScore(score);
    if (!isMultiplayer) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('mango-sum10-highscore', score.toString());
      }
    }
    setGameState(GameState.GAME_OVER);
    
    if (isMultiplayer && conn) {
      conn.send({ type: 'GAME_OVER', payload: { score } } as MultiPlayerMessage);
    }

    const newRecord: MatchRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        mode: isMultiplayer ? 'MULTIPLAYER' : 'SOLO',
        myName: myName,
        opponentName: isMultiplayer ? opponentName : undefined,
        myScore: score,
        opponentScore: isMultiplayer ? opponentScore : undefined,
        itemsUsed: itemsUsedStats as any
    };

    const currentHistory = localStorage.getItem('mango-match-history');
    let history: MatchRecord[] = currentHistory ? JSON.parse(currentHistory) : [];
    history.push(newRecord);
    if (history.length > 20) history = history.slice(history.length - 20);
    localStorage.setItem('mango-match-history', JSON.stringify(history));
  };

  const handleRestart = () => {
    if (isMultiplayer && conn) {
      setIsMeReady(true);
      conn.send({ type: 'READY' } as MultiPlayerMessage);
    } else {
      setGameState(GameState.PLAYING);
    }
  };

  const handleGoHome = () => {
    // Nếu đang chơi Multiplayer, xóa phòng hoặc rời phòng
    if (roomId) {
        if (isHost) {
            remove(ref(db, `rooms/${roomId}`)); // Host thoát thì xóa phòng
        } else {
            // Guest thoát thì xóa thông tin guest
            remove(ref(db, `rooms/${roomId}/guest`));
        }
    }

    setGameState(GameState.MENU);
    setIsMeReady(false);
    setIsOpponentReady(false);
    setOpponentScore(0);
    setFinalScore(0);
    setIsConnecting(false);
    setRoomId(null);
    if (conn) conn.close();
  };

  const handleUpdateName = (name: string) => {
      setMyName(name);
      localStorage.setItem('mango-player-name', name);
  }

  const handleUpdateAvatar = (avatar: string) => {
      setMyAvatar(avatar);
      localStorage.setItem('mango-player-avatar', avatar);
  }

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-cyan-50">
      {gameState === GameState.MENU && (
        <StartScreen 
          onStart={handleStartSolo} 
          onMultiplayer={handleOpenLobby}
          onOpenHistory={() => setGameState(GameState.HISTORY)}
          highScore={highScore} 
        />
      )}

      {gameState === GameState.HISTORY && (
          <HistoryScreen onBack={() => setGameState(GameState.MENU)} />
      )}

      {gameState === GameState.LOBBY && (
        <LobbyScreen 
          displayId={roomId} // Firebase Room ID
          onJoin={handleJoinGame} 
          onBack={handleGoHome}
          isConnecting={isConnecting}
          myName={myName}
          setMyName={handleUpdateName}
          myAvatar={myAvatar}
          setMyAvatar={handleUpdateAvatar}
        />
      )}
      
      {gameState === GameState.PLAYING && (
        <Game 
          key={isMultiplayer ? `multi-${roomId || Date.now()}` : `solo-${Date.now()}`}
          onGameOver={handleGameOver} 
          isMultiplayer={isMultiplayer}
          isHost={isHost}
          connection={conn as any} // Ép kiểu any để tương thích với Game.tsx cũ
          myName={myName}
          opponentName={opponentName}
          myAvatar={myAvatar}
          opponentAvatar={opponentAvatar}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <>
           <div className="absolute inset-0 opacity-10 pointer-events-none bg-repeat bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
           <GameOverScreen 
             score={finalScore} 
             opponentScore={opponentScore}
             highScore={highScore} 
             onRestart={handleRestart} 
             onHome={handleGoHome}
             isMultiplayer={isMultiplayer}
             isWaitingForOpponent={isMultiplayer && isMeReady && !isOpponentReady}
             myName={myName}
             opponentName={opponentName}
           />
        </>
      )}
    </div>
  );
}