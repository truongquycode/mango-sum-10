// components/MangoIcon.tsx
import React from 'react';
import { MANGO_COLORS } from '../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
  isError?: boolean; // Thêm prop này để nhận biết khi chọn sai
}

export const MangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved, isError }) => {
  
  const theme = MANGO_COLORS[value] || MANGO_COLORS[5];

  // Xử lý Animation Classes
  let animationClass = '';
  
  if (isRemoved) {
    // Hiệu ứng Rớt xuống: Di chuyển xuống 50px, xoay nhẹ, mờ dần
    animationClass = 'animate-drop-out pointer-events-none';
  } else if (isError) {
    // Hiệu ứng Sai: Phình to và rung màu đỏ
    animationClass = 'animate-puff-error z-20';
  } else if (isSelected) {
    // Hiệu ứng đang chọn (giữ nguyên cái cũ nhưng tăng độ sáng)
    animationClass = 'scale-[1.1] z-10 brightness-110 drop-shadow-xl';
  } else {
    // Trạng thái bình thường
    animationClass = 'scale-[0.95] hover:scale-[1.0]';
  }
  
  return (
    <div 
      className={`
        w-full h-full flex items-center justify-center 
        transition-all duration-300 select-none will-change-transform
        ${animationClass}
      `}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible"
        style={{ filter: isError ? 'drop-shadow(0px 0px 8px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))' }}
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
          fill={isError ? '#ef4444' : `url(#grad-${value})`} // Chuyển màu đỏ khi sai
          stroke={theme.dark}
          strokeWidth="1.5"
          className="transition-colors duration-200"
        />

        {/* Vệt sáng */}
        <ellipse cx="35" cy="35" rx="10" ry="5" fill="white" opacity="0.3" transform="rotate(-45 35 35)" />

        {/* Chiếc lá */}
        <path 
          d="M 50 15 Q 65 5 70 15 Q 65 25 50 15" 
          fill="#4ade80" 
          stroke="#15803d" 
          strokeWidth="1"
        />

        {/* Số điểm */}
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
      
      {/* Định nghĩa Keyframes ngay trong component (hoặc bạn có thể để trong index.css) */}
      <style>{`
        @keyframes drop-out {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100px) rotate(20deg); opacity: 0; }
        }
        .animate-drop-out {
          animation: drop-out 0.6s ease-in forwards;
        }

        @keyframes puff-error {
          0% { transform: scale(1); }
          40% { transform: scale(1.3) rotate(-5deg); }
          60% { transform: scale(1.3) rotate(5deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .animate-puff-error {
          animation: puff-error 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
});