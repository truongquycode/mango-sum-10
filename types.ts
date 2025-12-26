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
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface DragState {
  isDragging: boolean;
  startPos: Position | null;
  currentPos: Position | null;
}
