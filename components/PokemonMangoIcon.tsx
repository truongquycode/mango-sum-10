// components/PokemonMangoIcon.tsx
import React from 'react';
import { MANGO_COLORS } from '../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
  isError?: boolean;
}

// 1. MẮT ANIME (Có nhiều trạng thái)
const MonsterEye = ({ type = 'normal', x, y, size = 1, flip = false }: { type?: 'normal'|'angry'|'happy', x: number, y: number, size?: number, flip?: boolean }) => {
    const scaleX = flip ? -1 : 1;
    return (
        <g transform={`translate(${x}, ${y}) scale(${size}) scale(${scaleX}, 1)`}>
            {/* Lòng trắng */}
            <path d="M -6 -8 Q 8 -8 8 4 Q 8 10 -2 10 Q -8 8 -6 -8" fill="white" stroke="#212121" strokeWidth="1.5" />
            
            {/* Lòng đen + Màu */}
            {type === 'angry' ? (
                <path d="M -4 -4 L 6 -2 L 4 6 L -2 6 Z" fill="#212121" />
            ) : (
                <ellipse cx="2" cy="2" rx="3" ry="4" fill="#212121" />
            )}
            
            {/* Điểm sáng (Highlight) */}
            <circle cx="4" cy="-2" r="2" fill="white" />
            
            {/* Lông mày */}
            {type === 'angry' && <path d="M -8 -10 L 8 -4" stroke="#212121" strokeWidth="2" strokeLinecap="round" />}
        </g>
    )
}

// 2. NỀN HỆ (TYPE BACKGROUND) - Giống huy hiệu
const TypeBadge = ({ type }: { type: 'grass' | 'fire' | 'water' | 'electric' | 'normal' | 'fairy' }) => {
    const colors = {
        grass: "#aed581", fire: "#ffab91", water: "#90caf9",
        electric: "#fff59d", normal: "#e0e0e0", fairy: "#f48fb1"
    };
    return (
        <circle cx="50" cy="50" r="46" fill={colors[type]} stroke="white" strokeWidth="3" opacity="0.8" />
    );
};

