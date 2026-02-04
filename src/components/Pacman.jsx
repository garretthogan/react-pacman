import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Pacman({ position, direction, isMoving, lerpSpeed }) {
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
