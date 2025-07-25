/**
 * Battle arena maps for OrbGame, OrbGamePlus, and TankCombat modes
 * B = base spawns, P = powerHups, H = obstacles
 * All maps are 30x20 characters (600x400 pixels at 20px per char)
 */

import { GameMode } from '../types.js';
import type { GameMap } from './index.js';

export const battleMaps: GameMap[] = [
    {
      name: 'Classic Arena',
      description: 'Simple open arena with corner bases',
      supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
      ascii: [
        'B............................B',
        '..............................',
        '..............................',
        '..............................',
        '.......P..........P...........',
        '..............................',
        '..............................',
        '..............................',
        '..............................',
        '..............P...............',
        '..............................',
        '..............................',
        '..............................',
        '.......P......................',
        '..............................',
        '..................P...........',
        '..............................',
        '..............................',
        '..............................',
        'B............................B'
      ]
    },
  
    {
      name: 'Crossfire',
      description: 'Central cross obstacle creates four battle zones',
      supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
      ascii: [
        'B.............H..............B',
        '..............................',
        '..............H...............',
        '..............H...............',
        '.........P....H...............',
        '..............H...............',
        '..............H...............',
        '..............H.....HH........',
        '..............H.....H.........',
        'HHHHH...HHHHHHHH.........HHHHH',
        '..............P...............',
        'HHHHH...HHHH......HHHH...HHHHH',
        '..............HHHHH..H........',
        '........H.....H.....HHH.......',
        '.......HHH....H......HH.......',
        '..............H...............',
        '..............H...............',
        '..............H...............',
        '..............................',
        'B.............H..............B'
      ]
    },
   
   {
     name: 'Fortress',
     description: 'Defensive positions with protected bases',
     supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
     ascii: [
       'BHH........................BHH',
       '..H........................H.',
       '...........................H.',
       '..H........................H.',
       '..H..........................',
       '..H........................H.',
       '..H........HHH.HHH.........H.',
       '...........H.....H.........H.',
       '..H........H..P..H.........H.',
       '..H........H.....H...........',
       '..H........H.....H.........H.',
       '..H........H.....H.........H.',
       '...........H..P..H.........H.',
       '..H........H.....H.........H.',
       '..H........HHH.HHH...........',
       '..H........................H.',
       '..H........................H.',
       '.............................',
       '..H........................H.',
       'BHH........................BHH'
     ]
   },
   
   {
     name: 'Labyrinth',
     description: 'MazeHlike arena with tactical corridors',
     supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
     ascii: [
       'HHHHHHHHHHHHHHHHHHHHHHHHHHHHB',
       'HB......H...H...H...H...H...H',
       'H...H...H...H...H...H...H...H',
       'H.P.H...H...H.......H...P.H.H',
       'H...H.......H...H...H...H...H',
       'H...H...H...H...H...H...H...H',
       'HH.HHHHHHH.HHHH.HHHHH.HHHHH.H',
       'H...........H...H.......H...H',
       'H...H...H...H...H...H...H...H',
       'H...H...H...P...P...H...H...H',
       'H...H...H...H...H...H...H...H',
       'H.......H...........H.......H',
       'HHHHHHH.HH.HHHHHHH.HHH.HHHHHH',
       'H...H...H...H.......H...H...H',
       'H.......H...H...H...H...H...H',
       'H.P.H...H...H...H...H...P.H.H',
       'H...H...H.......H...H...H...H',
       'H...H...H...H...H...H...H...H',
       'HB..H...H...H.......H...H..BH',
       'HHHHHHHHHHHHHHHHHHHHHHHHHHHHH'
     ]
   },

   {
     name: 'Pillars',
     description: 'Strategic cover with scattered obstacles',
     supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
     ascii: [
       'HH............................',
       'HH............................',
       '..............................',
       '......B.......................',
       '........................HHH...',
       '.....................B........',
       '..............................',
       '..............................',
       '..............................',
       'H.............................',
       '..............P...............',
       '..............................',
       '....H.................H.......',
       '..............................',
       '.......B......................',
       '...................B..........',
       '......H.................H.....',
       '..............................',
       '..............................',
       '..............................'
     ]
   },
   
   {
     name: 'The Maze',
     description: 'Complex maze with twisting corridors',
     supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
     ascii: [
       'BHHHHHHHHHHHHHHHHHHHHHHHHHHHHB',
       'H.....H.....H.....H.....H....H',
       'H.HHH.H.HHH.H.HHH.H.HHH.H.HH.H',
       'H.H.P...H.P.H.H.P...H.P.H.H..H',
       'H.H...H.H...H.H...H.H...H....H',
       'H.HHH.H.HHHHH.HHH.H.H.HHH.H..H',
       'H.H...H.H...H.H...H.H...H.H..H',
       'H.H.P.H.H.P.H.H.P.H.H.P.H.H..H',
       'H.HHH.H.HHH.H.HHH.H.HHH.H.HH.H',
       'H.....H.....H.....H.....H....H',
       'H.....H.....H..P..H.....H....H',
       'H.....H.....H.....H.....H....H',
       'H.HHH.H.HHH.H.HHH.H.HHH.H.HH.H',
       'H.H.P...H.P.H.H.P.H.H.P.H.H..H',
       'H.H...H.....H.H...H.H...H....H',
       'H.HHH.H.H.HHH.HH.HH.H.HHH.H..H',
       'H.....H.H.....H...H.H...H.H..H',
       'H.H.P.H.H.P.H.H.P.H.H.P.H.H..H',
       'H.HHH.H.HHH.H.HHH.H.HHH.H.HH.H',
       'BHHHHHHHHHHHHHHHHHHHHHHHHHHHHB'
     ]
   },
   
   {
     name: 'Four Corners',
     description: 'Separated quadrants with central meeting point',
     supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
     ascii: [
       'B.............H..............B',
       '..............H...............',
       '..............H...............',
       '..............H...............',
       '..............................',
       '..............H...............',
       '..............H...............',
       '..............H...............',
       '..............H...............',
       'HHHHHHH.HHHHHHHHHHHHH.HHHHHHH',
       '.............P...............',
       'HHHHHHH.HHHHHHHHHHHHH.HHHHHHH',
       '..............H...............',
       '..............H...............',
       '..............H...............',
       '..............................',
       '..............H...............',
       '..............H...............',
       '..............H...............',
       'B.............H..............B'
     ]
   },
   
   {
     name: 'Diamond Arena',
     description: 'DiamondHshaped obstacles create interesting angles',
     supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
     ascii: [
       'B............................B',
       '..............................',
       '..............................',
       '..............................',
       '.............H.H..............',
       '............H...H.............',
       '...........H.....H............',
       '..........H.P...P.H...........',
       '.........H.........H..........',
       '..............P...............',
       '.........H.........H..........',
       '..........H.P...P.H...........',
       '...........H.....H............',
       '............H...H.............',
       '.............H.H..............',
       '..............................',
       '..............................',
       '..............................',
       '..............................',
       'B............................B'
     ]
   },
   
    {
      name: 'War Zone',
      description: 'Chaotic battlefield with scattered cover',
      supportedModes: [GameMode.TankCombat],
      ascii: [
        'B....HH...........HH.........B',
        '..H................H..........',
        '....H..........H..............',
        '........H.....................',
        '..........H.......H...........',
        '...H................H.........',
        '......H.......................',
        '..........H.......H...........',
        '....H..........H.......P......',
        '........H....P....H...........',
        '....H..........H..............',
        '..........H.......H...........',
        '......H................P......',
        '...H................H.........',
        '..........H.......H...........',
        '........H.....................',
        '....H..........H..............',
        '..H................H..........',
        '....HH...........HH...........',
        'B....HH...........HH.........B'
      ]
    },
   
   {
     name: 'Team Fortress',
     description: 'TwoHsided arena perfect for team battles',
     supportedModes: [GameMode.OrbGame, GameMode.OrbGamePlus, GameMode.TankCombat],
     ascii: [
       'B..B.........HHH.........B..B.',
       '............H...H.............',
       '...........H.....H............',
       '..........H.......H...........',
       '.........H.........H..........',
       '..............................',
       '.......H.............H........',
       '......H...............H.......',
       '.....H.................H......',
       '....H.....P.......P.....H.....',
       '.....H.................H......',
       '......H...............H.......',
       '.......H.............H........',
       '..............................',
       '.........H.........H..........',
       '..........H.......H...........',
       '...........H.....H............',
       '............H...H.............',
       '.............HHH..............',
       'B..B.........HHH.........B..B.'
     ]
  }
];