// components/MangoIcon.tsx
import React from 'react';
import { MANGO_COLORS } from '../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
  isError?: boolean;
}

// 1. Component vẽ mặt Ghibli: Chỉ giữ lại chớp mắt (nhẹ, không lag)
interface GhibliFaceProps {
  strokeColor?: string;
  translateY?: number;
  blinkDelay?: string;
}

const GhibliFace = ({ strokeColor = "#4b3621", translateY = 5, blinkDelay = "0s" }: GhibliFaceProps) => (
  <g className="ghibli-face" transform={`translate(0, ${translateY})`}>
    {/* Má hồng phớt */}
    <ellipse cx="28" cy="46" rx="5" ry="3" fill="#ff8a80" opacity="0.5" />
    <ellipse cx="72" cy="46" rx="5" ry="3" fill="#ff8a80" opacity="0.5" />
    
    {/* Mắt trái: Biết chớp */}
    <circle 
      cx="35" cy="42" r="2.5" 
      fill={strokeColor} 
      className="animate-blink"
      style={{ transformOrigin: '35px 42px', animationDelay: blinkDelay }} 
    />
    {/* Mắt phải: Biết chớp */}
    <circle 
      cx="65" cy="42" r="2.5" 
      fill={strokeColor} 
      className="animate-blink"
      style={{ transformOrigin: '65px 42px', animationDelay: blinkDelay }} 
    />
    
    {/* Miệng: Rất nhỏ ở giữa */}
    <path 
      d="M 48 48 Q 50 50 52 48" 
      fill="none" 
      stroke={strokeColor} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
  </g>
);

