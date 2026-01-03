// components/StartScreen/types.ts
import { SettingsModal, ThemeType } from './SettingsModal';
export interface AccessLog {
  name: string;
  timestamp: number;
  action: string;
  score?: number; // <--- Thêm dòng này để lưu điểm
}

export interface StartScreenProps {
  onStart: (name?: string) => void; 
  onMultiplayer: () => void;
  onOpenHistory: () => void;
  highScore: number;
  currentTheme: ThemeType;
  onSetTheme: (theme: ThemeType) => void;
}