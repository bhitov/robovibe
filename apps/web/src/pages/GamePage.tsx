import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from '@repo/game-render';
import { Play, Pause, RotateCcw, LogOut } from 'lucide-react';
import type { GameState } from '@repo/game-engine';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '@repo/game-config';
import { type SerializedGameState, deserializeGameState } from '@repo/game-serializer';
import styles from '@/styles/GamePage.module.css';
import { useGame } from '@/contexts/GameContext';

const GamePage = () => {
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  
  // Context (state & helpers)
  const {
    gameState,
    gameConfig,
    playerInfo,
    botCodeStatus,
    aiGenerationStatus,
    isRunning,
    currentGameId,
    playerId,
    joinGame,
    leaveGame,
    toggleRunning,
    resetGame,
  } = useGame();

  // Local UI-only state


  useEffect(() => {
    document.title = 'RoboCode | Game';
    
    if (!currentGameId) {
      console.log('No game in progress - redirecting to lobby');
      navigate('/lobby');
    } else if (!playerId) {
      console.log('Player not identified - waiting for identification');
    } else if (!gameState && !hasJoined) {
      // We have a game ID but no game state - need to join the game engine
      console.log('Joining game engine for game:', currentGameId);
      setHasJoined(true);
      joinGame({ gameId: currentGameId, playerId });
    } else if (gameState) {
      // Game state loaded
    }
  }, [currentGameId, playerId, gameState, hasJoined, joinGame, navigate]);




  const handleLeaveGame = useCallback(() => {
    leaveGame();
    navigate('/lobby');
  }, [leaveGame, navigate]);

  if (!gameState || !gameConfig) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Connecting to game...</p>
        </div>
      </div>
    );
  }

  // Check if player has a bot in the game
  const currentBot = playerId && gameState.bots?.get 
    ? gameState.bots.get(playerId) 
    : playerId ? (gameState.bots as any)?.[playerId] : null;
  const isSpectator = !currentBot && (!playerId || !playerInfo[playerId]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>// ROBOVIBE GAME</h1>
          <div className={styles.gameInfo}>
            <span>Room: <strong>{gameConfig.name}</strong></span>
            <span>Mode: <strong>{gameConfig.mode}</strong></span>
            <span>Playing as: <strong>{playerId ? (playerInfo[playerId]?.nickname || `Player ${playerId}`) : 'Not identified'}</strong></span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.gameSection}>
          <div className={styles.canvasContainer}>
            <div className={styles.canvasFixed}>
              <GameCanvas
                gameState={gameState}
                width={600}
                height={400}
                winConditionType={gameConfig?.gameEngineConfig?.winCondition?.type}
              />
            </div>
          </div>

          <div className={styles.controls}>
            <button
              className={`${styles.controlButton} ${isRunning ? styles.pause : styles.play}`}
              onClick={toggleRunning}
              disabled={isSpectator}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              className={styles.controlButton}
              onClick={resetGame}
              disabled={isSpectator || isRunning}
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              className={styles.controlButton}
              onClick={handleLeaveGame}
            >
              <LogOut size={16} />
              Leave
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default GamePage;