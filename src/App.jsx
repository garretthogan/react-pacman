import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import Game from './components/Game'
import './App.css'

export default function App() {
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameStarted, setGameStarted] = useState(false)
  
  // Initialize lerpSpeed from localStorage or use default
  const [lerpSpeed, setLerpSpeed] = useState(() => {
    const saved = localStorage.getItem('pacman-lerp-speed')
    return saved ? parseFloat(saved) : 0.3
  })

  // Save lerpSpeed to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pacman-lerp-speed', lerpSpeed.toString())
  }, [lerpSpeed])

  const handleStartGame = () => {
    setGameStarted(true)
  }

  return (
    <>
      <div className="game-ui">
        <div>SCORE: {score}</div>
        <div>LIVES: {'♥'.repeat(Math.max(0, lives))}</div>
      </div>
      
      <div className="controls-panel">
        <h3>Controls</h3>
        <div className="control-item">
          <label>Movement Smoothness</label>
          <input 
            type="range" 
            min="0.05" 
            max="1" 
            step="0.05" 
            value={lerpSpeed} 
            onChange={(e) => setLerpSpeed(parseFloat(e.target.value))}
            onKeyDown={(e) => {
              // Prevent arrow keys from changing slider value
              if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
              }
            }}
          />
          <span className="control-value">{lerpSpeed.toFixed(2)}</span>
        </div>
        <div className="control-description">
          Lower = Smoother (more lag)<br/>
          Higher = Snappier (less lag)
        </div>
      </div>
      
      {!gameStarted && (
        <div className="game-over">
          <div>PAC-MAN</div>
          <button 
            onClick={handleStartGame}
            style={{
              marginTop: '40px',
              padding: '20px 40px',
              fontSize: '24px',
              fontFamily: 'Courier New, monospace',
              backgroundColor: '#FFFF00',
              color: '#000',
              border: '4px solid #000',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#FFD700'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#FFFF00'}
          >
            START GAME
          </button>
        </div>
      )}
      
      {gameOver && (
        <div className="game-over">
          <div>GAME OVER</div>
          <div style={{fontSize: '24px', marginTop: '20px'}}>
            Final Score: {score}
          </div>
          <div style={{fontSize: '20px', marginTop: '20px'}}>
            Press R to Restart
          </div>
        </div>
      )}
      
      {gameStarted && !gameOver && (
        <div className="instructions">
          Use Arrow Keys or WASD to move
        </div>
      )}
      
      <Canvas>
        <OrthographicCamera 
          makeDefault 
          position={[9, 11, 20]} 
          zoom={35}
          near={0.1}
          far={1000}
        />
        <Game 
          lives={lives}
          setLives={setLives}
          score={score}
          setScore={setScore}
          gameOver={gameOver}
          setGameOver={setGameOver}
          gameStarted={gameStarted}
          lerpSpeed={lerpSpeed}
        />
      </Canvas>
    </>
  )
}
