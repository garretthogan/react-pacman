import { useState, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MAZE, CELL_SIZE } from '../constants/maze'
import Wall from './Wall'
import Pellet from './Pellet'
import Pacman from './Pacman'
import Ghost from './Ghost'

export default function Game({ lives, setLives, score, setScore, gameOver, setGameOver, gameStarted, lerpSpeed }) {
  const [pacmanPos, setPacmanPos] = useState({ x: 9, y: 16 })
  const [pacmanDirection, setPacmanDirection] = useState('right')
  const [nextDirection, setNextDirection] = useState(null)
  const [ghosts, setGhosts] = useState([
    { id: 0, x: 7, y: 9, color: '#FF0000', name: 'Blinky', scatterX: 17, scatterY: 1 },
    { id: 1, x: 9, y: 9, color: '#FFB8FF', name: 'Pinky', scatterX: 1, scatterY: 1 },
    { id: 2, x: 11, y: 9, color: '#00FFFF', name: 'Inky', scatterX: 17, scatterY: 20 },
    { id: 3, x: 9, y: 11, color: '#FFB847', name: 'Clyde', scatterX: 1, scatterY: 20 },
  ])
  const [scatterMode, setScatterMode] = useState(true)
  const scatterStartTime = useRef(Date.now())
  const [pellets, setPellets] = useState(() => {
    const initialPellets = []
    MAZE.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 2 || cell === 3) {
          initialPellets.push({
            x,
            y,
            isPowerPellet: cell === 3
          })
        }
      })
    })
    return initialPellets
  })
  const [isScaredMode, setIsScaredMode] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  
  const lastMoveTime = useRef(Date.now())
  const lastGhostMoveTime = useRef(Date.now())
  const keysPressed = useRef(new Set())
  const isResetting = useRef(false)
  const lastCollisionTime = useRef(0)
  const ghostsRef = useRef(ghosts)
  const pacmanPosRef = useRef(pacmanPos)
  const livesRef = useRef(lives)
  const isScaredModeRef = useRef(isScaredMode)
  const pendingMove = useRef(false)
  
  // Keep refs in sync
  useEffect(() => {
    ghostsRef.current = ghosts
  }, [ghosts])
  
  useEffect(() => {
    pacmanPosRef.current = pacmanPos
  }, [pacmanPos])
  
  useEffect(() => {
    livesRef.current = lives
  }, [lives])
  
  useEffect(() => {
    isScaredModeRef.current = isScaredMode
  }, [isScaredMode])

  // Handle keyboard input - track which keys are held
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return // Ignore key repeat events
      
      // Handle R key for restart (works even when game is over)
      if (e.key === 'r' || e.key === 'R') {
        if (gameOver) {
          window.location.reload()
        }
        return
      }
      
      // Don't process movement keys if game hasn't started, is over, or resetting
      if (!gameStarted || isResetting.current || gameOver) return
      
      let direction = null
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'down'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'up'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right'
          break
      }
      
      if (direction) {
        keysPressed.current.add(direction)
        setNextDirection(direction)
        pendingMove.current = true // Force immediate move check
      }
    }
    
    const handleKeyUp = (e) => {
      let direction = null
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'down'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'up'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right'
          break
      }
      
      if (direction) {
        keysPressed.current.delete(direction)
        // If no keys pressed, stop moving
        if (keysPressed.current.size === 0) {
          setNextDirection(null)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameOver, gameStarted])

  // Check if position is valid (with wraparound support)
  const isValidPosition = (x, y) => {
    // Handle wraparound
    const mazeWidth = MAZE[0].length
    const mazeHeight = MAZE.length
    
    if (y < 0 || y >= mazeHeight) return false
    
    // Wraparound x coordinates
    let wrappedX = x
    if (x < 0) wrappedX = mazeWidth - 1
    if (x >= mazeWidth) wrappedX = 0
    
    const cell = MAZE[y][wrappedX]
    return cell !== 1 // Not a wall
  }

  // Get next position based on direction (with wraparound)
  const getNextPosition = (x, y, direction) => {
    const mazeWidth = MAZE[0].length
    const mazeHeight = MAZE.length
    
    let newX = x
    let newY = y
    
    switch(direction) {
      case 'up':
        newY = y - 1
        break
      case 'down':
        newY = y + 1
        break
      case 'left':
        newX = x - 1
        // Wraparound to right side
        if (newX < 0) newX = mazeWidth - 1
        break
      case 'right':
        newX = x + 1
        // Wraparound to left side
        if (newX >= mazeWidth) newX = 0
        break
    }
    
    return { x: newX, y: newY }
  }
  
  // Handle collision with ghost
  const handleGhostCollision = () => {
    if (isResetting.current || gameOver) return
    
    const now = Date.now()
    // Prevent collision detection during cooldown period
    if (now - lastCollisionTime.current < 500) return
    
    const collidedGhost = ghostsRef.current.find(g => 
      g.x === pacmanPosRef.current.x && g.y === pacmanPosRef.current.y
    )
    
    if (collidedGhost) {
      if (isScaredModeRef.current) {
        // Eat ghost - send it back to spawn
        setScore(s => s + 200)
        setGhosts(ghostsRef.current.map(g => 
          g.id === collidedGhost.id 
            ? { ...g, x: 9, y: 9 } // Respawn at center
            : g
        ))
        lastCollisionTime.current = now
      } else {
        // Lose life - reset board
        isResetting.current = true
        lastCollisionTime.current = now
        
        // Use functional update to get current lives
        setLives(currentLives => {
          const newLives = currentLives - 1
          console.log('Lives before:', currentLives, 'Lives after:', newLives)
          
          if (newLives <= 0) {
            setGameOver(true)
            isResetting.current = false
          } else {
            // Reset positions for pacman and ghosts
            setPacmanPos({ x: 9, y: 16 })
            setPacmanDirection('right')
            setNextDirection(null)
            keysPressed.current.clear()
            
            // Reset ghosts to starting positions
            setGhosts([
              { id: 0, x: 7, y: 9, color: '#FF0000', name: 'Blinky', scatterX: 17, scatterY: 1 },
              { id: 1, x: 9, y: 9, color: '#FFB8FF', name: 'Pinky', scatterX: 1, scatterY: 1 },
              { id: 2, x: 11, y: 9, color: '#00FFFF', name: 'Inky', scatterX: 17, scatterY: 20 },
              { id: 3, x: 9, y: 11, color: '#FFB847', name: 'Clyde', scatterX: 1, scatterY: 20 },
            ])
            
            // Clear reset flag after a short delay
            setTimeout(() => {
              isResetting.current = false
            }, 100)
          }
          
          return newLives
        })
      }
    }
  }

  // Game loop for Pacman movement
  useFrame(() => {
    if (!gameStarted || gameOver || isResetting.current) return
    
    const now = Date.now()
    const moveSpeed = 150 // milliseconds per move
    
    // Check if enough time has passed OR if there's a pending move from a keypress
    const shouldMove = pendingMove.current || (now - lastMoveTime.current > moveSpeed)
    
    if (shouldMove) {
      // Only move if a key is being held
      if (nextDirection !== null) {
        // Try to turn if next direction is valid
        const nextPos = getNextPosition(pacmanPos.x, pacmanPos.y, nextDirection)
        if (isValidPosition(nextPos.x, nextPos.y)) {
          setPacmanDirection(nextDirection)
          setPacmanPos(nextPos)
          setIsMoving(true)
          // Check collision after player moves
          setTimeout(() => handleGhostCollision(), 10)
          lastMoveTime.current = now
          pendingMove.current = false
        } else {
          setIsMoving(false)
          pendingMove.current = false
        }
      } else {
        setIsMoving(false)
        pendingMove.current = false
      }
    }
    
    // Scatter-Chase mode cycling (7 seconds scatter, 20 seconds chase)
    const timeSinceScatterStart = (now - scatterStartTime.current) / 1000
    if (timeSinceScatterStart > 27) {
      scatterStartTime.current = now
      setScatterMode(true)
    } else if (timeSinceScatterStart > 7 && scatterMode) {
      setScatterMode(false)
    }
    
    // Ghost movement with classic AI behaviors
    const totalPellets = 244 // Approximate total pellets in maze
    const pelletsEaten = totalPellets - pellets.length
    const pelletPercentEaten = pelletsEaten / totalPellets
    
    // Blinky's Cruise Elroy mode - speeds up when 75% of pellets eaten
    const blinkySpeed = pelletPercentEaten > 0.75 ? 150 : 180
    
    if (!isResetting.current && now - lastGhostMoveTime.current > (isScaredMode ? 250 : blinkySpeed)) {
      setGhosts(prevGhosts => {
        const newGhosts = []
        const blinky = prevGhosts.find(g => g.name === 'Blinky')
        
        prevGhosts.forEach((ghost, index) => {
          let newX = ghost.x
          let newY = ghost.y
          let targetX, targetY
          
          if (isScaredMode) {
            // Frightened mode - run away from Pacman
            targetX = ghost.x - (pacmanPos.x - ghost.x)
            targetY = ghost.y - (pacmanPos.y - ghost.y)
          } else if (scatterMode) {
            // Scatter mode - go to corner
            targetX = ghost.scatterX
            targetY = ghost.scatterY
          } else {
            // Chase mode - each ghost has unique behavior
            switch(ghost.name) {
              case 'Blinky': // Red - Direct chase
                targetX = pacmanPos.x
                targetY = pacmanPos.y
                break
                
              case 'Pinky': // Pink - Target 4 tiles ahead
                const dirOffset = {
                  'up': { x: 0, y: -4 },
                  'down': { x: 0, y: 4 },
                  'left': { x: -4, y: 0 },
                  'right': { x: 4, y: 0 }
                }[pacmanDirection] || { x: 0, y: 0 }
                targetX = pacmanPos.x + dirOffset.x
                targetY = pacmanPos.y + dirOffset.y
                break
                
              case 'Inky': // Cyan - Uses both Pacman and Blinky's positions
                if (blinky) {
                  // Target is calculated from 2 tiles ahead of Pacman, then doubled from Blinky
                  const ahead = {
                    'up': { x: 0, y: -2 },
                    'down': { x: 0, y: 2 },
                    'left': { x: -2, y: 0 },
                    'right': { x: 2, y: 0 }
                  }[pacmanDirection] || { x: 0, y: 0 }
                  const pivotX = pacmanPos.x + ahead.x
                  const pivotY = pacmanPos.y + ahead.y
                  targetX = pivotX + (pivotX - blinky.x)
                  targetY = pivotY + (pivotY - blinky.y)
                } else {
                  targetX = pacmanPos.x
                  targetY = pacmanPos.y
                }
                break
                
              case 'Clyde': // Orange - Chase if far, scatter if close
                const distToPacman = Math.abs(ghost.x - pacmanPos.x) + Math.abs(ghost.y - pacmanPos.y)
                if (distToPacman > 8) {
                  // Far away - chase Pacman
                  targetX = pacmanPos.x
                  targetY = pacmanPos.y
                } else {
                  // Close - retreat to scatter corner
                  targetX = ghost.scatterX
                  targetY = ghost.scatterY
                }
                break
                
              default:
                targetX = pacmanPos.x
                targetY = pacmanPos.y
            }
          }
          
          // Calculate preferred directions toward target
          const dx = targetX - ghost.x
          const dy = targetY - ghost.y
          
          let preferredDirs = []
          if (Math.abs(dx) > Math.abs(dy)) {
            preferredDirs = dx > 0 ? ['right', 'down', 'up', 'left'] : ['left', 'down', 'up', 'right']
          } else {
            preferredDirs = dy > 0 ? ['down', 'right', 'left', 'up'] : ['up', 'right', 'left', 'down']
          }
          
          // Check if position would overlap with other ghosts
          const isOccupiedByGhost = (x, y) => {
            return newGhosts.some(g => g.x === x && g.y === y) ||
                   prevGhosts.some((g, i) => i !== index && g.x === x && g.y === y)
          }
          
          for (const dir of preferredDirs) {
            const nextPos = getNextPosition(ghost.x, ghost.y, dir)
            if (isValidPosition(nextPos.x, nextPos.y) && !isOccupiedByGhost(nextPos.x, nextPos.y)) {
              newX = nextPos.x
              newY = nextPos.y
              break
            }
          }
          
          newGhosts.push({ ...ghost, x: newX, y: newY })
        })
        
        return newGhosts
      })
      
      // Check collision after ghosts move
      setTimeout(() => handleGhostCollision(), 10)
      
      lastGhostMoveTime.current = now
    }
  })

  // Check collisions with pellets
  useEffect(() => {
    const eatenPellet = pellets.find(p => p.x === pacmanPos.x && p.y === pacmanPos.y)
    if (eatenPellet) {
      setPellets(pellets.filter(p => !(p.x === pacmanPos.x && p.y === pacmanPos.y)))
      setScore(s => s + (eatenPellet.isPowerPellet ? 50 : 10))
      
      if (eatenPellet.isPowerPellet) {
        setIsScaredMode(true)
        setTimeout(() => setIsScaredMode(false), 6000)
      }
    }
    
    // Check win condition
    if (pellets.length === 0) {
      setGameOver(true)
    }
  }, [pacmanPos, pellets])


  return (
    <>
      {/* Walls */}
      {MAZE.map((row, y) =>
        row.map((cell, x) =>
          cell === 1 ? (
            <Wall 
              key={`wall-${x}-${y}`} 
              position={[x * CELL_SIZE, y * CELL_SIZE, 0]} 
            />
          ) : null
        )
      )}
      
      {/* Pellets */}
      {pellets.map((pellet, i) => (
        <Pellet
          key={`pellet-${i}`}
          position={[pellet.x * CELL_SIZE, pellet.y * CELL_SIZE, 0]}
          isPowerPellet={pellet.isPowerPellet}
        />
      ))}
      
      {/* Pacman */}
      <Pacman
        position={[pacmanPos.x * CELL_SIZE, pacmanPos.y * CELL_SIZE, 0]}
        direction={pacmanDirection}
        isMoving={isMoving}
        lerpSpeed={lerpSpeed}
      />
      
      {/* Ghosts */}
      {ghosts.map(ghost => (
        <Ghost
          key={`ghost-${ghost.id}`}
          position={[ghost.x * CELL_SIZE, ghost.y * CELL_SIZE, 0]}
          color={ghost.color}
          isScared={isScaredMode}
          lerpSpeed={lerpSpeed}
        />
      ))}
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[9, 11, 10]} intensity={100} />
      <pointLight position={[9, 11, -10]} intensity={50} />
    </>
  )
}
