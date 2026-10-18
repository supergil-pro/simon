export type Color = 'green' | 'red' | 'yellow' | 'blue';

// Spatial board order: top-left, top-right, bottom-left, bottom-right
export const BOARD_COLORS: readonly Color[] = ['green', 'red', 'yellow', 'blue'];

export const COLOR_LABELS: Record<Color, string> = {
  green: 'ירוק',
  red: 'אדום',
  yellow: 'צהוב',
  blue: 'כחול',
};

export const TOTAL_ROUNDS = 10;

// Game-only randomness; repeats are allowed
export function randomColor(): Color {
  return BOARD_COLORS[Math.floor(Math.random() * BOARD_COLORS.length)];
}
