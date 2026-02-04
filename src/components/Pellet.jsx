import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Pellet({ position, isPowerPellet = false }) {
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
