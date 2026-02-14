import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { GridConfig } from '@/types/grid'
import { gridToWorld } from '@/game/map/gridUtils'
import {
  useFloatingNumberStore,
  FLOATING_NUMBER_DURATION,
} from '@/stores/floatingNumberStore'

const ROTATION_Y = Math.PI / 4

// ---- How far the number floats upward in world units ----
const FLOAT_DISTANCE_Y = 1.2

// ---- Reusable vector to avoid allocation per frame ----
const _vec = new Vector3()

// ---- Projects active floating numbers from world to screen each frame ----
function FloatingNumberProjector({ config }: { config: GridConfig }) {
  const { camera, size } = useThree()

  useFrame(() => {
    const store = useFloatingNumberStore.getState()
    const { numbers } = store
    if (numbers.length === 0) {
      if (store.projected.length > 0) store.setProjected([])
      return
    }

    const now = performance.now()
    const projected = []
    const expired: number[] = []

    for (const entry of numbers) {
      const elapsed = now - entry.createdAt
      if (elapsed >= FLOATING_NUMBER_DURATION) {
        expired.push(entry.id)
        continue
      }

      // ---- Progress 0..1 over the duration ----
      const t = elapsed / FLOATING_NUMBER_DURATION

      // ---- Fade out in the last 40% of the duration ----
      const opacity = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4

      // ---- World position with upward float ----
      const worldPos = gridToWorld(entry.tileCoord, config)
      _vec.set(worldPos.x, 0.8 + FLOAT_DISTANCE_Y * t, worldPos.z)
      _vec.applyAxisAngle(new Vector3(0, 1, 0), ROTATION_Y)
      _vec.project(camera)

      const x = (_vec.x * 0.5 + 0.5) * size.width
      const y = (-_vec.y * 0.5 + 0.5) * size.height

      projected.push({
        id: entry.id,
        value: entry.value,
        type: entry.type,
        x,
        y,
        opacity,
      })
    }

    // ---- Remove expired numbers ----
    for (const id of expired) {
      store.removeFloatingNumber(id)
    }

    store.setProjected(projected)
  })

  return null
}

export default FloatingNumberProjector
