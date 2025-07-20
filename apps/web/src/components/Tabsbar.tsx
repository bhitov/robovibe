import { useLocation } from 'react-router-dom';
import Tab from '@/components/Tab';
import { useGame } from '@/contexts/GameContext';

import styles from '@/styles/Tabsbar.module.css';

const Tabsbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { currentGameId } = useGame();
  
  // Always show portfolio tabs
  const portfolioTabs = [
    { icon: "/logos/html_icon.svg", filename: "about.html", path: "/about" },
    { icon: "/logos/react_icon.svg", filename: "login.tsx", path: "/login" },
    { icon: "/logos/react_icon.svg", filename: "lobby.tsx", path: "/lobby" },
  ];
  
  // Additional game tabs
  const gameTabs = [
    ...(currentGameId ? [{ icon: "/logos/react_icon.svg", filename: "game.tsx", path: "/game" }] : []),
  ];
  
  // Show game rules tab only when in game
  const gameRulesTab = { icon: "/logos/react_icon.svg", filename: "game-rules.tsx", path: "/game-rules" };
  
  const isInGame = currentPath.startsWith('/game') && currentGameId;
  
  let tabs = [...portfolioTabs, ...gameTabs];
  if (isInGame) {
    tabs = [...tabs, gameRulesTab];
  }
  
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <Tab 
          key={tab.path}
          icon={tab.icon} 
          filename={tab.filename} 
          path={tab.path} 
        />
      ))}
    </div>
  );
};

export default Tabsbar;
