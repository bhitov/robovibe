import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { UserCheck, UserPlus, Users } from 'lucide-react';
import styles from '@/styles/LoginPage.module.css';

const LoginPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { isSignedIn } = useAuth();
  const { setIsGuestMode } = useGuestMode();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'RoboVibe | Login';
  }, []);

  // If already signed in, redirect to lobby
  useEffect(() => {
    if (isSignedIn) {
      navigate('/lobby');
    }
  }, [isSignedIn, navigate]);

  const handleGuestMode = () => {
    setIsGuestMode(true);
    navigate('/lobby');
  };

  if (isSignedIn) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to RoboVibe</h1>
          <p className={styles.subtitle}>
            Sign in to your account or continue as a guest
          </p>
        </div>

        <div className={styles.authCard}>
          <div className={styles.tabContainer}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${mode === 'signin' ? styles.activeTab : ''}`}
                onClick={() => setMode('signin')}
              >
                <UserCheck size={16} />
                Sign In
              </button>
              <button
                className={`${styles.tab} ${mode === 'signup' ? styles.activeTab : ''}`}
                onClick={() => setMode('signup')}
              >
                <UserPlus size={16} />
                Sign Up
              </button>
            </div>
          </div>

          <div className={styles.tabContent}>
            {mode === 'signin' ? (
              <div className={styles.clerkContainer}>
                <SignIn 
                  redirectUrl="/lobby"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none p-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: styles.socialButton,
                      formButtonPrimary: styles.primaryButton,
                      formFieldInput: styles.input,
                      formFieldLabel: styles.label,
                      identityPreviewText: styles.identityText,
                      identityPreviewEditButton: styles.editButton,
                      footer: "hidden"
                    }
                  }}
                />
              </div>
            ) : (
              <div className={styles.clerkContainer}>
                <SignUp 
                  redirectUrl="/lobby"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none p-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: styles.socialButton,
                      formButtonPrimary: styles.primaryButton,
                      formFieldInput: styles.input,
                      formFieldLabel: styles.label,
                      footer: "hidden"
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <button 
            className={styles.guestButton}
            onClick={handleGuestMode}
          >
            <Users size={16} />
            Continue as Guest
          </button>
        </div>

        <p className={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginPage;