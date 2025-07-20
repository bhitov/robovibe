import { io, Socket } from 'socket.io-client';
import { clientConfig } from '@repo/config/client';

// Create Socket.IO client instance
export const socket: Socket = io(clientConfig.serverUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Helper function to connect socket
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// Helper function to disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};