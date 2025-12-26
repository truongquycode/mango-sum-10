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

  // Load high score
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
      // Khi kết nối thành công, bắt đầu game ngay
      setGameState(GameState.PLAYING);
      
      // Gửi tín hiệu START để cả 2 cùng chơi
      connection.send({ type: 'START' } as MultiPlayerMessage);
    });

    connection.on('data', (data: any) => {
      const msg = data as MultiPlayerMessage;
      if (msg.type === 'START') {
        setGameState(GameState.PLAYING);
        setOpponentScore(0);
        setFinalScore(0);
      } else if (msg.type === 'SCORE_UPDATE') {
        setOpponentScore(msg.payload);
      } else if (msg.type === 'GAME_OVER') {
        setOpponentScore(msg.payload);
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
    });
  };

  const connectToPeer = (remotePeerId: string) => {
    if (!peer) return;
    setIsConnecting(true);
    const connection = peer.connect(remotePeerId);
    handleConnection(connection);
  };

  // --- Game Flow Handlers ---

  const handleStartSolo = () => {
    setIsMultiplayer(false);
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
      conn.send({ type: 'GAME_OVER', payload: score } as MultiPlayerMessage);
    }
  };

  const handleScoreUpdate = (newScore: number) => {
    if (isMultiplayer && conn) {
      conn.send({ type: 'SCORE_UPDATE', payload: newScore } as MultiPlayerMessage);
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
    <div className="h-full w-full relative overflow-hidden bg-amber-50">
      {gameState === GameState.MENU && (
        // Bạn cần sửa StartScreen để có thêm nút Multiplayer
        <StartScreen 
          onStart={handleStartSolo} 
          onMultiplayer={handleOpenLobby} // Thêm prop này vào StartScreen
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
          opponentScore={opponentScore}
          onScoreUpdate={handleScoreUpdate}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <>
           <div className="absolute inset-0 opacity-10 pointer-events-none bg-repeat bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
           <GameOverScreen 
             score={finalScore} 
             opponentScore={opponentScore}
             isMultiplayer={isMultiplayer}
             highScore={highScore} 
             onRestart={handleRestart} 
             onHome={handleGoHome}
           />
        </>
      )}
    </div>
  );
}