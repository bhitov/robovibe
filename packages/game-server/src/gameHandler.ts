/**
 * Game handler functions for Socket.IO game management
 * Provides functional approach to game state management and event handling
 */

import type { Socket, Server } from 'socket.io';
import { Game, type GameState } from '@repo/game-engine';
import { GameMode, buildGameConfig, buildGameConfigWithPrompt, getRandomMapForMode } from '@repo/game-config';
import { serializeGameState } from '@repo/game-serializer';
import { clearPlayerGameMapping } from './lobbyHandler';

/**
 * Helper function to ensure exhaustive switch statements
 */
function assertNever(x: never): never {
  throw new Error(`Unexpected game mode: ${x}`);
}

export enum TeamMode {
  FFA = 'FFA',
  Teams = 'Teams',
}

export enum GameStatus {
  Waiting = 'Waiting',
  InGame = 'InGame',
  Finished = 'Finished',
}

export interface GamePlayer {
  id: string;
  nickname: string;
  socketId: string;
  isGuest: boolean;
  isReady: boolean;
  team?: number;
}

export interface GameInfo {
  id: string;
  name: string;
  mode: GameMode;
  teamMode: TeamMode;
  maxPlayers: number;
  players: Map<string, GamePlayer>;
  status: GameStatus;
  createdAt: Date;
  instance?: Game;
  mapName?: string;
  mapAscii?: string[];
}

// Global state maps
const gameInfos = new Map<string, GameInfo>(); // gameId -> game info
const gameConnections = new Map<string, Set<string>>(); // gameId -> socket IDs
const socketToGame = new Map<string, string>(); // socket ID -> gameId
const intervals = new Map<string, NodeJS.Timeout>();
const botCodeStatus = new Map<string, Map<string, boolean>>(); // gameId -> playerId -> hasCode
const botCodeStorage = new Map<string, Map<string, string>>(); // gameId -> playerId -> code
const aiGenerationStatus = new Map<string, Map<string, boolean>>(); // gameId -> playerId -> isGenerating
const playerNicknames = new Map<string, string>(); // playerId -> nickname (global storage)

/**
 * Generate a unique game ID
 */
function generateGameId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Get a random game mode between TankCombat and OrbGame
 */
function getRandomTankOrOrbMode(): GameMode {
  return Math.random() < 0.5 ? GameMode.TankCombat : GameMode.OrbGame;
}

/**
 * Create a new game
 */
export function createNewGame(
  name: string,
  mode: GameMode,
  maxPlayers: number,
  teamMode: TeamMode,
  creator: GamePlayer
): GameInfo {
  const gameId = generateGameId();
  const gameInfo: GameInfo = {
    id: gameId,
    name,
    mode,
    teamMode,
    maxPlayers,
    players: new Map([[creator.id, creator]]),
    status: GameStatus.Waiting,
    createdAt: new Date(),
  };
  
  // Create game instance with map data
  const selectedMap = getRandomMapForMode(mode);
  const gameConfig = buildGameConfigWithPrompt(mode, selectedMap ? { mapName: selectedMap.name } : undefined);
  const game = new Game(gameConfig);
  
  gameInfo.instance = game;
  
  // Store map information
  if (selectedMap) {
    gameInfo.mapName = selectedMap.name;
    gameInfo.mapAscii = selectedMap.ascii;
  }
  
  gameInfos.set(gameId, gameInfo);
  gameConnections.set(gameId, new Set());
  playerNicknames.set(creator.id, creator.nickname);
  
  // Initialize maps for the game
  botCodeStatus.set(gameId, new Map());
  botCodeStorage.set(gameId, new Map());
  aiGenerationStatus.set(gameId, new Map());
  
  return gameInfo;
}

/**
 * Join a game
 */
