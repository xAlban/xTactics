import { useGLTF } from '@react-three/drei'
import { getAllModelPaths } from '@/game/models/modelRegistry'
import { getAllDecorationModelPaths } from '@/game/world/decorationRegistry'

// ---- Preload all registered models (units + decorations) ----
// Preload functions silently fail on 404s, so missing files are safe
export function preloadAllModels(): void {
  const unitPaths = getAllModelPaths()
  const decorationPaths = getAllDecorationModelPaths()
  const allPaths = [...unitPaths, ...decorationPaths]
  for (const path of allPaths) {
    useGLTF.preload(path)
  }
}
