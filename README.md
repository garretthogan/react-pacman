# 3D Pacman Clone

A classic Pacman game recreated in 3D using React Three Fiber, while maintaining the classic 2D feel with an orthographic camera.

🎮 **[Play the game live on GitHub Pages!](https://YOUR_USERNAME.github.io/react-pacman/)**

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

## Deployment

This project is configured to deploy to GitHub Pages.

### Automatic Deployment (GitHub Actions)

The project includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages when you push to the `main` or `master` branch.

**Setup Steps:**

1. Push your code to GitHub
2. Go to your repository Settings → Pages
3. Under "Build and deployment", set Source to "GitHub Actions"
4. Push a commit to trigger the deployment
5. Your site will be available at `https://YOUR_USERNAME.github.io/react-pacman/`

### Manual Deployment

You can also deploy manually using:

```bash
npm run deploy
```

This will build the project and push it to the `gh-pages` branch.

**Note:** Make sure to update the `base` path in `vite.config.js` if your repository name is different from `react-pacman`:

```javascript
base: '/your-repo-name/',
```

## License

MIT
