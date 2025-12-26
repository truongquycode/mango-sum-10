// App.tsx
import React, { useState, useEffect } from 'react';
import { GameState, MultiPlayerMessage } from './types';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameOverScreen } from './components/GameOverScreen';
import { LobbyScreen } from './components/LobbyScreen';
import Peer, { DataConnection } from 'peerjs';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Multiplayer State
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Trạng thái cho việc Restart đồng bộ
  const [isMeReady, setIsMeReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mango-sum10-highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Logic kiểm tra cả 2 đã sẵn sàng chưa để start game lại
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
    // Reset trạng thái ready
    setIsMeReady(false);
    setIsOpponentReady(false);
  };

  // --- PeerJS Logic ---
  
  // Định nghĩa handleConnection trước để có thể gọi trong initializePeer
  const handleConnection = (connection: DataConnection) => {
    setConn(connection);
    
    connection.on('open', () => {
      console.log("Connected to", connection.peer);
      setIsConnecting(false);
      setGameState(GameState.PLAYING);
    });

    connection.on('data', (data: any) => {
      const msg = data as MultiPlayerMessage;
      
      if (msg.type === 'START') {
        setGameState(GameState.PLAYING);
      } else if (msg.type === 'GAME_OVER') {
        setOpponentScore(msg.payload.score);
      } else if (msg.type === 'RESTART') {
         // Logic cũ, giữ lại để tương thích nếu cần
      } else if (msg.type === 'READY') {
        // Đối thủ đã bấm Play Again
        setIsOpponentReady(true);
      }
    });

    connection.on('close', () => {
      alert("Opponent disconnected");
      setGameState(GameState.MENU);
      setConn(null);
      setIsHost(false);
      setIsMeReady(false);
      setIsOpponentReady(false);
    });
  };

  const initializePeer = () => {
    if (peer) return; 

    const newPeer = new Peer();

    newPeer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      setPeerId(id);
    });

    newPeer.on('connection', (connection) => {
      console.log('Incoming connection from', connection.peer);
      setIsHost(true);
      handleConnection(connection);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error', err);
      setIsConnecting(false);
      alert("Connection Error: " + err.type);
    });

    setPeer(newPeer);
  };

  const connectToPeer = (remotePeerId: string) => {
    if (!peer) return;
    setIsConnecting(true);
    setIsHost(false);
    const connection = peer.connect(remotePeerId);
    handleConnection(connection);
  };

  // --- Game Flow Handlers ---

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

  const handleJoinGame = (hostId: string) => {
    connectToPeer(hostId);
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
      // Thay vì start ngay, ta gửi tín hiệu READY
      setIsMeReady(true);
      conn.send({ type: 'READY' } as MultiPlayerMessage);
    } else {
      // Chế độ Solo thì start luôn
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
  };

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-amber-50">
      {gameState === GameState.MENU && (
        <StartScreen 
          onStart={handleStartSolo} 
          onMultiplayer={handleOpenLobby}
          highScore={highScore} 
        />
      )}

      {gameState === GameState.LOBBY && (
        <LobbyScreen 
          peerId={peerId} 
          onJoin={handleJoinGame} 
          onBack={handleGoHome}
          isConnecting={isConnecting}
        />
      )}
      
      {gameState === GameState.PLAYING && (
        <Game 
          key={isMultiplayer ? 'multi' + Date.now() : 'solo' + Date.now()}
          onGameOver={handleGameOver} 
          isMultiplayer={isMultiplayer}
          isHost={isHost}
          connection={conn}
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
           />
        </>
      )}
    </div>
  );
}