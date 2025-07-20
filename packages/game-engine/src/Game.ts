import type {
  BaseGameState,
  Bot,
  BotLoopFunction,
  BotInput,
  BotAction,
  Orb,
  Base,
  Projectile,
  Pipe,
  PowerUp,
  Vector2D,
} from './types.js';
import { PowerUpType } from './types.js';
import {
  addVectors,
  normalizeVector,
  scaleVector,
  getDistance,
  clampVector,
  applyFriction,
  keepInBounds,
  clipSegmentToCircle,
  distancePointToSegment,
} from './physics.js';
import { createSandboxedFunction } from '@repo/sandbox';
import type { GameConfig } from '@repo/game-config';
import { BOT_RADIUS } from '@repo/game-config';
import { pathFind } from './pathFind.js';

interface BotProgress {
  currentLap: number;
  nextCheckpoint: number;
  starTicks: number;
  boostTicks: number;
  lives?: number;
  lastFlapTick?: number;
  respawnTicks?: number;
}

export interface GameState extends BaseGameState {
  orbs: Map<string, Orb>;
  bases: Map<string, Base>;
  projectiles: Map<string, Projectile>;
  pipes: Pipe[];
  powerUps: Map<string, PowerUp>;
  checkpoints: Vector2D[];
  botProgress: Map<string, BotProgress>;
  speed: number; // for scrolling games
  orbsToWin?: number;
  lapsToWin?: number;
}

export class Game {
  protected state: GameState;
  public config: GameConfig;
  protected botLoops = new Map<string, BotLoopFunction>();
  protected botStores = new Map<string, Record<string, unknown>>();
  private groundHeight = 20; // for flappy mode
  
  private get gameMode(): string {
    // Determine game mode from config
    if (this.config.allowedActions.fire && this.config.allowedActions.turn) return 'tankCombat';
    if (this.config.allowedActions.flap) return 'flappyGame';
    if (this.config.allowedActions.pickup) return 'orbGame';
    if (this.config.checkpoints) return 'raceGame';
    return 'unknown';
  }

  public constructor(config: GameConfig) {
    this.config = config;
    
    this.state = {
      bots: new Map(),
      orbs: new Map(),
      bases: new Map(),
      projectiles: new Map(),
      pipes: [],
      powerUps: new Map(),
      checkpoints: config.checkpoints || [],
      walls: config.walls || [],
      blocks: config.blocks || [],
      mapAscii: config.mapAscii,
      arena: {
        width: config.arenaWidth,
        height: config.arenaHeight,
      },
      tickCount: 0,
      winner: null,
      botProgress: new Map(),
      speed: config.initialSpeed || 0,
      orbsToWin: config.orbsToWin,
      lapsToWin: config.lapsToWin,
    };
    
    // console.log(`🎲 Game initialized with ${this.state.walls.length} walls, ${this.state.blocks.length} blocks, ${this.state.checkpoints.length} checkpoints`);
    if (this.state.walls.length > 0) {
      // console.log(`🎲 First wall: ${JSON.stringify(this.state.walls[0])}`);
    }
    if (this.state.blocks.length > 0) {
      // console.log(`🎲 First block: ${JSON.stringify(this.state.blocks[0])}`);
    }
    
    this.initializeGame();
  }

  protected initializeGame(): void {
    // Initialize orbs if needed
    if (this.config.allowedActions.pickup && this.config.initialOrbs) {
      this.spawnInitialOrbs();
    }
    
    // Initialize power-ups if needed
    if (this.config.powerUpSpawns) {
      for (const spawn of this.config.powerUpSpawns) {
        const id = `pu-${spawn.type}-${Math.random()}`;
        this.state.powerUps.set(id, { id, ...spawn });
      }
    }
  }

