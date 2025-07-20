import type { Socket } from 'socket.io';

export interface TimeData {
  timestamp: string;
  formatted: string;
}

export class TimeStreamHandler {
  private intervals = new Map<string, NodeJS.Timeout>();

  handleConnection(socket: Socket): void {
    socket.on('start-time-stream', () => {
      this.startTimeStream(socket);
    });
    socket.on('stop-time-stream', () => {
      this.stopTimeStream(socket);
    });
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private startTimeStream(socket: Socket): void {
    console.log('Starting time stream for client:', socket.id);
    
    // Clear any existing interval
    this.stopTimeStream(socket);
    
    // Send time updates every 50ms
    const interval = setInterval(() => {
      const now = new Date();
      const timeData: TimeData = {
        timestamp: now.toISOString(),
        formatted: now.toLocaleString()
      };
      socket.emit('time-update', timeData);
    }, 50);
    
    this.intervals.set(socket.id, interval);
  }

  private stopTimeStream(socket: Socket): void {
    const interval = this.intervals.get(socket.id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(socket.id);
      console.log('Stopped time stream for client:', socket.id);
    }
  }

  private handleDisconnect(socket: Socket): void {
    console.log('Socket.IO client disconnected:', socket.id);
    this.stopTimeStream(socket);
  }
}