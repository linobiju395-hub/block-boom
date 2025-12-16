import React from 'react';
import { BlockDef } from '../types';

interface DraggableBlockProps {
  block: BlockDef;
  onPointerDown: (e: React.PointerEvent, block: BlockDef) => void;
  disabled: boolean;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, onPointerDown, disabled }) => {
  const { shape, color } = block;

  return (
    <div 
      className={`touch-none relative select-none flex items-center justify-center p-4 transition-transform duration-200 ${disabled ? 'opacity-0 pointer-events-none' : 'hover:scale-105 active:scale-95'}`}
      onPointerDown={(e) => !disabled && onPointerDown(e, block)}
      style={{ 
         width: '100px',
         height: '100px',
      }}
    >
      <div 
        className="grid gap-1 pointer-events-none"
        style={{
          gridTemplateColumns: `repeat(${shape[0].length}, 1fr)`,
        }}
      >
        {shape.map((row, r) => (
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm"
              style={{
                backgroundColor: cell ? color : 'transparent',
                boxShadow: cell ? 'inset 0 -2px 0 rgba(0,0,0,0.2)' : 'none',
              }}
            />
          ))
        ))}
      </div>
    </div>
  );
};

export default DraggableBlock;
