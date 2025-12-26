import React, { useState } from 'react';
import { Button } from './UI/Button';

interface LobbyScreenProps {
  peerId: string | null;
  onJoin: (hostId: string) => void;
  onBack: () => void;
  isConnecting: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ peerId, onJoin, onBack, isConnecting }) => {
  const [remoteId, setRemoteId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-orange-50 relative overflow-hidden">
       {/* Background */}
       <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-green-200 rounded-full opacity-30 blur-2xl" />
       <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-orange-200 rounded-full opacity-30 blur-2xl" />

      <div className="z-10 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border-4 border-orange-200 max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-orange-600 mb-2">Multiplayer Lobby</h2>
          <p className="text-gray-500 text-sm">Play 1vs1 against a friend!</p>
        </div>

        {/* My ID Section */}
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-center">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-2">Your Room ID</p>
          {peerId ? (
            <div 
              onClick={handleCopy}
              className="font-mono text-xl font-bold text-gray-800 bg-white py-2 px-4 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {peerId}
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-500">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </div>
          ) : (
            <div className="animate-pulse text-gray-400 font-mono">Generating ID...</div>
          )}
          <p className="text-[10px] text-gray-400 mt-2">Share this ID with your friend to host.</p>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-bold">Or Join</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Join Section */}
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Enter Friend's ID" 
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none font-mono text-center uppercase placeholder:normal-case transition-colors"
          />
          <Button 
            onClick={() => onJoin(remoteId)} 
            disabled={!remoteId || isConnecting || !peerId}
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Join Game'}
          </Button>
        </div>

        <Button onClick={onBack} variant="secondary" className="w-full mt-4">
          Back to Menu
        </Button>
      </div>
    </div>
  );
};