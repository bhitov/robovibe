import { Link } from 'react-router-dom';
import { useState } from 'react';
import { VscChevronRight } from 'react-icons/vsc';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@clerk/clerk-react';

import styles from '@/styles/Explorer.module.css';

const Explorer = () => {
  const [portfolioOpen, setPortfolioOpen] = useState(true);
  const [roboGameOpen, setRoboGameOpen] = useState(true);
  const [botCodeOpen, setBotCodeOpen] = useState(true);
  const [playersOpen, setPlayersOpen] = useState(true);
  const { currentGameId, botCode, playerInfo, gameState } = useGame();
  const { isSignedIn } = useAuth();

  const explorerItems = [
    {
      name: 'about.html',
      path: '/about',
      icon: '/logos/html_icon.svg',
    },
    {
      name: isSignedIn ? 'logout.tsx' : 'login.tsx',
      path: isSignedIn ? '/logout' : '/login',
      icon: '/logos/react_icon.svg',
    },
  ];

  // Helper function to get team color
  const getTeamColor = (team?: number) => {
    switch (team) {
      case 0: return '#3b82f6'; // blue
      case 1: return '#ef4444'; // red
      case 2: return '#22c55e'; // green
      default: return '#6b7280'; // gray
    }
  };

  const gameItems = [
    {
      name: 'lobby.tsx',
      path: '/lobby',
      icon: '/logos/react_icon.svg',
    },
    ...(currentGameId ? [{
      name: 'game.tsx',
      path: '/game',
      icon: '/logos/react_icon.svg',
    }] : []),
    ...(currentGameId ? [{
      name: 'game-rules.tsx',
      path: '/game-rules',
      icon: '/logos/react_icon.svg',
    }] : []),
    ...(currentGameId ? [{
      name: 'debug.tsx',
      path: '/debug',
      icon: '/logos/react_icon.svg',
    }] : []),
  ];

  return (
    <div className={styles.explorer}>
      <p className={styles.title}>Explorer</p>
      <div>
        <input
          type="checkbox"
          className={styles.checkbox}
          id="portfolio-checkbox"
          checked={portfolioOpen}
          onChange={() => setPortfolioOpen(!portfolioOpen)}
        />
        <label htmlFor="portfolio-checkbox" className={styles.heading}>
          <VscChevronRight
            className={styles.chevron}
            style={portfolioOpen ? { transform: 'rotate(90deg)' } : {}}
          />
          RoboVibe
        </label>
        <div
          className={styles.files}
          style={portfolioOpen ? { display: 'block' } : { display: 'none' }}
        >
          {explorerItems.map((item) => (
            <Link to={item.path} key={item.name}>
              <div className={styles.file}>
                <img src={item.icon} alt={item.name} height={18} width={18} />{' '}
                <p>{item.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <input
          type="checkbox"
          className={styles.checkbox}
          id="robogame-checkbox"
          checked={roboGameOpen}
          onChange={() => setRoboGameOpen(!roboGameOpen)}
        />
        <label htmlFor="robogame-checkbox" className={styles.heading}>
          <VscChevronRight
            className={styles.chevron}
            style={roboGameOpen ? { transform: 'rotate(90deg)' } : {}}
          />
          Game
        </label>
        <div
          className={styles.files}
          style={roboGameOpen ? { display: 'block' } : { display: 'none' }}
        >
          {gameItems.map((item) => (
            <Link to={item.path} key={item.name}>
              <div className={styles.file}>
                <img src={item.icon} alt={item.name} height={18} width={18} />{' '}
                <p>{item.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {currentGameId && Object.keys(botCode).length > 0 && (
        <div>
          <input
            type="checkbox"
            className={styles.checkbox}
            id="botcode-checkbox"
            checked={botCodeOpen}
            onChange={() => setBotCodeOpen(!botCodeOpen)}
          />
          <label htmlFor="botcode-checkbox" className={styles.heading}>
            <VscChevronRight
              className={styles.chevron}
              style={botCodeOpen ? { transform: 'rotate(90deg)' } : {}}
            />
            Bot Code
          </label>
          <div
            className={styles.files}
            style={botCodeOpen ? { display: 'block' } : { display: 'none' }}
          >
            {Object.entries(botCode).map(([playerId, code]) => {
              const playerNickname = playerInfo[playerId]?.nickname || 'player';
              const formattedNickname = playerNickname.toLowerCase().replace(/\s+/g, '-');
              const filename = `${formattedNickname}-bot.tsx`;
              
              return (
                <Link to={`/bot-code/${playerId}`} key={playerId}>
                  <div className={styles.file}>
                    <img src="/logos/react_icon.svg" alt={filename} height={18} width={18} />
                    <p>{filename}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {currentGameId && gameState && gameState.bots && gameState.bots.size > 0 && (
        <div>
          <input
            type="checkbox"
            className={styles.checkbox}
            id="players-checkbox"
            checked={playersOpen}
            onChange={() => setPlayersOpen(!playersOpen)}
          />
          <label htmlFor="players-checkbox" className={styles.heading}>
            <VscChevronRight
              className={styles.chevron}
              style={playersOpen ? { transform: 'rotate(90deg)' } : {}}
            />
            PLAYERS
          </label>
          <div
            className={styles.files}
            style={playersOpen ? { display: 'block' } : { display: 'none' }}
          >
            {Array.from(gameState.bots.values()).map((bot) => (
              <div key={bot.id} className={styles.file} style={{ color: bot.color }}>
                <span style={{ marginLeft: '18px' }}>{bot.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Explorer;
