import React from 'react';
import { Button } from './UI/Button';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, highScore, onRestart, onHome }) => {
  const isNewHigh = score > highScore;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-orange-400">
        <h2 className="text-4xl font-black text-gray-800 mb-6">Time's Up!</h2>
        
        <div className="mb-8 space-y-4">
          <div>
            <p className="text-gray-500 text-sm uppercase font-bold tracking-widest">Your Score</p>
            <p className="text-6xl font-black text-orange-500">{score.toLocaleString()}</p>
          </div>
          
          {isNewHigh && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold animate-pulse">
              🏆 New High Score!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onRestart} variant="primary" className="w-full">
            Play Again
          </Button>
          <Button onClick={onHome} variant="secondary" className="w-full">
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
