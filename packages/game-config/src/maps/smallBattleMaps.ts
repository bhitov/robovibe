/**
 * Battle arena maps for OrbGame, OrbGamePlus, and TankCombat modes
 * B = base spawns, P = power-ups, H = obstacles
 */

import { GameMode } from '../types.js';
import type { GameMap } from './index.js';

export const battleMaps: GameMap[] = [
  {
    name: 'Classic Arena',
    description: 'Simple open arena with corner bases',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B..................B',
      '....................',
      '....................',
      '....................',
      '....................',
      '..........P.........',
      '....................',
      '....................',
      '....................',
      '....................',
      'B..................B'
    ]
  },
  
  {
    name: 'Crossfire',
    description: 'Central cross obstacle creates four battle zones',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B.........H.........B',
      '..........H..........',
      '..........H..........',
      '..........H..........',
      'HHHHHHHHHH+HHHHHHHHHH',
      '..........P..........',
      'HHHHHHHHHH+HHHHHHHHHH',
      '..........H..........',
      '..........H..........',
      '..........H..........',
      'B.........H.........B'
    ]
  },
  
  {
    name: 'Fortress',
    description: 'Defensive positions with protected bases',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B+|.......|+B',
      '..|.......|..',
      '.............',
      '....HH+HH....',
      '....H...H....',
      '....H.P.H....',
      '....H...H....',
      '....HH+HH....',
      '.............',
      '..|.......|..',
      'B+|.......|+B'
    ]
  },
  
  {
    name: 'Labyrinth',
    description: 'Maze-like arena with tactical corridors',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B...|....|....B',
      '....|....|.....',
      '....|....|.....',
      '----.....|-----',
      '...............',
      '..P...HHH...P..',
      '...............',
      '-----....------',
      '.....|.........',
      '.....|.........',
      'B....|........B'
    ]
  },
  
  {
    name: 'Pillars',
    description: 'Strategic cover with scattered obstacles',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B...................B',
      '.....................',
      '...H...H....H...H....',
      '.....................',
      '......H......H.......',
      '.........P...........',
      '......H......H.......',
      '.....................',
      '...H...H....H...H....',
      '.....................',
      'B...................B'
    ]
  },
  
  {
    name: 'Spiral',
    description: 'Spiral layout with central power-up',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B....................',
      '..HHHHHHHHHHHHHHHH...',
      '..H...............H..',
      '..H.HHHHHHHHHHHH.H..',
      '..H.H...........H.H..',
      '..H.H.HHHHHHHH.H.H..',
      '..H.H.H.....H.H.H.H..',
      '..H.H.H..P..H.H.H.H..',
      '..H.H.H.....H.H.H.H..',
      '..H.H.HHHHHHHH.H.H..',
      '..H.H...........H.H..',
      '..H.HHHHHHHHHHHH.H..',
      '..H...............H..',
      '..HHHHHHHHHHHHHHHH...',
      '....................B'
    ]
  },
  
  {
    name: 'Four Corners',
    description: 'Separated quadrants with central meeting point',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B........|........B',
      '.........|.........',
      '.........|.........',
      '.........|.........',
      '------------------',
      '........P..........',
      '------------------',
      '.........|.........',
      '.........|.........',
      '.........|.........',
      'B........|........B'
    ]
  },
  
  {
    name: 'Diamond',
    description: 'Diamond-shaped obstacles create interesting angles',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B.........H.........B',
      '.........H.H.........',
      '........H...H........',
      '.......H.....H.......',
      '......H.......H......',
      '.....H....P....H.....',
      '......H.......H......',
      '.......H.....H.......',
      '........H...H........',
      '.........H.H.........',
      'B.........H.........B'
    ]
  },
  
  {
    name: 'Chaos Arena',
    description: 'Asymmetric layout for unpredictable battles',
    supportedModes: [GameMode.TankCombat],
    ascii: [
      'B...|......HH.......',
      '....|...............',
      '....|....P..........',
      '..........HH........',
      'HH..................',
      '....................', 
      '........--|--.......',
      '..........P.........',
      '...HH..........HH...',
      '....................',
      '...............|...B'
    ]
  },
  
  {
    name: 'Team Fortress',
    description: 'Two-sided arena perfect for team battles',
    supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
    ascii: [
      'B..B.......HHH.......B..B',
      '..........H...H..........',
      '.........H.....H.........',
      '........H.......H........',
      '...................P.....',
      '.........................',
      '.........................',
      '.....P...................',
      '........H.......H........',
      '.........H.....H.........',
      '..........H...H..........',
      'B..B.......HHH.......B..B'
    ]
  }
];