export function joinGame(gameId: string, player: GamePlayer): { success: boolean; error?: string } {
  const gameInfo = gameInfos.get(gameId);
  if (!gameInfo) {
    return { success: false, error: `Game "${gameId}" not found or no longer exists` };
  }
  
  // Check if game is full
  if (gameInfo.players.size >= gameInfo.maxPlayers) {
    return { success: false, error: `Game "${gameInfo.name}" is full (${gameInfo.players.size}/${gameInfo.maxPlayers} players)` };
  }
  
  // Check if game is already running
  if (gameInfo.status === GameStatus.InGame) {
    return { success: false, error: `Game "${gameInfo.name}" is already in progress` };
  }
  
  // Add player to game
  gameInfo.players.set(player.id, player);
  playerNicknames.set(player.id, player.nickname);
  
  // Auto-assign team if in team mode
  if (gameInfo.teamMode === TeamMode.Teams) {
    assignTeam(gameInfo, player);
  } else {
    // In FFA mode, assign team based on player count for different colors
    const currentPlayerCount = gameInfo.players.size - 1; // -1 because we just added the player
    player.team = currentPlayerCount;
  }
  
  return { success: true };
}

/**
 * Auto-assign team for team mode
 */
function assignTeam(gameInfo: GameInfo, player: GamePlayer): void {
  // Count players per team
  const teamCounts = new Map<number, number>();
  for (const p of gameInfo.players.values()) {
    if (p.team !== undefined) {
      teamCounts.set(p.team, (teamCounts.get(p.team) || 0) + 1);
    }
  }
  
  // Find team with fewer players
  let minTeam = 0;
  let minCount = Infinity;
  
  // Support up to 2 teams for now
  for (let team = 0; team < 2; team++) {
    const count = teamCounts.get(team) || 0;
    if (count < minCount) {
      minCount = count;
      minTeam = team;
    }
  }
  
  player.team = minTeam;
}

/**
 * Get game for quick play (game with most players waiting)
 */
export function getQuickPlayGame(mode?: GameMode): GameInfo | undefined {
  let bestGame: GameInfo | undefined;
  let maxPlayers = 0;
  
  for (const gameInfo of gameInfos.values()) {
    // Skip games that are running or full
    if (gameInfo.status !== GameStatus.Waiting) continue;
    if (gameInfo.players.size >= gameInfo.maxPlayers) continue;
    
    // Filter by mode if specified
    if (mode && gameInfo.mode !== mode) continue;
    
    // Prioritize games that start with "Quick Play"
    if (gameInfo.name.startsWith('Quick Play')) {
      if (gameInfo.players.size > maxPlayers || !bestGame?.name.startsWith('Quick Play')) {
        maxPlayers = gameInfo.players.size;
        bestGame = gameInfo;
      }
    } else if (!bestGame || !bestGame.name.startsWith('Quick Play')) {
      // Only consider non-quick-play games if we haven't found a quick play game
      if (gameInfo.players.size > maxPlayers) {
        maxPlayers = gameInfo.players.size;
        bestGame = gameInfo;
      }
    }
  }
  
  return bestGame;
}

/**
 * Get all active games for lobby display
 */
export function getAllActiveGames(): Array<{
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  players: Array<{ id: string; nickname: string; team?: number }>;
  isRunning: boolean;
  mode: GameMode;
  teamMode: TeamMode;
}> {
  const activeGames = [];
  
  for (const [gameId, gameInfo] of gameInfos.entries()) {
    const connections = gameConnections.get(gameId);
    const isRunning = intervals.has(gameId);
    
    if (connections && connections.size > 0) {
      const players = Array.from(gameInfo.players.values()).map(player => ({
        id: player.id,
        nickname: player.nickname,
        team: player.team
      }));
      
      activeGames.push({
        id: gameId,
        name: gameInfo.name,
        playerCount: gameInfo.players.size,
        maxPlayers: gameInfo.maxPlayers,
        status: isRunning ? 'InGame' : gameInfo.status,
        players,
        isRunning,
        mode: gameInfo.mode,
        teamMode: gameInfo.teamMode
      });
    }
  }
  
  return activeGames;
}

