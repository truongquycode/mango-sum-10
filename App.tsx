// App.tsx
import React, { useState, useEffect } from 'react';
import { GameState, MultiPlayerMessage } from './types';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameOverScreen } from './components/GameOverScreen';
import { LobbyScreen } from './components/LobbyScreen';
import Peer, { DataConnection } from 'peerjs';

// Prefix để đảm bảo ID không trùng với app khác trên server công cộng
const ID_PREFIX = 'mango-v1-vn-'; 

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Multiplayer State
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [displayId, setDisplayId] = useState<string | null>(null); // Mã 4 số hiển thị
  
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Tên người chơi
  const [myName, setMyName] = useState("Bạn");
  const [opponentName, setOpponentName] = useState("Đối thủ");

  // Trạng thái Restart
  const [isMeReady, setIsMeReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mango-sum10-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
    
    const savedName = localStorage.getItem('mango-player-name');
    if (savedName) setMyName(savedName);
  }, []);

  // Đồng bộ Restart game
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

  // --- PeerJS Logic ---
  
  const handleConnection = (connection: DataConnection) => {
    setConn(connection);
    
    connection.on('open', () => {
      setIsConnecting(false);
      setGameState(GameState.PLAYING);
      
      // Gửi tên của mình cho đối thủ ngay khi kết nối
      connection.send({ type: 'START', payload: { name: myName } } as MultiPlayerMessage);
    });

    connection.on('data', (data: any) => {
      const msg = data as MultiPlayerMessage;
      
      if (msg.type === 'START') {
        if (msg.payload?.name) setOpponentName(msg.payload.name);
        setGameState(GameState.PLAYING);
      } else if (msg.type === 'GRID_UPDATE') {
        setOpponentScore(msg.payload.score);
        if (msg.payload.opponentName) setOpponentName(msg.payload.opponentName);
      } else if (msg.type === 'GAME_OVER') {
        setOpponentScore(msg.payload.score);
      } else if (msg.type === 'READY') {
        setIsOpponentReady(true);
      }
    });

    connection.on('close', () => {
      alert("Đối thủ đã thoát!");
      setGameState(GameState.MENU);
      setConn(null);
      setIsHost(false);
      setIsMeReady(false);
      setIsOpponentReady(false);
    });
  };

  const generateRandom4Digit = () => Math.floor(1000 + Math.random() * 9000).toString();

  const initializePeer = () => {
    if (peer) return; 

    // Tạo mã 4 số
    const shortCode = generateRandom4Digit();
    const fullId = ID_PREFIX + shortCode;

    const newPeer = new Peer(fullId);

    newPeer.on('open', (id) => {
      console.log('My Peer ID:', id);
      setPeerId(id);
      setDisplayId(shortCode); // Chỉ hiện 4 số cho người chơi
    });

    newPeer.on('connection', (connection) => {
      setIsHost(true);
      handleConnection(connection);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      // Nếu xui xẻo trùng mã, thử lại (rất hiếm)
      if (err.type === 'unavailable-id') {
        setPeer(null);
        setTimeout(initializePeer, 500); 
      } else {
        setIsConnecting(false);
        alert("Lỗi kết nối: " + err.type);
      }
    });

    setPeer(newPeer);
  };

  const connectToPeer = (shortCode: string) => {
    // Nếu chưa có peer (người join), tạo peer tạm
    const tempPeer = peer || new Peer();
    
    if (!peer) {
        setPeer(tempPeer);
        tempPeer.on('open', () => {
            const fullHostId = ID_PREFIX + shortCode;
            setIsConnecting(true);
            setIsHost(false);
            const connection = tempPeer.connect(fullHostId, {
                metadata: { name: myName }
            });
            handleConnection(connection);
        });
    } else {
        const fullHostId = ID_PREFIX + shortCode;
        setIsConnecting(true);
        setIsHost(false);
        const connection = peer.connect(fullHostId, {
            metadata: { name: myName }
        });
        handleConnection(connection);
    }
  };

  // --- Handlers ---

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
    connectToPeer(hostCode);
  };

  const handleGameOver = (score: number) => {
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
    if (conn) {
      conn.close();
      setConn(null);
    }
    if (peer) {
        peer.destroy();
        setPeer(null);
        setPeerId(null);
        setDisplayId(null);
    }
  };

  const handleUpdateName = (name: string) => {
      setMyName(name);
      localStorage.setItem('mango-player-name', name);
  }

  return (
    // Đổi background thành màu Xanh Thanh Lam nhạt
    <div className="h-[100dvh] w-full relative overflow-hidden bg-cyan-50">
      {gameState === GameState.MENU && (
        <StartScreen 
          onStart={handleStartSolo} 
          onMultiplayer={handleOpenLobby}
          highScore={highScore} 
        />
      )}

      {gameState === GameState.LOBBY && (
        <LobbyScreen 
          displayId={displayId} 
          onJoin={handleJoinGame} 
          onBack={handleGoHome}
          isConnecting={isConnecting}
          myName={myName}
          setMyName={handleUpdateName}
        />
      )}
      
      {gameState === GameState.PLAYING && (
        <Game 
          key={isMultiplayer ? 'multi' + Date.now() : 'solo' + Date.now()}
          onGameOver={handleGameOver} 
          isMultiplayer={isMultiplayer}
          isHost={isHost}
          connection={conn}
          myName={myName}
          opponentName={opponentName}
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