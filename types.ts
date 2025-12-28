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
  HISTORY = 'HISTORY', // Thêm trạng thái này
}

export interface DragState {
  isDragging: boolean;
  startPos: Position | null;
  currentPos: Position | null;
}

export type ItemType = 'BOMB' | 'MAGIC' | 'FREEZE' | 'SPEED_UP' | 'STEAL' | 'DEBUFF_SCORE' | 'BUFF_SCORE';

export interface GameItem {
  id: string;
  type: ItemType;
  receivedAt: number;
}

export interface MultiPlayerMessage {
  type: 'START' | 'GRID_UPDATE' | 'SYNC_MAP' | 'UPDATE_SCORE' | 'GAME_OVER' | 'RESTART' | 'TIME_UPDATE' | 'READY' 
        | 'ITEM_ATTACK' | 'REQUEST_MAP' | 'SEND_EMOJI';
  payload?: any;
}

// --- MỚI: Cấu trúc lưu lịch sử ---
export interface MatchRecord {
  id: string;
  timestamp: number; // Thời gian chơi
  mode: 'SOLO' | 'MULTIPLAYER';
  myName: string;
  opponentName?: string;
  myScore: number;
  opponentScore?: number;
  itemsUsed: Record<string, number>; // Thống kê item: { BOMB: 2, MAGIC: 1... }
}