/**
 * Handle new socket connection and register event listeners
 */
export function handleConnection(socket: Socket, io: Server): void {
  
  socket.on('create-game', (data: { gameId?: string; playerId?: string } = {}) => {
    createGame(socket, io, data.gameId, data.playerId);
  });
  
  socket.on('start-game', () => {
    startGame(socket, io);
  });
  
  socket.on('stop-game', () => {
    stopGame(socket, io);
  });
  
  socket.on('reset-game', () => {
    resetGame(socket, io);
  });
  
  socket.on('leave-game', ({ gameId, playerId }: { gameId: string; playerId: string }) => {
    leaveGame(socket, io, gameId, playerId);
  });
  
  socket.on('set-bot-code', ({ playerId, code }: { playerId: string; code: string }) => {
    setBotCode(socket, io, playerId, code);
  });
  
  socket.on('ai-generation-start', ({ playerId }: { playerId: string }) => {
    setAiGenerationStatus(socket, io, playerId, true);
  });
  
  socket.on('ai-generation-end', ({ playerId }: { playerId: string }) => {
    setAiGenerationStatus(socket, io, playerId, false);
  });
  
  socket.on('disconnect', () => {
    handleDisconnect(socket, io);
  });
}

/**
 * Create or join a game
 */
function createGame(socket: Socket, io: Server, gameId?: string, playerId?: string): void {
  const actualGameId = gameId || socket.id; // Use socket.id if no gameId provided
  const actualPlayerId = playerId || socket.id; // Use socket.id if no playerId provided
  console.log('Client', socket.id, 'joining game:', actualGameId, 'as player:', actualPlayerId);
  
  // Check if game already exists
  let gameInfo = gameInfos.get(actualGameId);
  let game: Game | undefined;
  let isNewGame = false;
  
  if (!gameInfo) {
    // Create new game with default settings
    const player: GamePlayer = {
      id: actualPlayerId,
      nickname: getPlayerNickname(actualPlayerId) || getDisplayName(actualPlayerId),
      socketId: socket.id,
      isGuest: actualPlayerId.startsWith('guest-'),
      isReady: true,
      team: 0
    };
    
    gameInfo = createNewGame(
      `Game ${actualGameId.slice(-6)}`,
      getRandomTankOrOrbMode(),
      8,
      TeamMode.FFA,
      player
    );
    
    isNewGame = true;
  } else {
    game = gameInfo.instance;
    if (!game) {
      console.error(`Game instance not found for ${actualGameId}`);
      socket.emit('error', 'Game instance not found');
      return;
    }
  }
  
  // Add this specific player to the game if they're not already added
  const gameState = gameInfo.instance!.getState();
  const currentPlayers = Array.from(gameState.bots.keys());
  const playerBotId = `bot-${actualPlayerId}`;
  
  if (!currentPlayers.includes(playerBotId)) {
    // Get or create player info
    let playerInfo = { nickname: getDisplayName(actualPlayerId), team: 0 };
    
    // Check if player already exists in game
    const existingPlayer = gameInfo.players.get(actualPlayerId);
    if (existingPlayer) {
      playerInfo = { nickname: existingPlayer.nickname, team: existingPlayer.team || 0 };
    } else {
      // Always assign team based on current player count for different colors
      const currentPlayerCount = gameInfo.instance!.getState().bots.size;
      const team = currentPlayerCount;
      
      // Try to get nickname from global storage
      const globalNickname = getPlayerNickname(actualPlayerId);
      if (globalNickname) {
        playerInfo = { nickname: globalNickname, team };
      }
      
      // Add player to gameInfo
      const newPlayer: GamePlayer = {
        id: actualPlayerId,
        nickname: playerInfo.nickname,
        socketId: socket.id,
        isGuest: actualPlayerId.startsWith('guest-'),
        isReady: true,
        team
      };
      gameInfo.players.set(actualPlayerId, newPlayer);
    }
    
    // Add player to game
    console.log(`Adding player ${actualPlayerId} with team number: ${playerInfo.team}`);
    gameInfo.instance!.addPlayer(actualPlayerId, playerInfo.team || 0, playerInfo.nickname);
    
    // Initialize bot code status for this player
    const botStatus = botCodeStatus.get(actualGameId) || new Map();
    const isFirstPlayer = botStatus.size === 0;
    botStatus.set(actualPlayerId, isFirstPlayer);
    botCodeStatus.set(actualGameId, botStatus);
    
    // Don't set any default bot code
    
    console.log(`Added player ${actualPlayerId} to game ${actualGameId}, total players: ${gameInfo.instance!.getState().bots.size}`);
  }
  
  // Add socket to game connections and join room
  const connections = gameConnections.get(actualGameId);
  if (!connections) {
    console.error(`Game ${actualGameId} not found in gameConnections`);
    socket.emit('error', `Game ${actualGameId} not found`);
    return;
  }
  connections.add(socket.id);
  socketToGame.set(socket.id, actualGameId);
  socket.join(actualGameId);
  
  // Store gameId in socket data for other handlers
  socket.data.gameId = actualGameId;
  
  // Send initial state to the joining socket
  socket.emit('game-created', serializeGameState(gameInfo.instance!.getState()));
  
  // Send game configuration
  // const selectedMap = gameInfo.mapName ? { name: gameInfo.mapName } : undefined;
  // const gameEngineConfig = buildGameConfig(gameInfo.mode, selectedMap ? { mapName: selectedMap.name } : undefined);
  const gameEngineConfig = gameInfo.instance!.config;
  
  socket.emit('game-config', {
    mode: gameInfo.mode,
    teamMode: gameInfo.teamMode,
    maxPlayers: gameInfo.maxPlayers,
    name: gameInfo.name,
    mapName: gameInfo.mapName,
    mapAscii: gameInfo.mapAscii,
    gameEngineConfig: gameEngineConfig
  });
  
  // Send initial bot status to the joining socket
  socket.emit('bot-status-update', getBotStatusForGame(actualGameId));
  
  // Send player info
  const playerInfoMap = new Map<string, { nickname: string; team?: number }>();
  for (const [playerId, player] of gameInfo.players) {
    playerInfoMap.set(playerId, { nickname: player.nickname, team: player.team });
  }
  socket.emit('player-info', Object.fromEntries(playerInfoMap));
  
  // Send current bot code for all players
  const codeStorage = botCodeStorage.get(actualGameId);
  if (codeStorage) {
    for (const [playerId, code] of codeStorage) {
      socket.emit('bot-code-update', { playerId, code });
    }
  }
  
  // Broadcast updated game state and player info to all clients
  io.to(actualGameId).emit('game-update', serializeGameState(gameInfo.instance!.getState()));
  io.to(actualGameId).emit('bot-status-update', getBotStatusForGame(actualGameId));
  io.to(actualGameId).emit('player-info', Object.fromEntries(playerInfoMap));
  
  // If joining existing game that's running, start receiving updates
  if (!isNewGame && intervals.has(actualGameId)) {
    socket.emit('game-started');
  }
}

