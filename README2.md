Project Overview – “RoboVibe”  

RoboVibe is a monorepo (pnpm + Turborepo) that delivers a browser-based, real-time multiplayer “AI bot” gaming platform.  
Players write natural-language prompts; the backend calls OpenAI, turns the prompt into JavaScript, compiles it in an isolated-vm sandbox, and swaps it into their in-game bot without pausing the match.

High-level flow  
1. Front-end (apps/web) renders lobby, room UI and the live canvas.  
2. Front-end talks to back-end via:  
   • HTTP + tRPC for REST-like calls (generate code, user profile)  
   • WebSocket (Socket.IO) for real-time game state streams, lobby events, voice-prompt audio, etc.  
3. Back-end (apps/api) orchestrates:  
   • Clerk authentication middleware  
   • tRPC routes (game.generateBotCode, user.*)  
   • WebSocket server that delegates to the Game-Server package.  
4. Game-Server package spins up a Game-Engine instance per room, runs a 30 Hz authoritative loop, serializes the state each tick, and broadcasts it.  
5. Game-Engine holds pure deterministic simulation for every mode (Orb Collect, Tank Combat, Flappy, Race, etc.).  
6. Game-Config is the “source-of-truth” encyclopaedia: rules, default settings, ASCII maps, prompt templates, demo prompts, etc.  
7. Game-Render turns an incoming GameState into Pixi/Canvas drawings; used both in the React front-end and for future replay export.  
8. OpenAI wrapper (packages/openai) hides API key, does prompt + code extraction, returns “loop” code.  
9. Sandbox (packages/sandbox) uses isolated-vm to run that generated code in 25 ms budget per tick.  
10. DB package (Drizzle + Postgres) stores users, token ledgers, map definitions, prompt templates, match replays, etc.  
11. Config, eslint-config, typescript-config packages keep every workspace consistent.

────────────────────────────────────────────
Detailed package / app descriptions

apps/api  
• Express server with Helmet/CORS/compression  
• tRPC router (game, user)  
• Middleware: Clerk auth + Zod validation + errorHandler  
• Webhook endpoint for Clerk user-sync  
• Socket.IO server creation; delegates per-namespace handlers to Game-Server & Audio-Transcription handler  
• Exports typing (AppRouter) for web client

apps/web  
• Vite + React 18 + Tailwind v4 + shadcn/ui  
• Clerk React components for auth  
• React-Router routes: LobbyPage, GamePage, AuthPage, HomePage  
• Contexts: GuestModeContext (anonymous play)  
• Components: GameCanvas (from package), VoiceRecorder (streams WebM), modals (Welcome / Rules), streaming time demo widget, full shadcn UI primitives  
• Utilities: socket.ts wraps clientConfig.serverUrl; trpc.ts bootstraps tRPC react-query

packages/game-engine  
• Pure TS deterministic simulation.  
• Game.ts – huge unified engine supporting all 5 modes  
• physics.ts – vector math, collision, friction helpers  
• types.ts – canonical shared state shapes  
• Vitest suite (~180 assertions) covering movement, collisions, win conditions

packages/game-config  
• types.ts – enums, settings, model list  
• modes/* – per-mode rule description & default settings  
• configBuilder.ts – merges defaults + map + overrides into a ready GameConfig  
• promptBuilder.ts – builds lengthy “system prompt” for OpenAI according to allowed actions  
• mapParser.ts – converts ASCII maps to walls / blocks / checkpoints  
• constants.ts – TILE_SIZE etc.  
• MAP_INFO.md doc

packages/game-server  
• Pure Socket.IO coordination layer  
• gameHandler.ts – keeps maps of rooms, players, Interval loops; wraps Game-Engine; handles “create-game / start / stop / reset / set-bot-code” events; keeps bot-code status and AI-generation status maps  
• lobbyHandler.ts – handles lobby-only events (identify, create-room, quick-play, etc.) and pushes room list  
• sampleBotCode.ts – fallback demo bot  
• tests with real Socket.IO server

packages/game-render  
• React-free utility that draws GameState onto a Canvas2D context (renderer.ts). Also exposes GameCanvas React wrapper for convenience.  
• Tile rendering system: assets/blue/* chosen by neighbour signature lookup.  

packages/game-serializer  
• Tiny utility that converts GameState (full of Maps) to POJO + arrays for network transport and back.

packages/openai  
• client.ts – lazy singleton OpenAI client; generateBotCode() builds chat request, pulls out `function loop` by regex, returns tokens used.  
• types.ts – strict types for request/response; Model alias to Game-Config list.

packages/sandbox  
• index.ts – generic sandboxedEval and createSandboxedFunction helpers (isolated-vm)  
• improved.ts – richer sandbox creator with callback injection, used by Game-Engine (per-bot loops)  
• Extensive vitest suite

packages/db  
• Drizzle schema for users (synced via Clerk webhook) + re-exports drizzle helpers  
• drizzle-kit config for migrations  
• Postgres pool

packages/config  
• shared.ts holds all env-like constants in code (client and server URLs, Clerk publishable key, etc.)  
• secret.(example).ts is git-ignored copy for sensitive things (OPENAI key, Clerk secret)  
• client.ts / server.ts map shared + secret → typed objects that other packages import

packages/eslint-config, packages/typescript-config  
• Provide flat ESLint presets and tsconfig bases for Node, React, Next, etc.

packages/sandbox, game-engine, game-server, game-render all consume those dev-configs.

_docs/  
• Markdown specs: project-overview.md (full game design) + user-flow.md (UX flowcharts)

────────────────────────────────────────────
Major cross-cutting features

• Real-time authoritative server loop @ 30 Hz with JSON-delta broadcast  
• Voice-to-prompt via Whisper streaming (audioTranscriptionHandler)  
• Guest mode (no auth) with token limits  
• Prompt history, model picker (3.5, 4-mini, 4o) with cost multipliers  
• Team / FFA rooms, quick-play matchmaking, spectators  
• AI sandbox runs each bot loop in <25 ms or skips action  
• ASCII map parser lets designers version maps in Git  
• Renderer draws both glossy neon assets and optional ASCII overlay for debugging  
• Comprehensive vitest coverage (engine, sandbox, server, lobby)  

────────────────────────────────────────────
Summary

RoboVibe is an end-to-end stack that blends:

• React + Tailwind front-end UI  
• Express + tRPC + Socket.IO API layer  
• Deterministic TypeScript game engine  
• OpenAI code-generation pipeline  
• Isolated-vm sandbox for user code  
• Postgres-via-Drizzle ORM for persistence  

All wired together inside a pnpm/Turborepo monorepo with shared linting, TS configs, and CI-ready tests.
