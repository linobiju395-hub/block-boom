import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, BlockDef, Position, ThemeColors } from './types';
import { BOARD_SIZE, createEmptyGrid, generateRandomBlocks } from './constants';
import Board from './components/Board';
import DraggableBlock from './components/DraggableBlock';
import ThemeGenerator from './components/ThemeGenerator';
import { Trophy, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { audioService } from './services/audioService';

// Drag offset to make the block visible under the finger
const TOUCH_Y_OFFSET = -80; 

function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load saved state from localStorage
    const savedState = localStorage.getItem('blockBlastSaveState');
    const storedHighScore = parseInt(localStorage.getItem('blockBlastHighScore') || '0');

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Validate the shape of the data roughly
        if (
          parsedState.grid && 
          Array.isArray(parsedState.grid) &&
          parsedState.grid.length === BOARD_SIZE && 
          Array.isArray(parsedState.availableBlocks)
        ) {
          return {
            ...parsedState,
            // Ensure high score is synced with the standalone key (takes the max)
            highScore: Math.max(parsedState.highScore || 0, storedHighScore)
          };
        }
      } catch (e) {
        console.warn("Failed to parse saved game state:", e);
      }
    }

    // Default initial state
    return {
      score: 0,
      highScore: storedHighScore,
      grid: createEmptyGrid(BOARD_SIZE),
      availableBlocks: generateRandomBlocks(3),
      gameOver: false,
      streak: 0,
    };
  });

  // Persist Game State whenever it changes
  useEffect(() => {
    localStorage.setItem('blockBlastSaveState', JSON.stringify(gameState));
  }, [gameState]);

  // UI State
  const [draggedBlock, setDraggedBlock] = useState<BlockDef | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number, y: number } | null>(null);
  const [ghostPosition, setGhostPosition] = useState<Position | null>(null);
  const [isMuted, setIsMuted] = useState(audioService.isMuted());
  const boardRef = useRef<HTMLDivElement>(null);

  // Apply Theme
  const applyTheme = (theme: ThemeColors) => {
    const root = document.documentElement;
    root.style.setProperty('--color-bg', theme.background);
    root.style.setProperty('--color-board', theme.board);
    root.style.setProperty('--color-empty', theme.emptyCell);
    root.style.setProperty('--color-primary', theme.primaryBlock);
    root.style.setProperty('--color-secondary', theme.secondaryBlock);
    root.style.setProperty('--color-tertiary', theme.tertiaryBlock);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-text', theme.text);
  };

  const toggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
    if (!muted) audioService.playUi();
  };

  // --- Game Logic ---

  const checkPlacement = (grid: any[][], block: BlockDef, r: number, c: number): boolean => {
    for (let i = 0; i < block.height; i++) {
      for (let j = 0; j < block.width; j++) {
        if (block.shape[i][j]) {
          const newR = r + i;
          const newC = c + j;
          if (newR < 0 || newR >= BOARD_SIZE || newC < 0 || newC >= BOARD_SIZE) return false;
          if (grid[newR][newC].filled) return false;
        }
      }
    }
    return true;
  };

  const checkGameOver = useCallback((currentGrid: any[][], blocks: (BlockDef | null)[]) => {
    const activeBlocks = blocks.filter(b => b !== null) as BlockDef[];
    if (activeBlocks.length === 0) return false;

    // Check if ANY active block fits ANYWHERE
    for (const block of activeBlocks) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (checkPlacement(currentGrid, block, r, c)) {
            return false; // Found a spot
          }
        }
      }
    }
    return true;
  }, []);

  // Monitor Game Over for sound effect
  useEffect(() => {
    if (gameState.gameOver) {
      audioService.playGameOver();
    }
  }, [gameState.gameOver]);

  const placeBlock = (r: number, c: number, block: BlockDef) => {
    const newGrid = gameState.grid.map(row => row.map(cell => ({ ...cell })));
    
    // Place block
    for (let i = 0; i < block.height; i++) {
      for (let j = 0; j < block.width; j++) {
        if (block.shape[i][j]) {
          newGrid[r + i][c + j] = { filled: true, color: block.color };
        }
      }
    }

    // Check lines
    let linesCleared = 0;
    const rowsToClear = new Set<number>();
    const colsToClear = new Set<number>();

    // Check rows
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (newGrid[i].every(cell => cell.filled)) rowsToClear.add(i);
    }
    // Check cols
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (newGrid.every(row => row[j].filled)) colsToClear.add(j);
    }

    const clearedCount = rowsToClear.size + colsToClear.size;
    
    // Play Sound
    if (clearedCount > 0) {
      audioService.playClear(gameState.streak + 1);
    } else {
      audioService.playPlace();
    }

    // Animation state update first
    if (clearedCount > 0) {
       // Mark for clearing
       rowsToClear.forEach(r => {
         for(let c=0; c<BOARD_SIZE; c++) newGrid[r][c].clearing = true;
       });
       colsToClear.forEach(c => {
         for(let r=0; r<BOARD_SIZE; r++) newGrid[r][c].clearing = true;
       });
    }

    // Update available blocks
    const newAvailableBlocks = gameState.availableBlocks.map(b => b?.id === block.id ? null : b);
    const shouldRefill = newAvailableBlocks.every(b => b === null);
    const nextBlocks = shouldRefill ? generateRandomBlocks(3) : newAvailableBlocks;

    // Calculate score
    const placementScore = block.shape.flat().filter(x => x).length;
    const clearScore = clearedCount * 100 * (gameState.streak + 1); // Simple streak multiplier
    const totalMoveScore = placementScore + clearScore;

    // Apply updates
    setGameState(prev => {
      const newScore = prev.score + totalMoveScore;
      const newHighScore = Math.max(newScore, prev.highScore);
      localStorage.setItem('blockBlastHighScore', newHighScore.toString());

      return {
        ...prev,
        score: newScore,
        highScore: newHighScore,
        grid: newGrid,
        availableBlocks: nextBlocks,
        streak: clearedCount > 0 ? prev.streak + 1 : 0
      };
    });

    // If we cleared lines, we need a second "tick" to actually remove them after animation
    if (clearedCount > 0) {
      setTimeout(() => {
        setGameState(prev => {
          const cleanedGrid = prev.grid.map(row => row.map(cell => 
            cell.clearing ? { filled: false, color: '' } : cell
          ));
          
          // Check game over AFTER clearing
          const isOver = checkGameOver(cleanedGrid, nextBlocks);

          return {
            ...prev,
            grid: cleanedGrid,
            gameOver: isOver
          };
        });
      }, 300); // Matches CSS animation duration
    } else {
      // Check game over immediately if no lines cleared
       setGameState(prev => ({
         ...prev,
         gameOver: checkGameOver(newGrid, nextBlocks)
       }));
    }
  };

  const restartGame = () => {
    audioService.playUi();
    setGameState({
      score: 0,
      highScore: gameState.highScore,
      grid: createEmptyGrid(BOARD_SIZE),
      availableBlocks: generateRandomBlocks(3),
      gameOver: false,
      streak: 0,
    });
  };

  // --- Drag & Drop Handlers ---

  const handlePointerDown = (e: React.PointerEvent, block: BlockDef) => {
    e.preventDefault(); // Prevent scrolling
    audioService.playPickup();
    setDraggedBlock(block);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggedBlock || !boardRef.current) return;

    const x = e.clientX;
    const y = e.clientY;
    setDragPosition({ x, y });

    // Calculate Grid Position
    const boardRect = boardRef.current.getBoundingClientRect();
    const cellSize = boardRect.width / BOARD_SIZE;

    // Relative position inside board
    // The visual block is at (y + TOUCH_Y_OFFSET)
    const relX = x - boardRect.left;
    const relY = (y + TOUCH_Y_OFFSET) - boardRect.top;

    // We calculate the top-left coordinate of the block to ensure we center it on the cursor
    const blockPixelWidth = draggedBlock.width * cellSize;
    const blockPixelHeight = draggedBlock.height * cellSize;

    // Top-left of the block in board pixel coordinates
    const topLeftX = relX - (blockPixelWidth / 2);
    const topLeftY = relY - (blockPixelHeight / 2);

    // Convert to grid coordinates with rounding to snap to nearest cell
    const c = Math.round(topLeftX / cellSize);
    const r = Math.round(topLeftY / cellSize);

    // Only set ghost if placement is valid
    if (checkPlacement(gameState.grid, draggedBlock, r, c)) {
      setGhostPosition({ r, c });
    } else {
      setGhostPosition(null);
    }
  }, [draggedBlock, gameState.grid]);

  const handlePointerUp = useCallback(() => {
    if (draggedBlock && ghostPosition) {
      placeBlock(ghostPosition.r, ghostPosition.c, draggedBlock);
    }
    setDraggedBlock(null);
    setDragPosition(null);
    setGhostPosition(null);
  }, [draggedBlock, ghostPosition]);

  // Global pointer listeners
  useEffect(() => {
    if (draggedBlock) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedBlock, handlePointerMove, handlePointerUp]);


  // --- Render ---

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-none">
      <ThemeGenerator onThemeApply={applyTheme} />
      
      {/* Mute Button */}
      <button 
        onClick={toggleMute}
        className="fixed top-4 left-4 z-50 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all border border-white/10 shadow-lg"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter" style={{ color: 'var(--color-primary)' }}>
            BLOCK <span style={{ color: 'var(--color-text)' }}>BLAST</span>
          </h1>
          <p className="opacity-60 text-sm font-medium tracking-wide">GEMINI EDITION</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-yellow-400">
            <Trophy size={16} />
            <span className="font-bold text-xl">{gameState.highScore}</span>
          </div>
          <div className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            {gameState.score}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="mb-8 relative z-10">
        <Board 
          ref={boardRef}
          grid={gameState.grid} 
          ghostPosition={ghostPosition}
          ghostBlock={draggedBlock}
        />
        
        {/* Game Over Overlay */}
        {gameState.gameOver && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl animate-pop">
            <h2 className="text-5xl font-black text-white mb-2">GAME OVER</h2>
            <p className="text-gray-300 mb-6 text-xl">Score: {gameState.score}</p>
            <button 
              onClick={restartGame}
              className="bg-white text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
            >
              <RefreshCw size={20} /> Try Again
            </button>
          </div>
        )}
      </div>

      {/* Block Tray */}
      <div className="w-full max-w-md h-32 flex justify-around items-center z-10">
        {gameState.availableBlocks.map((block, idx) => (
          <div key={idx} className="w-24 h-24 flex items-center justify-center">
            {block && (
              <DraggableBlock 
                block={block} 
                onPointerDown={handlePointerDown} 
                disabled={gameState.gameOver || (draggedBlock?.id === block.id)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Floating Dragged Block (The one following the cursor) */}
      {draggedBlock && dragPosition && (
        <div 
          className="fixed pointer-events-none z-[100]"
          style={{
            left: dragPosition.x,
            top: dragPosition.y + TOUCH_Y_OFFSET, // Visual offset for visibility
            transform: 'translate(-50%, -50%) scale(1.2)', // Larger when dragging
          }}
        >
          <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${draggedBlock.width}, 1fr)` }}
          >
            {draggedBlock.shape.map((row, r) => 
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-6 h-6 rounded-sm shadow-xl"
                  style={{
                    backgroundColor: cell ? draggedBlock.color : 'transparent',
                    boxShadow: cell ? '0 4px 6px rgba(0,0,0,0.3)' : 'none'
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Footer Info */}
      <div className="fixed bottom-4 text-center text-xs opacity-30 w-full pointer-events-none">
        Powered by Google Gemini 2.5 Flash
      </div>
    </div>
  );
}

export default App;