/**
 * Create a better fallback nickname from player ID
 */
function getDisplayName(playerId: string): string {
  if (playerId.startsWith('guest-')) {
    // Extract last 6 characters for shorter display
    const suffix = playerId.slice(-6);
    return `Guest${suffix}`;
  }
  return playerId;
}

/**
 * Get player nickname from global storage
 */
export function getPlayerNickname(playerId: string): string | undefined {
  return playerNicknames.get(playerId);
}

/**
 * Set player nickname in global storage
 */
export function setPlayerNickname(playerId: string, nickname: string): void {
  playerNicknames.set(playerId, nickname);
}

/**
 * Start the game loop for a game
 */
function startGameLoop(io: Server, gameId: string): void {
  const gameInfo = gameInfos.get(gameId);
  if (!gameInfo || !gameInfo.instance) {
    console.error('Game not found for starting loop:', gameId);
    return;
  }
  
  // Check if game is already running
  if (intervals.has(gameId)) {
    console.log('Game already running:', gameId);
    return;
  }
  
  // Update game status
  gameInfo.status = GameStatus.InGame;
  
  // Run game loop at 30fps
  const interval = setInterval(() => {
    gameInfo.instance!.tick();
    const state = gameInfo.instance!.getState();
    
    // Emit to all sockets in this game
    emitToGame(io, gameId, 'game-update', serializeGameState(state));
    
    // Stop if game is won
    if (state.winner) {
      // Emit game-ended event with winner information
      emitToGame(io, gameId, 'game-ended', {
        winner: state.winner,
        finalState: serializeGameState(state)
      });
      stopGameById(io, gameId);
      
      // Schedule automatic restart after 10 seconds
      setTimeout(() => {
        const gameInfo = gameInfos.get(gameId);
        const connections = gameConnections.get(gameId);
        
        // Only restart if game still exists and has connected players
        if (gameInfo && gameInfo.instance && connections && connections.size > 0) {
          // Keep the same game mode, just get a new random map
          const selectedMap = getRandomMapForMode(gameInfo.mode);
          const gameConfig = buildGameConfigWithPrompt(gameInfo.mode, selectedMap ? { mapName: selectedMap.name } : undefined);
          gameInfo.instance = new Game(gameConfig);
          
          // Update map info
          if (selectedMap) {
            gameInfo.mapName = selectedMap.name;
            gameInfo.mapAscii = selectedMap.ascii;
          }
          
          // Re-add all players
          for (const [playerId, player] of gameInfo.players) {
            gameInfo.instance.addPlayer(playerId, player.team || 0, player.nickname);
            
            // Restore bot code
            const codeStorage = botCodeStorage.get(gameId);
            if (codeStorage) {
              const code = codeStorage.get(playerId);
              if (code) {
                gameInfo.instance.setBotCode(playerId, code);
              }
            }
          }
          
          // Send new config and reset
          emitToGame(io, gameId, 'game-config', {
            mode: gameInfo.mode,
            teamMode: gameInfo.teamMode,
            maxPlayers: gameInfo.maxPlayers,
            name: gameInfo.name,
            mapName: gameInfo.mapName,
            mapAscii: gameInfo.mapAscii,
            gameEngineConfig: gameConfig
          });
          emitToGame(io, gameId, 'game-reset', serializeGameState(gameInfo.instance.getState()));
          
          // Auto-start the new round
          startGameLoop(io, gameId);
        }
      }, 10000);
    }
  }, 1000 / 30);
  
  intervals.set(gameId, interval);
  
  // Notify all sockets in this game
  emitToGame(io, gameId, 'game-started');
}

