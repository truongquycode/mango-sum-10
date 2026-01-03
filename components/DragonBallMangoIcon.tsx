// components/DragonBallMangoIcon.tsx
import React from 'react';
import { MANGO_COLORS } from '../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
  isError?: boolean;
}

// 1. MẮT CHIBI
const ChibiEyes = ({ x, y, color = "#212121" }: { x: number, y: number, color?: string }) => (
    <g transform={`translate(${x}, ${y})`}>
        <ellipse cx="-12" cy="0" rx="5" ry="7" fill={color} />
        <circle cx="-14" cy="-3" r="2.5" fill="white" />
        <circle cx="-10" cy="3" r="1" fill="white" opacity="0.7" />
        
        <ellipse cx="12" cy="0" rx="5" ry="7" fill={color} />
        <circle cx="10" cy="-3" r="2.5" fill="white" />
        <circle cx="14" cy="3" r="1" fill="white" opacity="0.7" />

        <ellipse cx="-16" cy="6" rx="4" ry="2" fill="#ff8a80" opacity="0.6" />
        <ellipse cx="16" cy="6" rx="4" ry="2" fill="#ff8a80" opacity="0.6" />
        
        <path d="M -3 6 Q 0 8 3 6" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </g>
);

// 2. TÓC SUPER SAIYAN
const SaiyanHair = ({ color = "#ffd600" }) => (
    <path 
        d="M 50 25 C 40 10 30 15 20 25 C 10 15 5 25 10 35 C 5 40 10 50 15 45 L 85 45 C 90 50 95 40 90 35 C 95 25 90 15 80 25 C 70 15 60 10 50 25 Z" 
        fill={color} stroke="#f9a825" strokeWidth="2" 
        transform="translate(0, -10)"
    />
);

