import { CELL_SIZE } from '../constants/maze'

export default function Wall({ position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[CELL_SIZE, CELL_SIZE, CELL_SIZE]} />
      <meshStandardMaterial color="#1919A6" />
    </mesh>
  )
}
