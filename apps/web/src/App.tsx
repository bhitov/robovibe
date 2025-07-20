import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { GuestModeProvider } from './contexts/GuestModeContext'
import { GameProvider } from './contexts/GameContext'
import { ChatProvider } from './contexts/ChatContext'
import { trpc } from './utils/trpc'
import { clientConfig } from '@repo/config/client'
import Layout from './components/Layout'
import AboutPage from './pages/AboutPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import LoginPage from './pages/LoginPage'
import GameRulesPage from './pages/GameRulesPage'
import DebugPage from './pages/DebugPage'
import BotCodePage from './pages/BotCodePage'
import LogoutPage from './pages/LogoutPage'

const queryClient = new QueryClient()

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${clientConfig.serverUrl}/api/trpc`,
    }),
  ],
})

const clerkPubKey = clientConfig.clerk?.publishableKey || '';

function App() {
  return (
    <ChatProvider>
      <GameProvider>
        <ClerkProvider publishableKey={clerkPubKey}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <GuestModeProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/about" replace />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/lobby" element={<LobbyPage />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/logout" element={<LogoutPage />} />
                    <Route path="/game-rules" element={<GameRulesPage />} />
                    <Route path="/debug" element={<DebugPage />} />
                    <Route path="/bot-code/:playerId" element={<BotCodePage />} />
                  </Routes>
                </Layout>
              </GuestModeProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </ClerkProvider>
      </GameProvider>
    </ChatProvider>
  )
}

export default App