/**
 * Start a game
 */
function startGame(socket: Socket, io: Server): void {
  const gameId = socketToGame.get(socket.id);
  if (!gameId) {
    socket.emit('error', 'No game associated with this socket');
    return;
  }
  
  const gameInfo = gameInfos.get(gameId);
  if (!gameInfo || !gameInfo.instance) {
    socket.emit('error', 'No game found');
    return;
  }
  
  console.log('Starting game:', gameId);
  
  // Use the shared game loop function
  startGameLoop(io, gameId);
}

/**
 * Stop a game
 */
function stopGame(socket: Socket, io: Server): void {
  const gameId = socketToGame.get(socket.id);
  if (gameId) {
    stopGameById(io, gameId);
  }
}

/**
 * Stop a game by ID
 */
function stopGameById(io: Server, gameId: string): void {
  const interval = intervals.get(gameId);
  if (interval) {
    clearInterval(interval);
    intervals.delete(gameId);
    console.log('Stopped game:', gameId);
    
    // Update game status
    const gameInfo = gameInfos.get(gameId);
    if (gameInfo) {
      gameInfo.status = GameStatus.Finished;
    }
    
    // Notify all connected sockets
    emitToGame(io, gameId, 'game-stopped');
  }
}

/**
 * Reset a game
 */
