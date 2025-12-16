import { BlockDef } from "./types";

export const BOARD_SIZE = 8;

// Colors matching our default theme variables
export const BLOCK_COLORS = [
  '#e94560', // Primary
  '#533483', // Tertiary
  '#06B6D4', // Cyan (Replaces Dark Blue)
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
];

const SHAPES: number[][][] = [
  // Basic Shapes
  [[1]], // Dot
  [[1, 1]], // 2-Line H
  [[1], [1]], // 2-Line V
  [[1, 1, 1]], // 3-Line H
  [[1], [1], [1]], // 3-Line V
  [[1, 1, 1, 1]], // 4-Line H
  [[1], [1], [1], [1]], // 4-Line V
  [[1, 1], [1, 1]], // Square
  [[1, 0], [1, 0], [1, 1]], // L big
  [[0, 1], [0, 1], [1, 1]], // J big
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 0], [0, 1, 1]], // Z
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 0], [1, 1]], // Corner small
  [[0, 1], [1, 1]], // Corner small inverted
  [[1, 1, 1], [1, 0, 0]], // L long H
  [[1, 1, 1], [0, 0, 1]], // J long H

  // New Bigger & Different Shapes
  [[1, 1, 1, 1, 1]], // 5-Line H
  [[1], [1], [1], [1], [1]], // 5-Line V
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]], // 3x3 Square (Big)
  [[0, 1, 0], [1, 1, 1], [0, 1, 0]], // Plus (+)
  [[1, 1, 1], [1, 0, 1]], // U-shape
  [[1, 0, 1], [1, 1, 1]], // U-shape inverted
  [[1, 0, 0], [1, 0, 0], [1, 1, 1]], // Big L (3x3 area)
  [[0, 0, 1], [0, 0, 1], [1, 1, 1]], // Big J (3x3 area)
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]], // Diagonal 3
  [[0, 0, 1], [0, 1, 0], [1, 0, 0]], // Diagonal 3 Reverse
  [[1, 1], [1, 0]], // 2x2 L
  [[1, 1], [0, 1]], // 2x2 J
  [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // Big T (Tall)
  [[0, 0, 1], [1, 1, 1], [0, 0, 1]], // Big Z-ish / Step
];

export const generateRandomBlocks = (count: number = 3): BlockDef[] => {
  const blocks: BlockDef[] = [];
  for (let i = 0; i < count; i++) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
    
    blocks.push({
      id: Math.random().toString(36).substr(2, 9),
      shape: shape,
      color: color,
      width: shape[0].length,
      height: shape.length
    });
  }
  return blocks;
};

export const createEmptyGrid = (size: number): any[][] => {
  return Array(size).fill(null).map(() => 
    Array(size).fill(null).map(() => ({ filled: false, color: '' }))
  );
};