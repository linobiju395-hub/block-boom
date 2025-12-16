import React, { forwardRef } from 'react';
import { Grid, Position, BlockDef } from '../types';
import { BOARD_SIZE } from '../constants';

interface BoardProps {
  grid: Grid;
  ghostPosition: Position | null;
  ghostBlock: BlockDef | null;
}

const Board = forwardRef<HTMLDivElement, BoardProps>(({ grid, ghostPosition, ghostBlock }, ref) => {
  
  // Helper to check if a cell is part of the ghost block at the current position
  const isGhostCell = (r: number, c: number) => {
    if (!ghostPosition || !ghostBlock) return false;
    const { r: gr, c: gc } = ghostPosition;
    const { shape } = ghostBlock;
    
    if (r >= gr && r < gr + shape.length) {
      if (c >= gc && c < gc + shape[0].length) {
        return shape[r - gr][c - gc] === 1;
      }
    }
    return false;
  };

  return (
    <div 
      ref={ref}
      className="relative p-2 rounded-xl shadow-2xl transition-colors duration-500"
      style={{ 
        backgroundColor: 'var(--color-board)',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div 
        className="grid gap-1.5"
        style={{ 
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          width: 'min(90vw, 400px)',
          height: 'min(90vw, 400px)'
        }}
      >
        {grid.map((row, r) => 
          row.map((cell, c) => {
            const isGhost = isGhostCell(r, c);
            const isFilled = cell.filled;
            
            return (
              <div
                key={`${r}-${c}`}
                data-row={r}
                data-col={c}
                className={`
                  w-full h-full rounded-md relative overflow-hidden
                  transition-all duration-200
                  ${cell.clearing ? 'animate-fade-out z-10' : ''}
                `}
                style={{
                  backgroundColor: isFilled 
                    ? cell.color 
                    : isGhost 
                      ? `${ghostBlock?.color}66` // 40% opacity hex
                      : 'var(--color-empty)',
                  boxShadow: isFilled 
                    ? 'inset 0 -4px 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.2)' 
                    : 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {/* Glossy overlay for filled blocks */}
                {isFilled && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                )}
                
                {/* Ghost outline */}
                {isGhost && !isFilled && (
                  <div className="absolute inset-0 border-2 border-white/50 rounded-md" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

Board.displayName = 'Board';
export default Board;
