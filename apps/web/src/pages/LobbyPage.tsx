import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Gamepad2, Zap, Crown, Plus, X, Play } from 'lucide-react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { GameMode } from '@repo/game-config';
import styles from '@/styles/LobbyPage.module.css';
import { useChat } from '@/contexts/ChatContext';
import { useGame } from '@/contexts/GameContext';
import { TeamMode } from '@/types/game';


const LobbyPage = () => {
  const navigate = useNavigate();
  const { guestNickname, setGuestNickname, setIsGuestMode } = useGuestMode();
  const { addUserMsg, startAssistantThinking, finishAssistantMsg } = useChat();
  const { 
    rooms, 
    selectedRoom, 
    playerId,
    isQuickPlayWaiting,
    errorMessage,
    gameState,
    currentGameId,
    identify,
    createRoom,
    joinRoom,
    joinGame,
    leaveRoom,
    startGame: startGameFromRoom,
    toggleReady,
    quickPlay,
    cancelQuickPlay,
    refreshRooms
  } = useGame();
  
  const [nickname, setNickname] = useState(guestNickname);
  const [isNicknameSet, setIsNicknameSet] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMode, setNewRoomMode] = useState<GameMode>(
    Math.random() < 0.5 ? GameMode.TankCombat : GameMode.OrbGame
  );
  const [newRoomTeamMode, setNewRoomTeamMode] = useState<TeamMode>(TeamMode.FFA);
  const newRoomMaxPlayers = 4;
  const nicknameInputRef = useRef<HTMLInputElement>(null);

  // Update nickname and isNicknameSet when guestNickname loads from localStorage
  useEffect(() => {
    if (guestNickname) {
      setNickname(guestNickname);
      setIsNicknameSet(true);
    }
  }, [guestNickname]);

  // Navigate to rules page when joining a room
  useEffect(() => {
    if (selectedRoom && currentGameId) {
      console.log('Joined room, navigating to rules page');
      // setHasJoined(true);
      if (playerId) {
        joinGame({ gameId: currentGameId, playerId });
      } else {
        console.log('no playerId')
      }
      navigate('/game-rules');
    }
  }, [selectedRoom, currentGameId, navigate]);

  useEffect(() => {
    document.title = 'RoboCode | Lobby';
    
    if (!nickname) {
      nicknameInputRef.current?.focus();
    }

    // Always re-identify when entering lobby to ensure server has correct socket mapping
    if (guestNickname) {
      console.log('Re-identifying in lobby with nickname:', guestNickname);
      identify(guestNickname, true);
    }

    // Request initial room list
    refreshRooms();
  }, [guestNickname, identify, refreshRooms]);

  // Only re-identify when explicitly needed, not on every nickname change

  const handleSetNickname = useCallback(() => {
    if (nickname.trim()) {
      setIsGuestMode(true);
      setGuestNickname(nickname.trim());
      setIsNicknameSet(true);
      identify(nickname.trim(), true);
    }
  }, [nickname, setGuestNickname, setIsGuestMode, identify]);

  const handleCreateRoom = useCallback(() => {
    if (newRoomName.trim() && nickname.trim()) {
      createRoom(newRoomName.trim(), newRoomMode, newRoomTeamMode, newRoomMaxPlayers);
      setIsCreatingRoom(false);
      setNewRoomName('');
    }
  }, [newRoomName, newRoomMode, newRoomTeamMode, newRoomMaxPlayers, nickname, createRoom]);

  const handleJoinRoom = useCallback((roomId: string) => {
    if (nickname.trim()) {
      joinRoom(roomId);
    }
  }, [nickname, joinRoom]);

  const handleLeaveRoom = useCallback(() => {
    if (selectedRoom) {
      leaveRoom(selectedRoom.id);
    }
  }, [selectedRoom, leaveRoom]);

  const handleStartGame = useCallback(() => {
    if (selectedRoom) {
      startGameFromRoom(selectedRoom.id);
    }
  }, [selectedRoom, startGameFromRoom]);

  const handleToggleReady = useCallback(() => {
    if (selectedRoom) {
      toggleReady(selectedRoom.id);
    }
  }, [selectedRoom, toggleReady]);

  const handleQuickPlayOrb = useCallback(() => {
    if (nickname.trim() && !isQuickPlayWaiting) {
      // If not identified yet, identify first
      if (!playerId) {
        console.log('Not identified yet, identifying first');
        identify(nickname.trim(), true);
        // Wait a moment then try quick play
        setTimeout(() => {
          console.log('Quick play Orb clicked');
          quickPlay(GameMode.OrbGame);
        }, 100);
      } else {
        console.log('Quick play Orb clicked');
        quickPlay(GameMode.OrbGame);
      }
    }
  }, [nickname, isQuickPlayWaiting, playerId, identify, quickPlay]);

  const handleQuickPlayTank = useCallback(() => {
    if (nickname.trim() && !isQuickPlayWaiting) {
      // If not identified yet, identify first
      if (!playerId) {
        console.log('Not identified yet, identifying first');
        identify(nickname.trim(), true);
        // Wait a moment then try quick play
        setTimeout(() => {
          console.log('Quick play Tank clicked');
          quickPlay(GameMode.TankCombat);
        }, 100);
      } else {
        console.log('Quick play Tank clicked');
        quickPlay(GameMode.TankCombat);
      }
    }
  }, [nickname, isQuickPlayWaiting, playerId, identify, quickPlay]);

  const handleQuickPlayRace = useCallback(() => {
    if (nickname.trim() && !isQuickPlayWaiting) {
      // If not identified yet, identify first
      if (!playerId) {
        console.log('Not identified yet, identifying first');
        identify(nickname.trim(), true);
        // Wait a moment then try quick play
        setTimeout(() => {
          console.log('Quick play Race clicked');
          quickPlay(GameMode.RaceGame);
        }, 100);
      } else {
        console.log('Quick play Race clicked');
        quickPlay(GameMode.RaceGame);
      }
    }
  }, [nickname, isQuickPlayWaiting, playerId, identify, quickPlay]);

  const handleCancelQuickPlay = useCallback(() => {
    cancelQuickPlay();
  }, [cancelQuickPlay]);

  const getGameModeIcon = (mode: GameMode) => {
    switch (mode) {
      case GameMode.OrbGame:
      case GameMode.OrbGamePlus:
        return <Gamepad2 className={styles.icon} />;
      case GameMode.TankCombat:
        return <Zap className={styles.icon} />;
      default:
        return <Gamepad2 className={styles.icon} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>// ROBOVIBE GAME LOBBY</h1>
        <p className={styles.subtitle}>Select or create a game room to start playing</p>
      </div>

      {errorMessage && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠</span>
          {errorMessage}
        </div>
      )}

      {!isNicknameSet ? (
        <div className={styles.nicknameSection}>
          <div className={styles.nicknamePrompt}>
            <label>Enter your nickname:</label>
            <div className={styles.nicknameInput}>
              <input
                ref={nicknameInputRef}
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetNickname()}
                placeholder="Player123"
                maxLength={20}
              />
              <button onClick={handleSetNickname} disabled={!nickname.trim()}>
                <Play size={16} />
                Join Lobby
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.lobbyInfo}>
            <span>Playing as: <strong>{nickname || guestNickname}</strong></span>
            <button 
              className={styles.changeNicknameButton}
              onClick={() => {
                setNickname('');
                setGuestNickname('');
                setIsNicknameSet(false);
                localStorage.removeItem('guestNickname');
              }}
            >
              Change Nickname
            </button>
          </div>

          <div className={styles.mainContent}>
            <div className={styles.roomsList}>
              <div className={styles.roomsHeader}>
                <div className={styles.headerButtons}>
                  <button 
                    className={`${styles.quickPlayButton} ${isQuickPlayWaiting ? styles.waiting : ''}`}
                    onClick={isQuickPlayWaiting ? handleCancelQuickPlay : handleQuickPlayOrb}
                    disabled={!!selectedRoom}
                  >
                    <Zap size={16} />
                    {isQuickPlayWaiting ? 'Finding Game...' : 'Quick Play Orb'}
                  </button>
                  <button 
                    className={`${styles.quickPlayButton} ${isQuickPlayWaiting ? styles.waiting : ''}`}
                    onClick={isQuickPlayWaiting ? handleCancelQuickPlay : handleQuickPlayTank}
                    disabled={!!selectedRoom}
                  >
                    <Zap size={16} />
                    {isQuickPlayWaiting ? 'Finding Game...' : 'Quick Play Tank'}
                  </button>
                </div>
              </div>

              <div className={styles.rooms}>
                {rooms.length === 0 ? (
                  <div className={styles.noRooms}>
                    <p>No rooms available</p>
                    <p className={styles.hint}>Create a new room or try Quick Play!</p>
                  </div>
                ) : (
                  rooms.map(room => (
                    <div 
                      key={room.id} 
                      className={`${styles.roomCard} ${selectedRoom?.id === room.id ? styles.selected : ''}`}
                      onClick={() => !selectedRoom && handleJoinRoom(room.id)}
                    >
                      <div className={styles.roomHeader}>
                        {getGameModeIcon(room.mode)}
                        <h3>{room.name}</h3>
                        <span className={styles.roomStatus}>{room.status}</span>
                      </div>
                      <div className={styles.roomDetails}>
                        <span>Mode: {room.mode}</span>
                        <span>Team: {room.teamMode}</span>
                        <span className={styles.playerCount}>
                          <Users size={14} />
                          {room.playerCount}/{room.maxPlayers}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </>
      )}
    </div>
  );
};

export default LobbyPage;