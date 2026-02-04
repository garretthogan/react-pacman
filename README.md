# 3D Pacman Clone

A classic Pacman game recreated in 3D using React Three Fiber, while maintaining the classic 2D feel with an orthographic camera.

## Prerequisites

This project requires **Node.js 22 or higher**.

### Upgrading Node Version

If you're using nvm (Node Version Manager):

```bash
# Install Node 22
nvm install 22

# Use Node 22 for this project
nvm use 22

# Or use the .nvmrc file (recommended)
nvm use
```

If you don't have Node 22 installed, you can get it from:
- Using nvm: `nvm install 22`
- Download from [nodejs.org](https://nodejs.org/)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (usually http://localhost:5173)

## How to Play

- **Move Pacman**: Use Arrow Keys or WASD
  - **Single press**: Pacman moves one space
  - **Hold key**: Pacman continues moving in that direction
  - **Release key**: Pacman stops
- **Objective**: Eat all the pellets while avoiding ghosts
- **Power Pellets**: The larger glowing pellets make ghosts vulnerable for a short time
- **Restart**: Press R when game is over

## Features

- 🎮 Classic Pacman gameplay in 3D
- 👻 4 ghosts with chase AI
- 🔵 Power pellets for eating ghosts
- 📊 Score tracking and lives system
- 🎨 Orthographic camera for that retro 2D feel
- 🎵 Smooth animations and movement

## Technical Stack

- **React 19**: Latest React with hooks
- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for R3F
- **Three.js**: 3D graphics library
- **Vite**: Fast development build tool

## Game Mechanics

- **Regular Pellets**: 10 points each
- **Power Pellets**: 50 points each, enables ghost eating
- **Eating Ghosts**: 200 points each (when powered up)
- **Lives**: Start with 3 lives
- **Win Condition**: Collect all pellets
- **Lose Condition**: Lose all 3 lives

## Controls

| Key | Action |
|-----|--------|
| ↑ / W | Move Up |
| ↓ / S | Move Down |
| ← / A | Move Left |
| → / D | Move Right |
| R | Restart Game |

## Project Structure

```
src/
  ├── App.jsx       # Main game logic and components
  ├── App.css       # Game styling
  ├── main.jsx      # React entry point
  └── index.css     # Global styles
```

## Development

The game uses:
- **useFrame** hook for game loop
- **useState** and **useEffect** for game state management
- **Three.js geometry** for 3D models (boxes, spheres, cylinders)
- **OrthographicCamera** for 2D perspective in 3D space

## Troubleshooting

### "Unexpected token '??='" Error

This means you're running an old version of Node.js. Make sure you're using Node 22+:

```bash
node --version  # Should show v22.x.x or higher
nvm use 22      # Switch to Node 22
```

### Game Won't Start

1. Make sure all dependencies are installed: `npm install`
2. Check Node version: `node --version`
3. Clear cache and reinstall: `rm -rf node_modules package-lock.json && npm install`

## License

MIT
