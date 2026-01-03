// components/StartScreen/types.ts
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
}