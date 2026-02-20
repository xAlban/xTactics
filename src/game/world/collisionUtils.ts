import type { ZoneObject } from '@/types/zone'
import type { ZoneTerrain } from '@/game/world/terrainUtils'

interface Point {
  x: number
  z: number
}

interface AABB {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

// ---- Padding around obstacles for player clearance ----
const OBSTACLE_PADDING = 0.5

// ---- Filter only decoration objects with collision (portals, noCollision, and walkable decorations are excluded) ----
export function getDecorationObstacles(
  objects: ZoneObject[],
): ZoneObject[] {
  return objects.filter(
    (obj) =>
      obj.type === 'decoration' && !obj.noCollision && !obj.walkable,
  )
}

// ---- Build padded AABB from a zone object ----
function toAABB(obj: ZoneObject): AABB {
  return {
    minX: obj.position.x - obj.size.x - OBSTACLE_PADDING,
    maxX: obj.position.x + obj.size.x + OBSTACLE_PADDING,
    minZ: obj.position.z - obj.size.z - OBSTACLE_PADDING,
    maxZ: obj.position.z + obj.size.z + OBSTACLE_PADDING,
  }
}

// ---- Liang-Barsky segment vs AABB intersection ----
function segmentIntersectsAABB(
  from: Point,
  to: Point,
  box: AABB,
): boolean {
  const dx = to.x - from.x
  const dz = to.z - from.z

  const p = [-dx, dx, -dz, dz]
  const q = [
    from.x - box.minX,
    box.maxX - from.x,
    from.z - box.minZ,
    box.maxZ - from.z,
  ]

  let tMin = 0
  let tMax = 1

  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]!) < 1e-10) {
      if (q[i]! < 0) return false
    } else {
      const t = q[i]! / p[i]!
      if (p[i]! < 0) {
        tMin = Math.max(tMin, t)
      } else {
        tMax = Math.min(tMax, t)
      }
      if (tMin > tMax) return false
    }
  }

  return true
}

// ---- Check if a segment is blocked by any obstacle ----
function isSegmentBlocked(from: Point, to: Point, boxes: AABB[]): boolean {
  return boxes.some((box) => segmentIntersectsAABB(from, to, box))
}

// ---- Check if a point is strictly inside any AABB (not on boundary) ----
function isPointInsideAABB(p: Point, boxes: AABB[]): boolean {
  return boxes.some(
    (box) =>
      p.x > box.minX &&
      p.x < box.maxX &&
      p.z > box.minZ &&
      p.z < box.maxZ,
  )
}

// ---- Distance between two points ----
function dist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

// ---- Check if a segment has any slope exceeding the threshold ----
// ---- Samples at 1-unit intervals along the segment ----
function segmentExceedsSlope(
  from: Point,
  to: Point,
  terrain: ZoneTerrain,
): boolean {
  const d = dist(from, to)
  if (d < 0.01) return false

  const steps = Math.max(1, Math.ceil(d))
  let prevH = terrain.getHeightAt(from.x, from.z)

  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const x = from.x + (to.x - from.x) * t
    const z = from.z + (to.z - from.z) * t
    const h = terrain.getHeightAt(x, z)
    const segLen = d / steps
    const slope = Math.abs(h - prevH) / segLen
    if (slope > terrain.slopeThreshold) return true
    prevH = h
  }

  return false
}

// ---- Compute shortest path around obstacles using visibility graph + Dijkstra ----
export function findPath(
  from: Point,
  to: Point,
  obstacles: ZoneObject[],
  terrain?: ZoneTerrain,
): Point[] {
  const boxes = obstacles.map(toAABB)

  // ---- Direct path is clear and slope is walkable, no waypoints needed ----
  if (
    !isSegmentBlocked(from, to, boxes) &&
    (!terrain || !segmentExceedsSlope(from, to, terrain))
  ) {
    return [to]
  }

  // ---- Generate corner waypoints slightly outside each obstacle AABB ----
  const CORNER_OFFSET = 0.1
  const corners: Point[] = []
  for (const box of boxes) {
    corners.push(
      { x: box.minX - CORNER_OFFSET, z: box.minZ - CORNER_OFFSET },
      { x: box.maxX + CORNER_OFFSET, z: box.minZ - CORNER_OFFSET },
      { x: box.minX - CORNER_OFFSET, z: box.maxZ + CORNER_OFFSET },
      { x: box.maxX + CORNER_OFFSET, z: box.maxZ + CORNER_OFFSET },
    )
  }

  // ---- Filter out corners that land inside another obstacle ----
  const validCorners = corners.filter((c) => !isPointInsideAABB(c, boxes))

  // ---- Build node list: start + corners + end ----
  const nodes: Point[] = [from, ...validCorners, to]
  const n = nodes.length
  const startIdx = 0
  const endIdx = n - 1

  // ---- Build adjacency with distances (visibility graph) ----
  const adj: { to: number; cost: number }[][] = Array.from(
    { length: n },
    () => [],
  )
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (
        !isSegmentBlocked(nodes[i]!, nodes[j]!, boxes) &&
        (!terrain ||
          !segmentExceedsSlope(nodes[i]!, nodes[j]!, terrain))
      ) {
        const d = dist(nodes[i]!, nodes[j]!)
        adj[i]!.push({ to: j, cost: d })
        adj[j]!.push({ to: i, cost: d })
      }
    }
  }

  // ---- Dijkstra shortest path ----
  const costs = new Array(n).fill(Infinity) as number[]
  const prev = new Array(n).fill(-1) as number[]
  const visited = new Array(n).fill(false) as boolean[]
  costs[startIdx] = 0

  for (let step = 0; step < n; step++) {
    // ---- Find unvisited node with lowest cost ----
    let u = -1
    let best = Infinity
    for (let i = 0; i < n; i++) {
      if (!visited[i] && costs[i]! < best) {
        best = costs[i]!
        u = i
      }
    }
    if (u === -1 || u === endIdx) break
    visited[u] = true

    for (const edge of adj[u]!) {
      const newCost = costs[u]! + edge.cost
      if (newCost < costs[edge.to]!) {
        costs[edge.to] = newCost
        prev[edge.to] = u
      }
    }
  }

  // ---- No path found: return empty to block movement ----
  if (costs[endIdx] === Infinity) {
    return []
  }

  // ---- Reconstruct path (skip start node) ----
  const path: Point[] = []
  let cur = endIdx
  while (cur !== startIdx) {
    path.push(nodes[cur]!)
    cur = prev[cur]!
  }
  path.reverse()

  return path
}
