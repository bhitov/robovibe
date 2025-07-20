// Quick debug script to check map dimensions
import { battleMaps } from './src/maps/battleMaps.js';
import { raceMaps } from './src/maps/raceMaps.js';

const failingMaps = ['Crossfire', 'Fortress', 'Labyrinth', 'Four Corners', 'The Maze Circuit'];

function debugMap(map, type) {
  if (!failingMaps.includes(map.name)) return;
  
  console.log(`\n=== ${type}: ${map.name} ===`);
  console.log(`Height: ${map.ascii.length}`);
  
  map.ascii.forEach((row, index) => {
    console.log(`Row ${index}: ${row.length} chars - "${row}"`);
  });
}

battleMaps.forEach(map => debugMap(map, 'battle'));
raceMaps.forEach(map => debugMap(map, 'race'));