import React from 'react';
import { MANGO_COLORS } from '../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
}

export const MangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved }) => {
  // Giữ chỗ bằng div rỗng để layout không bị nhảy khi xoài biến mất
  if (isRemoved) return <div className="w-full h-full" />;

  const theme = MANGO_COLORS[value] || MANGO_COLORS[5];
  
  return (
    <div 
      className={`
        w-full h-full flex items-center justify-center 
        transition-all duration-200 select-none will-change-transform
        ${isSelected ? 'scale-[1.1] z-10 brightness-110 drop-shadow-xl' : 'scale-[0.95] hover:scale-[1.0]'}
      `}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible"
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))' }}
      >
        <defs>
          <linearGradient id={`grad-${value}`} x1="30%" y1="20%" x2="70%" y2="80%">
            <stop offset="0%" stopColor={theme.light} />
            <stop offset="50%" stopColor={theme.main} />
            <stop offset="100%" stopColor={theme.dark} />
          </linearGradient>
        </defs>

        {/* Body quả xoài */}
        <path 
          d="M 50 15 
             C 85 15, 95 40, 90 70 
             C 85 90, 60 95, 40 95 
             C 20 95, 5 75, 10 45 
             C 15 25, 30 15, 50 15 Z" 
          fill={`url(#grad-${value})`}
          stroke={theme.dark}
          strokeWidth="1.5"
        />

        {/* Vệt sáng (Highlight) */}
        <ellipse cx="35" cy="35" rx="10" ry="5" fill="white" opacity="0.3" transform="rotate(-45 35 35)" />

        {/* Chiếc lá */}
        <path 
          d="M 50 15 Q 65 5 70 15 Q 65 25 50 15" 
          fill="#4ade80" 
          stroke="#15803d" 
          strokeWidth="1"
        />

        {/* LOGIC MỚI: Dùng thẻ <text> của SVG thay vì thẻ <span> HTML.
           - x="50" y="62": Căn giữa tọa độ quả xoài.
           - textAnchor="middle": Căn giữa chữ theo chiều ngang.
           - fontSize="35": Kích thước chữ dựa trên hệ tọa độ 100x100 của SVG, 
             nghĩa là nó sẽ tự to/nhỏ theo quả xoài.
        */}
        <text
          x="50"
          y="65"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="35"
          fontWeight="900"
          fontFamily="monospace"
          style={{ 
            pointerEvents: 'none', 
            textShadow: '1px 1px 0px rgba(0,0,0,0.3)' 
          }}
        >
          {value}
        </text>
      </svg>
    </div>
  );
});