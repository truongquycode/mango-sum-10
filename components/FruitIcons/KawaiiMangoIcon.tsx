// components/KawaiiMangoIcon.tsx
import React from 'react';
import { MANGO_COLORS } from '../../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
  isError?: boolean;
}

// Khuôn mặt siêu dễ thương, mắt long lanh
const KawaiiFace = ({ translateY = 0 }) => (
  <g transform={`translate(0, ${translateY})`}>
    {/* Má hồng */}
    <ellipse cx="25" cy="52" rx="7" ry="4" fill="#ff8a80" opacity="0.6" filter="url(#blurMe)" />
    <ellipse cx="75" cy="52" rx="7" ry="4" fill="#ff8a80" opacity="0.6" filter="url(#blurMe)" />
    
    {/* Mắt trái long lanh */}
    <g>
      <ellipse cx="35" cy="45" rx="6" ry="7" fill="#3e2723" /> {/* Nền mắt tối */}
      <circle cx="32" cy="42" r="2.5" fill="white" /> {/* Đốm sáng lớn */}
      <circle cx="37" cy="48" r="1.5" fill="white" opacity="0.8" /> {/* Đốm sáng nhỏ */}
    </g>
    {/* Mắt phải long lanh */}
    <g>
      <ellipse cx="65" cy="45" rx="6" ry="7" fill="#3e2723" />
      <circle cx="62" cy="42" r="2.5" fill="white" />
      <circle cx="67" cy="48" r="1.5" fill="white" opacity="0.8" />
    </g>
    
    {/* Miệng nhỏ xinh (hình chữ w mềm) */}
    <path 
      d="M 43 55 Q 50 60 57 55" 
      fill="none" 
      stroke="#3e2723" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
  </g>
);

// Helper tạo hiệu ứng bóng bẩy căng mọng
const ShinyOverlay = ({ shapeId }: { shapeId: string }) => (
  <>
    {/* Viền sáng ở trên đỉnh (Rim light) */}
    <use href={`#${shapeId}`} fill="none" stroke="white" strokeWidth="3" opacity="0.3" clipPath={`url(#clip-${shapeId}-top)`} />
    {/* Bóng đổ bên trong (Inner shadow) để tạo độ sâu */}
    <use href={`#${shapeId}`} fill="url(#inner-shadow-grad)" opacity="0.4" style={{ mixBlendMode: 'multiply' }} />
    {/* Điểm sáng chính (Main Highlight) */}
    <ellipse cx="35" cy="30" rx="20" ry="15" fill="white" opacity="0.25" transform="rotate(-20 35 30)" filter="url(#blurMe)" />
  </>
);


