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
import { ref, set, update, onValue, push, remove, onDisconnect, child, get, serverTimestamp } from "firebase/database";

const ID_PREFIX = 'mango-v1-vn-'; 

// Giả lập đối tượng kết nối để tương thích với Game.tsx
interface MockConnection {
  send: (data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  close: () => void;
  open: boolean; // Thêm thuộc tính open
  peerConnection?: any; // Thêm để tránh lỗi access property
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Room State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [conn, setConn] = useState<MockConnection | null>(null);
  
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Player Info
  const [myName, setMyName] = useState("Bạn");
  const [myAvatar, setMyAvatar] = useState(AVATARS[0]);
  const [opponentName, setOpponentName] = useState("Đối thủ");
  const [opponentAvatar, setOpponentAvatar] = useState("👤");

  const [isMeReady, setIsMeReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Load Highscore
  useEffect(() => {
    const saved = localStorage.getItem('mango-sum10-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
    
    const savedName = localStorage.getItem('mango-player-name');
    if (savedName) setMyName(savedName);

    const savedAvatar = localStorage.getItem('mango-player-avatar');
    if (savedAvatar && AVATARS.includes(savedAvatar)) setMyAvatar(savedAvatar);
  }, []);

  // Auto Start when both ready
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

  // --- HÀM TẠO KẾT NỐI FIREBASE ---
  const createFirebaseConnection = (currentRoomId: string, role: 'host' | 'guest') => {
    const messagesRef = ref(db, `rooms/${currentRoomId}/messages`);
    
    const listeners: Record<string, Function[]> = {
      data: [],
      close: [],
      open: []
    };

    // Lắng nghe tin nhắn từ Firebase
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgKeys = Object.keys(data);
        // Chỉ lấy tin nhắn mới nhất (hoặc xử lý logic queue nếu cần, nhưng game này realtime đơn giản)
        // Ở đây ta duyệt qua các tin nhắn mới thêm vào nếu dùng child_added sẽ tốt hơn, 
        // nhưng onValue đơn giản cho demo.
        // Cải tiến: Dùng timestamp hoặc ID để tránh xử lý lại.
        // Cách đơn giản nhất cho game turn-based/realtime này:
        const lastKey = msgKeys[msgKeys.length - 1];
        const lastMsg = data[lastKey];

        // Quan trọng: Chỉ nhận tin từ ĐỐI PHƯƠNG (người khác role với mình)
        // và tin nhắn phải mới (có thể check timestamp > thời điểm vào phòng)
        if (lastMsg && lastMsg.sender !== role) {
           // Hack nhỏ: Đánh dấu đã xử lý local hoặc chỉ trigger nếu chưa xử lý
           // Để đơn giản, ta trigger luôn. Game logic sẽ tự lọc (ví dụ update score)
           listeners['data']?.forEach(cb => cb(lastMsg.payload));
        }
      }
    });

    const mockConn: MockConnection = {
      open: true,
      
      send: (payload: any) => {
        push(messagesRef, {
          sender: role,
          payload: payload,
          timestamp: serverTimestamp()
        });
      },

      on: (event: string, callback: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        // Nếu đăng ký sự kiện open, gọi ngay lập tức vì Firebase luôn online
        if (event === 'open') setTimeout(() => callback(), 100);
      },

      off: (event: string) => {
        listeners[event] = [];
      },

      close: () => {
        unsubscribe();
        listeners['close']?.forEach(cb => cb());
        setConn(null);
      }
    };

    return mockConn;
  };

  // --- HOST TẠO PHÒNG ---
  const handleOpenLobby = async () => {
    setIsMultiplayer(true);
    setGameState(GameState.LOBBY);
    
    const newRoomId = generateRandom4Digit();
    setRoomId(newRoomId);
    setIsHost(true);

    const roomRef = ref(db, `rooms/${newRoomId}`);
    
    // Set dữ liệu phòng
    await set(roomRef, {
      createdAt: serverTimestamp(),
      host: { name: myName, avatar: myAvatar, status: 'WAITING' },
      status: 'OPEN'
    });

    // Tự động xóa phòng khi mất kết nối
    onDisconnect(roomRef).remove();

    // Lắng nghe người vào (Guest)
    const guestRef = child(roomRef, 'guest');
    onValue(guestRef, (snapshot) => {
      const guest = snapshot.val();
      if (guest) {
        setOpponentName(guest.name);
        setOpponentAvatar(guest.avatar);
        
        // Kết nối thành công!
        const connection = createFirebaseConnection(newRoomId, 'host');
        setConn(connection);
        
        // Gửi thông tin mình cho Guest
        connection.send({ 
            type: 'START', 
            payload: { name: myName, avatar: myAvatar } 
        } as MultiPlayerMessage);

        setupGameListeners(connection);
        setGameState(GameState.PLAYING);
      }
    });
  };

  // --- GUEST VÀO PHÒNG ---
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

        // Cập nhật thông tin Host
        if (roomData.host) {
            setOpponentName(roomData.host.name);
            setOpponentAvatar(roomData.host.avatar);
        }

        // Vào phòng
        await update(roomRef, {
            guest: { name: myName, avatar: myAvatar, status: 'JOINED' },
            status: 'PLAYING'
        });
        
        // Đăng ký xóa thông tin mình khi thoát
        onDisconnect(child(roomRef, 'guest')).remove();

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
        alert("Lỗi kết nối Server!");
    }
  };

  // --- LẮNG NGHE GAME EVENTS ---
  const setupGameListeners = (connection: MockConnection) => {
    connection.on('data', (msg: MultiPlayerMessage) => {
      if (msg.type === 'START') {
        if (msg.payload?.name) setOpponentName(msg.payload.name);
        if (msg.payload?.avatar) setOpponentAvatar(msg.payload.avatar);
      } else if (msg.type === 'UPDATE_SCORE') {
        if (msg.payload.score !== undefined) setOpponentScore(msg.payload.score);
      } else if (msg.type === 'GAME_OVER') {
        setOpponentScore(msg.payload.score);
      } else if (msg.type === 'READY') {
        setIsOpponentReady(true);
      } else if (msg.type === 'REQUEST_MAP' && isHost) {
        // App.tsx không giữ state Grid, nên việc này sẽ do Game.tsx xử lý thông qua props connection
        // Nhưng vì MockConnection đã forward event 'data', Game.tsx sẽ nhận được và tự xử lý.
      }
    });
  };

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
    if (roomId) {
        const roomRef = ref(db, `rooms/${roomId}`);
        if (isHost) {
            remove(roomRef);
        } else {
            remove(child(roomRef, 'guest'));
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
          displayId={roomId} 
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
          connection={conn as any} 
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