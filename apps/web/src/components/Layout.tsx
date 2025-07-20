import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Titlebar from '@/components/Titlebar';
import Explorer from '@/components/Explorer';
import Bottombar from '@/components/Bottombar';
import Tabsbar from '@/components/Tabsbar';
import { ChatSidebar } from '@/sidebar';

import styles from '@/styles/Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // set scroll to top of main content on url pathname change
  const location = useLocation();
  useEffect(() => {
    const main = document.getElementById('main-editor');
    if (main) {
      main.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Titlebar />
      <div className={styles.main}>
        <Explorer />
        <div style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Tabsbar />
          <main id="main-editor" className={styles.content}>
            {children}
          </main>
        </div>
        <ChatSidebar />
      </div>
      <Bottombar />
    </div>
  );
};

export default Layout;
