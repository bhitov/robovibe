/**
 * Game configuration package - single source of truth for all game settings,
 * modes, models, and system prompts used across RoboVibe
 */

// Re-export all types
export * from './types.js';

// Re-export game rules utilities
export * from './gameRules.js';

// Re-export constants
export * from './constants.js';

// Import individual game mode configurations
import { FlappyGameConfig } from './modes/FlappyGame.js';
import { OrbGameConfig } from './modes/OrbGame.js';
import { OrbGamePlusConfig } from './modes/OrbGamePlus.js';
import { TankCombatConfig } from './modes/TankCombat.js';
import { RaceGameConfig, simpleCircuit } from './modes/RaceGame.js';
import { GameMode, type GameModeConfig, type GameSettings, type SubMode, type ModelKey, models } from './types.js';

// Re-export simpleCircuit for RaceGame
export { simpleCircuit };

// Export new utilities
export { buildGameConfig, buildGameConfigWithPrompt } from './configBuilder.js';
export { buildSystemPrompt, allDemoPrompts, botStrategyPrompts } from './promptBuilder.js';
export type { GameConfig } from './gameConfig.js';

// Game mode configurations
export const gameModeConfigs: Record<GameMode, GameModeConfig> = {
  [GameMode.OrbGame]: OrbGameConfig,
  [GameMode.OrbGamePlus]: OrbGamePlusConfig,
  [GameMode.TankCombat]: TankCombatConfig,
  [GameMode.FlappyGame]: FlappyGameConfig,
  [GameMode.RaceGame]: RaceGameConfig,
} as const;

// Utility functions
export function getGameModeConfig(mode: GameMode): GameModeConfig {
  return gameModeConfigs[mode];
}

export function getGameSettings(mode: GameMode, subModeName?: string): GameSettings {
  const config = gameModeConfigs[mode];
  if (!subModeName) {
    return config.settings;
  }
  
  const subMode = config.subModes.find(sm => sm.name === subModeName);
  if (!subMode) {
    return config.settings;
  }
  
  return { ...config.settings, ...subMode.settings };
}

export function getRandomSubMode(mode: GameMode): SubMode {
  const config = gameModeConfigs[mode];
  const randomIndex = Math.floor(Math.random() * config.subModes.length);
  const subMode = config.subModes[randomIndex];
  if (!subMode) {
    throw new Error(`No submodes available for game mode: ${mode}`);
  }
  return subMode;
}

export function isValidGameMode(mode: string): mode is GameMode {
  return Object.values(GameMode).includes(mode as GameMode);
}

export function isValidModel(model: string): model is ModelKey {
  return model in models;
}

export { parseAsciiMap } from './mapParser.js';
export * from './maps/index.js';