export const KawaiiMangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved, isError }) => {
  
  const colorSet = MANGO_COLORS[value] || MANGO_COLORS[5];
  const strokeColor = colorSet.dark;

  let containerClass = '';
  if (isRemoved) {
    containerClass = 'animate-bounce-out pointer-events-none';
  } else if (isError) {
    containerClass = 'animate-wobble z-20';
  } else if (isSelected) {
    containerClass = 'scale-[1.15] z-10 brightness-110 drop-shadow-2xl';
  } else {
    containerClass = 'scale-[0.98] hover:scale-[1.08] transition-transform duration-300 ease-out';
  }

  const renderFruitBody = () => {
    const mainId = `fruit-shape-${value}`;
    switch (value) {
      case 1: // Nho (Chùm bóng tròn căng mọng)
        return (
          <g>
            <defs>
              <g id={mainId}>
                 <circle cx="30" cy="40" r="15" /> <circle cx="70" cy="40" r="15" />
                 <circle cx="50" cy="75" r="15" /> <circle cx="20" cy="60" r="14" />
                 <circle cx="80" cy="60" r="14" /> <circle cx="50" cy="55" r="16" />
                 <circle cx="35" cy="75" r="15" /> <circle cx="65" cy="75" r="15" />
              </g>
            </defs>
            <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke={strokeColor} strokeWidth="3" />
            
            {/* Chi tiết: Thêm các điểm sáng nhỏ trên từng quả nho */}
            <g fill="white" opacity="0.3">
               <circle cx="25" cy="35" r="3" /> <circle cx="65" cy="35" r="3" />
               <circle cx="45" cy="50" r="4" /> <circle cx="15" cy="55" r="3" />
               <circle cx="85" cy="55" r="3" /> <circle cx="45" cy="70" r="3" />
            </g>

            {/* Cuống lá chi tiết hơn */}
            <g transform="translate(50, 25)">
               <path d="M 0 0 Q 5 -15 0 -20" stroke="#5d4037" strokeWidth="4" strokeLinecap="round"/>
               <path d="M -2 -2 C -15 -10, -25 0, -12 10 C -5 5, -2 2, -2 -2 Z" fill="#7cb342" stroke="#33691e" strokeWidth="2"/>
               <path d="M 2 -2 C 15 -10, 25 0, 12 10 C 5 5, 2 2, 2 -2 Z" fill="#8bc34a" stroke="#33691e" strokeWidth="2"/>
               <path d="M -12 10 Q -18 5 -15 -2" stroke="#fff" strokeWidth="1" opacity="0.4" fill="none"/> {/* Vân lá */}
            </g>
          </g>
        );
      case 2: // Lê (Bầu bĩnh, có tàn nhang)
        return (
          <g>
            <defs><path id={mainId} d="M 50 10 C 25 10, 30 45, 15 65 C 5 85, 25 98, 50 98 C 75 98, 95 85, 85 65 C 70 45, 75 10, 50 10 Z" /></defs>
            <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke={strokeColor} strokeWidth="3"/>
            <ShinyOverlay shapeId={mainId} />
            
            {/* Chi tiết: Tàn nhang */}
            <g fill="#a16207" opacity="0.3">
               <circle cx="30" cy="70" r="1" /> <circle cx="40" cy="80" r="1.5" /> <circle cx="70" cy="75" r="1" />
               <circle cx="60" cy="85" r="1" /> <circle cx="25" cy="60" r="1" />
            </g>
            {/* Cuống */}
            <path d="M 50 10 Q 55 0 60 5" fill="none" stroke="#6d4c41" strokeWidth="4" strokeLinecap="round"/>
            <path d="M 55 8 Q 75 5 70 20 C 60 25, 55 15, 55 8 Z" fill="#8bc34a" stroke="#33691e" strokeWidth="2"/>
          </g>
        );
      case 3: // Chanh (Bề mặt sần sùi, màu tươi)
        return (
          <g>
            <defs><ellipse id={mainId} cx="50" cy="50" rx="48" ry="38" /></defs>
            {/* Hai đầu núm chanh */}
            <path d="M 4 50 C 0 50, 0 45, 8 40 L 12 50 L 8 60 C 0 55, 0 50, 4 50 Z" fill={colorSet.main} stroke={strokeColor} strokeWidth="3"/>
            <path d="M 96 50 C 100 50, 100 45, 92 40 L 88 50 L 92 60 C 100 55, 100 50, 96 50 Z" fill={colorSet.main} stroke={strokeColor} strokeWidth="3"/>
            
            <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke={strokeColor} strokeWidth="3" />
            
            {/* Chi tiết: Lỗ chân lông (sần sùi) */}
            <pattern id="lemon-texture" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="#c0ca33" opacity="0.5" />
            </pattern>
            <use href={`#${mainId}`} fill="url(#lemon-texture)" opacity="0.6" style={{ mixBlendMode: 'overlay' }} />

            <ShinyOverlay shapeId={mainId} />
          </g>
        );
      case 4: // Cam (Tròn xoe, sần sùi)
        return (
          <g>
            <defs><circle id={mainId} cx="50" cy="52" r="44" /></defs>
            <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke={strokeColor} strokeWidth="3" />
            
            {/* Chi tiết: Lỗ chân lông cam */}
            <pattern id="orange-texture" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1" fill="#e65100" opacity="0.3" />
            </pattern>
            <use href={`#${mainId}`} fill="url(#orange-texture)" opacity="0.7" style={{ mixBlendMode: 'overlay' }} />
            
            <ShinyOverlay shapeId={mainId} />
            
            {/* Cuống và lá */}
            <g transform="translate(50, 8)">
               <rect x="-2" y="0" width="4" height="8" fill="#3e2723" rx="1"/>
               <path d="M 0 5 Q 20 0 25 15 Q 5 25 0 5 Z" fill="#66bb6a" stroke="#2e7d32" strokeWidth="2"/>
               <path d="M 2 7 Q 12 5 18 12" stroke="#fff" strokeWidth="1" opacity="0.5" fill="none"/>
            </g>
          </g>
        );
      case 5: // Chuối (Cong mềm mại, có đường sống lưng)
        return (
          <g transform="rotate(5 50 50)">
             <defs><path id={mainId} d="M 32 60 Q 20 10 50 5 Q 80 10 68 60 Q 95 60 88 80 Q 70 95 50 95 Q 30 95 12 80 Q 5 60 32 60 Z" /></defs>
             <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke={strokeColor} strokeWidth="3" />
             
             {/* Đường sống lưng chuối */}
             <path d="M 50 5 Q 65 50 50 95" stroke="#fdd835" strokeWidth="2" fill="none" opacity="0.6" />
             
             <ShinyOverlay shapeId={mainId} />
             {/* Đầu núm nâu */}
             <path d="M 45 92 L 46 97 L 54 97 L 55 92 Z" fill="#6d4c41" stroke={strokeColor} strokeWidth="2" />
          </g>
        );
      case 6: // Bơ (Hạt tròn nổi khối)
        return (
          <g>
            <defs><path id={mainId} d="M 50 5 C 25 5, 10 35, 10 65 C 10 95, 30 98, 50 98 C 70 98, 90 95, 90 65 C 90 35, 75 5, 50 5 Z" /></defs>
            {/* Vỏ */}
            <use href={`#${mainId}`} fill="#2e7d32" stroke="#1b5e20" strokeWidth="3"/>
            {/* Ruột */}
            <path d="M 50 12 C 30 12, 18 38, 18 65 C 18 88, 32 92, 50 92 C 68 92, 82 88, 82 65 C 82 38, 70 12, 50 12 Z" fill={`url(#kawaii-grad-${value})`} stroke="#8bc34a" strokeWidth="2"/>
            
            {/* Hạt bơ (Nổi khối 3D) */}
            <g>
               <circle cx="50" cy="68" r="18" fill="url(#avocado-pit-grad)" stroke="#3e2723" strokeWidth="2" />
               <ellipse cx="45" cy="62" rx="6" ry="4" fill="white" opacity="0.4" transform="rotate(-20 45 62)" filter="url(#blurMe)"/>
            </g>
          </g>
        );
      case 7: // Dứa (Mắt dứa hình thoi chi tiết, lá dày)
        return (
          <g>
            {/* Lá dứa dày */}
            <g stroke="#052e16" strokeWidth="2" strokeLinejoin="round">
                <path d="M 30 30 Q 10 10 30 0 L 40 25 Z" fill="#2e7d32"/>
                <path d="M 70 30 Q 90 10 70 0 L 60 25 Z" fill="#2e7d32"/>
                <path d="M 50 25 Q 50 -5 50 25 Z" fill="#4ade80"/> {/* Lá giữa sáng */}
                <path d="M 40 28 Q 30 5 50 5 L 55 28 Z" fill="#1b5e20"/>
            </g>

            <defs><rect id={mainId} x="20" y="28" width="60" height="68" rx="25" ry="25" /></defs>
            <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke={strokeColor} strokeWidth="3" />
            
            {/* Mắt dứa chi tiết (Hình thoi có bóng) */}
            <pattern id="pineapple-skin" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                 <rect x="0" y="0" width="18" height="18" fill="none" stroke="#a16207" strokeWidth="1.5" opacity="0.5"/>
                 <circle cx="9" cy="9" r="2" fill="#a16207"/>
                 <path d="M 9 1 L 17 9 L 9 17 L 1 9 Z" fill="#ffd54f" opacity="0.3" /> {/* Highlight trong mắt */}
            </pattern>
            <use href={`#${mainId}`} fill="url(#pineapple-skin)" />
            <ShinyOverlay shapeId={mainId} />
          </g>
        );
      case 8: // Dưa hấu (Hạt giọt nước, vỏ nhiều lớp)
        return (
          <g>
              <defs><path id={mainId} d="M 5 35 Q 5 98 50 98 Q 95 98 95 35 Z" /></defs>
              {/* Vỏ ngoài */}
              <path d="M 5 35 Q 5 105 50 105 Q 95 105 95 35 Z" fill="#1b5e20" stroke="#052e16" strokeWidth="3"/>
              {/* Vỏ trong (cùi trắng) */}
              <path d="M 8 35 Q 8 100 50 100 Q 92 100 92 35 Z" fill="#e8f5e9" />
              {/* Ruột đỏ */}
              <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke="#d32f2f" strokeWidth="2"/>

              <ShinyOverlay shapeId={mainId} />
              
              {/* Hạt dưa (hình giọt nước bóng) */}
              <g fill="#3e2723">
                 {[
                   {x: 30, y: 55}, {x: 70, y: 55}, {x: 50, y: 70}, {x: 35, y: 80}, {x: 65, y: 80}
                 ].map((pos, idx) => (
                   <g key={idx} transform={`translate(${pos.x}, ${pos.y}) rotate(${idx % 2 === 0 ? -10 : 10})`}>
                     <path d="M 0 -4 Q 3 0 0 4 Q -3 0 0 -4 Z" />
                     <circle cx="-1" cy="-1" r="1" fill="white" opacity="0.5" />
                   </g>
                 ))}
              </g>
          </g>
        );
      case 9: // Dâu tây (Hạt lõm xuống, lá bồng bềnh)
        return (
          <g>
             <defs><path id={mainId} d="M 50 15 C 25 10, 5 35, 10 65 C 15 90, 35 95, 50 99 C 65 95, 85 90, 90 65 C 95 35, 75 10, 50 15 Z" /></defs>
             <use href={`#${mainId}`} fill={`url(#kawaii-grad-${value})`} stroke={strokeColor} strokeWidth="3" />
             <ShinyOverlay shapeId={mainId} />

             {/* Hạt dâu (nằm trong hố lõm) */}
             <g>
                 {[
                   {x: 30, y: 40}, {x: 70, y: 40}, {x: 50, y: 55}, 
                   {x: 25, y: 65}, {x: 75, y: 65}, {x: 50, y: 80}
                 ].map((pos, idx) => (
                   <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                      <circle r="3" fill="#b71c1c" opacity="0.5" /> {/* Hố lõm tối màu */}
                      <path d="M 0 -1.5 Q 1.5 0 0 1.5 Q -1.5 0 0 -1.5 Z" fill="#ffe0b2" /> {/* Hạt sáng màu */}
                   </g>
                 ))}
             </g>

             {/* Lá dâu (bồng bềnh, nhiều lớp) */}
             <g filter="url(#dropShadowSmall)">
               <path d="M 50 18 L 35 5 Q 45 25 50 20 L 65 5 Q 55 25 50 20 L 50 0" fill="#2e7d32" stroke="#1b5e20" strokeWidth="2" strokeLinejoin="round"/>
               <path d="M 35 5 Q 40 15 50 18" stroke="#4ade80" strokeWidth="1" fill="none" opacity="0.5"/>
               <path d="M 65 5 Q 60 15 50 18" stroke="#4ade80" strokeWidth="1" fill="none" opacity="0.5"/>
             </g>
          </g>
        );
      default: return <circle cx="50" cy="50" r="40" fill={colorSet.main} />;
    }
  };

  const renderFace = () => {
      let translateY = 0;
      if (value === 1) translateY = 5;
      if (value === 5) translateY = -5;
      if (value === 2) translateY = 10;
      if (value === 6) translateY = 8;
      if (value === 9) translateY = 5;
      return <KawaiiFace translateY={translateY} />;
  }

  return (
    <div className={`w-full h-full flex items-center justify-center transition-all duration-300 select-none will-change-transform ${containerClass}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible" 
        style={{ filter: isError ? 'drop-shadow(0px 0px 8px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0px 6px 10px rgba(0,0,0,0.15))' }}
      >
        <defs>
          {/* Gradients kiểu Kawaii: Dùng Radial để tạo độ khối tròn trịa */}
          <radialGradient id={`kawaii-grad-${value}`} cx="40%" cy="40%" r="70%" fx="30%" fy="30%">
            <stop offset="0%" stopColor={colorSet.light} /> {/* Điểm sáng nhất */}
            <stop offset="50%" stopColor={colorSet.main} />
            <stop offset="100%" stopColor={colorSet.dark} /> {/* Viền tối */}
          </radialGradient>
          
          {/* Gradient bóng đổ bên trong */}
          <linearGradient id="inner-shadow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="black" stopOpacity="0" />
               <stop offset="80%" stopColor="black" stopOpacity="0.2" />
               <stop offset="100%" stopColor="black" stopOpacity="0.5" />
          </linearGradient>

          {/* Gradient riêng cho hạt bơ */}
           <radialGradient id="avocado-pit-grad" cx="40%" cy="40%" r="60%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#8d6e63" />
            <stop offset="100%" stopColor="#3e2723" />
          </radialGradient>

          {/* Filters */}
          <filter id="blurMe"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5" /></filter>
          <filter id="dropShadowSmall">
             <feDropShadow dx="0" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.2)"/>
          </filter>
        </defs>
        
        {renderFruitBody()}
        {renderFace()}
        
        {/* Số điểm: Font chữ tròn trịa, viền dày dễ thương */}
        <text 
          x="50" y="88" textAnchor="middle" dominantBaseline="middle" 
          fill="white" stroke={strokeColor} strokeWidth="5" paintOrder="stroke"
          fontSize="30" fontWeight="900" fontFamily="'Comic Sans MS', 'Fredoka One', cursive, sans-serif" 
          style={{ pointerEvents: 'none', filter: 'drop-shadow(0px 3px 0px rgba(0,0,0,0.2))' }}
        >
          {value}
        </text>
      </svg>
      
      <style>{`
        @keyframes bounce-out { 
           0% { transform: scale(1); opacity: 1; } 
           30% { transform: scale(1.2); opacity: 1; }
           100% { transform: scale(0); opacity: 0; } 
        }
        .animate-bounce-out { animation: bounce-out 0.5s ease-in forwards; }
        @keyframes wobble { 
           0%, 100% { transform: rotate(0); } 
           25% { transform: rotate(-5deg) scale(1.1); } 
           75% { transform: rotate(5deg) scale(1.1); } 
        }
        .animate-wobble { animation: wobble 0.4s ease-in-out both; }
      `}</style>
    </div>
  );
});