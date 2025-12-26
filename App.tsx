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
  
  // Xác định ai là chủ phòng để tạo map gốc
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mango-sum10-highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // --- PeerJS Logic ---
  const initializePeer = () => {
    if (peer) return; 

    const newPeer = new Peer();

    newPeer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      setPeerId(id);
    });

    newPeer.on('connection', (connection) => {
      console.log('Incoming connection from', connection.peer);
      setIsHost(true); // Ai nhận kết nối thì là Host
      handleConnection(connection);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error', err);
      setIsConnecting(false);
      alert("Connection Error: " + err.type);
    });

    setPeer(newPeer);
  };

  const handleConnection = (connection: DataConnection) => {
    setConn(connection);
    
    connection.on('open', () => {
      console.log("Connected to", connection.peer);
      setIsConnecting(false);
      setGameState(GameState.PLAYING);
      
      // Host không gửi START ở đây nữa, mà để Game component tự init và gửi Grid
    });

    connection.on('data', (data: any) => {
      const msg = data as MultiPlayerMessage;
      // App chỉ xử lý chuyển trạng thái game, còn Grid update để Game component lo
      if (msg.type === 'START') {
        setGameState(GameState.PLAYING);
        setOpponentScore(0);
        setFinalScore(0);
      } else if (msg.type === 'GAME_OVER') {
        setOpponentScore(msg.payload.score);
      } else if (msg.type === 'RESTART') {
        setGameState(GameState.PLAYING);
        setOpponentScore(0);
        setFinalScore(0);
      }
    });

    connection.on('close', () => {
      alert("Opponent disconnected");
      setGameState(GameState.MENU);
      setConn(null);
      setIsHost(false);
    });
  };

  const connectToPeer = (remotePeerId: string) => {
    if (!peer) return;
    setIsConnecting(true);
    setIsHost(false); // Người đi join là Client
    const connection = peer.connect(remotePeerId);
    handleConnection(connection);
  };

  // --- Game Flow Handlers ---

  const handleStartSolo = () => {
    setIsMultiplayer(false);
    setIsHost(true); // Solo thì coi như mình là host
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
      conn.send({ type: 'RESTART' } as MultiPlayerMessage);
      setOpponentScore(0);
    }
    setGameState(GameState.PLAYING);
  };

  const handleGoHome = () => {
    setGameState(GameState.MENU);
    if (conn) {
      conn.close();
      setConn(null);
    }
  };

  return (
    // Sử dụng dvh để fix lỗi layout trên mobile safari/chrome
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
             highScore={highScore} 
             onRestart={handleRestart} 
             onHome={handleGoHome}
           />
        </>
      )}
    </div>
  );
}