  public addPlayer(playerId: string, team?: number, nickname?: string): void {
    const bot: Bot = {
      id: `bot-${playerId}`,
      playerId,
      nickname: nickname || playerId,
      position: this.getStartPosition(team),
      velocity: { x: 0, y: 0 },
      rotation: 0,
      health: this.config.maxHealth || 100,
      hasOrb: false,
      team,
      color: team === 0 ? '#3b82f6' : team === 1 ? '#ef4444' : '#22c55e',
      lives: this.config.lives,
      lastFiredTick: -Infinity,
      lastFlapTick: -Infinity,
    };

    // Stack flappy bots vertically
    if (this.config.allowedActions.flap) {
      const offset = this.state.bots.size * 30;
      bot.position.y += offset;
    }

    this.state.bots.set(bot.id, bot);
    this.botStores.set(bot.id, {});
    
    // Initialize progress tracking
    this.state.botProgress.set(bot.id, {
      currentLap: 0,
      nextCheckpoint: 1,
      starTicks: 0,
      boostTicks: 0,
      lives: this.config.lives,
      lastFlapTick: -Infinity,
    });

    // Create base for orb games
    if (this.config.allowedActions.deposit) {
      const base: Base = {
        id: `base-${playerId}`,
        position: this.getValidSpawnPosition(20), // 20px radius for bases
        team,
        playerId,
        orbsDeposited: 0
      };
      this.state.bases.set(base.id, base);
    }
  }

  private getStartPosition(_team?: number): Vector2D {
    // Race game starts at first checkpoint
    if (this.config.checkpoints && this.config.checkpoints[0]) {
      return { 
        x: this.config.checkpoints[0].x - this.state.bots.size * (BOT_RADIUS * 1.5), 
        y: this.config.checkpoints[0].y 
      };
    }
    
    // Flappy game starts on left
    if (this.config.allowedActions.flap) {
      return { x: 50, y: this.config.arenaHeight / 2 };
    }
    
    // Default random position that avoids blocks
    return this.getValidSpawnPosition(BOT_RADIUS);
  }

  private getValidSpawnPosition(radius: number): Vector2D {
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const position = {
        x: Math.random() * (this.config.arenaWidth - 2 * radius) + radius,
        y: Math.random() * (this.config.arenaHeight - 2 * radius) + radius
      };
      
      // Check if position overlaps with any block
      let isValid = true;
      for (const block of this.state.blocks) {
        if (this.isPositionInBlock(position, radius, block)) {
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        return position;
      }
    }
    
    // Fallback to center if no valid position found
    console.warn('Could not find valid spawn position, using fallback');
    return { 
      x: this.config.arenaWidth / 2, 
      y: this.config.arenaHeight / 2 
    };
  }

  private isPositionInBlock(position: Vector2D, radius: number, block: { x: number; y: number; width: number; height: number }): boolean {
    const objLeft = position.x - radius;
    const objRight = position.x + radius;
    const objTop = position.y - radius;
    const objBottom = position.y + radius;
    
    const blockLeft = block.x;
    const blockRight = block.x + block.width;
    const blockTop = block.y;
    const blockBottom = block.y + block.height;
    
    return objRight > blockLeft && objLeft < blockRight && objBottom > blockTop && objTop < blockBottom;
  }

  public setBotLoop(playerId: string, loop: BotLoopFunction): void {
    this.botLoops.set(`bot-${playerId}`, loop);
  }

  public setBotCode(playerId: string, code: string): void {
    try {
      const fn = createSandboxedFunction({
        code,
        functionName: 'loop',
        timeout: 25,
        callbacks: { pathFind }
      }) as BotLoopFunction;
      this.setBotLoop(playerId, fn);
    } catch (err) {
      console.error(`Failed to set bot code for ${playerId}:`, err);
    }
  }

