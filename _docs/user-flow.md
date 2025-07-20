# RoboVibe User Flow

## Overview

This document outlines the user journeys through RoboVibe, covering guest users, registered users (Free/Pro tiers), and administrators. Each flow shows the path through different application segments and the connections between features.

---

## 1. Guest User Flow

### Entry & Tutorial
```
Landing Page → Guest Mode Selected → Tutorial Room (skippable) → Auto-assign to Game
```

**Details:**
- Guests receive a small token allocation upon entry
- Tutorial forces `gpt-3.5-turbo` model to minimize token cost
- No lobby access - immediately placed into available game via Quick Play logic

### Gameplay Loop
```
In-Game → Write Prompt → Select Model → Submit → Bot Executes → Match Ends
         ↓                                          ↑
         → Update Prompt (mid-match) ──────────────┘
```

**Limitations:**
- Cannot create rooms
- Limited token balance
- Prompt history only persists during current match

### Post-Game Options
```
Match Results → View Final Scores/Stats
              ↓
              → Quick Play Again (auto-assign)
              → Register Account (convert to user)
              → Exit
```

---

## 2. Registered User Flow (Free Tier)

### Initial Journey
```
Landing Page → Login/Register → Email/Google Auth → Tutorial Room (optional)
                     ↓
                     → Token Tier Selection (Free selected)
                     → Main Lobby
```

### Lobby Experience
```
Main Lobby → View Available Rooms → Join Room → Enter as Player/Spectator
           ↓                                   ↓
           → Quick Play                        → Wait for Round Start
           → Account/Token Management
```

**Features:**
- Can browse and filter room list
- Can join as spectator if room is full
- 500 monthly RoboTokens

### Room Interaction
```
Spectator Mode → Watch Game → Player Slot Opens → Join as Player
                           ↓
                           → Chat (global only)
```

---

## 3. Pro User Flow

### Additional Capabilities
```
Main Lobby → Create Room → Configure Settings → Wait for Players
                        ↓
                        → Mode: Orb Collect/Tank Combat
                        → Map Selection
                        → Team/FFA
                        → Max Players (2-16)
                        → Visibility Mode
```

**Pro Benefits:**
- 10,000 monthly RoboTokens
- Room creation privileges
- All Free tier features

---

## 4. In-Game Flow (All Users)

### Core Gameplay Loop
```
Game Start → Initial Prompt Entry → Model Selection → Code Generation
          ↓
          → Bot Spawns → Execute Actions → Monitor Performance
          ↓                              ↑
          → Identify Issues → Write New Prompt → Select Model
                                               ↓
                                               → "Compiling..." Overlay
                                               ↓
                                               → Code Swaps In
```

### UI Elements During Match
```
Game View → Expand: Generated Code Viewer
          → Expand: Prompt History (with revert)
          → Token Cost Display
          → Team Chat (team mode only)
```

### Match Completion
```
Match Ends → Results Screen → View Stats/Scores
                           ↓
                           → Global Chat Enabled
                           → Show Token Usage/Refunds
                           → Optional: Reveal All Prompts
                           ↓
                           → Return to Lobby
                           → Play Again (same room)
                           → View Match Replay
```

---

## 5. Token Management Flow

### Token Depletion
```
Low Token Warning → Out of Tokens → Redirect to Token Page
                                 ↓
                                 → View Current Tier
                                 → Upgrade to Pro Option
                                 → Purchase Additional (future)
```

### Token Tracking
```
Account Page → Token Balance Display
            → Usage History
            → Refund History (team wins)
            → Reward History (FFA wins)
```

---

## 6. Account Management Flow

```
Main Menu → Account → Profile Settings
                   ↓
                   → Token Management
                   → Match History
                   → Saved Prompts (future)
                   → Billing/Subscription
```

---

## 7. Admin User Flow

### Admin Dashboard Access
```
Admin Login → Admin Panel → Select Management Area
                         ↓
                         → Match Monitoring
                         → User Management
                         → System Configuration
                         → Analytics Dashboard
```

### System Configuration
```
System Config → Prompt Template Editor → Select Model × Game Mode
                                     ↓
                                     → Edit Template
                                     → Save to Database
                                     → Test Template
```

### Map & Bot Management
```
Content Management → Maps → Upload/Edit YAML → Preview → Deploy
                  ↓
                  → AI Bots → Create/Edit Profile → Set Win/Loss Stats
                           ↓
                           → Export for Version Control
```

### Monitoring & Moderation
```
Live Monitoring → Active Matches → View Match Details → Spectate Any Game
               ↓                                     ↓
               → Flag Suspicious Activity            → View Prompts/Code
               → User Reports                        → Kick/Ban Users
```

### Analytics Access
```
Analytics Dashboard → Performance Metrics
                   → Token Usage Stats
                   → Error/Timeout Logs
                   → User Engagement
                   → Prompt Success Rates
                   → Model Performance Comparison
```

### Replay System
```
Match History → Select Match → Load Replay → View Code Changes
                                          → Playback Controls
                                          → Export Data
```

---

## 8. Mobile User Flow

### Optimized Mobile Experience
```
Mobile Landing → Simplified UI → Tutorial (touch-optimized)
              ↓
              → Quick Play Priority
              → Prompt-First Interface
              → Model Selector (prominent)
              → Collapsible Code Viewer
```

---

## 9. Error & Edge Case Flows

### Connection Issues
```
Connection Lost → Reconnection Attempt → Resume Game State
                                     ↓
                                     → Timeout → Return to Lobby
```

### Code Execution Errors
```
Bot Error → Error Logged → Continue with Last Valid Code
                        ↓
                        → Display Error to Player
                        → Suggest Prompt Fixes
```

### Token Errors
```
Insufficient Tokens → Block Submission → Show Token Page
                                     ↓
                                     → Upgrade Option
                                     → Wait for Monthly Reset
```

---

## Flow Connection Points

### Key Integration Points:
1. **Tutorial → Game**: Seamless transition with pre-selected model
2. **Spectator → Player**: Dynamic role switching within rooms
3. **Game → Token Management**: Automatic redirects on depletion
4. **Match End → Lobby**: Multiple pathways based on user choice
5. **Admin → Live Games**: Real-time intervention capabilities

### State Persistence:
- **Session**: Prompt history, current game state
- **Account**: Token balance, match history, settings
- **System**: Room configurations, active matches, replay data

---

## Notes for Implementation

1. **Progressive Disclosure**: Complex features (code viewing, prompt history) are hidden by default
2. **Token Visibility**: Balance should be visible at all times during gameplay
3. **Mobile-First Prompting**: Ensure prompt entry is optimized for touch keyboards
4. **Quick Actions**: Common flows (Quick Play, Rematch) should be one-click
5. **Admin Tools**: Should not interfere with normal user experience when not in use