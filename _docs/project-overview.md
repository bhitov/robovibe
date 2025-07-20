# Project Name

RoboVibe

## Project Description

RoboVibe is a browser‑based, real‑time multiplayer game hub. Every in‑game unit (“bot”) runs JavaScript generated on‑demand by an OpenAI model from the player’s plain‑language prompt (“vibe coding”). Players can update prompts mid‑match; old code keeps running until the new code compiles and swaps in.

Version 1 ships two modes:

| Mode | One‑sentence pitch | Victory |
| ---- | ------------------ | ------- |

| **Orb Collect** | Dash around, grab glowing orbs, deliver them to your base. | First player/team to 5 deposits. |
| **Tank Combat** | Top‑down tanks drive, rotate, and fire shells.             | Last tank or last team alive.    |

Rooms support **2–16 players** and can run as **Free‑For‑All** or **Team** matches (teams split evenly, 1-8 per team).

---

## Target Audience

- AI‑curious gamers and coders
- Coding clubs / educators demonstrating LLMs
- Casual players intrigued by “programming by prose”

---

## Detailed Feature List

### 1 · Gameplay Logic

#### 1.1  Shared rules (all modes)

- **Bot loop contract**

  ```js
  function loop(input, store) {
    // return ONE action object + updated store
    return { action: /* … */, store };
  }
  ```

- Loop called every tick (30 ticks/second); hard 25 ms CPU limit—action skipped + error logged on violation.

- **LLM prompting strategy**

  - Each OpenAI call is wrapped in a **System Prompt Template** (editable in admin UI, stored per model × game‑mode) that:
    - Declares the loop signature & allowed commands.
    - Explains what each command does, **but hides win conditions / scoring**.
    - Demands raw JavaScript output only.
  - Templates live in the DB and can be edited without redeploying.

- **Model choice per submission** – player picks one each time:

  - `gpt-3.5-turbo` – "Fast / Draft"
  - `gpt-4o-mini` – "Balanced"
  - `GPT‑4.1 nano` – “Accurate / Slow”\
    UI shows latency & cost estimates drawn from rolling averages stored in the DB.

#### 1.2  Orb Collect (launch)

- Single 600 × 400 open arena.
- Bot input = its position + nearby entities (orbs, bases, enemies).
- Allowed actions: `move(dx,dy)`, `pickup()`, `deposit()`.
- First player/team to deposit 5 orbs wins.

#### 1.3  Tank Combat (flagship V1)

- **Maps** — defined in game-config package, loaded at startup:
  1. `open‑arena` – 800 × 600, no obstacles.
  2. `maze‑run`  – 1000 × 800, axis‑aligned walls.
- **Visibility mode** (room option, default “Random”):
  - `global` – loop sees entire game state
  - `fog`   – loop sees only objects within fixed radius (no radar direction, circular view)
- **Tank specs**:
  - Health: 100 HP (no energy system)
  - Max speed: 8 pixels/tick
  - Acceleration: 1 pixels/tick² forward, 2 pixels/tick² reverse/brake
  - Turn rate: 10°/tick when stationary, scales down with speed
- **Tank commands** (no extra API):
  - `move(v)`   `v ∈ [‑1,1]` (forward/back)
  - `turn(v)`   `v ∈ [‑1,1]` (left/right)
  - `fire()`    shoot shell (3-second cooldown)
- **Combat**:
  - Bullet damage: 20 HP
  - Bullet speed: 15 pixels/tick
  - Fire cooldown: 3 seconds (90 ticks)
- **Scoring**:
  - Kill: 50 points
  - Damage dealt: 1 point per HP
  - Survival bonus: 100 points
- Win: last tank (FFA) or last team alive (team).


---

### 3 · Economy & Tokens

| Tier | Monthly RoboTokens | Notes                                        |
| ---- | ------------------ | -------------------------------------------- |
| Free | 500                |                                              |
| Pro  | 10 000             | Includes 25 % overhead vs. raw OpenAI tokens |

- **Rewards**
  - Team match → winning side refunded 100 % of tokens they spent.
  - FFA → top N share 50 % of match overhead (formula TBD).
- **Free‑Mode** server flag disables token charges (dev / promo).
- Payments mocked for V1; Stripe later.

---

### 4 · Accounts & Access

- Email + Google via Auth0/Clerk/Supabase Auth (easy to add more providers).
- **Guest Mode** toggle allows instant play without login.

---

### 5 · Lobby, Rooms & Chat

- Room creator picks mode, map, max players, FFA/team, visibility (or Random).
- Players can join, leave, or replace AI.
- **Chat**
  - Team‑only during team matches.
  - Global chat on post‑match results screen.
- **Matchmaking**
  - Browse list of open rooms to join
  - "Quick Play" button auto-joins room with most human players
  - Late joiners enter spectator mode until next round
---

### 6 · User Interface

- Prompt box + per‑submission model selector.
- Prompt history list with “revert.”
- Click‑to‑expand generated code; prompts hidden in‑match, optional reveal on results screen.
- Latency “compiling…” overlay.
- **Mobile UI** focuses on prompt entry, model pick, and code viewing.
- Room‑creation map preview.

---

### 7 · Back‑End & Storage

- Server‑authoritative game loop; state deltas via WebSocket.
- LLM proxy service with per‑user rate limits.
- **PostgreSQL** tables store users, token ledger, maps, bots, prompts, generated code, compile/run outcomes, latency stats, code changes (for replay).
- YAML loader ↔ exporter keeps maps and bots in version control.

---

### 8 · Security & Sandbox

- Each bot runs in **isolated-vm** (25 ms watchdog, soft memory cap).
- Future option: migrate to WebAssembly sandbox.

---

### 9 · Analytics & Moderation

- Log every prompt, generated code, latency, compile/runtime errors, timeouts.
- Per‑prompt and per‑user performance stats.
- Abuse / malicious‑code detection pipeline.

---

## Design Requests

- Neon‑on‑dark grid aesthetic with glowing shells & orbs.
- Mobile‑friendly layout (prompt‑focused).
- Admin dashboards: maps, bots, matches, prompt templates, replay playback.

---

## Other Notes

- Tutorial Room: single‑player intro that waits for first prompt compile and forces `gpt-3.5-turbo` model.

