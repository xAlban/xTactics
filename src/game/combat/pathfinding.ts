import type { TileCoord, TileData } from '@/types/grid'
import type { Path } from '@/types/combat'

// ---- Stable string key for map/set lookups ----
export function coordKey(coord: TileCoord): string {
  return `${coord.col},${coord.row}`
}

// ---- Cardinal directions: up, down, left, right (no diagonals) ----
const DIRECTIONS: TileCoord[] = [
  { col: 0, row: -1 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
  { col: 1, row: 0 },
]

// ---- BFS node storing distance from origin and parent for path reconstruction ----
export interface BfsNode {
  distance: number
  parent: string | null
}

// ---- Build a set of walkable tile keys from tile data, excluding occupied positions ----
export function buildWalkableSet(
  tiles: TileData[],
  occupiedPositions: TileCoord[],
): Set<string> {
  const occupied = new Set(occupiedPositions.map(coordKey))
  const walkable = new Set<string>()

  for (const tile of tiles) {
    if (tile.type !== 'ground') continue
    const key = coordKey(tile.coord)
    if (!occupied.has(key)) {
      walkable.add(key)
    }
  }

  return walkable
}

// ---- BFS from origin up to maxSteps, returning reachable nodes with parent pointers ----
export function bfsReachable(
  origin: TileCoord,
  maxSteps: number,
  walkable: Set<string>,
): Map<string, BfsNode> {
  const result = new Map<string, BfsNode>()
  const originKey = coordKey(origin)
  result.set(originKey, { distance: 0, parent: null })

  const queue: TileCoord[] = [origin]

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentKey = coordKey(current)
    const currentNode = result.get(currentKey)!

    if (currentNode.distance >= maxSteps) continue

    for (const dir of DIRECTIONS) {
      const neighbor: TileCoord = {
        col: current.col + dir.col,
        row: current.row + dir.row,
      }
      const neighborKey = coordKey(neighbor)

      // ---- Skip if already visited or not walkable ----
      if (result.has(neighborKey)) continue
      if (!walkable.has(neighborKey)) continue

      result.set(neighborKey, {
        distance: currentNode.distance + 1,
        parent: currentKey,
      })
      queue.push(neighbor)
    }
  }

  return result
}

// ---- Extract reachable coordinates excluding the origin ----
export function getReachableCoords(
  reachableMap: Map<string, BfsNode>,
  origin: TileCoord,
): TileCoord[] {
  const originKey = coordKey(origin)
  const coords: TileCoord[] = []

  for (const key of reachableMap.keys()) {
    if (key === originKey) continue
    const [col, row] = key.split(',').map(Number)
    coords.push({ col: col!, row: row! })
  }

  return coords
}

// ---- Reconstruct the path from origin to target using parent pointers ----
export function reconstructPath(
  reachableMap: Map<string, BfsNode>,
  target: TileCoord,
): Path {
  const targetKey = coordKey(target)
  if (!reachableMap.has(targetKey)) return []

  const path: Path = []
  let currentKey: string | null = targetKey

  // ---- Walk back from target to origin via parent pointers ----
  while (currentKey !== null) {
    const [col, row] = currentKey.split(',').map(Number)
    path.unshift({ col: col!, row: row! })
    currentKey = reachableMap.get(currentKey)!.parent
  }

  return path
}
