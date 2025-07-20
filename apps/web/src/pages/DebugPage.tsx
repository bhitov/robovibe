import { useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import styles from '@/styles/DebugPage.module.css';

const DebugPage = () => {
  const { gameState, gameConfig, currentGameId, playerId } = useGame();

  useEffect(() => {
    document.title = 'RoboVibe | Debug';
  }, []);

  const formatJson = (obj: any) => {
    if (!obj) return 'null';
    return JSON.stringify(obj, null, 2);
  };

  const formatGameState = (state: any) => {
    if (!state) return 'null';
    
    // Convert Maps to objects for JSON display
    const serialized = { ...state };
    
    if (state.bots instanceof Map) {
      serialized.bots = Object.fromEntries(state.bots);
    }
    if (state.orbs instanceof Map) {
      serialized.orbs = Object.fromEntries(state.orbs);
    }
    if (state.bases instanceof Map) {
      serialized.bases = Object.fromEntries(state.bases);
    }
    if (state.projectiles instanceof Map) {
      serialized.projectiles = Object.fromEntries(state.projectiles);
    }
    if (state.powerUps instanceof Map) {
      serialized.powerUps = Object.fromEntries(state.powerUps);
    }
    if (state.botProgress instanceof Map) {
      serialized.botProgress = Object.fromEntries(state.botProgress);
    }
    
    return JSON.stringify(serialized, null, 2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Debug Information</h1>
        <div className={styles.status}>
          <span>Game ID: <strong>{currentGameId || 'None'}</strong></span>
          <span>Player ID: <strong>{playerId || 'None'}</strong></span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Game Config</h2>
          <div className={styles.codeBlock}>
            <pre>{formatJson(gameConfig)}</pre>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Game State</h2>
          <div className={styles.codeBlock}>
            <pre>{formatGameState(gameState)}</pre>
          </div>
        </div>

        {gameConfig?.gameEngineConfig && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Game Engine Config</h2>
            <div className={styles.codeBlock}>
              <pre>{formatJson(gameConfig.gameEngineConfig)}</pre>
            </div>
          </div>
        )}

        {gameConfig?.mapAscii && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Map ASCII (from gameConfig)</h2>
            <div className={styles.mapDisplay}>
              <pre>{gameConfig.mapAscii.join('\n')}</pre>
            </div>
          </div>
        )}

        {(gameConfig as any)?.gameEngineConfig?.mapAscii && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Map ASCII (from gameEngineConfig)</h2>
            <div className={styles.mapDisplay}>
              <pre>{(gameConfig as any).gameEngineConfig.mapAscii.join('\n')}</pre>
            </div>
          </div>
        )}

        {(gameState as any)?.mapAscii && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Map ASCII (from gameState)</h2>
            <div className={styles.mapDisplay}>
              <pre>{(gameState as any).mapAscii.join('\n')}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPage;