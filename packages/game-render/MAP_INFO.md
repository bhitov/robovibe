# Map ASCII Character Reference

This document describes the ASCII characters used in game maps and their meanings.

## Character Legend

### Structural Elements

| Character | Description | Visual Representation |
|-----------|-------------|----------------------|
| `H` | Heavy/solid block | Filled rectangle (gray) |
| `-` | Horizontal wall | Thin horizontal line |
| `|` | Vertical wall | Thin vertical line |
| `+` | Wall connector | Joins adjacent walls at corners/intersections |

### Game Objects

| Character | Description | Game Mode | Visual Representation |
|-----------|-------------|-----------|----------------------|
| `B` | Base spawn point | Orb Game | Blue glowing ring |
| `P` | Power-up spawn | All modes | Random power-up type |
| `0-9` | Checkpoints (ordered) | Race Game | Orange/blue circles with numbers |
| `A-Z` | Additional checkpoints | Race Game | Orange/blue circles with letters |

### Other Characters

| Character | Description |
|-----------|-------------|
| ` ` (space) | Empty space |
| `.` | Empty space (alternative) |
| Any other | Treated as empty space |

## Map Structure

- Each character represents a cell in the game grid
- Default cell size is 20x20 pixels
- Maps are defined as arrays of strings, where each string is a row
- The map origin (0,0) is at the top-left corner

## Example Map

```
+--------+
|H.....P.|
|..B.....|
|...0....|
|..1.2...|
|.......H|
+--------+
```

This example shows:
- Border walls using `+`, `-`, and `|`
- Two solid blocks (`H`)
- One base spawn point (`B`)
- One power-up spawn (`P`)
- Three checkpoints (`0`, `1`, `2`)

## Color Coding in ASCII Overlay

When the ASCII overlay is displayed in the game renderer:

- `H` - Gray (#6b7280) for blocks
- `-`, `|`, `+` - Darker gray (#4b5563) for walls
- `B` - Blue (#3b82f6) for bases
- `P` - Green (#10b981) for power-ups
- `0-9` - Orange (#f59e0b) for checkpoints
- Other characters - White (#ffffff)

## Usage

The ASCII map data is:
1. Stored in map definition files (`packages/game-config/src/maps/`)
2. Parsed by `parseAsciiMap()` into game objects
3. Passed through GameConfig and GameState
4. Can be displayed as an overlay using `showAsciiOverlay={true}` on the GameCanvas component