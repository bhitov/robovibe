# RoboVibe

A browser-based, real-time multiplayer game hub where players program their in-game units ("bots") using natural language prompts that get compiled into JavaScript by AI models.

## What it does

RoboVibe transforms plain-language descriptions into executable bot behavior in real-time multiplayer games. Players write prompts like "collect orbs aggressively" or "defend the base," and OpenAI models generate JavaScript code that controls their bots. Code can be updated mid-match, creating dynamic gameplay where strategy evolves in real-time.

### Game Modes

- **Orb Collect**: Race to collect glowing orbs and deliver them to your base (first to 5 wins)
- **Tank Combat**: Top-down tank battles with driving, aiming, and shooting mechanics

### Key Features

- **2-16 player support** with team or free-for-all matches
- **Real-time AI coding** with model choice (GPT-3.5 Turbo, GPT-4o Mini, GPT-4.1 Nano)
- **Token-based economy** with monthly allocations and match rewards
- **Multiple visibility modes** including fog of war for strategic gameplay
- **Guest mode** for instant play without registration

## What it will do

### Core Gameplay Systems
- Server-authoritative game loop with WebSocket communication
- 25ms CPU limit per bot execution with isolated-vm sandboxing
- YAML-defined maps and AI bot profiles for easy content creation
- Prompt template system for consistent AI model behavior

### User Experience
- Mobile-optimized prompt entry and code viewing
- Live spectator mode with dynamic player slot switching
- Comprehensive match replay system with code change tracking
- Team chat during matches, global chat post-game

### Technical Infrastructure
- PostgreSQL backend with Drizzle ORM
- React frontend with Tailwind CSS 4
- Express.js API with Auth0/Clerk authentication
- Admin dashboard for content management and monitoring

### Advanced Features
- Performance analytics tracking prompt success rates
- Automated abuse detection for malicious code
- Comprehensive token management with team win refunds
- Map editor and bot profile creation tools

## Development

Built with TypeScript monorepo architecture using Turborepo and pnpm workspaces. Features comprehensive testing, ESLint configuration, and modern development workflows.

```bash
# Start development
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Architecture

The project uses a modern TypeScript monorepo with:
- **Backend**: Express.js with Drizzle ORM and PostgreSQL
- **Frontend**: React with Tailwind CSS 4 and shadcn/ui components
- **Game Engine**: Server-authoritative with WebSocket real-time communication
- **AI Integration**: OpenAI API with custom prompt templates and sandboxed execution

RoboVibe combines the accessibility of natural language programming with the excitement of competitive multiplayer gaming, creating a unique platform where coding creativity meets real-time strategy.
