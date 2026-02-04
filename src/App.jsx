import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

// Classic Pacman maze layout (1 = wall, 0 = path, 2 = pellet, 3 = power pellet)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

const CELL_SIZE = 1

// Wall component
function Wall({ position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[CELL_SIZE, CELL_SIZE, CELL_SIZE]} />
      <meshStandardMaterial color="#1919A6" />
    </mesh>
  )
}

// Pellet component
function Pellet({ position, isPowerPellet = false }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current && isPowerPellet) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2)
    }
  })

  const size = isPowerPellet ? 0.3 : 0.15
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial 
        color={isPowerPellet ? "#FFB8FF" : "#FFB897"} 
        emissive={isPowerPellet ? "#FF69B4" : "#FFA500"}
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

// Pacman component with animated texture
function Pacman({ position, direction, isMoving, lerpSpeed }) {
  const groupRef = useRef()
  const textureRef = useRef()
  const canvasRef = useRef()
  const visualPos = useRef([position[0], position[1], position[2]])
  
  // Create canvas texture once
  useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    canvasRef.current = canvas
    
    const texture = new THREE.CanvasTexture(canvas)
    textureRef.current = texture
    
    return texture
  }, [])
  
  // Draw Pac-Man on canvas
  const drawPacman = (mouthAngle) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const centerX = 64
    const centerY = 64
    const radius = 60
    
    // Clear canvas
    ctx.clearRect(0, 0, 128, 128)
    
    // Draw Pac-Man
    ctx.fillStyle = '#FFFF00'
    ctx.beginPath()
    
    if (mouthAngle > 0.01) {
      // Draw Pac-Man with mouth open
      ctx.arc(centerX, centerY, radius, mouthAngle, Math.PI * 2 - mouthAngle)
      ctx.lineTo(centerX, centerY)
    } else {
      // Draw full circle when mouth closed
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    }
    
    ctx.closePath()
    ctx.fill()
    
    // Update texture
    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }
  }
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Detect wraparound (large jump in position indicates tunnel teleport)
    const distX = Math.abs(position[0] - visualPos.current[0])
    const distY = Math.abs(position[1] - visualPos.current[1])
    
    // If horizontal distance is very large, it's a wraparound - instant teleport
    if (distX > 10) {
      visualPos.current[0] = position[0]
      visualPos.current[1] = position[1]
      visualPos.current[2] = position[2]
    } else {
      // Normal smooth interpolation
      visualPos.current[0] += (position[0] - visualPos.current[0]) * lerpSpeed
      visualPos.current[1] += (position[1] - visualPos.current[1]) * lerpSpeed
      visualPos.current[2] += (position[2] - visualPos.current[2]) * lerpSpeed
    }
    
    groupRef.current.position.set(visualPos.current[0], visualPos.current[1], visualPos.current[2])
    
    // Animate mouth - opens and closes like classic Pac-Man
    let mouthAngle
    if (isMoving) {
      const cycle = (state.clock.elapsedTime * 4) % 1 // 4 chomps per second
      // Mouth wide open for first half, closed for second half
      if (cycle < 0.5) {
        mouthAngle = 0.9 // Wide open (in radians for drawing)
      } else {
        mouthAngle = 0 // Closed
      }
    } else {
      mouthAngle = 0.3 // Slightly open when idle
    }
    
    // Redraw texture with new mouth angle
    drawPacman(mouthAngle)
    
    // Rotate to face direction
    const rotationAngle = {
      right: 0,
      left: Math.PI,
      up: -Math.PI / 2,
      down: Math.PI / 2
    }[direction] || 0
    
    groupRef.current.rotation.z = rotationAngle
  })
  
  return (
    <group ref={groupRef}>
      {/* Flat sprite with Pac-Man texture */}
      <mesh>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial map={textureRef.current} transparent={true} />
      </mesh>
    </group>
  )
}

// Ghost component
function Ghost({ position, color, isScared, lerpSpeed }) {
  const groupRef = useRef()
  const visualPos = useRef([position[0], position[1], position[2]])
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Detect wraparound (large jump in position indicates tunnel teleport)
    const distX = Math.abs(position[0] - visualPos.current[0])
    
    // If horizontal distance is very large, it's a wraparound - instant teleport
    if (distX > 10) {
      visualPos.current[0] = position[0]
      visualPos.current[1] = position[1]
      visualPos.current[2] = position[2]
    } else {
      // Normal smooth interpolation
      visualPos.current[0] += (position[0] - visualPos.current[0]) * lerpSpeed
      visualPos.current[1] += (position[1] - visualPos.current[1]) * lerpSpeed
      visualPos.current[2] += (position[2] - visualPos.current[2]) * lerpSpeed
    }
    
    // Add bobbing animation
    const bobOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05
    groupRef.current.position.set(
      visualPos.current[0], 
      visualPos.current[1] + bobOffset, 
      visualPos.current[2]
    )
  })
  
  const ghostColor = isScared ? "#2121FF" : color
  
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={ghostColor} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color={ghostColor} />
      </mesh>
      {/* Eyes */}
      {!isScared && (
        <>
          <mesh position={[-0.12, 0.1, 0.25]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.12, 0.1, 0.25]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.12, 0.1, 0.3]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#0000FF" />
          </mesh>
          <mesh position={[0.12, 0.1, 0.3]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#0000FF" />
          </mesh>
        </>
      )}
    </group>
  )
}

// Main game component
function Game({ lives, setLives, score, setScore, gameOver, setGameOver, gameStarted, lerpSpeed }) {
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

function App() {
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

export default App
