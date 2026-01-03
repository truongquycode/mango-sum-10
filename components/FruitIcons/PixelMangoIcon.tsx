// components/PixelMangoIcon.tsx
import React from 'react';
import { MANGO_COLORS } from '../../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
  isError?: boolean;
}

// Khuôn mặt Pixel (TĨNH - KHÔNG CHỚP MẮT)
const PixelFace = ({ color = "#4b3621" }) => (
  <g transform="translate(0, 1)">
    {/* Mắt trái */}
    <rect x="6" y="8" width="2" height="2" fill={color} />
    {/* Mắt phải */}
    <rect x="12" y="8" width="2" height="2" fill={color} />
    {/* Má hồng (1px) */}
    <rect x="4" y="10" width="2" height="1" fill="#ff8a80" opacity="0.6" />
    <rect x="14" y="10" width="2" height="1" fill="#ff8a80" opacity="0.6" />
    {/* Miệng (nhỏ) */}
    <rect x="9" y="11" width="2" height="1" fill={color} />
  </g>
);

export const PixelMangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved, isError }) => {
  
  const colorSet = MANGO_COLORS[value] || MANGO_COLORS[5];
  const mainColor = colorSet.main;
  const darkColor = colorSet.dark;
  const lightColor = colorSet.light;

  let containerClass = '';
  if (isRemoved) {
    containerClass = 'animate-drop-out pointer-events-none';
  } else if (isError) {
    containerClass = 'animate-shake-pixel z-20';
  } else if (isSelected) {
    containerClass = 'scale-[1.15] z-10 brightness-110 drop-shadow-md';
  } else {
    containerClass = 'scale-[0.95] hover:scale-[1.05] transition-transform duration-200';
  }

  const renderPixelFruit = () => {
    switch (value) {
      case 1: // Nho
        return (
          <g>
            <rect x="9" y="4" width="3" height="3" fill={mainColor} />
            <rect x="6" y="6" width="3" height="3" fill={mainColor} />
            <rect x="12" y="6" width="3" height="3" fill={mainColor} />
            <rect x="5" y="9" width="3" height="3" fill={mainColor} />
            <rect x="8" y="9" width="4" height="4" fill={mainColor} />
            <rect x="13" y="9" width="3" height="3" fill={mainColor} />
            <rect x="7" y="13" width="3" height="3" fill={mainColor} />
            <rect x="11" y="13" width="3" height="3" fill={mainColor} />
            <rect x="9" y="15" width="3" height="2" fill={mainColor} />
            <rect x="10" y="2" width="1" height="3" fill="#5d4037" />
            <rect x="11" y="3" width="2" height="1" fill="#7cb342" />
          </g>
        );
      case 2: // Lê
        return (
          <g>
            <path d="M 8 4 H 12 V 8 H 14 V 16 H 6 V 8 H 8 V 4 Z" fill={mainColor} stroke={darkColor} strokeWidth="0.5" />
            <rect x="10" y="2" width="1" height="2" fill="#6d4c41" />
            <rect x="11" y="2" width="2" height="1" fill="#8bc34a" />
          </g>
        );
      case 3: // Chanh
        return (
          <g>
            <rect x="4" y="6" width="12" height="8" fill={mainColor} rx="1" />
            <rect x="2" y="8" width="2" height="4" fill={mainColor} />
            <rect x="16" y="8" width="2" height="4" fill={mainColor} />
            <rect x="6" y="7" width="2" height="2" fill="white" opacity="0.3" />
          </g>
        );
      case 4: // Cam
        return (
          <g>
            <rect x="4" y="4" width="12" height="12" rx="2" fill={mainColor} />
            <rect x="5" y="3" width="10" height="14" fill={mainColor} />
            <rect x="3" y="5" width="14" height="10" fill={mainColor} />
            <rect x="9" y="2" width="2" height="2" fill="#2e7d32" />
          </g>
        );
      case 5: // Chuối
        return (
          <g>
             <rect x="6" y="12" width="8" height="4" fill={mainColor} />
             <rect x="4" y="8" width="4" height="6" fill={mainColor} />
             <rect x="12" y="8" width="4" height="6" fill={mainColor} />
             <rect x="3" y="6" width="3" height="4" fill={mainColor} />
             <rect x="14" y="6" width="3" height="4" fill={mainColor} />
             <rect x="9" y="14" width="2" height="3" fill="#6d4c41" />
          </g>
        );
      case 6: // Bơ
        return (
          <g>
            <path d="M 6 4 H 14 V 16 H 6 V 4 Z" fill="#2e7d32" stroke="#2e7d32" strokeWidth="1"/>
            <rect x="5" y="6" width="10" height="10" fill="#2e7d32" />
            <rect x="7" y="5" width="6" height="10" fill={lightColor} />
            <rect x="6" y="7" width="8" height="8" fill={lightColor} />
            <rect x="8" y="11" width="4" height="4" fill="#6d4c41" />
          </g>
        );
      case 7: // Dứa
        return (
          <g>
            <rect x="6" y="6" width="8" height="10" fill={mainColor} />
            <rect x="5" y="8" width="10" height="6" fill={mainColor} />
            <rect x="7" y="8" width="1" height="1" fill={darkColor} opacity="0.5" />
            <rect x="10" y="10" width="1" height="1" fill={darkColor} opacity="0.5" />
            <rect x="12" y="8" width="1" height="1" fill={darkColor} opacity="0.5" />
            <rect x="7" y="12" width="1" height="1" fill={darkColor} opacity="0.5" />
            <path d="M 6 6 L 4 2 H 8 L 10 6 L 12 2 H 16 L 14 6 Z" fill="#2e7d32" />
          </g>
        );
      case 8: // Dưa hấu
        return (
          <g>
            <path d="M 2 6 H 18 L 10 18 Z" fill={mainColor} />
            <path d="M 2 6 H 18 L 18 4 H 2 Z" fill="#2e7d32" />
            <path d="M 2 6 H 18 L 18 5 H 2 Z" fill="#e8f5e9" />
            <rect x="8" y="10" width="1" height="1" fill="black" opacity="0.7" />
            <rect x="11" y="10" width="1" height="1" fill="black" opacity="0.7" />
            <rect x="10" y="13" width="1" height="1" fill="black" opacity="0.7" />
          </g>
        );
      case 9: // Dâu tây
        return (
          <g>
            <path d="M 4 6 H 16 L 10 17 Z" fill="#e53935" />
            <rect x="4" y="6" width="12" height="4" fill="#e53935" />
            <path d="M 4 6 L 6 2 H 14 L 16 6 Z" fill="#43a047" />
            <rect x="6" y="8" width="1" height="1" fill="#ffcdd2" />
            <rect x="10" y="12" width="1" height="1" fill="#ffcdd2" />
            <rect x="13" y="8" width="1" height="1" fill="#ffcdd2" />
          </g>
        );
      default:
        return <rect x="4" y="4" width="12" height="12" rx="2" fill={mainColor} />;
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center transition-all duration-100 select-none will-change-transform ${containerClass}`}>
      <svg 
        viewBox="0 0 20 20" 
        className="w-full h-full overflow-visible" 
        shapeRendering="crispEdges"
        style={{ filter: isError ? 'drop-shadow(2px 2px 0px #ef4444)' : 'drop-shadow(2px 2px 0px rgba(0,0,0,0.15))' }}
      >
        {renderPixelFruit()}
        <PixelFace color="#3e2723" />
        
        <text 
          x="10" y="18" textAnchor="middle" 
          fill="white" stroke={darkColor} strokeWidth="0.5" paintOrder="stroke"
          fontSize="7" fontWeight="bold" fontFamily="'Courier New', monospace"
          style={{ pointerEvents: 'none', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}
        >
          {value}
        </text>
      </svg>
      
      <style>{`
        @keyframes drop-out { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }
        .animate-drop-out { animation: drop-out 0.4s steps(5) forwards; }
        
        @keyframes shake-pixel { 
            0% { transform: translate(0, 0); } 
            25% { transform: translate(-2px, 2px); } 
            50% { transform: translate(2px, -2px); } 
            75% { transform: translate(-2px, -2px); } 
            100% { transform: translate(0, 0); } 
        }
        .animate-shake-pixel { animation: shake-pixel 0.3s steps(4) both; }
      `}</style>
    </div>
  );
});