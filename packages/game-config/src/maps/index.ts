/**
 * Map management utilities and type definitions
 */

import type { GameMode, ParsedMap } from '../types.js';
import { parseAsciiMap } from '../mapParser.js';
import { raceMaps } from './raceMaps.js';
import { battleMaps } from './battleMaps.js';
import { testMaps } from './testMaps.js';

export interface GameMap {
  name: string;
  description: string;
  ascii: string[];
  supportedModes: GameMode[];
}

// Combine all maps
const allMaps: GameMap[] = [...raceMaps, ...battleMaps, ...testMaps];

/**
 * Get all maps that support a specific game mode
 */
export function getMapsForMode(mode: GameMode): GameMap[] {
  return allMaps.filter(map => map.supportedModes.includes(mode));
}

/**
 * Get a specific map by name
 */
export function getMapByName(name: string): GameMap | undefined {
  return allMaps.find(map => map.name === name);
}

/**
 * Get a random map for a specific game mode
 */
export function getRandomMapForMode(mode: GameMode): GameMap | undefined {
  const availableMaps = getMapsForMode(mode);
  if (availableMaps.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * availableMaps.length);
  return availableMaps[randomIndex];
}

/**
 * Parse a GameMap into engine-ready format
 */
export function parseGameMap(map: GameMap): ParsedMap {
  return parseAsciiMap(map.ascii);
}

/**
 * Get all available map names for a mode
 */
export function getMapNamesForMode(mode: GameMode): string[] {
  return getMapsForMode(mode).map(map => map.name);
}

/**
 * Export all maps for direct access
 */
export { raceMaps } from './raceMaps.js';
export { battleMaps } from './battleMaps.js';
export { testMaps } from './testMaps.js';