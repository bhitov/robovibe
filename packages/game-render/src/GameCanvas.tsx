import React, { useRef, useEffect, useCallback } from 'react';
import type { GameState } from '@repo/game-engine';
import { drawGame } from './renderer.js';

interface GameCanvasProps {
  gameState: GameState;
  width?: number;
  height?: number;
  showAsciiOverlay?: boolean;
  tileColor?: string; // Added colour theme for tiles
  winConditionType?: string;
}

export function GameCanvas({
  gameState,
  width = 600,
  height = 400,
  showAsciiOverlay = false,
  tileColor = 'blue', // default
  winConditionType
}: GameCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGame(ctx, gameState, width, height, showAsciiOverlay, tileColor, winConditionType);
  }, [gameState, width, height, showAsciiOverlay, tileColor, winConditionType]);

  useEffect(() => {
    const animate = (): void => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return (): void => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-700 bg-gray-900 rounded-lg shadow-lg"
      style={{
        imageRendering: 'crisp-edges',
        cursor: 'crosshair'
      }}
    />
  );
}