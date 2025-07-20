import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { LogOut } from 'lucide-react';
import styles from '@/styles/LoginPage.module.css';

const LogoutPage = () => {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'RoboVibe | Logout';
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCancel = () => {
    navigate('/lobby');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Logout</h1>
          <p className={styles.subtitle}>
            Are you sure you want to sign out of your account?
          </p>
        </div>

        <div className={styles.authCard}>
          <div className={styles.logoutContent}>
            <LogOut size={48} className={styles.logoutIcon} />
            <p className={styles.logoutText}>
              You will be signed out and redirected to the login page.
            </p>
            <div className={styles.logoutButtons}>
              <button
                onClick={handleCancel}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className={styles.primaryButton}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;