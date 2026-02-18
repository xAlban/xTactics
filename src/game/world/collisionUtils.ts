import type { ZoneObject } from '@/types/zone'

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

// ---- Filter only decoration objects (portals are walkable) ----
export function getDecorationObstacles(
  objects: ZoneObject[],
): ZoneObject[] {
  return objects.filter((obj) => obj.type === 'decoration')
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

// ---- Compute shortest path around obstacles using visibility graph + Dijkstra ----
export function findPath(
  from: Point,
  to: Point,
  obstacles: ZoneObject[],
): Point[] {
  const boxes = obstacles.map(toAABB)

  // ---- Direct path is clear, no waypoints needed ----
  if (!isSegmentBlocked(from, to, boxes)) {
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
      if (!isSegmentBlocked(nodes[i]!, nodes[j]!, boxes)) {
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

  // ---- No path found, fall back to direct movement ----
  if (costs[endIdx] === Infinity) {
    return [to]
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