function resetGame(socket: Socket, io: Server): void {
  const gameId = socketToGame.get(socket.id);
  if (!gameId) return;
  
  const gameInfo = gameInfos.get(gameId);
  if (!gameInfo || !gameInfo.instance) {
    socket.emit('error', 'No game found');
    return;
  }
  
  const game = gameInfo.instance;
  
  console.log('Resetting game:', gameId);
  stopGameById(io, gameId);
  gameInfo.instance!.reset();
  
  // Update game status
  if (gameInfo) {
    gameInfo.status = GameStatus.Waiting;
  }
  
  // Notify all sockets in this game
  emitToGame(io, gameId, 'game-reset', serializeGameState(gameInfo.instance!.getState()));
}

/**
 * Set bot code for a player
 */
function setBotCode(socket: Socket, io: Server, playerId: string, code: string): void {
  const gameId = socketToGame.get(socket.id);
  if (!gameId) return;
  
  const gameInfo = gameInfos.get(gameId);
  if (!gameInfo || !gameInfo.instance) {
    socket.emit('error', 'No game found');
    return;
  }
  
  const game = gameInfo.instance;
  
  console.log(`Setting bot code for player ${playerId} in game ${gameId}`);
  gameInfo.instance!.setBotCode(playerId, code);
  
  // Store the bot code
  const codeStorage = botCodeStorage.get(gameId);
  if (codeStorage) {
    codeStorage.set(playerId, code);
  }
  
  // Broadcast bot code update to all players in the game
  io.to(gameId).emit('bot-code-update', { playerId, code });
  
  // Update bot code status
  const botStatus = botCodeStatus.get(gameId);
  if (botStatus) {
    botStatus.set(playerId, true);
  }
  
  // Notify all sockets in this game
  emitToGame(io, gameId, 'bot-code-set', { playerId });
  emitToGame(io, gameId, 'bot-status-update', getBotStatusForGame(gameId));
}

/**
 * Leave a game
 */
function leaveGame(socket: Socket, io: Server, gameId: string, playerId: string): void {
  console.log(`Player ${playerId} leaving game ${gameId}`);
  
  // Verify the socket is in this game
  const socketGameId = socketToGame.get(socket.id);
  if (socketGameId !== gameId) {
    socket.emit('error', 'Not connected to this game');
    return;
  }
  
  const gameInfo = gameInfos.get(gameId);
  if (!gameInfo) {
    socket.emit('error', 'Game not found');
    return;
  }
  
  // Remove socket from game connections
  const connections = gameConnections.get(gameId);
  if (connections) {
    connections.delete(socket.id);
    console.log(`Removed socket ${socket.id} from game ${gameId} connections. Remaining: ${connections.size}`);
  }
  
  // Remove from socket mapping
  socketToGame.delete(socket.id);
  
  // Leave the Socket.IO room
  socket.leave(gameId);
  
  // Store the player data before we remove them
  socket.data.playerId = playerId;
  
  // Remove player from the game if they have no other connections
  let hasOtherConnections = false;
  if (connections) {
    for (const socketId of connections) {
      const otherSocket = io.sockets.sockets.get(socketId);
      if (otherSocket && otherSocket.data.playerId === playerId) {
        hasOtherConnections = true;
        break;
      }
    }
  }
  
  if (!hasOtherConnections) {
    // Remove player from game info
    const playerData = gameInfo.players.get(playerId);
    const playerNickname = playerData?.nickname || playerId;
    gameInfo.players.delete(playerId);
    
    // Remove bot code if any
    const botStatus = botCodeStatus.get(gameId);
    if (botStatus) {
      botStatus.delete(playerId);
    }
    
    // Remove AI generation status
    const genStatus = aiGenerationStatus.get(gameId);
    if (genStatus) {
      genStatus.delete(playerId);
    }
    
    // Notify other players
    io.to(gameId).emit('player-left-game', { nickname: playerNickname });
    
    // Update player info for remaining players
    const playerInfoMap = new Map<string, { nickname: string; team?: number }>();
    for (const [pid, player] of gameInfo.players) {
      playerInfoMap.set(pid, { nickname: player.nickname, team: player.team });
    }
    io.to(gameId).emit('player-info', Object.fromEntries(playerInfoMap));
    
    // Update bot status
    io.to(gameId).emit('bot-status-update', getBotStatusForGame(gameId));
  }
  
  // Clear player's game mapping in lobby system (always clear, even if they have other connections)
  clearPlayerGameMapping(playerId);
  
  // Confirm to the leaving socket
  socket.emit('game-left');
  
  // If no players left, stop and clean up the game
  if (gameInfo.players.size === 0 || (connections && connections.size === 0)) {
    console.log(`No players left in game ${gameId}, cleaning up`);
    
    // Stop the game if running
    stopGameById(io, gameId);
    
    // Clean up all game data
    gameInfos.delete(gameId);
    gameConnections.delete(gameId);
    botCodeStatus.delete(gameId);
    botCodeStorage.delete(gameId);
    aiGenerationStatus.delete(gameId);
  }
}