export const DragonBallMangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved, isError }) => {
  
  const colorSet = MANGO_COLORS[value] || MANGO_COLORS[5];
  
  let containerClass = '';
  if (isRemoved) {
    containerClass = 'animate-teleport pointer-events-none';
  } else if (isError) {
    containerClass = 'animate-shake z-20';
  } else if (isSelected) {
    containerClass = 'scale-[1.15] z-10 drop-shadow-[0_0_15px_rgba(255,214,0,0.8)]';
  } else {
    containerClass = 'scale-[0.95] hover:scale-[1.05] transition-transform duration-200';
  }

  const renderChibiFruit = () => {
    switch (value) {
      case 1: // Nho - Frieza (TÍM + TRẮNG)
        return (
          <g>
             <circle cx="50" cy="55" r="35" fill="#f5f5f5" stroke="#bdbdbd" strokeWidth="2" />
             <path d="M 25 35 Q 50 15 75 35 Q 75 60 50 60 Q 25 60 25 35" fill="#ab47bc" stroke="#7b1fa2" strokeWidth="2" opacity="0.9" />
             <circle cx="20" cy="75" r="8" fill="#ab47bc" stroke="#7b1fa2" strokeWidth="1"/>
             <circle cx="80" cy="75" r="8" fill="#ab47bc" stroke="#7b1fa2" strokeWidth="1"/>
             <ChibiEyes x={50} y={55} />
          </g>
        );
      case 2: // Lê - Piccolo (XANH LÁ SÁNG/NEON) -> Khác biệt với Bơ
        return (
          <g>
             {/* Màu xanh lá mạ sáng */}
             <path d="M 50 15 C 30 15, 25 50, 20 70 C 15 85, 30 95, 50 95 C 70 95, 85 85, 80 70 C 75 50, 70 15, 50 15 Z" 
                   fill="#76ff03" stroke="#33691e" strokeWidth="2" />
             {/* Râu Namek */}
             <path d="M 40 25 Q 35 10 30 15" fill="none" stroke="#33691e" strokeWidth="3" strokeLinecap="round" />
             <path d="M 60 25 Q 65 10 70 15" fill="none" stroke="#33691e" strokeWidth="3" strokeLinecap="round" />
             <path d="M 30 70 Q 50 80 70 70" fill="none" stroke="#f06292" strokeWidth="2" strokeDasharray="5,5" />
             <ChibiEyes x={50} y={50} />
          </g>
        );
      case 3: // Chanh - Super Saiyan (VÀNG TƯƠI)
        return (
          <g>
             <SaiyanHair color="#ffff00" /> {/* Tóc vàng rực */}
             <ellipse cx="50" cy="60" rx="35" ry="30" fill="#ffeb3b" stroke="#fbc02d" strokeWidth="2" />
             <ChibiEyes x={50} y={60} />
             {/* Tia sét xanh dương */}
             <path d="M 15 50 L 5 40 M 85 50 L 95 40" stroke="#29b6f6" strokeWidth="3" />
          </g>
        );
      case 4: // Cam - Goku (CAM ĐẬM)
        return (
          <g>
             <circle cx="50" cy="55" r="38" fill="#ff6d00" stroke="#e65100" strokeWidth="2" />
             {/* Băng đầu xanh dương đậm */}
             <path d="M 15 40 Q 50 35 85 40" fill="none" stroke="#1565c0" strokeWidth="7" strokeLinecap="round" />
             <ChibiEyes x={50} y={55} />
             <path d="M 30 85 Q 50 90 70 85" fill="none" stroke="#1565c0" strokeWidth="4" />
          </g>
        );
      case 5: // Chuối - Vegeta (TRẮNG KEM / VÀNG NHẠT) -> Để khác Chanh
        return (
          <g transform="rotate(5 50 50)">
             {/* Tóc đen */}
             <path d="M 50 15 L 35 35 L 65 35 Z" fill="#212121" />
             <path d="M 35 35 L 20 20 L 40 40 Z" fill="#212121" />
             <path d="M 65 35 L 80 20 L 60 40 Z" fill="#212121" />
             
             {/* Thân màu kem nhạt (như bộ đồ bó) */}
             <path d="M 35 60 Q 25 20 50 35 Q 75 20 65 60 Q 50 90 35 60 Z" fill="#fff9c4" stroke="#fbc02d" strokeWidth="2" />
             {/* Giáp ngực Vàng cam rõ nét */}
             <path d="M 30 60 Q 50 70 70 60" fill="none" stroke="#ffab00" strokeWidth="8" opacity="1" />
             <ChibiEyes x={50} y={50} />
          </g>
        );
      case 6: // Bơ - Cell (XANH LÁ ĐẬM + ĐỐM) -> Khác biệt với Lê
        return (
          <g>
             {/* Cánh */}
             <path d="M 20 40 Q 10 20 30 30" fill="#212121" opacity="0.8" />
             <path d="M 80 40 Q 90 20 70 30" fill="#212121" opacity="0.8" />
             
             {/* Màu xanh đậm (Forest Green) */}
             <path d="M 50 10 C 30 10, 20 40, 20 65 C 20 90, 35 95, 50 95 C 65 95, 80 90, 80 65 C 80 40, 70 10, 50 10 Z" 
                   fill="#2e7d32" stroke="#1b5e20" strokeWidth="2" />
             {/* Đốm đen rõ */}
             <circle cx="35" cy="80" r="3" fill="#000" opacity="0.5" />
             <circle cx="65" cy="80" r="3" fill="#000" opacity="0.5" />
             <circle cx="50" cy="30" r="2" fill="#000" opacity="0.5" />
             {/* Bụng tím nhạt */}
             <circle cx="50" cy="65" r="14" fill="#b39ddb" stroke="#7e57c2" strokeWidth="1" />
             <ChibiEyes x={50} y={50} />
          </g>
        );
      case 7: // Dứa - SSJ3 (VÀNG NÂU / GOLD) -> Khác biệt với Chanh
        return (
          <g>
             {/* Tóc dài vàng sậm */}
             <path d="M 50 40 Q 20 50 10 90" fill="none" stroke="#f9a825" strokeWidth="5" />
             <path d="M 50 40 Q 80 50 90 90" fill="none" stroke="#f9a825" strokeWidth="5" />
             <path d="M 50 30 L 50 10" fill="none" stroke="#f9a825" strokeWidth="5" />
             
             {/* Thân màu Vàng Cam (Gold) */}
             <rect x="30" y="35" width="40" height="55" rx="15" fill="#fbc02d" stroke="#e65100" strokeWidth="2" />
             <g transform="translate(50, 55)">
                <ellipse cx="-8" cy="0" rx="4" ry="5" fill="#212121" />
                <ellipse cx="8" cy="0" rx="4" ry="5" fill="#212121" />
                <path d="M -12 -5 Q 0 0 12 -5" fill="none" stroke="#e65100" strokeWidth="3" />
             </g>
             <path d="M 45 65 Q 50 68 55 65" fill="none" stroke="#212121" strokeWidth="1.5" />
          </g>
        );
      case 8: // Dưa hấu - Majin (XANH LÁ + ĐỎ)
        return (
          <g>
             <path d="M 10 40 Q 50 100 90 40 Z" fill="#1b5e20" stroke="#000" strokeWidth="2" />
             <path d="M 15 40 Q 50 90 85 40 Z" fill="#ff5252" stroke="none" />
             <ChibiEyes x={50} y={55} />
             <path d="M 42 45 L 45 52 L 50 48 L 55 52 L 58 45" fill="none" stroke="#212121" strokeWidth="2" />
             <circle cx="35" cy="70" r="2" fill="black" />
             <circle cx="65" cy="70" r="2" fill="black" />
          </g>
        );
      case 9: // Dâu tây - Buu (HỒNG)
        return (
          <g>
             <path d="M 20 40 Q 10 60 15 80 L 85 80 Q 90 60 80 40" fill="#9575cd" opacity="0.9" />
             <path d="M 20 30 Q 50 15 80 30 Q 90 50 50 95 Q 10 50 20 30 Z" fill="#f48fb1" stroke="#ec407a" strokeWidth="2" />
             <path d="M 40 30 Q 50 10 60 30" fill="none" stroke="#f48fb1" strokeWidth="8" strokeLinecap="round" />
             <path d="M 38 55 Q 42 52 46 55" fill="none" stroke="#212121" strokeWidth="2" />
             <path d="M 54 55 Q 58 52 62 55" fill="none" stroke="#212121" strokeWidth="2" />
             <path d="M 45 65 Q 50 70 55 65" fill="none" stroke="#212121" strokeWidth="1.5" />
          </g>
        );
      default: return <circle cx="50" cy="50" r="35" fill={colorSet.main} />;
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center transition-all duration-200 select-none will-change-transform ${containerClass}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible" 
      >
        {isSelected && (
            <circle cx="50" cy="50" r="45" fill="url(#aura-grad)" opacity="0.5" className="animate-pulse" />
        )}

        <defs>
            <radialGradient id="aura-grad" cx="50%" cy="50%" r="50%">
                <stop offset="50%" stopColor="#ffeb3b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffeb3b" stopOpacity="0" />
            </radialGradient>
            
            {/* Gradient cho Ngọc Rồng: Cam Sáng hơn */}
            <radialGradient id="dragonball-grad" cx="35%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#ffcc80" /> {/* Cam rất sáng */}
                <stop offset="100%" stopColor="#ff9800" /> {/* Cam chuẩn */}
            </radialGradient>
        </defs>

        {renderChibiFruit()}

        {/* SỐ ĐIỂM: VIÊN NGỌC RỒNG 4 SAO CẢI TIẾN */}
        <g transform="translate(80, 80)">
           {/* Viên ngọc */}
           <circle r="18" fill="url(#dragonball-grad)" stroke="#e65100" strokeWidth="1.5" />
           {/* Điểm sáng bóng */}
           <ellipse cx="-6" cy="-6" rx="6" ry="3" fill="white" opacity="0.7" transform="rotate(-45)" />
           
           {/* Các ngôi sao nhỏ trang trí */}
           <path d="M 0 -14 L 2 -10 L 6 -10 L 3 -7 L 4 -3 L 0 -5 L -4 -3 L -3 -7 L -6 -10 L -2 -10 Z" fill="#d32f2f" opacity="0.6" />
           
           {/* SỐ ĐIỂM: CHỮ ĐỎ + VIỀN TRẮNG DÀY (Stroke) để dễ đọc trên nền cam */}
           <text 
             y="7" textAnchor="middle" 
             fill="#d32f2f"  // Màu đỏ đậm của sao
             stroke="white"  // Viền trắng dày
             strokeWidth="3.5"
             paintOrder="stroke" // Vẽ viền trước, vẽ chữ sau
             fontSize="26" fontWeight="900" fontFamily="Arial, sans-serif"
           >
             {value}
           </text>
        </g>
      </svg>
      
      <style>{`
        @keyframes teleport { 
           0% { transform: scale(1); opacity: 1; filter: brightness(1); } 
           10% { transform: scale(0.1); opacity: 0; filter: brightness(10); } 
           100% { transform: scale(0); opacity: 0; } 
        }
        .animate-teleport { animation: teleport 0.3s ease-in forwards; }

        @keyframes shake { 
           0%, 100% { transform: translateX(0); } 
           25% { transform: translateX(-3px); } 
           75% { transform: translateX(3px); } 
        }
        .animate-shake { animation: shake 0.3s ease-in-out both; }
      `}</style>
    </div>
  );
});