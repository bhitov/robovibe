import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Target, Gamepad2, Settings, Code, Sparkles } from 'lucide-react';
import { GameMode, generateGameRules, getGameModeConfig, getGameSettings, buildSystemPrompt, buildGameConfig } from '@repo/game-config';
import styles from '@/styles/GameRulesPage.module.css';
import { useGame } from '@/contexts/GameContext';

const GameRulesPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'RoboVibe | Game Rules';
  }, []);

  // Get live game config from context if we already joined a room
  const { gameConfig: liveConfig, gameState } = useGame();
  

  // Default to random mode (Tank or Orb) when no live config is present
  const gameMode = liveConfig?.mode ?? (Math.random() < 0.5 ? GameMode.TankCombat : GameMode.OrbGame);
  const modeConfig = getGameModeConfig(gameMode);
  const gameSettings = getGameSettings(gameMode);
  const rules = generateGameRules(modeConfig, gameSettings, gameMode);
  
  // The frontend should NOT be building configs - just use what the server provides
  // Check if we have a system prompt from the server, otherwise show a placeholder
  const gameEngineConfig = liveConfig?.gameEngineConfig as any;
  const systemPrompt = gameEngineConfig?.systemPrompt || 
    'System prompt not available - join a game to see the actual prompt sent to AI bots.';
  
  // Use map data from server config, or show placeholder when not in a game
  const mapAscii = liveConfig?.mapAscii || 
                   gameEngineConfig?.mapAscii || 
                   (gameState as any)?.mapAscii || 
                   [];
  const mapName = liveConfig?.mapName || 
                  gameEngineConfig?.mapName || 
                  'No active game';

  const handleGoToGame = () => {
    navigate('/game');
  };

  // Parse actions to display them with proper formatting
  const formatAction = (action: string) => {
    // Convert **action**: description to proper format
    const match = action.match(/\*\*([^*]+)\*\*:\s*(.+)/);
    if (match) {
      return {
        name: match[1],
        description: match[2]
      };
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <Info className={styles.titleIcon} />
            <h1 className={styles.title}>{rules.title}</h1>
          </div>
          <button
            onClick={handleGoToGame}
            className={styles.newToRoboVibeButton}
          >
            <Sparkles className={styles.sparklesIcon} />
            Go to Game
          </button>
        </div>

        {/* Core Concept */}
        <div className={styles.howItWorksBox}>
          <h3 className={styles.howItWorksTitle}>How It Works</h3>
          <p className={styles.howItWorksText}>
            You are writing prompts for an AI that will program the bot for you. 
            Describe what you want your bot to do, and the AI will generate code to control it.
          </p>
        </div>

        {/* Game Description */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Target className={`${styles.sectionIcon} ${styles.targetIcon}`} />
            Game Objective
          </h3>
          <p className={styles.sectionText}>{rules.description}</p>
          <p className={styles.objectiveText}>{rules.objective}</p>
        </div>

        {/* Available Actions */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Gamepad2 className={`${styles.sectionIcon} ${styles.gamepadIcon}`} />
            Available Actions
          </h3>
          <div className={styles.actionsList}>
            {rules.actions.map((action, index) => {
              const formatted = formatAction(action);
              return formatted ? (
                <div key={index} className={styles.actionItem}>
                  <code>**{formatted.name}**</code>: {formatted.description}
                </div>
              ) : (
                <div key={index} className={styles.actionItem}>
                  {action}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Settings className={`${styles.sectionIcon} ${styles.settingsIcon}`} />
            Game Settings
          </h3>
          <div className={styles.settingsGrid}>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Arena Size:</span>
              <span className={styles.settingValue}>{rules.settings.arena}</span>
            </div>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Win Condition:</span>
              <span className={styles.settingValue}>{rules.settings.winCondition}</span>
            </div>
            {rules.settings.specialRules.length > 0 && (
              <div className={styles.specialRules}>
                {rules.settings.specialRules.map((rule, index) => (
                  <div key={index} className={styles.specialRule}>
                    • {rule}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Information */}
        {mapAscii.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Target className={`${styles.sectionIcon} ${styles.targetIcon}`} />
              Map: {mapName}
            </h3>
            <div className={styles.mapBox}>
              <pre className={styles.mapAscii}>
                {mapAscii.join('\n')}
              </pre>
            </div>
          </div>
        )}

        {/* System Prompt */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Code className={`${styles.sectionIcon} ${styles.codeIcon}`} />
            System Prompt (for AI)
          </h3>
          <div className={styles.systemPromptBox}>
            <pre className={styles.systemPrompt}>
              {systemPrompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRulesPage;