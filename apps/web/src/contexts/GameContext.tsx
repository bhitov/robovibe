import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { socket, connectSocket, disconnectSocket } from '@/utils/socket';
import type { GameState } from '@repo/game-engine';
import {
  type SerializedGameState,
  deserializeGameState,
} from '@repo/game-serializer';
import type { GameMode } from '@repo/game-config';
import { useChat } from '@/contexts/ChatContext';
import { TeamMode } from '@/types/game';
import type { Message } from '@/sidebar';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface GameConfig {
  mode: GameMode;
  teamMode: string;
  maxPlayers: number;
  name: string;
  mapName?: string;
  mapAscii?: string[];
  gameEngineConfig?: {
    winCondition?: {
      type: string;
      value: number;
    };
  };
}

interface PlayerInfo {
  nickname: string;
  team?: number;
}

interface JoinParams {
  gameId?: string;
  playerId: string;
}

interface Player {
  id: string;
  nickname: string;
  ready: boolean;
  team?: number;
}

interface Room {
  id: string;
  name: string;
  mode: GameMode;
  maxPlayers: number;
  playerCount: number;
  players: Player[];
  teamMode: TeamMode;
  status: string;
  createdAt: string;
}

interface GameContextType {
  /* Game state */
  gameState: GameState | null;
  gameConfig: GameConfig | null;
  playerInfo: Record<string, PlayerInfo>;
  botCodeStatus: Record<string, boolean>;
  botCode: Record<string, string>; // playerId -> code content
  aiGenerationStatus: Record<string, boolean>;
  isRunning: boolean;
  currentGameId: string | null;

  /* Lobby state */
  playerId: string | null;
  rooms: Room[];
  selectedRoom: Room | null;
  isQuickPlayWaiting: boolean;
  errorMessage: string;

  /* Game actions */
  joinGame: (params: JoinParams) => void;
  leaveGame: () => void;
  toggleRunning: () => void;
  resetGame: () => void;

  /* Lobby actions */
  identify: (nickname: string, isGuest: boolean) => void;
  createRoom: (name: string, mode: GameMode, teamMode: TeamMode, maxPlayers: number) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  startGame: (roomId: string) => void;
  toggleReady: (roomId: string) => void;
  quickPlay: (mode: GameMode) => void;
  cancelQuickPlay: () => void;
  refreshRooms: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { startAssistantThinking, finishAssistantMsg } = useChat();

  /* ----- Game state ------------------------------------------------ */
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<Record<string, PlayerInfo>>({});
  const [botCodeStatus, setBotCodeStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [botCode, setBotCode] = useState<Record<string, string>>({});
  const [aiGenerationStatus, setAiGenerationStatus] = useState<
    Record<string, boolean>
  >({});
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  /* ----- Lobby state ----------------------------------------------- */
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isQuickPlayWaiting, setIsQuickPlayWaiting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /* The latest join params (used after reconnects) ------------------ */
  const joinParamsRef = useRef<JoinParams | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const seenBotCodesRef = useRef<Set<string>>(new Set());
  const playerInfoRef = useRef<Record<string, PlayerInfo>>({});

  /* ----- Utility to push chat messages ----------------------------- */
  const pushAssistantMsg = useCallback((text: string) => {
    const id = startAssistantThinking();
    requestAnimationFrame(() => finishAssistantMsg(id, text));
  }, [startAssistantThinking, finishAssistantMsg]);

  /* ----- Game actions ---------------------------------------------- */
  const joinGame = useCallback((params: JoinParams) => {
    joinParamsRef.current = params;

    if (!socket.connected) {
      console.log('Socket not connected, connecting first...');
      connectSocket();
      return;
    }
    
    // Use currentGameId from context if not provided in params
    const gameId = params.gameId || currentGameId;
    if (!gameId) {
      console.error('Cannot join game without gameId');
      return;
    }
    
    console.log('joinGame called with:', { gameId, playerId: params.playerId });
    
    // 'create-game' is used for both creating and joining games
    // The server differentiates based on whether gameId is provided
    socket.emit('create-game', { gameId, playerId: params.playerId });
  }, [currentGameId]);

  const toggleRunning = useCallback(() => {
    console.log('Toggle running called, isRunning:', isRunning, 'socket connected:', socket.connected);
    if (!socket.connected) {
      console.error('Socket not connected!');
      connectSocket();
      // Try again after a brief delay
      setTimeout(() => {
        socket.emit(isRunning ? 'stop-game' : 'start-game');
      }, 100);
    } else {
      socket.emit(isRunning ? 'stop-game' : 'start-game');
    }
  }, [isRunning]);

  const resetGame = useCallback(() => {
    socket.emit('reset-game');
  }, []);

  const leaveGame = useCallback(() => {
    if (currentGameId && playerId) {
      console.log('Leaving game:', currentGameId);
      socket.emit('leave-game', { gameId: currentGameId, playerId });
      
      // Clear local game state immediately
      setGameState(null);
      setGameConfig(null);
      setIsRunning(false);
      setPlayerInfo({});
      setBotCodeStatus({});
      setBotCode({});
      setAiGenerationStatus({});
      setCurrentGameId(null);
      seenBotCodesRef.current.clear();
      
      // Don't call leave-room here - the game handler will handle room cleanup
      // Just clear the selected room locally
      setSelectedRoom(null);
    }
  }, [currentGameId, playerId]);

  /* ----- Lobby actions --------------------------------------------- */
  const identify = useCallback((nickname: string, isGuest: boolean) => {
    socket.emit('identify', { nickname, isGuest });
  }, []);

  const createRoom = useCallback((name: string, mode: GameMode, teamMode: TeamMode, maxPlayers: number) => {
    socket.emit('create-room', { name, mode, teamMode, maxPlayers });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socket.emit('join-room', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socket.emit('leave-room', { roomId });
  }, []);

  const startGame = useCallback((roomId: string) => {
    socket.emit('start-game', { roomId });
  }, []);

  const toggleReady = useCallback((roomId: string) => {
    socket.emit('toggle-ready', { roomId });
  }, []);

  const quickPlay = useCallback((mode: GameMode) => {
    socket.emit('quick-play', { mode });
  }, []);

  const cancelQuickPlay = useCallback(() => {
    socket.emit('cancel-quick-play');
    setIsQuickPlayWaiting(false);
  }, []);

  const refreshRooms = useCallback(() => {
    socket.emit('refresh-rooms');
  }, []);

  /* ----- Wire up socket listeners once ----------------------------- */
  useEffect(() => {
    // Connect socket on mount
    connectSocket();

    const handleConnect = () => {
      console.log('[Socket] connected');
      // Don't show message here to avoid closure issues
      // pushAssistantMsg('Connected to game server.');
      
      // Re-identify if we have a saved playerId
      if (playerIdRef.current) {
        // Re-identify with stored player info
        // The server should restore our session
      }
      // Rejoin game if we were in one
      if (joinParamsRef.current && joinParamsRef.current.gameId) {
        socket.emit('create-game', joinParamsRef.current);
      }
    };

    const handleDisconnect = () => {
      console.log('[Socket] disconnected');
      // Don't show message here to avoid closure issues
    };

    const handleReconnect = () => {
      console.log('[Socket] reconnected');
      // Don't show message here to avoid closure issues
    };

    /* ----- Connection events --------------------------------------- */
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    /* ----- Lobby events -------------------------------------------- */
    socket.on('identified', ({ playerId: id }: { playerId: string }) => {
      console.log('Identified with playerId:', id);
      setPlayerId(id);
      playerIdRef.current = id;
    });

    socket.on('room-list', (roomsList: Room[]) => {
      // This event is broadcast to all clients whenever rooms change
      // (created, joined, left, etc.) so we always get the full updated list
      setRooms(roomsList);
    });

    socket.on('room-created', (room: Room) => {
      // The creator receives this event for confirmation
      // Don't add to rooms list as room-list broadcast will handle it
      console.log('Room created:', room);
    });

    socket.on('room-updated', (room: Room) => {
      console.log('room-updated event received with data:', room);
      // Room-list broadcast will handle room updates
      // Just update selected room if it's the one that changed
      if (selectedRoom?.id === room.id) {
        setSelectedRoom(room);
      }
    });

    socket.on('room-deleted', (roomId: string) => {
      // Room-list broadcast will handle room removal
      // Just clear selected room if it was deleted
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
      }
    });

    socket.on('room-joined', (room: Room) => {
      console.log('Joined room:', room);
      setSelectedRoom(room);
      setIsQuickPlayWaiting(false);
      setCurrentGameId(room.id); // Room ID is the game ID
      pushAssistantMsg(`Joined room **${room.name}** (${room.mode}).`);
    });

    socket.on('game-joined', (data: { gameState?: unknown }) => {
      console.log('Successfully joined game');
      if (data.gameState) {
        setGameState(deserializeGameState(data.gameState as SerializedGameState));
      }
    });

    socket.on('game-state', (data: { state: unknown; config?: unknown }) => {
      console.log('Received game state');
      setGameState(deserializeGameState(data.state as SerializedGameState));
      if (data.config) {
        console.log('setting config in game-state GameContext')
        setGameConfig(data.config as GameConfig);
      }
    });

    socket.on('game-left', () => {
      console.log('Successfully left game');
      // State cleanup already done in leaveGame function
      pushAssistantMsg('You left the game.');
    });

    socket.on('room-left', () => {
      setSelectedRoom(null);
      pushAssistantMsg('You left the room.');
    });

    socket.on('player-joined', (info: { nickname: string }) => {
      pushAssistantMsg(`**${info.nickname}** joined the room.`);
    });

    socket.on('quick-play-waiting', () => {
      setIsQuickPlayWaiting(true);
    });

    socket.on('game-starting', (data: { gameId?: string; gameState?: unknown } = {}) => {
      setIsQuickPlayWaiting(false);
      // pushAssistantMsg('Game starting!');
      console.log('game-starting event received with data:', data);
      if (data.gameId) {
        setCurrentGameId(data.gameId);
      }
      if (data.gameState) {
        setGameState(deserializeGameState(data.gameState as SerializedGameState));
      }
    });

    socket.on('error', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    });

    /* ----- Game events --------------------------------------------- */
    socket.on('game-created', (data: unknown) => {
      // Handle both direct state and wrapped state
      if (typeof data === 'object' && data && 'state' in data) {
        const typedData = data as { state: unknown; gameId?: string };
        setGameState(deserializeGameState(typedData.state as SerializedGameState));
        if (typedData.gameId) {
          setCurrentGameId(typedData.gameId);
        }
      } else {
        // Legacy format - just the state
        setGameState(deserializeGameState(data as SerializedGameState));
      }
      // Don't show message - games are created from lobby
    });
    socket.on('game-update', (state: unknown) =>
      setGameState(deserializeGameState(state as SerializedGameState)),
    );
    socket.on('game-started', (data?: { gameState?: unknown }) => {
      setIsRunning(true);
      pushAssistantMsg('Game started!');
      console.log('game-started event received with data:', data);
      if (data?.gameState) {
        setGameState(deserializeGameState(data.gameState as SerializedGameState));
      }
    });
    socket.on('game-stopped', () => {
      setIsRunning(false);
      pushAssistantMsg('Game paused.');
    });
    socket.on('game-reset', (state: unknown) => {
      setGameState(deserializeGameState(state as SerializedGameState));
      setIsRunning(false);
      pushAssistantMsg('Game reset.');
    });
    socket.on('bot-status-update', setBotCodeStatus);
    socket.on('ai-generation-status', ({ playerId, isGenerating }) =>
      setAiGenerationStatus((prev) => ({
        ...prev,
        [playerId]: isGenerating,
      })),
    );
    socket.on('bot-code-update', ({ playerId: pid, code }: { playerId: string; code: string }) => {
      setBotCode(prev => ({ ...prev, [pid]: code }));
    });
    socket.on('player-info', (info: Record<string, PlayerInfo>) => {
      setPlayerInfo(info);
      playerInfoRef.current = info;
    });
    socket.on('game-config', (x: any) => {
      console.log('game-config event received with data:', x);
      setGameConfig(x)
  });
    socket.on('round-ended', (summary: { winner?: string }) => {
      pushAssistantMsg(
        summary.winner
          ? `Round ended – **${summary.winner}** wins!`
          : 'Round ended.'
      );
    });
    
    socket.on('game-ended', (data: { winner?: string; finalState?: unknown }) => {
      console.log('Game ended, winner:', data.winner);
      if (data.finalState) {
        setGameState(deserializeGameState(data.finalState as SerializedGameState));
      }
      pushAssistantMsg(
        data.winner
          ? `Game Over! **${data.winner}** wins! New round starting in 10 seconds...`
          : 'Game Over! New round starting in 10 seconds...'
      );
    });

    return () => {
      /* Provider unmount – only on full page reload                  */
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('identified');
      socket.off('room-list');
      socket.off('room-created');
      socket.off('room-updated');
      socket.off('room-deleted');
      socket.off('room-joined');
      socket.off('room-left');
      socket.off('player-joined');
      socket.off('quick-play-waiting');
      socket.off('game-starting');
      socket.off('game-joined');
      socket.off('game-state');
      socket.off('game-left');
      socket.off('error');
      socket.off('game-created');
      socket.off('game-update');
      socket.off('game-started');
      socket.off('game-stopped');
      socket.off('game-reset');
      socket.off('bot-status-update');
      socket.off('ai-generation-status');
      socket.off('bot-code-update');
      socket.off('player-info');
      socket.off('game-config');
      socket.off('round-ended');
      socket.off('game-ended');
      disconnectSocket();
    };
  }, []); // Empty deps - socket connection should only happen once

