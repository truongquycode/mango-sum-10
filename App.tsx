import React, { useState, useEffect } from 'react';
import { GameState } from './types';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { GameOverScreen } from './components/GameOverScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Load high score from local storage
  useEffect(() => {
    const saved = localStorage.getItem('mango-sum10-highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('mango-sum10-highscore', score.toString());
    }
    setGameState(GameState.GAME_OVER);
  };

  const handleRestart = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGoHome = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-amber-50">
      {gameState === GameState.MENU && (
        <StartScreen onStart={handleStartGame} highScore={highScore} />
      )}
      
      {gameState === GameState.PLAYING && (
        <Game onGameOver={handleGameOver} />
      )}

      {gameState === GameState.GAME_OVER && (
        <>
           {/* Render Game in background slightly dimmed or static? 
               Easier to just replace it, but rendering a "fake" game background looks nice.
               For simplicity, we just overlay on the empty background or last frame.
           */}
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
