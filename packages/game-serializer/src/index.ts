/**
 * Game state serialization and deserialization utilities
 * Converts between runtime GameState (with Maps) and serialized state (with arrays) for socket transport
 */

import type { GameState, Bot, Orb, Base, Projectile, PowerUp } from '@repo/game-engine';

/**
 * Helper type to convert Maps to arrays for serialization
 * Recursively transforms Map<K, V> types to Array<[K, V]> tuples and processes nested objects
 */
export type Serialized<T> = T extends Map<infer K, infer V>
  ? Array<[K, V]>
  : T extends object
  ? { [P in keyof T]: Serialized<T[P]> }
  : T;

/**
 * Type representing a GameState with all Maps converted to arrays
 */
export type SerializedGameState = Serialized<GameState>;

/**
 * Serializes a value by converting Maps to arrays
 * Recursively processes nested objects to handle all Map instances
 * 
 * @param value - The value to serialize
 * @returns The serialized value with Maps converted to arrays
 */
export function serializeValue<T>(value: T): Serialized<T> {
  if (value instanceof Map) {
    return Array.from(value.entries()) as Serialized<T>;
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    const result: Record<string, unknown> = {};
    for (const key in value) {
      result[key] = serializeValue(value[key as keyof T]);
    }
    return result as Serialized<T>;
  }
  return value as Serialized<T>;
}

/**
 * Serializes a GameState for socket transport
 * Converts all Map fields to arrays
 * 
 * @param gameState - The game state to serialize
 * @returns The serialized game state
 */
export function serializeGameState(gameState: GameState): SerializedGameState {
  return serializeValue(gameState);
}

/**
 * Deserializes a value by converting arrays back to Maps
 * Uses type information to determine which fields should be Maps
 * 
 * @param value - The serialized value
 * @returns The deserialized value with proper Map instances
 */
function deserializeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    // Check if this is a Map serialized as array of tuples
    if (value.length > 0 && Array.isArray(value[0]) && value[0].length === 2) {
      return new Map(value);
    }
    // Otherwise it's a regular array
    return value.map(item => deserializeValue(item));
  } else if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in value as Record<string, unknown>) {
      result[key] = deserializeValue((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

/**
 * Deserializes a game state received from socket transport
 * Converts arrays back to Maps for runtime use
 * 
 * @param state - The serialized game state
 * @returns The deserialized GameState with proper Map instances
 */
export function deserializeGameState(state: SerializedGameState): GameState {
  return deserializeValue(state) as GameState;
}