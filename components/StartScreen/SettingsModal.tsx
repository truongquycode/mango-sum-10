// components/StartScreen/SettingsModal.tsx
import React from 'react';
import { Button } from '../UI/Button';
// Import các icon để làm demo (Preview)
import { MangoIcon } from '../MangoIcon';
import { PixelMangoIcon } from '../PixelMangoIcon';
import { PaperMangoIcon } from '../PaperMangoIcon';
import { KawaiiMangoIcon } from '../KawaiiMangoIcon';
import { PokemonMangoIcon } from '../PokemonMangoIcon';
import { DragonBallMangoIcon } from '../DragonBallMangoIcon';



export type ThemeType = 'DEFAULT' | 'PIXEL' | 'PAPER';

interface SettingsModalProps {
  onClose: () => void;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, currentTheme, onSelectTheme }) => {
  
  const themes = [
  { id: 'DEFAULT', name: 'Mịn Màng (Ghibli)', Component: MangoIcon },
  { id: 'KAWAII', name: 'Siêu Cute (Chi tiết)', Component: KawaiiMangoIcon }, // <--- Thêm dòng này
  { id: 'PIXEL', name: 'Cổ Điển (8-bit)', Component: PixelMangoIcon },
  { id: 'PAPER', name: 'Giấy Dán (Cutout)', Component: PaperMangoIcon },
  { id: 'POKEMON', name: 'Bảo Bối (Monster)', Component: PokemonMangoIcon },
  { id: 'DRAGONBALL', name: 'Ngọc Rồng (Manga)', Component: DragonBallMangoIcon },
];

  return (
    <div className="z-50 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border-4 border-cyan-400 max-w-sm w-full animate-zoom-in relative">
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 w-8 h-8 flex items-center justify-center font-bold"
      >✕</button>
      
      <div className="text-center mb-4"> {/* Giảm mb-6 xuống mb-4 cho gọn */}
        <div className="text-5xl mb-2 animate-spin-slow">⚙️</div>
        <h3 className="text-2xl font-black text-cyan-600 uppercase">Cài Đặt</h3>
        <p className="text-gray-500 text-xs">Chọn phong cách trái cây nà</p>
      </div>

      {/* --- [BẮT ĐẦU SỬA] --- */}
      {/* Thêm div bao ngoài với max-h-64 (khoảng 3 dòng) và overflow-y-auto */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {themes.map((theme) => {
          const isSelected = currentTheme === theme.id;
          const DemoIcon = theme.Component;

          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id as ThemeType)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all ${
                isSelected 
                  ? 'border-cyan-500 bg-cyan-50 shadow-md scale-[0.98]' 
                  : 'border-gray-200 hover:border-cyan-200 hover:bg-gray-50'
              }`}
            >
              {/* Preview Icon */}
              <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                {/* @ts-ignore */}
                <DemoIcon value={5} isSelected={false} isRemoved={false} />
              </div>

              <div className="text-left flex-1">
                <p className={`font-bold ${isSelected ? 'text-cyan-700' : 'text-gray-600'}`}>
                  {theme.name}
                </p>
                {isSelected && <p className="text-[10px] text-cyan-500 font-bold">Đang chọn nè</p>}
              </div>

              {isSelected && <span className="text-cyan-500 text-xl font-bold">✓</span>}
            </button>
          )
        })}
      </div>
      {/* --- [KẾT THÚC SỬA] --- */}

      <Button onClick={onClose} className="w-full mt-6 shadow-cyan-200">
        Xong Rùi
      </Button>
    </div>
  );
};