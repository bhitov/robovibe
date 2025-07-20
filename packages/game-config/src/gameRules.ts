/**
 * Game rules generator - extracts and formats game rules from configuration
 * Used to generate dynamic game rule explanations for players
 */

import { GameMode, type GameModeConfig, type GameSettings } from './types.js';

export interface GameRulesData {
  title: string;
  description: string;
  objective: string;
  actions: string[];
  settings: {
    arena: string;
    winCondition: string;
    specialRules: string[];
  };
  tips: string[];
}

/**
 * Generates formatted game rules data from game configuration
 */
export function generateGameRules(
  gameConfig: GameModeConfig,
  gameSettings: GameSettings,
  gameMode: GameMode
): GameRulesData {
  const actions = extractActionsFromSystemPrompt(gameConfig.systemPrompt);
  const objective = extractObjectiveFromMode(gameMode, gameSettings);
  const settings = formatGameSettings(gameSettings, gameMode);
  
  return {
    title: `${gameMode} Rules`,
    description: gameConfig.description,
    objective,
    actions,
    settings,
    tips: gameConfig.defaultBotPrompts.slice(0, 3) // First 3 tips
  };
}

/**
 * Extracts available actions from the system prompt
 */
function extractActionsFromSystemPrompt(systemPrompt: string): string[] {
  const actions: string[] = [];
  
  // Look for action definitions in the system prompt
  const actionSection = systemPrompt.split('Available actions:')[1];
  if (!actionSection) return actions;
  
  const lines = actionSection.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- {type:')) {
      // Extract action description
      const match = /- \{type: '(\w+)'[^}]*\} - (.+)/.exec(trimmed);
      if (match) {
        actions.push(`**${match[1] ?? 'unknown'}**: ${match[2] ?? 'no description'}`);
      }
    }
  }
  
  return actions;
}

/**
 * Extracts game objective based on game mode and settings
 */
function extractObjectiveFromMode(gameMode: GameMode, settings: GameSettings): string {
  switch (gameMode) {
    case GameMode.OrbGame:
      return `Collect ${String(settings.orbsToWin ?? 20)} orbs and deposit them at your base to win!`;
    
    case GameMode.OrbGamePlus:
      return `Collect ${String(settings.orbsToWin ?? 20)} orbs and deposit them at your base. Watch out for other players!`;
    
    case GameMode.TankCombat:
      return `Destroy all enemy tanks to be the last tank standing!`;
    
    case GameMode.FlappyGame:
      return `Navigate through pipes without crashing. You have ${String(settings.lives ?? 3)} lives.`;
    
    case GameMode.RaceGame:
      return `Complete ${String(settings.lapsToWin ?? 3)} laps around the track to win the race!`;
    
    default:
      return 'Complete the game objective to win!';
  }
}

/**
 * Formats game settings into readable format
 */
function formatGameSettings(settings: GameSettings, gameMode: GameMode): {
  arena: string;
  winCondition: string;
  specialRules: string[];
} {
  const arena = `${String(settings.arenaWidth)}x${String(settings.arenaHeight)} pixels`;
  
  let winCondition = '';
  const specialRules: string[] = [];
  
  switch (gameMode) {
    case GameMode.OrbGame:
    case GameMode.OrbGamePlus:
      winCondition = `First to ${String(settings.orbsToWin ?? 20)} orbs wins`;
      specialRules.push(`Pickup radius: ${String(settings.pickupRadius ?? 20)} pixels`);
      specialRules.push(`Deposit radius: ${String(settings.depositRadius ?? 30)} pixels`);
      break;
    
    case GameMode.TankCombat:
      winCondition = 'Last tank standing wins';
      specialRules.push(`Tank health: ${String(settings.maxHealth ?? 100)} HP`);
      specialRules.push(`Fire cooldown: ${String(Math.round((settings.fireCooldown ?? 90) / 30))} seconds`);
      break;
    
    case GameMode.FlappyGame:
      winCondition = 'Survive as long as possible';
      specialRules.push(`Lives: ${String(settings.lives ?? 3)}`);
      specialRules.push(`Pipe gap: ${String(settings.pipeGap ?? 120)} pixels`);
      break;
    
    case GameMode.RaceGame:
      winCondition = `First to complete ${String(settings.lapsToWin ?? 3)} laps wins`;
      break;
    
    default:
      winCondition = 'Complete the objective to win';
  }
  
  // Add common rules
  specialRules.push(`Max speed: ${String(settings.maxSpeed)} pixels/tick`);
  specialRules.push(`Tick rate: ${String(settings.tickRate)} ticks/second`);
  
  return {
    arena,
    winCondition,
    specialRules
  };
}