export const MangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved, isError }) => {
  
  const colorSet = MANGO_COLORS[value] || MANGO_COLORS[5];
  const strokeColor = colorSet.stroke || colorSet.dark;
  const fillStyle = `url(#grad-${value})`;

  // Giữ lại random delay cho chớp mắt để tự nhiên
  const blinkDelay = React.useMemo(() => `-${(Math.random() * 4).toFixed(2)}s`, []);

  let containerClass = '';
  if (isRemoved) {
    containerClass = 'animate-drop-out pointer-events-none';
  } else if (isError) {
    containerClass = 'animate-puff-error z-20';
  } else if (isSelected) {
    containerClass = 'scale-[1.15] z-10 brightness-110 drop-shadow-xl';
  } else {
    // Chỉ phóng to nhẹ khi hover, không nhún nhảy liên tục nữa
    containerClass = 'scale-[0.95] hover:scale-[1.05] transition-transform duration-200';
  }

  const renderFruitBody = () => {
    switch (value) {
      case 1: // Nho
        return (
          <g>
            <circle cx="30" cy="38" r="14" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="70" cy="38" r="14" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="50" cy="75" r="14" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="18" cy="55" r="13" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="82" cy="55" r="13" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="50" cy="52" r="15" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/> 
            <circle cx="35" cy="70" r="14" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="65" cy="70" r="14" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
            <ellipse cx="25" cy="32" rx="3" ry="1.5" fill="white" opacity="0.5" transform="rotate(-45 25 32)"/>
            <ellipse cx="65" cy="32" rx="3" ry="1.5" fill="white" opacity="0.5" transform="rotate(-45 65 32)"/>
            <ellipse cx="45" cy="46" rx="4" ry="2" fill="white" opacity="0.6" transform="rotate(-45 45 46)"/>
            <ellipse cx="30" cy="65" rx="3" ry="1.5" fill="white" opacity="0.5" transform="rotate(-45 30 65)"/>
            <g transform="translate(50, 25)">
               <path d="M 0 0 L 0 -12" stroke="#5d4037" strokeWidth="3" strokeLinecap="round"/>
               <path d="M -2 -2 L -10 -8 L -18 -2 L -12 6 L -2 2 Z" fill="#7cb342" stroke="#33691e" strokeWidth="1" strokeLinejoin="round"/>
               <path d="M 2 -2 L 12 -10 L 20 -4 L 12 8 L 2 2 Z" fill="#8bc34a" stroke="#33691e" strokeWidth="1" strokeLinejoin="round"/>
            </g>
          </g>
        );
      case 2: // Lê
        return (
          <g>
             <path d="M 50 10 C 30 10, 35 40, 25 55 C 15 70, 25 92, 50 92 C 75 92, 85 70, 75 55 C 65 40, 70 10, 50 10 Z" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
             <path d="M 50 10 Q 55 -2 60 5" fill="none" stroke="#6d4c41" strokeWidth="3" strokeLinecap="round"/>
             <path d="M 55 10 Q 75 10 70 20" fill="none" stroke="#8bc34a" strokeWidth="2" />
          </g>
        );
      case 3: // Chanh
        return (
          <g>
             <ellipse cx="50" cy="50" rx="44" ry="38" fill={fillStyle} stroke={strokeColor} strokeWidth="2" />
             <path d="M 6 50 Q 2 50 6 44 L 10 50 Z" fill={colorSet.main} stroke={strokeColor} strokeWidth="2"/>
             <path d="M 94 50 Q 98 50 94 44 L 90 50 Z" fill={colorSet.main} stroke={strokeColor} strokeWidth="2"/>
          </g>
        );
      case 4: // Cam
        return (
          <g>
             <circle cx="50" cy="50" r="42" fill={fillStyle} stroke={strokeColor} strokeWidth="2" />
             <path d="M 50 8 L 50 15" fill="none" stroke="#3e2723" strokeWidth="3" />
             <path d="M 50 15 Q 70 10 75 20 Q 65 30 50 15" fill="#66bb6a" stroke="#2e7d32" strokeWidth="1.5"/>
          </g>
        );
      case 8: // Dưa hấu - Bell Shape
        return (
          <g>
             <path d="M 5 35 Q 5 98 50 98 Q 95 98 95 35 L 5 35 Z" fill={fillStyle} stroke="none"/>
             <path d="M 5 35 Q 5 98 50 98 Q 95 98 95 35" fill="none" stroke="#e8f5e9" strokeWidth="6" strokeLinecap="round"/>
             <path d="M 2 35 Q 2 101 50 101 Q 98 101 98 35" fill="none" stroke="#2e7d32" strokeWidth="4" strokeLinecap="round"/>
             <g fill="#3e2723">
                 <circle cx="20" cy="50" r="3.5" /> <circle cx="80" cy="50" r="3.5" />
                 <circle cx="35" cy="65" r="3.5" /> <circle cx="65" cy="65" r="3.5" />
                 <circle cx="50" cy="78" r="3.5" />
             </g>
          </g>
        );
      case 6: // Bơ
        return (
          <g>
            <path d="M 50 5 C 30 5, 12 35, 12 60 C 12 88, 35 95, 50 95 C 65 95, 88 88, 88 60 C 88 35, 70 5, 50 5 Z" fill="#2aaa30ff" stroke="#1b5e20" strokeWidth="2"/>
            <path d="M 50 12 C 34 12, 20 38, 20 60 C 20 84, 36 88, 50 88 C 64 88, 80 84, 80 60 C 80 38, 66 12, 50 12 Z" fill={fillStyle} />
            <circle cx="50" cy="65" r="18" fill="#652e1fff" stroke="#8a5e56ff" strokeWidth="2" />
          </g>
        );
      case 7: // Dứa
        return (
          <g>
            <path d="M 30 28 L 20 10 L 40 22 L 50 5 L 60 22 L 80 10 L 70 28 Z" fill="#1b5e20" stroke="#052e16" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M 35 28 L 30 15 L 45 25 L 50 10 L 55 25 L 70 15 L 65 28 Z" fill="#2e7d32" stroke="#052e16" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M 40 28 L 42 18 L 50 12 L 58 18 L 60 28 Z" fill="#4ade80" stroke="#052e16" strokeWidth="1.5" strokeLinejoin="round"/>
            <rect x="25" y="28" width="50" height="65" rx="25" ry="25" fill={fillStyle} stroke={strokeColor} strokeWidth="2" />
            <g stroke="#a16207" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                <path d="M 30 40 L 60 85" /> <path d="M 45 30 L 75 75" /> <path d="M 25 60 L 50 90" />
                <path d="M 70 40 L 40 85" /> <path d="M 55 30 L 25 75" /> <path d="M 75 60 L 50 90" />
            </g>
            <g fill="#a16207" opacity="0.8">
                <circle cx="50" cy="45" r="1.5" /> <circle cx="38" cy="60" r="1.5" /> <circle cx="62" cy="60" r="1.5" /> <circle cx="50" cy="75" r="1.5" />
            </g>
          </g>
        );
      case 5: // Chuối
        return (
          <g transform="rotate(5 50 50)">
             <path d="M 32 60 Q 25 15 50 10 Q 75 15 68 60" fill={colorSet.light} stroke={strokeColor} strokeWidth="2" />
             <path d="M 32 60 Q 50 85 68 60 L 60 85 Q 50 92 40 85 Z" fill={colorSet.main} stroke={strokeColor} strokeWidth="2" />
             <path d="M 32 60 Q 10 60 15 75 Q 30 80 38 70" fill={colorSet.main} stroke={strokeColor} strokeWidth="2" />
             <path d="M 68 60 Q 90 60 85 75 Q 70 80 62 70" fill={colorSet.main} stroke={strokeColor} strokeWidth="2" />
             <path d="M 32 60 Q 50 70 68 60" fill="none" stroke={strokeColor} strokeWidth="2" />
             <path d="M 45 88 L 45 94 L 55 94 L 55 88 Z" fill="#6d4c41" stroke={strokeColor} strokeWidth="1.5" />
          </g>
        );
      case 9: // Dâu tây
        return (
          <g>
             <path d="M 50 20 C 30 10, 5 35, 10 60 C 15 85, 35 90, 50 98 C 65 90, 85 85, 90 60 C 95 35, 70 10, 50 20 Z" fill={fillStyle} stroke={strokeColor} strokeWidth="2"/>
             <path d="M 50 20 L 30 10 Q 40 25 50 20 L 70 10 Q 60 25 50 20 L 50 5" fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
             <path d="M 30 10 L 50 20 L 70 10" fill="#66bb6a" opacity="0.5"/>
             <g fill="#eb2135ff" opacity="0.8">
                <circle cx="30" cy="45" r="1.5" /> <circle cx="70" cy="45" r="1.5" />
                <circle cx="20" cy="60" r="1.5" /> <circle cx="50" cy="60" r="1.5" /> <circle cx="80" cy="60" r="1.5" />
                <circle cx="35" cy="75" r="1.5" /> <circle cx="65" cy="75" r="1.5" />
                <circle cx="50" cy="88" r="1.5" />
             </g>
          </g>
        );
      default: 
        return <circle cx="50" cy="50" r="40" fill={colorSet.main} />;
    }
  };

  const renderFace = () => {
      if (value === 6) return <GhibliFace strokeColor="#000000ff" translateY={-5} blinkDelay={blinkDelay} />; 
      if (value === 1) return <GhibliFace strokeColor="#21242aff" translateY={5} blinkDelay={blinkDelay} />; 
      if (value === 5) return <GhibliFace strokeColor="#5d4037" translateY={-5} blinkDelay={blinkDelay} />;
      if (value === 8) return <GhibliFace strokeColor="#37311cff" translateY={0} blinkDelay={blinkDelay} />;
      return <GhibliFace blinkDelay={blinkDelay} />;
  }

  return (
    <div className={`w-full h-full flex items-center justify-center transition-all duration-300 select-none will-change-transform ${containerClass}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible" 
        style={{ filter: isError ? 'drop-shadow(0px 0px 8px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}
      >
        <defs>
          <linearGradient id={`grad-${value}`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor={colorSet.light} />
            <stop offset="50%" stopColor={colorSet.main} />
            <stop offset="100%" stopColor={colorSet.dark} />
          </linearGradient>
        </defs>
        
        {/* ĐÃ BỎ WRAPPER NHÚN NHẢY - Chỉ còn render tĩnh */}
        {renderFruitBody()}
        {renderFace()}
        
        {/* Số điểm: Màu trắng + Viền đậm + Bóng sâu */}
        <text 
          x="50" 
          y="85" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          
          fill="white"                   // Giữ nguyên màu trắng
          stroke="rgba(0,0,0,0.4)"       // Thêm viền màu đen bán trong suốt (màu khói)
          strokeWidth="4"                // Độ dày viền (đủ dày để tách biệt với nền)
          paintOrder="stroke"            // Quan trọng: Vẽ viền NẰM DƯỚI màu trắng (để chữ không bị lem)
          
          fontSize="28"                  // Tăng kích thước lên chút (24 -> 28) cho rõ
          fontWeight="900" 
          fontFamily="Rounded Mplus 1c, sans-serif" 
          style={{ 
            pointerEvents: 'none', 
            // Tăng độ đậm của bóng đổ
            textShadow: '0px 3px 2px rgba(0,0,0,0.3)', 
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))' 
          }}
        >
          {value}
        </text>
      </svg>
      
      <style>{`
        /* Chớp mắt - Rất nhẹ, không gây lag */
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        .animate-blink {
          animation: blink 4s infinite;
        }

        /* Các hiệu ứng tương tác game */
        @keyframes drop-out { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100px) rotate(20deg); opacity: 0; } }
        .animate-drop-out { animation: drop-out 0.6s ease-in forwards; }
        @keyframes puff-error { 0% { transform: scale(1); } 40% { transform: scale(1.3) rotate(-5deg); } 60% { transform: scale(1.3) rotate(5deg); } 100% { transform: scale(1) rotate(0); } }
        .animate-puff-error { animation: puff-error 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
      `}</style>
    </div>
  );
});