export type CellState = {
  filled: boolean;
  color: string;
  clearing?: boolean; // For animation
};

export type Grid = CellState[][];

export type Position = {
  r: number;
  c: number;
};

export type BlockShape = number[][]; // 1 for filled, 0 for empty

export interface BlockDef {
  id: string;
  shape: BlockShape;
  color: string; // The CSS variable name or hex code
  width: number;
  height: number;
}

export interface GameState {
  score: number;
  highScore: number;
  grid: Grid;
  availableBlocks: (BlockDef | null)[];
  gameOver: boolean;
  streak: number;
}

export interface ThemeColors {
  background: string;
  board: string;
  emptyCell: string;
  primaryBlock: string;
  secondaryBlock: string;
  tertiaryBlock: string;
  accent: string;
  text: string;
  name?: string;
}
