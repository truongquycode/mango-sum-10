import React, { useState, useEffect, useRef } from 'react';
import { GameState, MultiPlayerMessage, MatchRecord } from './types';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameOverScreen } from './components/GameOverScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { HistoryScreen } from './components/HistoryScreen';
import Peer, { DataConnection } from 'peerjs';
import { AVATARS } from './constants';

const ID_PREFIX = 'mango-v1-vn-'; 

// --- CẤU HÌNH SERVER KẾT NỐI (Dùng Key Riêng Metered.ca của bạn) ---
const PEER_CONFIG = {
  config: {
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "75f2e0223b2f2c0f1252807c",
        credential: "B2M8G/eb5kzcQLWr",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "75f2e0223b2f2c0f1252807c",
        credential: "B2M8G/eb5kzcQLWr",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "75f2e0223b2f2c0f1252807c",
        credential: "B2M8G/eb5kzcQLWr",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "75f2e0223b2f2c0f1252807c",
        credential: "B2M8G/eb5kzcQLWr",
      },
  ],
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Multiplayer State
  const [peer, setPeer] = useState<Peer | null>(null);
  const [displayId, setDisplayId] = useState<string | null>(null);
  
  const [conn, setConn] = useState<DataConnection | null>(null);
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

  const peerInstance = useRef<Peer | null>(null);

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

  // --- PeerJS Logic (Xử lý kết nối) ---
  const setupConnectionListeners = (connection: DataConnection) => {
    setConn(connection);
    
    const handleOpen = () => {
      console.log("Đã kết nối với:", connection.peer);
      setIsConnecting(false);
      setGameState(GameState.PLAYING);
      // Gửi thông tin cá nhân ngay khi kết nối
      connection.send({ type: 'START', payload: { name: myName, avatar: myAvatar } } as MultiPlayerMessage);
    };

    if (connection.open) { handleOpen(); } else { connection.on('open', handleOpen); }

    connection.on('data', (data: any) => {
      const msg = data as MultiPlayerMessage;
      
      if (msg.type === 'START') {
        if (msg.payload?.name) setOpponentName(msg.payload.name);
        if (msg.payload?.avatar) setOpponentAvatar(msg.payload.avatar);
      } else if (msg.type === 'UPDATE_SCORE') {
        if (msg.payload.score !== undefined) setOpponentScore(msg.payload.score);
      } else if (msg.type === 'SYNC_MAP') {
        if (msg.payload.opponentName) setOpponentName(msg.payload.opponentName);
        if (msg.payload.opponentAvatar) setOpponentAvatar(msg.payload.opponentAvatar);
      } else if (msg.type === 'GRID_UPDATE') {
        if (msg.payload.opponentName) setOpponentName(msg.payload.opponentName);
        if (msg.payload.opponentAvatar) setOpponentAvatar(msg.payload.opponentAvatar);
        if (msg.payload.score !== undefined) setOpponentScore(msg.payload.score);
      } else if (msg.type === 'GAME_OVER') {
        setOpponentScore(msg.payload.score);
      } else if (msg.type === 'READY') {
        setIsOpponentReady(true);
      } else if (msg.type === 'REQUEST_MAP' && isHost) {
        // Host gửi map cho người mới vào
        connection.send({ 
            type: 'GRID_UPDATE', 
            payload: { 
                grid: [], // Game.tsx sẽ tự điền grid thực tế vào sau
                score: 0, 
                opponentName: myName,
                opponentAvatar: myAvatar 
            } 
        } as MultiPlayerMessage);
      }
    });

    connection.on('close', () => {
      alert("Đối thủ đã thoát!");
      handleGoHome();
    });

    connection.on('error', (err) => {
        console.error("Lỗi kết nối:", err);
        handleGoHome();
    });
  };

  const generateRandom4Digit = () => Math.floor(1000 + Math.random() * 9000).toString();

  // --- TẠO PHÒNG (HOST) ---
  const initializePeer = () => {
    if (peerInstance.current) return; 

    // QUAN TRỌNG: Tạo ID ngắn 4 số để dễ nhập
    const shortCode = generateRandom4Digit();
    const fullId = ID_PREFIX + shortCode;

    // Dùng config Metered.ca
    const newPeer = new Peer(fullId, PEER_CONFIG);

    peerInstance.current = newPeer;

    newPeer.on('open', (id) => {
      console.log('ID của tôi:', id);
      setPeer(newPeer);
      setDisplayId(shortCode); // Chỉ hiển thị 4 số
    });

    newPeer.on('connection', (connection) => {
      console.log("Có người kết nối vào...");
      setIsHost(true);
      setupConnectionListeners(connection);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        peerInstance.current = null;
        setPeer(null);
        setTimeout(initializePeer, 500); // Thử lại nếu ID trùng
      } else {
        setIsConnecting(false);
        alert("Lỗi mạng: " + err.type + ". Hãy thử chuyển Wifi/4G.");
      }
    });
  };

  // --- VÀO PHÒNG (JOINER) ---
  const connectToPeer = (shortCode: string) => {
    setIsConnecting(true); 
    
    const performConnect = (peerToUse: Peer) => {
        // Tái tạo lại ID đầy đủ từ mã 4 số
        const fullHostId = ID_PREFIX + shortCode;
        console.log("Đang kết nối tới:", fullHostId);
        setIsHost(false);
        
        const connection = peerToUse.connect(fullHostId, {
            metadata: { name: myName },
            reliable: true 
        });
        setupConnectionListeners(connection);
    };

    if (!peerInstance.current) {
        // Người join cũng cần PEER_CONFIG để xuyên 4G
        const tempPeer = new Peer(undefined, PEER_CONFIG);

        peerInstance.current = tempPeer;
        setPeer(tempPeer);
        
        tempPeer.on('open', () => performConnect(tempPeer));
        tempPeer.on('error', (err) => {
            setIsConnecting(false);
            alert("Không thể tạo kết nối. Kiểm tra mạng.");
        });
    } else {
        if (!peerInstance.current.open) {
             peerInstance.current.on('open', () => performConnect(peerInstance.current!));
        } else {
             performConnect(peerInstance.current);
        }
    }
  };

  // --- GAME FLOW HANDLERS ---
  const handleStartSolo = () => {
    setIsMultiplayer(false);
    setIsHost(true);
    setGameState(GameState.PLAYING);
    if (conn) conn.close();
  };

  const handleOpenLobby = () => {
    setIsMultiplayer(true);
    setGameState(GameState.LOBBY);
    initializePeer();
  };

  const handleJoinGame = (hostCode: string) => {
    if (!hostCode || hostCode.length !== 4) {
        alert("Mã phòng phải là 4 số!");
        return;
    }
    connectToPeer(hostCode);
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

    // Lưu lịch sử
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
    setGameState(GameState.MENU);
    setIsMeReady(false);
    setIsOpponentReady(false);
    setOpponentScore(0);
    setFinalScore(0);
    setIsConnecting(false);
    if (conn) { conn.close(); setConn(null); }
    if (peerInstance.current) {
        peerInstance.current.destroy();
        peerInstance.current = null;
        setPeer(null);
        setDisplayId(null);
    }
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
          displayId={displayId} 
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
          key={isMultiplayer ? `multi-${conn?.connectionId || Date.now()}` : `solo-${Date.now()}`}
          onGameOver={handleGameOver} 
          isMultiplayer={isMultiplayer}
          isHost={isHost}
          connection={conn}
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