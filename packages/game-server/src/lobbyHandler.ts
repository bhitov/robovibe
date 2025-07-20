/**
 * Lobby handler for managing room-related socket events
 */

import type { Socket, Server } from 'socket.io';
import { GameMode } from '@repo/game-config';
import {
  createNewGame,
  joinGame,
  getQuickPlayGame,
  getAllActiveGames,
  setPlayerNickname,
  TeamMode,
  GameStatus,
  type GamePlayer
} from './gameHandler';

/**
 * Get a random game mode from all available modes
 */
function getRandomGameMode(): GameMode {
  const modes = Object.values(GameMode);
  const randomMode = modes[Math.floor(Math.random() * modes.length)];
  if (!randomMode) {
    return Math.random() < 0.5 ? GameMode.TankCombat : GameMode.OrbGame; // fallback, should never happen
  }
  return randomMode;
}

// Track socket to player mapping
const socketToPlayer = new Map<string, GamePlayer>();

// Track player to game mapping
const playerToGame = new Map<string, string>();

// Track active lobby connections and periodic broadcast
let activeLobbyConnections = 0;
let broadcastInterval: NodeJS.Timeout | null = null;

/**
 * Clear player's game mapping (called from gameHandler when leaving game)
 */
export function clearPlayerGameMapping(playerId: string): void {
  playerToGame.delete(playerId);
}

/**
 * Start periodic broadcast of room list
 */
function startPeriodicBroadcast(io: Server): void {
  if (broadcastInterval) return; // Already running
  
  console.log('Starting periodic room list broadcast (200ms)');
  broadcastInterval = setInterval(() => {
    if (activeLobbyConnections > 0) {
      const activeGames = getAllActiveGames();
      io.emit('room-list', activeGames);
    } else {
      // No active connections, stop the interval
      stopPeriodicBroadcast();
    }
  }, 200);
}

/**
 * Stop periodic broadcast
 */
