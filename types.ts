// types.ts
export interface Position {
  row: number;
  col: number;
}

export interface MangoCell {
  id: string;
  value: number; // 1-9
  isRemoved: boolean;
  isBonus?: boolean;
}

export enum GameState {
  MENU = 'MENU',
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface DragState {
  isDragging: boolean;
  startPos: Position | null;
  currentPos: Position | null;
}

export interface MultiPlayerMessage {
  // Thêm SYNC_MAP và UPDATE_SCORE để xử lý riêng biệt
  type: 'START' | 'SYNC_MAP' | 'UPDATE_SCORE' | 'GAME_OVER' | 'RESTART' | 'TIME_UPDATE' | 'READY';
  payload?: any;
}