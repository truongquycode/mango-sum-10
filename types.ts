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
  LOBBY = 'LOBBY', // Thêm trạng thái Lobby
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface DragState {
  isDragging: boolean;
  startPos: Position | null;
  currentPos: Position | null;
}

// Thêm interface cho tin nhắn mạng
export interface MultiPlayerMessage {
  type: 'START' | 'SCORE_UPDATE' | 'GAME_OVER' | 'RESTART';
  payload?: any;
}