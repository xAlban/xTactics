import { useGLTF } from '@react-three/drei'
import { getAllModelPaths } from '@/game/models/modelRegistry'

// ---- Preload all registered models ----
// Preload functions silently fail on 404s, so missing files are safe
export function preloadAllModels(): void {
  const paths = getAllModelPaths()
  for (const path of paths) {
      useGLTF.preload(path)
  }
}
