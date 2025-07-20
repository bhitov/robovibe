import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Brain, 
  Code, 
  Target, 
  Gamepad2, 
  Zap,
  ArrowRight,
  Info
} from 'lucide-react';
import styles from '@/styles/AboutPage.module.css';

const AboutPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'RoboVibe | About';
  }, []);

  const handleGetStarted = () => {
    navigate('/game-rules');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroHeader}>
            <h1 className={styles.heroTitle}>Welcome to RoboVibe!</h1>
          </div>
          <p className={styles.heroDescription}>
            The AI-First Gaming Platform
          </p>
        </div>

        {/* What is RoboVibe */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Brain className={`${styles.sectionIcon} ${styles.brainIcon}`} />
            What is RoboVibe?
          </h3>
          <p className={styles.sectionText}>
          Inspired by classic programming games like Robocode, RoboVibe lets you command AI bots in real-time multiplayer arenas—using natural-language prompts.
          LLMs transform your ideas into control functions that are loaded in real time to control bots in an arena.
          </p>
        </div>

        {/* How It Works */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Zap className={`${styles.sectionIcon} ${styles.zapIcon}`} />
            How It Works
          </h3>
          <div className={styles.howItWorksGrid}>
            <div className={styles.stepCard}>
              <Code className={`${styles.stepIcon} ${styles.codeIcon}`} />
              <h4 className={styles.stepTitle}>1. Talk or Type Prompt</h4>
              <p className={styles.stepDescription}>
                Describe your bot's strategy in plain English
              </p>
            </div>
            <div className={styles.stepCard}>
              <Brain className={`${styles.stepIcon} ${styles.brainIconLarge}`} />
              <h4 className={styles.stepTitle}>2. AI Generates</h4>
              <p className={styles.stepDescription}>
                Our AI converts your prompt into working bot code
              </p>
            </div>
            <div className={styles.stepCard}>
              <Gamepad2 className={`${styles.stepIcon} ${styles.gamepadIcon}`} />
              <h4 className={styles.stepTitle}>3. Watch & Learn</h4>
              <p className={styles.stepDescription}>
                See your bot compete and refine your strategy
              </p>
            </div>
          </div>
        </div>

        {/* Game Modes */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Target className={`${styles.sectionIcon} ${styles.targetIcon}`} />
            Game Modes
          </h3>
          <div className={styles.gameModesList}>
            <div className={styles.gameModeCard}>
              <div className={styles.gameModeContent}>
                <div className={`${styles.gameModeDot} ${styles.dotYellow}`}></div>
                <div className={styles.gameModeInfo}>
                  <h4 className={styles.gameModeTitle}>Orb Collection</h4>
                  <p className={styles.gameModeDescription}>Collect orbs and deposit them at your base</p>
                </div>
              </div>
            </div>
            <div className={styles.gameModeCard}>
              <div className={styles.gameModeContent}>
                <div className={`${styles.gameModeDot} ${styles.dotRed}`}></div>
                <div className={styles.gameModeInfo}>
                  <h4 className={styles.gameModeTitle}>Tank Combat</h4>
                  <p className={styles.gameModeDescription}>Battle other tanks with strategy and firepower</p>
                </div>
              </div>
            </div>
            <div className={styles.gameModeCard}>
              <div className={styles.gameModeContent}>
                <div className={`${styles.gameModeDot} ${styles.dotGreen}`}></div>
                <div className={styles.gameModeInfo}>
                  <h4 className={styles.gameModeTitle}>Racing</h4>
                  <p className={styles.gameModeDescription}>Navigate checkpoints and race to victory</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Tips */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Sparkles className={`${styles.sectionIcon} ${styles.sparklesIcon}`} />
            Getting Started Tips
          </h3>
          <div className={styles.tipsBox}>
            <ul className={styles.tipsList}>
              <li>• Start simple - describe basic actions like "move towards the nearest orb"</li>
              <li>• Be specific - the AI works better with clear, detailed instructions</li>
              <li>• Experiment - try different strategies and see what works</li>
              <li>• Learn from others - watch how other bots behave for inspiration</li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className={styles.ctaSection}>
          <h3 className={styles.ctaTitle}>Ready to Start?</h3>
          <div className={styles.ctaButtons}>
            <button
              onClick={() => navigate('/lobby')}
              className={styles.secondaryButton}
            >
              Go to Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;