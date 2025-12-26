export const GRID_ROWS = 10;
export const GRID_COLS = 14; // Wider for landscape, handles mobile portrait decently via flex
export const TARGET_SUM = 10;
export const GAME_DURATION_SECONDS = 120;
export const BASE_SCORE = 10;

// Colors for the mangoes (Main body, Highlight/Glare, Shadow/Stroke)
export const MANGO_COLORS: Record<number, { main: string, light: string, dark: string }> = {
  1: { main: '#84cc16', light: '#d9f99d', dark: '#4d7c0f' }, // Greenish
  2: { main: '#a3e635', light: '#ecfccb', dark: '#65a30d' }, // Lime
  3: { main: '#facc15', light: '#fef08a', dark: '#a16207' }, // Yellow
  4: { main: '#fbbf24', light: '#fde68a', dark: '#b45309' }, // Golden
  5: { main: '#fb923c', light: '#fed7aa', dark: '#c2410c' }, // Orange
  6: { main: '#f97316', light: '#ffedd5', dark: '#c2410c' }, // Deep Orange
  7: { main: '#ea580c', light: '#ffedd5', dark: '#9a3412' }, // Darker Orange
  8: { main: '#ef4444', light: '#fee2e2', dark: '#b91c1c' }, // Reddish
  9: { main: '#dc2626', light: '#fee2e2', dark: '#991b1b' }, // Red
};