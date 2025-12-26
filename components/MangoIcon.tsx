import React from 'react';
import { MANGO_COLORS } from '../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
}

export const MangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved }) => {
  if (isRemoved) return <div className="w-full h-full opacity-0" />;

  const theme = MANGO_COLORS[value] || MANGO_COLORS[5];
  
  return (
    <div 
      className={`
        relative w-full h-full flex items-center justify-center 
        transition-transform duration-200 select-none will-change-transform
        ${isSelected ? 'scale-110 z-10 brightness-110' : 'scale-95'}
      `}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible drop-shadow-md"
      >
        <defs>
          <linearGradient id={`grad-${value}`} x1="30%" y1="20%" x2="70%" y2="80%">
            <stop offset="0%" stopColor={theme.light} />
            <stop offset="50%" stopColor={theme.main} />
            <stop offset="100%" stopColor={theme.dark} />
          </linearGradient>
        </defs>

        {/* Mango Body - Simplified Shape like the Apple */}
        <path 
          d="M 50 15 
             C 85 15, 95 40, 90 70 
             C 85 90, 60 95, 40 95 
             C 20 95, 5 75, 10 45 
             C 15 25, 30 15, 50 15 Z" 
          fill={`url(#grad-${value})`}
          stroke={theme.dark}
          strokeWidth="1"
        />

        {/* Highlight glare */}
        <ellipse cx="35" cy="35" rx="10" ry="5" fill="white" opacity="0.3" transform="rotate(-45 35 35)" />

        {/* Leaf */}
        <path 
          d="M 50 15 Q 65 5 70 15 Q 65 25 50 15" 
          fill="#4ade80" 
          stroke="#15803d" 
          strokeWidth="1"
        />
      </svg>
      
      {/* Number Centered - Big & White like the reference image */}
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <span className="text-white font-black text-xl md:text-2xl drop-shadow-md font-mono pointer-events-none select-none">
          {value}
        </span>
      </div>
    </div>
  );
});