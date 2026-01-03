// components/PaperMangoIcon.tsx
import React from 'react';
import { MANGO_COLORS } from '../../constants';

interface MangoIconProps {
  value: number;
  isSelected: boolean;
  isRemoved: boolean;
  isError?: boolean;
}

const PaperLayer = ({ 
  children, 
  color, 
  shadowColor = "rgba(0,0,0,0.2)", 
  offset = 3 
}: { 
  children: React.ReactNode, 
  color: string, 
  shadowColor?: string, 
  offset?: number 
}) => {
  return (
    <g>
      <g transform={`translate(${offset}, ${offset})`} fill={shadowColor} stroke="none">
         {children}
      </g>
      <g fill={color} stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
         {children}
      </g>
    </g>
  );
};

// Khuôn mặt (TĨNH - KHÔNG CHỚP MẮT)
const PaperFace = () => (
  <g transform="translate(0, 2)" opacity="0.8">
    <circle cx="35" cy="45" r="3" fill="#3e2723" />
    <circle cx="65" cy="45" r="3" fill="#3e2723" />
    <path d="M 25 50 L 30 52 L 25 54" stroke="#ff8a80" strokeWidth="2" fill="none" />
    <path d="M 75 50 L 70 52 L 75 54" stroke="#ff8a80" strokeWidth="2" fill="none" />
    <path d="M 45 52 Q 50 58 55 52" stroke="#3e2723" strokeWidth="2" fill="none" strokeLinecap="round" />
  </g>
);

export const PaperMangoIcon: React.FC<MangoIconProps> = React.memo(({ value, isSelected, isRemoved, isError }) => {
  
  const colorSet = MANGO_COLORS[value] || MANGO_COLORS[5];
  const paperColor = colorSet.main;
  const shadowTone = "rgba(0,0,0,0.15)"; 

  let containerClass = '';
  if (isRemoved) {
    containerClass = 'animate-paper-fall pointer-events-none';
  } else if (isError) {
    containerClass = 'animate-shake z-20';
  } else if (isSelected) {
    containerClass = 'scale-[1.1] rotate-3 z-10 drop-shadow-xl';
  } else {
    containerClass = 'hover:-translate-y-1 hover:rotate-2 transition-transform duration-200';
  }

  const renderPaperFruit = () => {
    switch (value) {
      case 1:
        return (
          <g>
             <PaperLayer color={paperColor} shadowColor={shadowTone}>
                <circle cx="50" cy="35" r="15" />
                <circle cx="35" cy="55" r="14" />
                <circle cx="65" cy="55" r="14" />
                <circle cx="50" cy="75" r="13" />
             </PaperLayer>
             <g transform="translate(50, 20)">
                <path d="M 0 0 L 0 -10" stroke="#5d4037" strokeWidth="4" />
             </g>
          </g>
        );
      case 2:
        return (
          <PaperLayer color={paperColor} shadowColor={shadowTone}>
             <path d="M 50 15 C 30 15, 35 45, 25 60 C 15 75, 25 90, 50 90 C 75 90, 85 75, 75 60 C 65 45, 70 15, 50 15 Z" />
          </PaperLayer>
        );
      case 3:
        return (
          <PaperLayer color={paperColor} shadowColor={shadowTone}>
             <ellipse cx="50" cy="50" rx="45" ry="35" />
             <path d="M 5 50 L 15 45 L 15 55 Z" />
             <path d="M 95 50 L 85 45 L 85 55 Z" />
          </PaperLayer>
        );
      case 4:
        return (
          <PaperLayer color={paperColor} shadowColor={shadowTone}>
             <circle cx="50" cy="50" r="40" />
             <path d="M 50 10 Q 70 5 70 20 Q 60 30 50 10" fill="#66bb6a" stroke="white" strokeWidth="1" />
          </PaperLayer>
        );
      case 5:
        return (
          <PaperLayer color={paperColor} shadowColor={shadowTone}>
             <path d="M 30 15 Q 10 50 40 85 L 60 85 Q 90 50 70 15 Q 50 30 30 15 Z" />
          </PaperLayer>
        );
      case 6:
        return (
          <g>
            <PaperLayer color="#2e7d32" shadowColor={shadowTone}>
               <path d="M 50 10 C 30 10, 15 40, 15 65 C 15 90, 35 95, 50 95 C 65 95, 85 90, 85 65 C 85 40, 70 10, 50 10 Z" />
            </PaperLayer>
            <g transform="scale(0.85) translate(8.5, 10)">
                <path d="M 50 10 C 30 10, 15 40, 15 65 C 15 90, 35 95, 50 95 C 65 95, 85 90, 85 65 C 85 40, 70 10, 50 10 Z" fill={colorSet.light} stroke="none"/>
            </g>
            <circle cx="50" cy="65" r="15" fill="#5d4037" stroke="white" strokeWidth="1" />
          </g>
        );
      case 7:
        return (
          <g>
             <path d="M 50 30 L 30 5 L 40 30 L 50 10 L 60 30 L 70 5 L 50 30" fill="#2e7d32" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
             <PaperLayer color={paperColor} shadowColor={shadowTone}>
                <rect x="30" y="30" width="40" height="60" rx="15" />
             </PaperLayer>
             <path d="M 35 40 L 65 80 M 65 40 L 35 80" stroke="#a16207" strokeWidth="2" opacity="0.5" />
          </g>
        );
      case 8:
        return (
          <g>
            <PaperLayer color="#2e7d32" shadowColor={shadowTone}>
                <path d="M 10 35 Q 50 100 90 35 Z" />
            </PaperLayer>
            <path d="M 15 35 Q 50 90 85 35 Z" fill={paperColor} stroke="white" strokeWidth="1" />
            <g fill="#3e2723">
               <circle cx="40" cy="50" r="2" />
               <circle cx="60" cy="50" r="2" />
               <circle cx="50" cy="65" r="2" />
            </g>
          </g>
        );
      case 9:
        return (
          <PaperLayer color={paperColor} shadowColor={shadowTone}>
             <path d="M 20 20 Q 50 5 80 20 Q 90 40 50 95 Q 10 40 20 20 Z" />
             <path d="M 30 20 L 50 5 L 70 20 L 50 25 Z" fill="#43a047" stroke="white" />
          </PaperLayer>
        );
      default:
        return <circle cx="50" cy="50" r="40" fill={paperColor} />;
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center select-none will-change-transform ${containerClass}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible" 
        style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))' }}
      >
        {renderPaperFruit()}
        <PaperFace />
        
        <g transform="translate(80, 80) rotate(-10)">
           <circle r="16" fill="white" stroke="#ccc" strokeWidth="1" />
           <text 
             y="5" textAnchor="middle" 
             fill="#333" 
             fontSize="20" fontWeight="bold" fontFamily="sans-serif"
           >
             {value}
           </text>
        </g>
      </svg>
      
      <style>{`
        @keyframes paper-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(50px) rotate(10deg); opacity: 0; }
        }
        .animate-paper-fall {
          animation: paper-fall 0.5s ease-in forwards;
          transform-origin: top center;
        }
      `}</style>
    </div>
  );
});