  public tick(): void {
    if (this.state.winner) return;
    this.state.tickCount++;

    // Flappy-specific: increase speed and spawn pipes
    if (this.config.allowedActions.flap) {
      if (this.state.tickCount % 100 === 0 && this.config.speedIncrement) {
        this.state.speed += this.config.speedIncrement;
      }
      if (this.state.tickCount % this.config.pipeFrequency! === 0) {
        this.spawnPipe();
      }
    }

    // Process each bot
    for (const bot of this.state.bots.values()) {
      const progress = this.state.botProgress.get(bot.id)!;
      
      // Handle tank respawn
      if (this.gameMode === 'tankCombat' && bot.health !== undefined && bot.health <= 0) {
        if (progress.respawnTicks !== undefined && progress.respawnTicks > 0) {
          progress.respawnTicks--;
          if (progress.respawnTicks === 0) {
            // Respawn the tank
            bot.health = this.config.maxHealth || 100;
            bot.position = this.getStartPosition(bot.team);
            bot.rotation = 0;
            bot.velocity = { x: 0, y: 0 };
            bot.canFire = true;
            bot.lastFiredTick = -Infinity;
          }
        }
        continue;
      }
      
      // Skip dead bots
      if (bot.health !== undefined && bot.health <= 0) continue;
      if (progress.lives !== undefined && progress.lives <= 0) continue;

      // Update timers
      if (progress.starTicks > 0) progress.starTicks--;
      if (progress.boostTicks > 0) progress.boostTicks--;

      const loopFunction = this.botLoops.get(bot.id);
      if (!loopFunction) continue;

      const input = this.getBotInput(bot, progress);
      const store = this.botStores.get(bot.id) ?? {};

      try {
        const result = loopFunction(input, store);
        this.processAction(bot, result.action, progress);
        this.botStores.set(bot.id, result.store);
      } catch (error) {
        console.error(`Bot ${bot.id} error:`, error);
      }

      // Apply physics based on game mode
      if (this.config.allowedActions.flap) {
        // Flappy physics: gravity
        bot.velocity.y += this.config.gravity!;
      } else {
        // Normal physics: friction and max speed
        const maxSpeed = progress.boostTicks > 0 ? this.config.maxSpeed * 1.5 : this.config.maxSpeed;
        bot.velocity = clampVector(bot.velocity, maxSpeed);
        bot.velocity = applyFriction(bot.velocity, this.config.friction);
      }
      
      // Update position
      bot.position = addVectors(bot.position, bot.velocity);
      
      // Handle collisions
      if (this.config.allowedActions.flap) {
        this.handleFlappyCollisions(bot, progress);
      } else {
        this.handleCollisions(bot, BOT_RADIUS);
      }
      
      // Check race progress
      if (this.config.checkpoints && this.config.checkpoints.length > 0) {
        this.updateLapProgress(bot, progress);
      }
      
      // Check power-up pickup
      if (this.config.powerUpSpawns) {
        this.checkPowerUpPickup(bot, progress);
      }
    }

    // Update projectiles
    if (this.config.allowedActions.fire) {
      this.updateProjectiles();
    }

    // Update pipes
    if (this.config.allowedActions.flap) {
      this.updatePipes();
    }

    // Check win conditions
    this.checkWinConditions();
    
    // Respawn power-ups
    if (this.config.powerUpRespawn && this.state.tickCount % this.config.powerUpRespawn === 0) {
      this.respawnPowerUps();
    }
  }

  private spawnInitialOrbs(): void {
    if (!this.state.mapAscii) return;
    
    const orbsToSpawn = this.config.initialOrbs || 5;
    const cellWidth = this.state.arena.width / (this.state.mapAscii[0]?.length ?? 1);
    const cellHeight = this.state.arena.height / this.state.mapAscii.length;
    
    // Track occupied tiles
    const occupiedTiles = new Set<string>();
    
    // Find all valid spawn locations (empty tiles)
    const validTiles: { row: number; col: number }[] = [];
    for (let row = 0; row < this.state.mapAscii.length; row++) {
      for (let col = 0; col < (this.state.mapAscii[row]?.length ?? 0); col++) {
        const char = this.state.mapAscii[row]?.[col];
        if (char === ' ' || char === '.') { // Empty space
          validTiles.push({ row, col });
        }
      }
    }
    
    // Spawn orbs randomly in valid tiles
    let spawnedOrbs = 0;
    const maxAttempts = validTiles.length * 2;
    let attempts = 0;
    
    while (spawnedOrbs < orbsToSpawn && attempts < maxAttempts && validTiles.length > 0) {
      attempts++;
      const randomIndex = Math.floor(Math.random() * validTiles.length);
      const tile = validTiles[randomIndex]!;
      const tileKey = `${tile.row},${tile.col}`;
      
      if (!occupiedTiles.has(tileKey)) {
        // Calculate center position of tile
        const centerX = (tile.col + 0.5) * cellWidth;
        const centerY = (tile.row + 0.5) * cellHeight;
        
        const orb: Orb = {
          id: `orb-${spawnedOrbs}`,
          position: { x: centerX, y: centerY }
        };
        
        this.state.orbs.set(orb.id, orb);
        occupiedTiles.add(tileKey);
        spawnedOrbs++;
      }
    }
    
    // console.log(`🎲 Spawned ${spawnedOrbs} orbs in tile centers`);
  }

  private getTilePosition(position: { x: number; y: number }): { row: number; col: number } {
    if (!this.state.mapAscii) return { row: 0, col: 0 };
    
    const cellWidth = this.state.arena.width / (this.state.mapAscii[0]?.length ?? 1);
    const cellHeight = this.state.arena.height / this.state.mapAscii.length;
    
    return {
      col: Math.floor(position.x / cellWidth),
      row: Math.floor(position.y / cellHeight)
    };
  }