export const PokemonMangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved, isError }) => {
  
  const colorSet = MANGO_COLORS[value] || MANGO_COLORS[5];
  // Màu đậm hơn cho viền và bóng
  const strokeColor = "#1a1a1a"; // Đen nhạt (Charcoal)

  let containerClass = '';
  if (isRemoved) {
    containerClass = 'animate-poke-faint pointer-events-none';
  } else if (isError) {
    containerClass = 'animate-poke-shake z-20';
  } else if (isSelected) {
    containerClass = 'scale-[1.15] z-10 drop-shadow-2xl animate-poke-bounce';
  } else {
    containerClass = 'scale-[0.92] hover:scale-[1.02] transition-transform duration-200';
  }

  // Cấu hình từng loại Pokemon-Fruit
  const renderMonster = () => {
    switch (value) {
      case 1: // Nho (Hệ Độc/Ma - Tím - Mắt to tròn)
        return (
          <g>
            <TypeBadge type="fairy" />
            <g transform="translate(0, 5)">
                {/* Chùm nho */}
                <circle cx="30" cy="40" r="14" fill="#7e57c2" stroke={strokeColor} strokeWidth="2.5" />
                <circle cx="70" cy="40" r="14" fill="#7e57c2" stroke={strokeColor} strokeWidth="2.5" />
                <circle cx="50" cy="75" r="14" fill="#7e57c2" stroke={strokeColor} strokeWidth="2.5" />
                <circle cx="50" cy="55" r="18" fill="#673ab7" stroke={strokeColor} strokeWidth="2.5" />
                
                {/* Mặt */}
                <MonsterEye x={42} y={55} size={0.8} />
                <MonsterEye x={58} y={55} size={0.8} flip />
                <path d="M 48 62 Q 50 65 52 62" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        );

      case 2: // Lê (Hệ Cỏ - Xanh - Hiền lành)
        return (
          <g>
            <TypeBadge type="grass" />
            {/* Thân */}
            <path d="M 50 15 C 30 15, 25 50, 20 70 C 15 85, 30 95, 50 95 C 70 95, 85 85, 80 70 C 75 50, 70 15, 50 15 Z" 
                  fill="#cddc39" stroke={strokeColor} strokeWidth="2.5" />
            {/* Lá trên đầu */}
            <path d="M 50 15 Q 35 5 30 15 Q 40 25 50 15" fill="#43a047" stroke={strokeColor} strokeWidth="2" />
            {/* Mặt */}
            <MonsterEye x={40} y={55} size={0.9} />
            <MonsterEye x={60} y={55} size={0.9} flip />
            <path d="M 48 65 Q 50 68 52 65" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            {/* Má hồng */}
            <ellipse cx="30" cy="62" rx="4" ry="2" fill="#ef9a9a" opacity="0.6"/>
            <ellipse cx="70" cy="62" rx="4" ry="2" fill="#ef9a9a" opacity="0.6"/>
          </g>
        );

      case 3: // Chanh (Hệ Điện - Vàng - Tinh nghịch)
        return (
          <g>
            <TypeBadge type="electric" />
            {/* Thân bầu dục ngang */}
            <ellipse cx="50" cy="55" rx="42" ry="32" fill="#ffeb3b" stroke={strokeColor} strokeWidth="2.5" />
            {/* Gai điện (Tóc) */}
            <path d="M 30 30 L 40 10 L 50 30 L 60 10 L 70 30" fill="#fdd835" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
            {/* Mặt */}
            <MonsterEye x={35} y={52} size={0.9} type="angry" />
            <MonsterEye x={65} y={52} size={0.9} type="angry" flip />
            <path d="M 45 62 L 50 65 L 55 62" fill="none" stroke={strokeColor} strokeWidth="2" />
            {/* Má điện Pikachu */}
            <circle cx="20" cy="60" r="5" fill="#e53935" stroke="none" />
            <circle cx="80" cy="60" r="5" fill="#e53935" stroke="none" />
          </g>
        );

      case 4: // Cam (Hệ Lửa - Cam - Tròn)
        return (
          <g>
            <TypeBadge type="fire" />
            <circle cx="50" cy="55" r="38" fill="#fb8c00" stroke={strokeColor} strokeWidth="2.5" />
            {/* Họa tiết bụng */}
            <circle cx="50" cy="75" r="20" fill="#ffcc80" opacity="0.6" />
            {/* Mặt */}
            <MonsterEye x={40} y={50} size={1} />
            <MonsterEye x={60} y={50} size={1} flip />
            <path d="M 45 65 Q 50 70 55 65" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            {/* Lá */}
            <path d="M 50 17 Q 65 10 65 25 Q 55 35 50 17" fill="#43a047" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case 5: // Chuối (Hệ Bay/Rồng - Vàng - Dài)
        return (
          <g transform="rotate(10 50 50)">
            <TypeBadge type="normal" />
            {/* Thân */}
            <path d="M 35 65 Q 25 20 50 15 Q 75 20 65 65 Q 50 95 35 65 Z" fill="#fff176" stroke={strokeColor} strokeWidth="2.5" />
            {/* Cánh/Vỏ */}
            <path d="M 35 65 Q 10 70 20 90" fill="none" stroke={strokeColor} strokeWidth="2.5" fillStyle="#fff9c4"/>
            <path d="M 65 65 Q 90 70 80 90" fill="none" stroke={strokeColor} strokeWidth="2.5" />
            
            <MonsterEye x={42} y={45} size={0.8} />
            <MonsterEye x={58} y={45} size={0.8} flip />
            <path d="M 48 58 Q 50 60 52 58" fill="none" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case 6: // Bơ (Hệ Đất - Xanh - Bụng bự)
        return (
          <g>
            <TypeBadge type="grass" />
            <path d="M 50 10 C 30 10, 20 40, 20 65 C 20 90, 35 95, 50 95 C 65 95, 80 90, 80 65 C 80 40, 70 10, 50 10 Z" 
                  fill="#66bb6a" stroke={strokeColor} strokeWidth="2.5" />
            {/* Bụng (Hột) */}
            <circle cx="50" cy="70" r="16" fill="#8d6e63" stroke={strokeColor} strokeWidth="2" />
            {/* Mặt (Trên thân) */}
            <MonsterEye x={40} y={45} size={0.9} />
            <MonsterEye x={60} y={45} size={0.9} flip />
            <path d="M 48 55 Q 50 58 52 55" fill="none" stroke={strokeColor} strokeWidth="2" />
          </g>
        );

      case 7: // Dứa (Hệ Chiến Đấu - Vàng/Nâu - Ngầu)
        return (
          <g>
            <TypeBadge type="electric" />
            {/* Tóc lá */}
            <path d="M 30 35 L 20 10 L 40 25 L 50 5 L 60 25 L 80 10 L 70 35 Z" fill="#2e7d32" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
            {/* Thân */}
            <rect x="30" y="35" width="40" height="55" rx="15" fill="#fbc02d" stroke={strokeColor} strokeWidth="2.5" />
            {/* Kính râm (Ngầu) */}
            <path d="M 35 55 L 48 58 L 65 55 L 65 62 L 48 65 L 35 62 Z" fill="#212121" />
            {/* Miệng nhếch mép */}
            <path d="M 45 75 Q 55 78 60 72" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            {/* Vết sẹo/Gai */}
            <path d="M 35 45 L 40 50 M 60 45 L 65 50" stroke="#e65100" strokeWidth="2" />
          </g>
        );

      case 8: // Dưa hấu (Hệ Nước - Đỏ/Xanh - Hàm răng)
        return (
          <g>
            <TypeBadge type="water" />
            {/* Vỏ */}
            <path d="M 10 40 Q 50 100 90 40 Z" fill="#2e7d32" stroke={strokeColor} strokeWidth="2.5" />
            {/* Ruột */}
            <path d="M 15 40 Q 50 90 85 40 Z" fill="#e53935" stroke="none" />
            {/* Mắt to */}
            <MonsterEye x={35} y={55} size={1} type="angry" />
            <MonsterEye x={65} y={55} size={1} type="angry" flip />
            {/* Răng (Hạt) */}
            <path d="M 40 40 L 45 48 L 50 40 M 50 40 L 55 48 L 60 40" fill="white" stroke={strokeColor} strokeWidth="1" />
          </g>
        );

      case 9: // Dâu tây (Hệ Tiên - Hồng - Cute)
        return (
          <g>
            <TypeBadge type="fairy" />
            <path d="M 20 30 Q 50 15 80 30 Q 90 50 50 95 Q 10 50 20 30 Z" fill="#f06292" stroke={strokeColor} strokeWidth="2.5" />
            {/* Lá (Nơ) */}
            <path d="M 25 30 Q 30 15 50 25 Q 70 15 75 30" fill="#8bc34a" stroke={strokeColor} strokeWidth="2" />
            {/* Mặt long lanh */}
            <MonsterEye x={38} y={55} size={1.1} />
            <MonsterEye x={62} y={55} size={1.1} flip />
            <path d="M 48 65 Q 50 68 52 65" fill="none" stroke={strokeColor} strokeWidth="2" />
            {/* Tàn nhang */}
            <circle cx="30" cy="50" r="1.5" fill="white" opacity="0.6"/>
            <circle cx="70" cy="50" r="1.5" fill="white" opacity="0.6"/>
            <circle cx="50" cy="80" r="1.5" fill="white" opacity="0.6"/>
          </g>
        );

      default: return <circle cx="50" cy="50" r="30" fill="#ffd600" stroke={strokeColor} strokeWidth="2.5" />;
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center transition-all duration-200 select-none will-change-transform ${containerClass}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible" 
        style={{ filter: 'drop-shadow(0px 4px 0px rgba(0,0,0,0.2))' }} // Bóng đổ cứng kiểu Sticker
      >
        {renderMonster()}

        {/* Số điểm: Kiểu Badge ở góc */}
        <g transform="translate(82, 82)">
           <circle r="14" fill="#212121" stroke="white" strokeWidth="2" />
           <text 
             y="5" textAnchor="middle" 
             fill="white" 
             fontSize="16" fontWeight="900" fontFamily="Arial, sans-serif"
           >
             {value}
           </text>
        </g>
      </svg>
      
      <style>{`
        @keyframes poke-faint { 
           0% { transform: scale(1) translateY(0); opacity: 1; filter: grayscale(0); } 
           100% { transform: scale(0.5) translateY(20px); opacity: 0; filter: grayscale(1); } 
        }
        .animate-poke-faint { animation: poke-faint 0.5s ease-in forwards; }

        @keyframes poke-shake { 
           0%, 100% { transform: rotate(0); } 
           25% { transform: rotate(-10deg); } 
           75% { transform: rotate(10deg); } 
        }
        .animate-poke-shake { animation: poke-shake 0.3s ease-in-out both; }

        @keyframes poke-bounce {
            0%, 100% { transform: scale(1.15) translateY(0); }
            50% { transform: scale(1.25) translateY(-5px); }
        }
        .animate-poke-bounce { animation: poke-bounce 0.6s infinite ease-in-out; }
      `}</style>
    </div>
  );
});