import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Ghost({ position, color, isScared, lerpSpeed }) {
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