  private spawnNewOrb(): void {
    if (!this.state.mapAscii) return;
    
    const cellWidth = this.state.arena.width / (this.state.mapAscii[0]?.length ?? 1);
    const cellHeight = this.state.arena.height / this.state.mapAscii.length;
    
    // Get all occupied tiles by existing orbs
    const occupiedTiles = new Set<string>();
    for (const orb of this.state.orbs.values()) {
      const tile = this.getTilePosition(orb.position);
      occupiedTiles.add(`${tile.row},${tile.col}`);
    }
    
    // Find all valid spawn locations (empty tiles not occupied by orbs)
    const validTiles: { row: number; col: number }[] = [];
    for (let row = 0; row < this.state.mapAscii.length; row++) {
      for (let col = 0; col < (this.state.mapAscii[row]?.length ?? 0); col++) {
        const char = this.state.mapAscii[row]?.[col];
        const tileKey = `${row},${col}`;
        if ((char === ' ' || char === '.') && !occupiedTiles.has(tileKey)) { // Empty space and no orb
          validTiles.push({ row, col });
        }
      }
    }
    
    // Spawn orb randomly in a valid tile
    if (validTiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * validTiles.length);
      const tile = validTiles[randomIndex]!;
      
      // Calculate center position of tile
      const centerX = (tile.col + 0.5) * cellWidth;
      const centerY = (tile.row + 0.5) * cellHeight;
      
      const orb: Orb = {
        id: `orb-${Date.now()}-${Math.random()}`,
        position: { x: centerX, y: centerY }
      };
      
      this.state.orbs.set(orb.id, orb);
    }
  }

  private getBotInput(bot: Bot, progress: any): BotInput {
    const input: BotInput = {
      botPosition: { ...bot.position },
      velocity: { ...bot.velocity },
      rotation: bot.rotation,
      health: bot.health,
      lives: bot.lives,
      hasOrb: bot.hasOrb,
      orbs: [],
      enemies: [],
      projectiles: [],
      tanks: [],
      walls: [],
      powerUps: [],
      canFire: this.config.allowedActions.fire ? 
        this.state.tickCount - (bot.lastFiredTick ?? 0) >= this.config.fireCooldown! : false,
    };

    // Add orbs (no vision radius limit)
    if (this.config.allowedActions.pickup) {
      for (const orb of this.state.orbs.values()) {
        const distance = getDistance(bot.position, orb.position);
        input.orbs.push({
          id: orb.id,
          position: { ...orb.position },
          distance
        });
      }
      input.orbs.sort((a, b) => a.distance - b.distance);
    }

    // Add bot's own base (only)
    if (this.config.allowedActions.deposit) {
      for (const base of this.state.bases.values()) {
        if (base.playerId === bot.playerId) {
          const distance = getDistance(bot.position, base.position);
          input.base = {
            id: base.id,
            position: { ...base.position },
            team: base.team,
            distance
          };
          break; // Only include bot's own base
        }
      }
    }

    // Add enemies/tanks (no vision radius limit)
    for (const otherBot of this.state.bots.values()) {
      if (otherBot.id === bot.id) continue;
      if (bot.team !== undefined && otherBot.team === bot.team) continue;
      
      const distance = getDistance(bot.position, otherBot.position);
      if (this.config.allowedActions.fire) {
        input.tanks?.push({
          id: otherBot.id,
          position: { ...otherBot.position },
          rotation: otherBot.rotation!,
          health: otherBot.health!,
          distance
        });
      } else {
        input.enemies.push({
          id: otherBot.id,
          position: { ...otherBot.position },
          team: otherBot.team,
          distance
        });
      }
    }

    // Add projectiles (no vision radius limit)
    if (this.config.allowedActions.fire) {
      for (const projectile of this.state.projectiles.values()) {
        const distance = getDistance(bot.position, projectile.position);
        input.projectiles.push({
          id: projectile.id,
          position: { ...projectile.position },
          velocity: { ...projectile.velocity },
          distance
        });
      }
    }

    // Add nearby walls - COMMENTED OUT, replaced by nearestWall function
    // for (const wall of this.state.walls) {
    //   const clipped = clipSegmentToCircle(bot.position, this.config.visionRadius, wall.start, wall.end);
    //   if (clipped) {
    //     const midPoint = {
    //       x: (clipped.start.x + clipped.end.x) / 2,
    //       y: (clipped.start.y + clipped.end.y) / 2,
    //     };
    //     input.nearbyWalls?.push({
    //       start: { ...clipped.start },
    //       end: { ...clipped.end },
    //       distance: getDistance(bot.position, midPoint),
    //     });
    //   }
    // }

    // Add power-ups (no vision radius limit)
    if (this.config.powerUpSpawns) {
      for (const pu of this.state.powerUps.values()) {
        const distance = getDistance(bot.position, pu.position);
        input.powerUps?.push({
          id: pu.id,
          position: { ...pu.position },
          type: pu.type,
          distance
        });
      }
    }

    // Sort all arrays by distance
    if (input.tanks) input.tanks.sort((a, b) => a.distance - b.distance);
    if (input.enemies) input.enemies.sort((a, b) => a.distance - b.distance);
    if (input.projectiles) input.projectiles.sort((a, b) => a.distance - b.distance);
    if (input.powerUps) input.powerUps.sort((a, b) => a.distance - b.distance);

    // Include ASCII map if available
    if (this.state.mapAscii) {
      // Create a copy of the map and add orb locations
//       const mapCopy = this.state.mapAscii.map(row => row.split(''));
//       
//       // Calculate grid dimensions
       const cellWidth = this.state.arena.width / (this.state.mapAscii[0]?.length ?? 1);
       const cellHeight = this.state.arena.height / this.state.mapAscii.length;
//       
//       // Add orbs to the map
//       for (const orb of this.state.orbs.values()) {
//         const orbTile = this.getTilePosition(orb.position);
//         if (orbTile.row >= 0 && orbTile.row < mapCopy.length &&
//             orbTile.col >= 0 && orbTile.col < (mapCopy[orbTile.row]?.length ?? 0)) {
//           mapCopy[orbTile.row]![orbTile.col] = 'O'; // O for orb
//         }
//       }
//       
//       // Convert back to strings
//       input.mapAscii = mapCopy.map(row => row.join(''));
//       
      // Calculate bot's grid position
      input.mapAscii = this.state.mapAscii;
      input.gridPosition = {
        col: Math.floor(bot.position.x / cellWidth),
        row: Math.floor(bot.position.y / cellHeight)
      };
      // console.log(input.mapAscii);
      
      // Ensure grid position is within bounds
      input.gridPosition.col = Math.max(0, Math.min(input.gridPosition.col, (this.state.mapAscii[0]?.length ?? 1) - 1));
      input.gridPosition.row = Math.max(0, Math.min(input.gridPosition.row, this.state.mapAscii.length - 1));
    }

    // Add race mode specific data
    if (this.config.checkpoints && this.config.checkpoints.length > 0) {
      input.currentLap = progress.currentLap;
      
      // Add next checkpoint coordinates
      const nextCpIdx = progress.nextCheckpoint;
      const nextCpPos = this.state.checkpoints[nextCpIdx];
      if (nextCpPos) {
        input.nextCheckpoint = {
          x: nextCpPos.x,
          y: nextCpPos.y
        };
      }
      
      // Add all checkpoints
      input.checkpoints = this.state.checkpoints.map(cp => ({
        x: cp.x,
        y: cp.y
      }));
    }

    return input;
  }

  private processAction(bot: Bot, action: BotAction, progress: any): void {
    switch (action.type) {
      case 'move': {
        if (!this.config.allowedActions.move) break;
        
        // Bot-style movement (dx/dy)
        if ('dx' in action && 'dy' in action) {
          const acceleration = normalizeVector({ x: action.dx, y: action.dy });
          const accelMultiplier = progress.boostTicks > 0 ? 1.5 : 1.0;
          const scaledAccel = scaleVector(acceleration, this.config.acceleration * accelMultiplier);
          bot.velocity = addVectors(bot.velocity, scaledAccel);
        }
        // Tank-style movement (forward/back with rotation)
        else if ('velocity' in action && this.config.allowedActions.turn) {
          const dirRad = (bot.rotation! * Math.PI) / 180;
          const accelMultiplier = progress.boostTicks > 0 ? 1.5 : 1.0;
          const accel = {
            x: Math.cos(dirRad) * action.velocity * this.config.acceleration * accelMultiplier,
            y: Math.sin(dirRad) * action.velocity * this.config.acceleration * accelMultiplier,
          };
          bot.velocity = addVectors(bot.velocity, accel);
        }
        break;
      }
      
      case 'turn': {
        if (!this.config.allowedActions.turn) break;
        bot.rotation = (bot.rotation! + action.velocity * this.config.turnRate!) % 360;
        break;
      }
      
      case 'fire': {
        if (!this.config.allowedActions.fire) break;
        if (this.state.tickCount - (bot.lastFiredTick ?? 0) >= this.config.fireCooldown!) {
          this.spawnProjectile(bot, action.dx, action.dy);
          bot.lastFiredTick = this.state.tickCount;
        }
        break;
      }
      
      case 'pickup': {
        if (!this.config.allowedActions.pickup || bot.hasOrb) break;
        for (const [orbId, orb] of this.state.orbs.entries()) {
          if (getDistance(bot.position, orb.position) <= this.config.pickupRadius!) {
            bot.hasOrb = true;
            this.state.orbs.delete(orbId);
            break;
          }
        }
        break;
      }
      
      case 'deposit': {
        if (!this.config.allowedActions.deposit || !bot.hasOrb) break;
        const playerBase = Array.from(this.state.bases.values()).find(
          base => base.playerId === bot.playerId
        );
        
        if (playerBase && getDistance(bot.position, playerBase.position) <= this.config.depositRadius!) {
          bot.hasOrb = false;
          playerBase.orbsDeposited++;
          
          // Spawn new orb in tile center
          this.spawnNewOrb();
        }
        break;
      }
    }
  }

  private spawnProjectile(bot: Bot, dx?: number, dy?: number): void {
    let velocity: Vector2D;
    
    if (dx !== undefined && dy !== undefined) {
      // Use provided direction
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      if (magnitude > 0) {
        velocity = {
          x: (dx / magnitude) * this.config.bulletSpeed!,
          y: (dy / magnitude) * this.config.bulletSpeed!,
        };
      } else {
        // If dx and dy are both 0, fire in the direction the tank is facing
        const dirRad = (bot.rotation! * Math.PI) / 180;
        velocity = {
          x: Math.cos(dirRad) * this.config.bulletSpeed!,
          y: Math.sin(dirRad) * this.config.bulletSpeed!,
        };
      }
    } else {
      // Fall back to firing in the direction the tank is facing
      const dirRad = (bot.rotation! * Math.PI) / 180;
      velocity = {
        x: Math.cos(dirRad) * this.config.bulletSpeed!,
        y: Math.sin(dirRad) * this.config.bulletSpeed!,
      };
    }
    
    const proj: Projectile = {
      id: `proj-${Date.now()}-${Math.random()}`,
      ownerId: bot.playerId,
      position: { ...bot.position },
      velocity,
      life: 200,
    };
    this.state.projectiles.set(proj.id, proj);
  }

  private updateProjectiles(): void {
    for (const [id, p] of this.state.projectiles.entries()) {
      p.position = addVectors(p.position, p.velocity);
      p.life--;

      // Check collision with bots
      for (const bot of this.state.bots.values()) {
        if (bot.health! <= 0 || bot.playerId === p.ownerId) continue;
        if (getDistance(bot.position, p.position) < BOT_RADIUS + 2) {
          bot.health = Math.max(0, bot.health! - 20);
          
          // Handle tank death with lives system
          if (bot.health === 0 && this.gameMode === 'tankCombat') {
            const progress = this.state.botProgress.get(bot.id);
            if (progress && bot.lives !== undefined && bot.lives > 1) {
              bot.lives--;
              progress.respawnTicks = this.config.respawnDelay || 90;
            }
          }
          
          this.state.projectiles.delete(id);
          break;
        }
      }

      // Remove if out of bounds or expired
      const outOfBounds =
        p.position.x < 0 ||
        p.position.x > this.config.arenaWidth ||
        p.position.y < 0 ||
        p.position.y > this.config.arenaHeight;
      if (outOfBounds || p.life <= 0) {
        this.state.projectiles.delete(id);
      }
    }
  }

  private spawnPipe(): void {
    const gapY = 50 + Math.random() * (this.config.arenaHeight - this.groundHeight - 100);
    const pipe: Pipe = { x: this.config.arenaWidth, gapY };
    this.state.pipes.push(pipe);
  }

  private updatePipes(): void {
    // Move pipes left
    for (const pipe of this.state.pipes) {
      pipe.x -= this.state.speed;
    }
    // Remove off-screen pipes
    this.state.pipes = this.state.pipes.filter(p => p.x + 50 > 0);
  }

  private handleFlappyCollisions(bot: Bot, progress: any): void {
    // Ceiling
    if (bot.position.y < 0) bot.position.y = 0;

    // Ground
    if (bot.position.y > this.config.arenaHeight - this.groundHeight) {
      this.loseLife(bot, progress);
    }

    // Pipes
    for (const pipe of this.state.pipes) {
      if (pipe.x < bot.position.x + BOT_RADIUS + 2 && pipe.x + 50 > bot.position.x - (BOT_RADIUS + 2)) {
        if (
          bot.position.y < pipe.gapY - this.config.pipeGap! / 2 ||
          bot.position.y > pipe.gapY + this.config.pipeGap! / 2
        ) {
          this.loseLife(bot, progress);
          break;
        }
      }
    }

    // Update bird rotation based on velocity
    bot.rotation = Math.max(-30, Math.min(90, (bot.velocity.y / 10) * 90));
  }

  private loseLife(bot: Bot, progress: any): void {
    progress.lives--;
    bot.lives = progress.lives;
    bot.position.y = this.config.arenaHeight / 2;
    bot.velocity.y = 0;
    if (progress.lives <= 0) {
      bot.rotation = 90;
    }
  }

  private handleCollisions(bot: Bot, radius: number): void {
    // Arena boundaries
    const bounded = keepInBounds(bot.position, bot.velocity, this.state.arena, radius);
    bot.position = bounded.position;
    bot.velocity = bounded.velocity;

    // Walls
    let collisionsDetected = 0;
    for (const w of this.state.walls) {
      const dist = distancePointToSegment(bot.position, w.start, w.end);
      if (dist < radius) {
        collisionsDetected++;
        const dx = w.end.x - w.start.x;
        const dy = w.end.y - w.start.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const overlap = radius - dist;
        bot.position = {
          x: bot.position.x + nx * overlap,
          y: bot.position.y + ny * overlap,
        };
        bot.velocity = { x: 0, y: 0 };
      }
    }
    
    // Block collisions
    for (const block of this.state.blocks) {
      const botLeft = bot.position.x - radius;
      const botRight = bot.position.x + radius;
      const botTop = bot.position.y - radius;
      const botBottom = bot.position.y + radius;
      
      const blockLeft = block.x;
      const blockRight = block.x + block.width;
      const blockTop = block.y;
      const blockBottom = block.y + block.height;
      
      // Check if bot overlaps with block
      if (botRight > blockLeft && botLeft < blockRight && botBottom > blockTop && botTop < blockBottom) {
        collisionsDetected++;
        
        // Calculate overlap amounts
        const overlapLeft = botRight - blockLeft;
        const overlapRight = blockRight - botLeft;
        const overlapTop = botBottom - blockTop;
        const overlapBottom = blockBottom - botTop;
        
        // Find the smallest overlap (closest edge)
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        // Push bot out based on smallest overlap
        if (minOverlap === overlapLeft) {
          bot.position.x = blockLeft - radius;
        } else if (minOverlap === overlapRight) {
          bot.position.x = blockRight + radius;
        } else if (minOverlap === overlapTop) {
          bot.position.y = blockTop - radius;
        } else {
          bot.position.y = blockBottom + radius;
        }
        
        bot.velocity = { x: 0, y: 0 };
        // Block collision detected - handled silently
      }
    }
  }

  private updateLapProgress(bot: Bot, progress: any): void {
    const nextCpIdx = progress.nextCheckpoint;
    const cpPos = this.state.checkpoints[nextCpIdx];
    if (!cpPos) return;
    
    if (getDistance(bot.position, cpPos) < 20) {
      progress.nextCheckpoint = (progress.nextCheckpoint + 1) % this.state.checkpoints.length;
      
      // Completed a lap?
      if (progress.nextCheckpoint === 0) {
        progress.currentLap++;
      }
    }
  }

  private checkPowerUpPickup(bot: Bot, progress: any): void {
    for (const [id, pu] of this.state.powerUps.entries()) {
      if (getDistance(bot.position, pu.position) < BOT_RADIUS * 1.5) {
        switch (pu.type) {
          case PowerUpType.Speed:
            progress.boostTicks = 200;
            break;
          case PowerUpType.Star:
            progress.starTicks = 200;
            break;
        }
        this.state.powerUps.delete(id);
        break;
      }
    }

    // Star collision - stun others
    if (progress.starTicks > 0) {
      for (const other of this.state.bots.values()) {
        if (other.id === bot.id) continue;
        const otherProg = this.state.botProgress.get(other.id)!;
        if (otherProg.starTicks > 0) continue;
        if (getDistance(bot.position, other.position) < BOT_RADIUS * 1.5) {
          other.velocity = { x: 0, y: 0 };
          otherProg.boostTicks = Math.max(0, otherProg.boostTicks - 50);
        }
      }
    }
  }

  private respawnPowerUps(): void {
    if (!this.config.powerUpSpawns) return;
    
    for (const puDef of this.config.powerUpSpawns) {
      const exists = Array.from(this.state.powerUps.values()).some(
        p => getDistance(p.position, puDef.position) < 1 && p.type === puDef.type
      );
      if (!exists) {
        const id = `pu-${puDef.type}-${Math.random()}`;
        this.state.powerUps.set(id, { id, ...puDef });
      }
    }
  }

  private checkWinConditions(): void {
    switch (this.config.winCondition.type) {
      case 'orbs': {
        for (const base of this.state.bases.values()) {
          if (base.orbsDeposited >= this.config.winCondition.value) {
            const bot = Array.from(this.state.bots.values()).find(b => b.playerId === base.playerId);
            if (bot) this.state.winner = bot.nickname;
          }
        }
        break;
      }
      
      case 'elimination': {
        const livingBots = Array.from(this.state.bots.values()).filter(b => {
          if (b.health === undefined) return true;
          if (b.lives !== undefined && b.lives > 0) return true;
          return b.health > 0;
        });
        if (livingBots.length === 1 && livingBots[0]) {
          this.state.winner = livingBots[0].nickname;
        }
        break;
      }
      
      case 'survival': {
        const alive = Array.from(this.state.bots.values()).filter(b => {
          const prog = this.state.botProgress.get(b.id)!;
          return prog.lives! > 0;
        });
        if (alive.length === 0) {
          this.state.winner = 'No one';
        } else if (alive.length === 1 && this.state.bots.size > 1) {
          this.state.winner = alive[0]!.nickname;
        }
        break;
      }
      
      case 'laps': {
        for (const [botId, progress] of this.state.botProgress.entries()) {
          if (progress.currentLap >= this.config.winCondition.value) {
            const bot = this.state.bots.get(botId);
            if (bot) this.state.winner = bot.nickname;
          }
        }
        break;
      }
    }
  }

  public reset(): void {
    this.state.tickCount = 0;
    this.state.winner = null;
    this.state.speed = this.config.initialSpeed || 0;
    
    // Clear game objects
    this.state.orbs.clear();
    this.state.projectiles.clear();
    this.state.pipes = [];
    this.state.powerUps.clear();
    
    // Reset bots
    for (const bot of this.state.bots.values()) {
      bot.velocity = { x: 0, y: 0 };
      bot.hasOrb = false;
      bot.position = this.getStartPosition(bot.team);
      bot.rotation = 0;
      bot.health = this.config.maxHealth || 100;
      bot.lives = this.config.maxLives || this.config.lives;
      bot.lastFiredTick = -Infinity;
      bot.lastFlapTick = -Infinity;
    }
    
    // Reset bases
    for (const base of this.state.bases.values()) {
      base.orbsDeposited = 0;
    }
    
    // Reset progress
    for (const [_botId, progress] of this.state.botProgress.entries()) {
      progress.currentLap = 0;
      progress.nextCheckpoint = 1;
      progress.starTicks = 0;
      progress.boostTicks = 0;
      progress.lives = this.config.maxLives || this.config.lives;
      progress.lastFlapTick = -Infinity;
    }
    
    // Reset bot stores
    for (const botId of this.botStores.keys()) {
      this.botStores.set(botId, {});
    }
    
    // Reinitialize game objects
    this.initializeGame();
  }

  public getState(): GameState {
    return {
      ...this.state,
      bots: new Map(this.state.bots),
      orbs: new Map(this.state.orbs),
      bases: new Map(this.state.bases),
      projectiles: new Map(this.state.projectiles),
      pipes: [...this.state.pipes],
      powerUps: new Map(this.state.powerUps),
      botProgress: new Map(this.state.botProgress),
      blocks: [...this.state.blocks],
    };
  }
}