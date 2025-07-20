import type { Vector2D, WallSegment, PowerUpType } from './types.js';

export interface GameConfig {
  // Core settings
  arenaWidth: number;
  arenaHeight: number;
  maxSpeed: number;
  acceleration: number;
  friction: number;
  visionRadius: number;
  tickRate: number;
  
  // Mode-specific settings (all optional, used based on allowedActions)
  pickupRadius?: number;
  depositRadius?: number;
  orbsToWin?: number;
  maxHealth?: number;
  maxPlayers?: number;
  bulletSpeed?: number;
  turnRate?: number;
  fireCooldown?: number;
  maxLives?: number;
  respawnDelay?: number;
  gravity?: number;
  flapStrength?: number;
  flapCooldown?: number;
  pipeFrequency?: number;
  pipeGap?: number;
  lives?: number;
  initialSpeed?: number;
  speedIncrement?: number;
  powerUpRespawn?: number;
  lapsToWin?: number;
  
  // Allowed actions for this mode
  allowedActions: {
    move: boolean;      // bot-style dx/dy movement
    turn: boolean;      // rotation control
    fire: boolean;      // projectile shooting
    flap: boolean;      // flappy bird jump
    pickup: boolean;    // orb collection
    deposit: boolean;   // orb depositing
  };
  
  // Win condition
  winCondition: {
    type: 'orbs' | 'elimination' | 'survival' | 'laps';
    value: number;
  };
  
  // Initial game objects
  initialOrbs?: number;
  walls?: WallSegment[];
  blocks?: { x: number; y: number; width: number; height: number }[];
  checkpoints?: Vector2D[];
  powerUpSpawns?: { position: Vector2D; type: PowerUpType }[];
  
  // Raw map data
  mapAscii?: string[];
  mapName?: string;
  
  // System prompt for AI bots
  systemPrompt?: string;
}