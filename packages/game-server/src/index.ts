/**
 * Game server package for Socket.IO game handlers
 * Provides centralized game management and WebSocket event handling
 */

import type { Server } from 'socket.io';
import { handleConnection } from './gameHandler';
import { handleLobbyConnection } from './lobbyHandler';

/**
 * Register game handlers with a Socket.IO server
 * @param io - Socket.IO server instance
 */
export function registerGameHandlers(io: Server): void {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Handle both lobby and game events on the same connection
    handleLobbyConnection(socket, io);
    handleConnection(socket, io);
  });
}

export { handleConnection, getGameMode } from './gameHandler';
export { handleLobbyConnection } from './lobbyHandler';
export { sampleBotCode } from './sampleBotCode';
