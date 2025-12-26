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
        ${isSelected ? 'scale-110 z-10' : 'scale-95'}
      `}
    >
      <svg 
        viewBox="0 0 100 100" 
        className={`w-full h-full overflow-visible drop-shadow-sm transition-filter duration-200 ${isSelected ? 'brightness-110 drop-shadow-lg' : ''}`}
      >
        <defs>
          <linearGradient id={`grad-${value}`} x1="30%" y1="20%" x2="70%" y2="80%">
            <stop offset="0%" stopColor={theme.light} />
            <stop offset="50%" stopColor={theme.main} />
            <stop offset="100%" stopColor={theme.dark} />
          </linearGradient>
        </defs>

        {/* Mango Body - Kidney Shape */}
        <path 
          d="M 50 10 
             C 80 10, 95 35, 90 65 
             C 85 90, 60 95, 40 95 
             C 20 95, 5 75, 10 45 
             C 15 20, 30 10, 50 10 Z" 
          fill={`url(#grad-${value})`}
          stroke={theme.dark}
          strokeWidth="2"
        />

        {/* Leaf */}
        <path 
          d="M 50 10 Q 65 0 70 10 Q 65 20 50 10" 
          fill="#15803d" 
          stroke="#14532d" 
          strokeWidth="1.5"
        />
        <path 
          d="M 50 10 Q 35 5 30 15 Q 35 25 50 10" 
          fill="#16a34a" 
          stroke="#14532d" 
          strokeWidth="1.5"
        />

        {/* Kawaii Face */}
        <g transform="translate(0, 5)">
          {/* Eyes */}
          <circle cx="35" cy="55" r="4" fill="#1f2937" />
          <circle cx="65" cy="55" r="4" fill="#1f2937" />
          
          {/* Blush */}
          <ellipse cx="30" cy="62" rx="4" ry="2" fill="#f472b6" opacity="0.6" />
          <ellipse cx="70" cy="62" rx="4" ry="2" fill="#f472b6" opacity="0.6" />

          {/* Mouth - changing based on value (odd/even) for variety */}
          {value % 2 === 0 ? (
            // Smile
            <path d="M 45 60 Q 50 65 55 60" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          ) : (
            // Open mouth
            <path d="M 46 62 Q 50 66 54 62" fill="#1f2937" opacity="0.8" />
          )}
        </g>
      </svg>
      
      {/* Number Badge */}
      <div className="absolute -bottom-1 -right-1 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center border-2 border-orange-100 shadow-sm">
        <span className="text-orange-800 font-black text-sm font-mono leading-none pt-[1px]">
          {value}
        </span>
      </div>
    </div>
  );
});