  /* ----- Bot code notification listener with current state access -- */
  useEffect(() => {
    const handleBotCodeSet = ({ playerId: pid }: { playerId: string }) => {
      // Only show notification for other players
      if (pid !== playerId) {
        const nickname = playerInfo[pid]?.nickname || 'Someone';
        const formattedNickname = nickname.toLowerCase().replace(/\s+/g, '-');
        const filename = `${formattedNickname}-bot.tsx`;
        const code = botCode[pid];
        
        if (code) {
          // Add message with file
          const id = startAssistantThinking();
          finishAssistantMsg(id, `**${nickname}** generated new bot code`, [{
            path: filename,
            content: code,
            isOpen: false
          }]);
        }
      }
    };

    // Listen for bot code set events (only fires when code is actively generated)
    socket.on('bot-code-set', handleBotCodeSet);

    return () => {
      socket.off('bot-code-set', handleBotCodeSet);
    };
  }, [playerId, playerInfo, botCode, startAssistantThinking, finishAssistantMsg]);

  /* ----- Memoised context value ------------------------------------ */
  const value: GameContextType = {
    // Game state
    gameState,
    gameConfig,
    playerInfo,
    botCodeStatus,
    botCode,
    aiGenerationStatus,
    isRunning,
    currentGameId,
    // Lobby state
    playerId,
    rooms,
    selectedRoom,
    isQuickPlayWaiting,
    errorMessage,
    // Game actions
    joinGame,
    leaveGame,
    toggleRunning,
    resetGame,
    // Lobby actions
    identify,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    toggleReady,
    quickPlay,
    cancelQuickPlay,
    refreshRooms,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Convenience hook                                                    */
/* ------------------------------------------------------------------ */
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}