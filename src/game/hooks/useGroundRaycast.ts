import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import type { RefObject } from 'react'
import type { Mesh, Group } from 'three'

// ---- Ray origin height: cast from well above any terrain/object ----
const RAY_ORIGIN_Y = 50
const DOWN = new THREE.Vector3(0, -1, 0)

interface UseGroundRaycastOptions {
  groundRef: RefObject<Mesh | null>
  walkablesRef: RefObject<Group | null>
  fallbackGetHeight: (x: number, z: number) => number
}

// ---- Hook that provides a getYAt function using downward raycasting ----
// ---- Only raycasts against ground mesh + walkable surfaces, NOT blocking obstacles ----
export function useGroundRaycast({
  groundRef,
  walkablesRef,
  fallbackGetHeight,
}: UseGroundRaycastOptions) {
  const raycasterRef = useRef(new THREE.Raycaster())
  const originRef = useRef(new THREE.Vector3())

  const getYAt = useCallback(
    (x: number, z: number): number => {
      const raycaster = raycasterRef.current
      const origin = originRef.current
      origin.set(x, RAY_ORIGIN_Y, z)
      raycaster.set(origin, DOWN)

      // ---- Only intersect ground + walkable surfaces (NOT collidable obstacles) ----
      const targets: THREE.Object3D[] = []
      if (groundRef.current) targets.push(groundRef.current)
      if (walkablesRef.current) targets.push(walkablesRef.current)

      if (targets.length === 0) return fallbackGetHeight(x, z)

      const hits = raycaster.intersectObjects(targets, true)
      if (hits.length > 0) {
        return hits[0]!.point.y
      }

      // ---- No hit: fall back to terrain noise ----
      return fallbackGetHeight(x, z)
    },
    [groundRef, walkablesRef, fallbackGetHeight],
  )

  return { getYAt }
}
