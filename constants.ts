export const GRID_ROWS = 10;
export const GRID_COLS = 10;
export const TARGET_SUM = 10;
export const GAME_DURATION_SECONDS = 120;
export const BASE_SCORE = 10;

export const MANGO_COLORS: Record<number, { main: string, light: string, dark: string }> = {
  1: { main: '#84cc16', light: '#d9f99d', dark: '#4d7c0f' },
  2: { main: '#a3e635', light: '#ecfccb', dark: '#65a30d' },
  3: { main: '#facc15', light: '#fef08a', dark: '#a16207' },
  4: { main: '#fbbf24', light: '#fde68a', dark: '#b45309' },
  5: { main: '#fb923c', light: '#fed7aa', dark: '#c2410c' },
  6: { main: '#f97316', light: '#ffedd5', dark: '#c2410c' },
  7: { main: '#ea580c', light: '#ffedd5', dark: '#9a3412' },
  8: { main: '#ef4444', light: '#fee2e2', dark: '#b91c1c' },
  9: { main: '#dc2626', light: '#fee2e2', dark: '#991b1b' },
};

import { ItemType } from './types';

export const ITEM_CONFIG: Record<ItemType, { name: string, icon: string, desc: string, color: string }> = {
  BOMB: { name: 'Bom Nổ', icon: '💣', desc: '-10s đối thủ', color: 'bg-red-500' },
  MAGIC: { name: 'Xoài Thần', icon: '🌈', desc: 'Chọn bừa cũng đúng', color: 'bg-purple-500' },
  FREEZE: { name: 'Đóng Băng', icon: '❄️', desc: 'Dừng giờ 5s', color: 'bg-blue-400' },
  SPEED_UP: { name: 'Tua Nhanh', icon: '⏩', desc: 'Đối thủ trôi giờ 1.5x', color: 'bg-yellow-500' },
  STEAL: { name: 'Cướp Điểm', icon: '😈', desc: 'Lấy 10% điểm bạn', color: 'bg-pink-600' },
  DEBUFF_SCORE: { name: 'Giảm Điểm', icon: '📉', desc: 'Đối thủ nhận 50% điểm', color: 'bg-gray-500' },
  BUFF_SCORE: { name: 'X2 Điểm', icon: '🚀', desc: 'Nhân đôi điểm 10s', color: 'bg-green-500' },
};

// --- NEW CONSTANTS ---
export const AVATARS = ['🕊️', '🐢', '🐒','🙊','🙉', '🐤', '🐣', '🐥', '🦀', '🐸','🐶', '🐱', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐷', '🐔', '🐦', '🐲'];
export const REACTION_EMOJIS = ['🤣', '😍', '😡', '😭', '😱', '😘', '😝', ':3', 'hí hí', 'he he', '😜',':>>', '>w<'];