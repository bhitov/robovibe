export enum PowerUpType { Speed = 'speed', Star = 'star' }

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector2D;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface WallSegment {
  start: Vector2D;
  end: Vector2D;
}

export interface Pipe {
  x: number;           // horizontal position (left edge of pipe pair)
  gapY: number;        // Y coordinate of gap centre
}

export interface Bot {
  id: string;
  playerId: string;
  nickname: string;
  position: Vector2D;
  velocity: Vector2D;
  /** Rotation in degrees (0° = right, 90° = down) */
  rotation?: number;
  /** Current health (TankCombat only, 0-100) */
  health?: number;
  /** Whether bot can currently fire (cool-down helper) */
  canFire?: boolean;
  /** Tick index of last shot fired */
  lastFiredTick?: number;
  hasOrb: boolean;
  team?: number;
  color: string;
  /** FlappyGame – remaining lives */
  lives?: number;
  /** FlappyGame – last flap tick (for animation) */
  lastFlapTick?: number;
}

/** Tank shell or similar projectile (TankCombat only) */
export interface Projectile {
  id: string;
  ownerId: string;
  position: Vector2D;
  velocity: Vector2D;
  life: number;            // ticks remaining before despawn
}

export interface Orb {
  id: string;
  position: Vector2D;
}

export interface Base {
  id: string;
  position: Vector2D;
  team?: number;
  playerId?: string;
  orbsDeposited: number;
}

// Base game state shared by all games
export interface BaseGameState {
  bots: Map<string, Bot>;
  arena: {
    width: number;
    height: number;
  };
  tickCount: number;
  winner: string | null;
  walls: WallSegment[];   // NEW – static walls in the arena
  blocks: { x: number; y: number; width: number; height: number }[];
  mapAscii?: string[];    // Raw ASCII map data
}

// Orb game specific state
export interface OrbGameState extends BaseGameState {
  orbs: Map<string, Orb>;
  bases: Map<string, Base>;
  orbsToWin: number;
}

// Tank game specific state
export interface TankGameState extends BaseGameState {
  projectiles: Map<string, Projectile>;
}

export interface FlappyGameState extends BaseGameState {
  pipes: Pipe[];
  speed: number;
}

export interface RaceGameState extends BaseGameState {
  lapsToWin: number;
  checkpoints: Vector2D[];
  powerUps: Map<string, PowerUp>;
  // Per-bot lap & checkpoint tracking
  botProgress: Map<string, { currentLap: number; nextCheckpoint: number; starTicks: number; boostTicks: number }>;
}

export interface RaceGameConfig extends BaseGameConfig {
  turnRate: number;
  powerUpRespawn: number;
  lapsToWin: number;
}

// For backwards compatibility
export type GameState = OrbGameState | TankGameState | FlappyGameState | RaceGameState;

// (No extra action needed – power-ups activate automatically)

export type BotAction =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'pickup' }
  | { type: 'deposit' }
  | { type: 'idle' }
  | { type: 'move'; velocity: number } // tank fwd/back
  | { type: 'turn'; velocity: number } // tank turn
  | { type: 'fire'; dx?: number; dy?: number } // fire with optional direction
  // | { type: 'flap' };                 // NEW – FlappyGame jump

export interface BotInput {
  botPosition: Vector2D;
  velocity: Vector2D;
  rotation?: number;
  health?: number;
  lives?: number;
  hasOrb: boolean;
  orbs: { id: string; position: Vector2D; distance: number }[];
  base?: { id: string; position: Vector2D; team?: number; distance: number }; // Only bot's own base
  enemies: { id: string; position: Vector2D; team?: number; distance: number }[];
  projectiles: { id: string; position: Vector2D; velocity: Vector2D; distance: number }[];
  // Tank-specific properties
  tanks?: { id: string; position: Vector2D; rotation: number; health: number; distance: number }[];
  walls?: { start: Vector2D; end: Vector2D; distance: number }[]; // UPDATED – segment with distance
  canFire?: boolean;
  powerUps?: { id: string; position: Vector2D; type: PowerUpType; distance: number }[];
  // ASCII map of the game board
  mapAscii?: string[];
  // Bot's current grid position in the ASCII map
  gridPosition?: { row: number; col: number };
  // Race mode specific
  nextCheckpoint?: { x: number; y: number };
  currentLap?: number;
  checkpoints?: { x: number; y: number }[];
}

export type BotLoopFunction = (input: BotInput, store: Record<string, unknown>) => {
  action: BotAction;
  store: Record<string, unknown>;
};

// Base config shared by all games
export interface BaseGameConfig {
  arenaWidth: number;
  arenaHeight: number;
  maxSpeed: number;
  acceleration: number;
  friction: number;
  visionRadius: number;
  tickRate: number;
}

// Orb-specific config
export interface OrbGameConfig extends BaseGameConfig {
  pickupRadius: number;
  depositRadius: number;
  orbsToWin: number;
}

// Tank-specific config
export interface TankGameConfig extends BaseGameConfig {
  maxHealth: number;
  maxPlayers: number;
  bulletSpeed: number;
  turnRate: number;
  fireCooldown: number;
}

export interface FlappyGameConfig extends BaseGameConfig {
  gravity: number;
  flapStrength: number;
  flapCooldown: number;
  pipeFrequency: number;   // ticks between new pipes
  pipeGap: number;         // vertical opening size
  lives: number;
  initialSpeed: number;    // map scroll speed
  speedIncrement: number;  // speed gain per 100 ticks
}

// Union type for all game configs
export type GameConfig = OrbGameConfig | TankGameConfig | FlappyGameConfig | RaceGameConfig;