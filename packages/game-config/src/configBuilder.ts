import { GameMode } from './types.js';
import type { GameConfig } from './gameConfig.js';
import { simpleCircuit } from './modes/RaceGame.js';
import { getGameSettings } from './index.js';
import { getMapByName, parseGameMap, getRandomMapForMode } from './maps/index.js';
import type { PowerUpType } from './types.js';
import { buildSystemPrompt } from './promptBuilder.js';

// Default settings that apply to all games
const defaultSettings = {
  arenaWidth: 600,
  arenaHeight: 400,
  maxSpeed: 8,
  acceleration: 3,    // Increased from 1 to reach max speed quickly
  friction: 0.6,      // Increased from 0.2 to reduce sliding
  visionRadius: 10000,
  tickRate: 30,
  // Mode-specific defaults
  pickupRadius: 20,
  depositRadius: 30,
  orbsToWin: 20,
  maxHealth: 100,
  maxPlayers: 16,
  bulletSpeed: 15,
  turnRate: 10,
  fireCooldown: 90,
  gravity: 0.8,
  flapStrength: 10,
  flapCooldown: 15,
  pipeFrequency: 60,
  pipeGap: 120,
  lives: 3,
  initialSpeed: 2,
  speedIncrement: 0.1,
  powerUpRespawn: 600,
  lapsToWin: 3,
};

export function buildGameConfig(
  mode: GameMode, 
  options?: {
    mapName?: string;
    overrides?: Partial<GameConfig>;
  }
): GameConfig {
  const settings = getGameSettings(mode);
  const baseConfig = { ...defaultSettings, ...settings };
  
  // Load map - either specified or random
  let mapData: { walls?: GameConfig['walls']; blocks?: GameConfig['blocks']; checkpoints?: GameConfig['checkpoints']; powerUpSpawns?: GameConfig['powerUpSpawns']; mapAscii?: string[]; mapName?: string } = {};
  
  const selectedMap = options?.mapName ? getMapByName(options.mapName) : getRandomMapForMode(mode);
  
  if (selectedMap?.supportedModes.includes(mode)) {
    // console.log(`🎮 Using map: ${selectedMap.name} for mode: ${mode}`);
    const parsed = parseGameMap(selectedMap);
    mapData = {
      walls: parsed.walls,
      blocks: parsed.blocks,
      checkpoints: parsed.checkpoints.length > 0 ? parsed.checkpoints : undefined,
      powerUpSpawns: parsed.powerUps.map(pos => ({ position: pos, type: (Math.random() > 0.5 ? 'speed' : 'star') as PowerUpType })),
      mapAscii: selectedMap.ascii,
      mapName: selectedMap.name
    };
    // console.log(`🎮 Config builder: ${mapData.walls?.length || 0} walls, ${mapData.blocks?.length || 0} blocks, ASCII map with ${mapData.mapAscii?.length || 0} rows included in mapData`);
  } else {
    console.log(`🎮 No map selected for mode: ${mode}`);
  }
  
  switch (mode) {
    case GameMode.OrbGame:
      return {
        ...baseConfig,
        ...mapData,
        ...options?.overrides,
        allowedActions: {
          move: true,
          turn: false,
          fire: false,
          flap: false,
          pickup: true,
          deposit: true,
        },
        winCondition: {
          type: 'orbs',
          value: baseConfig.orbsToWin,
        },
        initialOrbs: 10,
      };
      
    case GameMode.OrbGamePlus:
      return {
        ...baseConfig,
        ...mapData,
        ...options?.overrides,
        allowedActions: {
          move: true,
          turn: false,
          fire: false,
          flap: false,
          pickup: true,
          deposit: true,
        },
        winCondition: {
          type: 'orbs',
          value: baseConfig.orbsToWin,
        },
        initialOrbs: 15,
      };
      
    case GameMode.TankCombat:
      return {
        ...baseConfig,
        ...mapData,
        ...options?.overrides,
        allowedActions: {
          move: true,
          turn: true,
          fire: true,
          flap: false,
          pickup: false,
          deposit: false,
        },
        winCondition: {
          type: 'elimination',
          value: 1,
        },
      };
      
    case GameMode.FlappyGame:
      return {
        ...baseConfig,
        ...options?.overrides,
        allowedActions: {
          move: false,
          turn: false,
          fire: false,
          flap: true,
          pickup: false,
          deposit: false,
        },
        winCondition: {
          type: 'survival',
          value: 1,
        },
      };
      
    case GameMode.RaceGame:
      return {
        ...baseConfig,
        ...mapData,
        ...options?.overrides,
        allowedActions: {
          move: true,
          turn: true,
          fire: false,
          flap: false,
          pickup: false,
          deposit: false,
        },
        winCondition: {
          type: 'laps',
          value: baseConfig.lapsToWin,
        },
        // Use map data if available, otherwise use default circuit
        walls: mapData.walls ?? simpleCircuit.walls,
        blocks: mapData.blocks,
        checkpoints: mapData.checkpoints ?? simpleCircuit.checkpoints,
        powerUpSpawns: mapData.powerUpSpawns ?? simpleCircuit.powerUps,
      };
      
    default:
      throw new Error(`Unknown game mode: ${String(mode)}`);
  }
}

/**
 * Build game configuration with system prompt included
 */
export function buildGameConfigWithPrompt(
  mode: GameMode,
  options?: {
    mapName?: string;
    overrides?: Partial<GameConfig>;
  }
): GameConfig {
  const config = buildGameConfig(mode, options);
  config.systemPrompt = buildSystemPrompt(config);
  return config;
}