function stopPeriodicBroadcast(): void {
  if (broadcastInterval) {
    console.log('Stopping periodic room list broadcast');
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

/**
 * Handle lobby connection
 */
export function handleLobbyConnection(socket: Socket, io: Server): void {
  // Track this connection
  activeLobbyConnections++;
  console.log(`Lobby connection added. Active connections: ${activeLobbyConnections}`);
  
  // Start periodic broadcast if this is the first connection
  if (activeLobbyConnections === 1) {
    startPeriodicBroadcast(io);
  }
  
  // Show all active games (rooms are games now)
  const activeGames = getAllActiveGames();
  socket.emit('room-list', activeGames);
  
  // Handle player identification
  socket.on('identify', ({ nickname, userId, isGuest }: { 
    nickname: string; 
    userId?: string;
    isGuest: boolean;
  }) => {
    const player: GamePlayer = {
      id: userId || `guest-${socket.id}`,
      nickname,
      socketId: socket.id,
      isGuest,
      isReady: false,
    };
    
    socketToPlayer.set(socket.id, player);
    
    // Store nickname globally for game transitions
    setPlayerNickname(player.id, player.nickname);
    
    socket.emit('identified', { playerId: player.id });
  });
  
  // Handle game creation (was room creation)
  socket.on('create-room', ({ name, mode, maxPlayers, teamMode }: {
    name: string;
    mode: GameMode;
    maxPlayers: number;
    teamMode: TeamMode;
  }) => {
    const player = socketToPlayer.get(socket.id);
    if (!player) {
      socket.emit('error', 'Not identified');
      return;
    }
    
    // Validate inputs
    if (!name || name.trim().length === 0) {
      socket.emit('error', 'Game name required');
      return;
    }
    
    if (maxPlayers < 2 || maxPlayers > 16) {
      socket.emit('error', 'Max players must be between 2 and 16');
      return;
    }
    
    const gameInfo = createNewGame(
      name.trim(),
      mode,
      maxPlayers,
      teamMode,
      player
    );
    
    // Track player to game mapping
    playerToGame.set(player.id, gameInfo.id);
    
    // Join socket.io room
    socket.join(gameInfo.id);
    
    socket.emit('room-created', serializeGame(gameInfo));
    // Periodic broadcast will handle updating all clients
    // console.log('Broadcasting game list after room creation. Game has map:', !!gameInfo.mapName);
    // broadcastGameList(io);
    
    // Broadcast game event
    io.emit('room-event', {
      type: 'room-created',
      message: `${player.nickname} created "${gameInfo.name}"`,
      roomId: gameInfo.id,
      playerId: player.id
    });
  });
  
  // Handle game joining (was room joining)
  socket.on('join-room', ({ roomId }: { roomId: string }) => {
    const player = socketToPlayer.get(socket.id);
    if (!player) {
      socket.emit('error', 'Not identified');
      return;
    }
    
    const result = joinGame(roomId, player);
    if (!result.success) {
      socket.emit('error', result.error || 'Failed to join game');
      return;
    }
    
    // Track player to game mapping
    playerToGame.set(player.id, roomId);
    
    // Join socket.io room
    socket.join(roomId);
    
    // Get game info for response
    const activeGames = getAllActiveGames();
    const gameInfo = activeGames.find(g => g.id === roomId);
    
    if (gameInfo) {
      socket.emit('room-joined', gameInfo);
      // broadcastGameList(io); // Handled by periodic broadcast
      
      // Broadcast game event
      io.to(roomId).emit('room-event', {
        type: 'player-joined',
        message: `${player.nickname} joined the game`,
        roomId: roomId,
        playerId: player.id
      });
    }
  });
  
  // Handle leaving game (was leaving room)
  socket.on('leave-room', () => {
    const player = socketToPlayer.get(socket.id);
    if (!player) return;
    
    const gameId = playerToGame.get(player.id);
    if (!gameId) return;
    
    // Leave socket.io room
    socket.leave(gameId);
    
    // Broadcast leave event
    io.to(gameId).emit('room-event', {
      type: 'player-left',
      message: `${player.nickname} left the game`,
      roomId: gameId,
      playerId: player.id
    });
    
    // Remove player mapping
    playerToGame.delete(player.id);
    
    socket.emit('room-left');
    // broadcastGameList(io); // Handled by periodic broadcast
  });
  
  // Track pending quick play requests
  const pendingQuickPlay = new Map<string, NodeJS.Timeout>();
  
  // Handle quick play
  socket.on('quick-play', ({ mode }: { mode?: GameMode }) => {
    console.log('Received quick-play event', { socketId: socket.id, mode });
    
    // Debug: Log current state
    console.log('Current socketToPlayer map size:', socketToPlayer.size);
    console.log('Socket exists in map:', socketToPlayer.has(socket.id));
    
    const player = socketToPlayer.get(socket.id);
    if (!player) {
      console.log('Player not found for socket:', socket.id);
      console.log('Available sockets:', Array.from(socketToPlayer.keys()));
      socket.emit('error', 'Not identified');
      return;
    }
    console.log('Player found:', player);
    
    // First, try to find an existing game
    const gameInfo = getQuickPlayGame(mode);
    console.log('Looking for quick play game, found:', gameInfo ? `game ${gameInfo.id}` : 'none');
    if (gameInfo) {
      const result = joinGame(gameInfo.id, player);
      console.log('Join game result:', result);
      if (result.success) {
        playerToGame.set(player.id, gameInfo.id);
        socket.join(gameInfo.id);
        
        // Emit room-joined with the game info we already have
        const serializedGame = serializeGame(gameInfo);
        console.log('Emitting room-joined with:', serializedGame);
        socket.emit('room-joined', serializedGame);
        // broadcastGameList(io); // Handled by periodic broadcast
        
        // Cancel any pending quick play for this socket
        const timeout = pendingQuickPlay.get(socket.id);
        if (timeout) {
          clearTimeout(timeout);
          pendingQuickPlay.delete(socket.id);
        }
      } else {
        socket.emit('error', result.error || 'Failed to join game');
      }
      return;
    }
    
    // No game found - wait a bit to see if another player clicks quick play
    socket.emit('quick-play-waiting');
    
    // Set a timeout to create a game if no one else joins
    const timeout = setTimeout(() => {
      // Check again if a game is available
      const gameInfo = getQuickPlayGame(mode);
      if (gameInfo) {
        const result = joinGame(gameInfo.id, player);
        if (result.success) {
          playerToGame.set(player.id, gameInfo.id);
          socket.join(gameInfo.id);
          
          // Emit room-joined with the game info we already have
          socket.emit('room-joined', serializeGame(gameInfo));
          // broadcastGameList(io); // Handled by periodic broadcast
        } else {
          socket.emit('error', result.error || 'Failed to join game');
        }
      } else {
        // Create a new game for quick play
        console.log('No existing game found, creating new quick play game');
        const gameNumber = Math.floor(Math.random() * 1000);
        const newGameInfo = createNewGame(
          `Quick Play #${gameNumber}`,
          mode || getRandomGameMode(),
          8, // Default 8 players
          TeamMode.FFA,
          player
        );
        
        console.log(`Created new game: { id: '${newGameInfo.id}', name: '${newGameInfo.name}' }`);
        playerToGame.set(player.id, newGameInfo.id);
        socket.join(newGameInfo.id);
        socket.emit('room-joined', serializeGame(newGameInfo));
        // console.log('Broadcasting game list after quick play creation. Game has map:', !!newGameInfo.mapName);
        // broadcastGameList(io); // Handled by periodic broadcast
      }
      
      pendingQuickPlay.delete(socket.id);
    }, 1500); // Wait 1.5 seconds
    
    pendingQuickPlay.set(socket.id, timeout);
  });
  
  // Handle player ready status
  socket.on('toggle-ready', () => {
    const player = socketToPlayer.get(socket.id);
    if (!player) return;
    
    const gameId = playerToGame.get(player.id);
    if (!gameId) return;
    
    player.isReady = !player.isReady;
    // broadcastGameList(io); // Handled by periodic broadcast
    
    // Check if all players are ready to start
    const activeGames = getAllActiveGames();
    const gameInfo = activeGames.find(g => g.id === gameId);
    if (gameInfo) {
      const allReady = gameInfo.players.every(p => p.id === player.id ? player.isReady : true); // Assume others are ready
      if (allReady && gameInfo.players.length >= 2) {
        io.to(gameId).emit('all-ready');
      }
    }
  });
  
  // Handle starting game from lobby
  socket.on('start-game', () => {
    const player = socketToPlayer.get(socket.id);
    if (!player) return;
    
    const gameId = playerToGame.get(player.id);
    if (!gameId) return;
    
    // Get game info
    const activeGames = getAllActiveGames();
    const gameInfo = activeGames.find(g => g.id === gameId);
    if (!gameInfo) return;
    
    // Validate game can start
    if (gameInfo.players.length < 2) {
      socket.emit('error', 'Need at least 2 players');
      return;
    }
    
    if (gameInfo.status === 'InGame') {
      socket.emit('error', 'Game already in progress');
      return;
    }
    
    // Notify all players to transition to game
    io.to(gameId).emit('game-starting', {
      gameId,
      mode: gameInfo.mode || GameMode.TankCombat,
      teamMode: gameInfo.teamMode || TeamMode.FFA,
      players: gameInfo.players,
    });
    
    // broadcastGameList(io); // Handled by periodic broadcast
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    // Decrement connection count
    activeLobbyConnections--;
    console.log(`Lobby connection removed. Active connections: ${activeLobbyConnections}`);
    
    // Stop broadcast if no more connections
    if (activeLobbyConnections === 0) {
      stopPeriodicBroadcast();
    }
    
    const player = socketToPlayer.get(socket.id);
    if (!player) {
      // Socket disconnected before identifying, still valid
      return;
    }
    
    // Cancel any pending quick play
    const timeout = pendingQuickPlay.get(socket.id);
    if (timeout) {
      clearTimeout(timeout);
      pendingQuickPlay.delete(socket.id);
    }
    
    // Leave current game
    const gameId = playerToGame.get(player.id);
    if (gameId) {
      socket.leave(gameId);
      playerToGame.delete(player.id);
      // broadcastGameList(io); // Handled by periodic broadcast
    }
    
    socketToPlayer.delete(socket.id);
  });
  
  // Request room list refresh
  socket.on('refresh-rooms', () => {
    // Show all active games (games only now)
    const activeGames = getAllActiveGames();
    socket.emit('room-list', activeGames);
  });
}

/**
 * Serialize game info for client (replaces serializeRoom)
 */
function serializeGame(gameInfo: any): unknown {
  return {
    id: gameInfo.id,
    name: gameInfo.name,
    mode: gameInfo.mode,
    maxPlayers: gameInfo.maxPlayers,
    playerCount: gameInfo.players.size,
    players: Array.from(gameInfo.players.values()).map((p: any) => ({
      id: p.id,
      nickname: p.nickname,
      isGuest: p.isGuest,
      isReady: p.isReady,
      team: p.team,
    })),
    teamMode: gameInfo.teamMode,
    status: gameInfo.status,
    createdAt: gameInfo.createdAt.toISOString(),
    mapName: gameInfo.mapName,
    mapAscii: gameInfo.mapAscii,
  };
}

/**
 * Broadcast game list to all clients (replaces broadcastRoomList)
 */
function broadcastGameList(io: Server): void {
  const activeGames = getAllActiveGames();
  io.emit('room-list', activeGames);
}