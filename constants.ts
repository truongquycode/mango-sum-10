// constants.ts
export const GRID_ROWS = 10;
export const GRID_COLS = 10;
export const TARGET_SUM = 10;
export const GAME_DURATION_SECONDS = 120;
export const BASE_SCORE = 10;

export const MANGO_COLORS: Record<number, { main: string, light: string, dark: string, stroke: string }> = {
  1: { main: '#9d8ec4', light: '#dcd6f7', dark: '#6a5acd', stroke: '#4a3b75' }, // Nho (Tím phấn)
  2: { main: '#e3f09b', light: '#f7fcde', dark: '#aecb47', stroke: '#5c6b24' }, // Lê (Xanh cốm nhạt)
  3: { main: '#fdd835', light: '#fff59d', dark: '#fbc02d', stroke: '#af8613' }, // Chanh (Vàng trứng)
  4: { main: '#ffab91', light: '#ffccbc', dark: '#ff7043', stroke: '#bf360c' }, // Cam (Cam san hô)
  5: { main: '#fff176', light: '#ffffbf', dark: '#fdd835', stroke: '#bf9e17' }, // Chuối (Vàng kem)
  6: { main: '#a5d6a7', light: '#e8f5e9', dark: '#66bb6a', stroke: '#2e7d32' }, // Bơ (Xanh bơ dịu)
  7: { main: '#fbc02d', light: '#fff9c4', dark: '#f57f17', stroke: '#e65100' }, // Dứa (Vàng nghệ)
  8: { main: '#ef5350', light: '#ffcdd2', dark: '#c62828', stroke: '#8e0000' }, // Dưa hấu (Đỏ dưa)
  9: { main: '#ff8a80', light: '#ffebee', dark: '#ec1e1eff', stroke: '#ff0000ff' }, // Dâu (Hồng đỏ)
};

import { ItemType } from './types';

export const ITEM_CONFIG: Record<ItemType, { name: string, icon: string, desc: string, color: string }> = {
  BOMB: { name: 'Bom Nổ', icon: '💣', desc: '-10s đối thủ', color: 'bg-red-500' },
  MAGIC: { name: 'Đũa Thần', icon: '🌈', desc: 'Chọn bừa cũng đúng', color: 'bg-purple-500' },
  FREEZE: { name: 'Đóng Băng', icon: '❄️', desc: 'Dừng giờ 5s', color: 'bg-blue-400' },
  SPEED_UP: { name: 'Tua Nhanh', icon: '⏩', desc: 'Đối thủ trôi giờ 1.5x', color: 'bg-yellow-500' },
  STEAL: { name: 'Cướp Điểm', icon: '😈', desc: 'Lấy 10% điểm bạn', color: 'bg-pink-600' },
  DEBUFF_SCORE: { name: 'Giảm Điểm', icon: '📉', desc: 'Đối thủ nhận 50% điểm', color: 'bg-gray-500' },
  BUFF_SCORE: { name: 'X2 Điểm', icon: '🚀', desc: 'Nhân đôi điểm 10s', color: 'bg-green-500' },
};

export const AVATARS = [
  // --- NHÓM 1: ẢNH ĐẠI DIỆN ---
  { type: 'image', value: '/assets/avatar/1.webp' },
  { type: 'image', value: '/assets/avatar/2.webp' },
  { type: 'image', value: '/assets/avatar/3.webp' },
  { type: 'image', value: '/assets/avatar/4.webp' },
  { type: 'image', value: '/assets/avatar/5.webp' },

  // --- NHÓM 1: EMOJI ---
  { type: 'text', value: '🕊️' },
  { type: 'text', value: '🐢' },
  { type: 'text', value: '🐒' },
  { type: 'text', value: '🙊' },
  { type: 'text', value: '🙉' },
  { type: 'text', value: '🐤' },
  { type: 'text', value: '🐣' },
  { type: 'text', value: '🐥' },
  { type: 'text', value: '🦀' },
  { type: 'text', value: '🐸' },
  { type: 'text', value: '🐶' },
  { type: 'text', value: '🐱' },
  { type: 'text', value: '🐹' },
  { type: 'text', value: '🐰' },
  { type: 'text', value: '🦊' },
  { type: 'text', value: '🐻' },
  { type: 'text', value: '🐼' },
  { type: 'text', value: '🐨' },
  { type: 'text', value: '🐷' },
  { type: 'text', value: '🐔' },
  { type: 'text', value: '🐦' },
  { type: 'text', value: '🐲' },

  

];export const REACTION_EMOJIS = [
   // --- NHÓM 2: HÌNH ẢNH / MEME ---
  { type: 'image', value: '/assets/meme/1.png' }, 
  { type: 'image', value: '/assets/meme/2.png' }, 
  { type: 'image', value: '/assets/meme/3.png' }, 
  { type: 'image', value: '/assets/meme/2.gif' },
  { type: 'image', value: '/assets/meme/3.gif' },
  { type: 'image', value: '/assets/meme/4.gif' },
  { type: 'image', value: '/assets/meme/5.gif' },
  { type: 'image', value: '/assets/meme/6.gif' },
  // --- NHÓM 1: TEXT & EMOJI---
  { type: 'text', value: '🤣' },
  // { type: 'text', value: '😍' },
  { type: 'text', value: '😡' },
  { type: 'text', value: '😭' },
  // { type: 'text', value: '😘' },
  { type: 'text', value: '😝' },
  { type: 'text', value: '😜' },
  { type: 'text', value: ':3' },
  { type: 'text', value: 'hí hí' },
  { type: 'text', value: 'he he' },
  { type: 'text', value: 'hiho hiho' },
  { type: 'text', value: 'kkkk' },
  { type: 'text', value: ':>>' },
  { type: 'text', value: '>w<' },
  { type: 'text', value: 'chơi ăn gian' },
  { type: 'text', value: 'chệu thua chưa' },
  { type: 'text', value: 'phá mí ngừi' },
  { type: 'text', value: 'đã che hiho hiho' },
  { type: 'text', value: 'chơi hay dạa' },
];