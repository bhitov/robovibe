/**
 * Common interfaces and types for game configurations
 */

// Game mode enum matching class names exactly
export enum GameMode {
  OrbGame = "OrbGame",
  OrbGamePlus = "OrbGamePlus",
  TankCombat = "TankCombat",
  FlappyGame = "FlappyGame",
  RaceGame = "RaceGame"
}

// Model configurations for frontend display and OpenAI package
export const models = {
  "gpt-3.5-turbo": {
    displayName: "Fast / Draft",
    description: "Quick responses, lower cost",
    costMultiplier: 1.0,
    estimatedLatency: "2-3s"
  },
  "gpt-4o-mini": {
    displayName: "Balanced", 
    description: "Good balance of speed and quality",
    costMultiplier: 2.0,
    estimatedLatency: "3-5s"
  },
  "gpt-4o": {
    displayName: "Accurate / Slow",
    description: "Highest quality responses", 
    costMultiplier: 10.0,
    estimatedLatency: "8-12s"
  }
} as const;

export type ModelKey = keyof typeof models;

// Interface for game settings
export interface GameSettings {
  arenaWidth: number;
  arenaHeight: number;
  maxSpeed: number;
  acceleration?: number;
  friction?: number;
  pickupRadius?: number;
  depositRadius?: number;
  visionRadius: number;
  orbsToWin?: number;
  tickRate: number;
  maxHealth?: number;
  maxPlayers?: number;
  /** Tank shell speed in pixels/tick (TankCombat only) */
  bulletSpeed?: number;
  /** Tank turn rate in degrees per tick when velocity == 1 (TankCombat only) */
  turnRate?: number;
  /** Cool-down between shots in ticks (TankCombat only) */
  fireCooldown?: number;
  /** Maximum lives for respawn modes (TankCombat) */
  maxLives?: number;
  /** Respawn delay in ticks (TankCombat) */
  respawnDelay?: number;
  /** FlappyGame - gravity force */
  gravity?: number;
  /** FlappyGame - upward force when flapping */
  flapStrength?: number;
  /** FlappyGame - cooldown between flaps */
  flapCooldown?: number;
  /** FlappyGame - ticks between new pipes */
  pipeFrequency?: number;
  /** FlappyGame - vertical opening size */
  pipeGap?: number;
  /** FlappyGame - number of lives */
  lives?: number;
  /** FlappyGame - initial map scroll speed */
  initialSpeed?: number;
  /** FlappyGame - speed gain per 100 ticks */
  speedIncrement?: number;
  /** RaceGame - turn rate */
  /** RaceGame - powerup respawn time */
  powerUpRespawn?: number;
  /** RaceGame - laps needed to win */
  lapsToWin?: number;
}

// Interface for sub-mode variations
export interface SubMode {
  name: string;
  description: string;
  settings: Partial<GameSettings>;
}

// Interface for demo prompts
export interface DemoPrompt {
  name: string;
  text: string;
}

// Re-export basic types needed by GameConfig
export interface Vector2D {
  x: number;
  y: number;
}

export interface WallSegment {
  start: Vector2D;
  end: Vector2D;
}

export enum PowerUpType {
  Speed = 'speed',
  Star = 'star'
}

// Interface for game mode configuration
export interface GameModeConfig {
  systemPrompt: string;
  defaultBotPrompts: string[];
  description: string;
  settings: GameSettings;
  subModes: SubMode[];
  demoPrompts?: DemoPrompt[];
}

// These duplicates avoid a circular dep on @repo/game-engine

export interface Vector2D {
  x: number;
  y: number;
}

export interface WallSegment {
  start: Vector2D;
  end: Vector2D;
}

/**
 * Result produced by parseAsciiMap()
 */
export interface ParsedMap {
  walls: WallSegment[];
  blocks: { x: number; y: number; width: number; height: number }[];
  bases: Vector2D[];
  checkpoints: Vector2D[];
  powerUps: Vector2D[];
}