/**
 * Handle socket disconnection
 */
function handleDisconnect(socket: Socket, io: Server): void {
  console.log('Game client disconnected:', socket.id);
  
  const gameId = socketToGame.get(socket.id);
  if (!gameId) return;
  
  // Remove socket from game connections
  const connections = gameConnections.get(gameId);
  if (connections) {
    connections.delete(socket.id);
    
    // If no more connections, clean up the game
    if (connections.size === 0) {
      stopGameById(io, gameId);
      
      // Clean up game info and maps
      const gameInfo = gameInfos.get(gameId);
      if (gameInfo) {
        gameInfo.players.clear();
        gameInfos.delete(gameId);
      }
      
      gameConnections.delete(gameId);
      botCodeStatus.delete(gameId);
      botCodeStorage.delete(gameId);
      aiGenerationStatus.delete(gameId);
    }
  }
  
  socketToGame.delete(socket.id);
}

/**
 * Emit event to all sockets in a game using Socket.IO rooms
 */
function emitToGame(io: Server, gameId: string, event: string, data?: unknown): void {
  io.to(gameId).emit(event, data);
}

/**
 * Set AI generation status for a player
 */
function setAiGenerationStatus(socket: Socket, io: Server, playerId: string, isGenerating: boolean): void {
  const gameId = socketToGame.get(socket.id);
  if (!gameId) return;
  
  // Initialize if needed
  if (!aiGenerationStatus.has(gameId)) {
    aiGenerationStatus.set(gameId, new Map());
  }
  
  const genStatus = aiGenerationStatus.get(gameId);
  if (!genStatus) {
    console.error(`Game ${gameId} not found in AI generation status`);
    return;
  }
  genStatus.set(playerId, isGenerating);
  
  // Broadcast updated status
  emitToGame(io, gameId, 'ai-generation-status', { playerId, isGenerating });
}

/**
 * Get bot status for a game
 */
function getBotStatusForGame(gameId: string): Record<string, boolean> {
  const botStatus = botCodeStatus.get(gameId);
  if (!botStatus) return {};
  
  const result: Record<string, boolean> = {};
  botStatus.forEach((hasCode, playerId) => {
    result[playerId] = hasCode;
  });
  return result;
}

/**
 * Get game mode for a specific game ID
 */
export function getGameMode(gameId: string): GameMode | null {
  const gameInfo = gameInfos.get(gameId);
  return gameInfo?.mode || null;
}

