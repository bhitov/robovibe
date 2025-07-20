import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import styles from '@/styles/BotCodePage.module.css';

const BotCodePage = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { botCode, playerInfo, currentGameId } = useGame();

  useEffect(() => {
    document.title = 'RoboVibe | Bot Code';
  }, []);

  // Redirect if not in a game
  if (!currentGameId) {
    navigate('/lobby');
    return null;
  }

  // Get the bot code for this player
  const code = playerId ? botCode[playerId] : null;
  const playerNickname = playerId && playerInfo[playerId]?.nickname || 'Unknown Player';
  const formattedNickname = playerNickname.toLowerCase().replace(/\s+/g, '-');
  const filename = `${formattedNickname}-bot.tsx`;

  if (!code) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Bot Code Not Found</h1>
          <p className={styles.subtitle}>No bot code has been generated for {playerNickname} yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{filename}</h1>
        <p className={styles.subtitle}>Bot code for {playerNickname}</p>
      </div>
      
      <div className={styles.codeContainer}>
        <pre className={styles.codeBlock}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default BotCodePage;