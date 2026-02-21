import type { ZoneDefinition, ZoneObject, WorldMap } from '@/types/zone'
import { PORTAL_COMBAT_SETUP } from '@/game/combat/combatSetups'

// ---- Helper to create a decoration object ----
function deco(
  id: string,
  modelId: string,
  x: number,
  z: number,
  opts?: {
    sizeX?: number
    sizeZ?: number
    scale?: number
    rotationY?: number
    noCollision?: boolean
  },
): ZoneObject {
  return {
    id,
    type: 'decoration',
    position: { x, z },
    size: { x: opts?.sizeX ?? 1, z: opts?.sizeZ ?? 1 },
    modelId,
    scale: opts?.scale,
    rotationY: opts?.rotationY,
    noCollision: opts?.noCollision,
  }
}

// ---- Helper to create multiple scattered decorations of the same type ----
function scatter(
  prefix: string,
  modelId: string,
  positions: [number, number][],
  opts?: {
    sizeX?: number
    sizeZ?: number
    scale?: number
    noCollision?: boolean
    randomRotation?: boolean
    walkable?: boolean
  },
): ZoneObject[] {
  return positions.map(([x, z], i) =>
    deco(`${prefix}-${i}`, modelId, x, z, {
      ...opts,
      rotationY: opts?.randomRotation
        ? ((i * 137.5 * Math.PI) / 180) % (2 * Math.PI)
        : undefined,
    }),
  )
}

// =====================================================
// GRASS ZONE - "Green Meadow" (200x200)
// Layout based on provided image:
//   Top-left: scattered trees (open meadow)
//   Top-right: dense forest
//   Center-left: flower field
//   Left edge: dirt road (rock path decorations)
//   Bottom-left: village area with bush fence
//   Bottom-right diagonal: rock road to portal
//   Bottom-right corner: zone portal
// =====================================================

const grassObjects: ZoneObject[] = [
  // ================ SCATTERED TREES (top-left meadow) ================
  ...scatter(
    'meadow-tree',
    'common-tree-1',
    [
      [-70, -80],
      [-55, -70],
      [-80, -55],
    ],
    { sizeX: 2, sizeZ: 2, scale: 3, randomRotation: true },
  ),
  ...scatter(
    'meadow-tree-b',
    'common-tree-3',
    [
      [-40, -60],
      [-60, -40],
    ],
    { sizeX: 2, sizeZ: 2, scale: 2.5, randomRotation: true },
  ),
  ...scatter('meadow-tree-c', 'common-tree-5', [[-75, -35]], {
    sizeX: 2,
    sizeZ: 2,
    scale: 2,
    randomRotation: true,
  }),

  // ================ DENSE FOREST (top-right) ================
  // ---- Outer edge trees ----
  ...scatter(
    'forest-edge',
    'common-tree-2',
    [
      [10, -85],
      [25, -90],
      [45, -88],
      [65, -85],
      [80, -80],
      [90, -65],
      [88, -45],
      [85, -25],
    ],
    { sizeX: 2, sizeZ: 2, scale: 5, randomRotation: true },
  ),
  // ---- Interior dense trees ----
  ...scatter(
    'forest-inner-1',
    'common-tree-1',
    [
      [20, -75],
      [40, -70],
      [60, -75],
      [75, -60],
      [30, -55],
      [55, -55],
      [70, -40],
      [80, -50],
    ],
    { sizeX: 2, sizeZ: 2, scale: 3, randomRotation: true },
  ),
  ...scatter(
    'forest-inner-2',
    'common-tree-4',
    [
      [35, -80],
      [50, -65],
      [65, -50],
      [45, -45],
      [25, -65],
      [75, -70],
      [85, -35],
    ],
    { sizeX: 2, sizeZ: 2, scale: 3, randomRotation: true },
  ),
  ...scatter(
    'forest-inner-3',
    'common-tree-5',
    [
      [15, -60],
      [55, -80],
      [70, -55],
      [40, -35],
      [60, -35],
    ],
    { sizeX: 2, sizeZ: 2, scale: 3, randomRotation: true },
  ),
  // ---- Forest undergrowth (ferns and plants) ----
  ...scatter(
    'forest-fern',
    'fern',
    [
      [22, -70],
      [38, -60],
      [52, -72],
      [68, -48],
      [45, -50],
      [30, -42],
      [62, -62],
      [78, -55],
    ],
    { noCollision: true, scale: 3, randomRotation: true },
  ),
  ...scatter(
    'forest-plant',
    'plant',
    [
      [18, -68],
      [42, -58],
      [58, -68],
      [72, -42],
      [48, -38],
    ],
    { noCollision: true, scale: 2, randomRotation: true },
  ),
  // ---- Forest mushrooms ----
  ...scatter(
    'forest-mush',
    'mushroom',
    [
      [28, -58],
      [62, -55],
      [50, -42],
    ],
    { noCollision: true, scale: 3, randomRotation: true },
  ),

  // ================ FLOWER FIELD (center-left) ================
  ...scatter(
    'flower-a',
    'flower-group-3',
    [
      [-50, -15],
      [-40, -20],
      [-55, -5],
      [-45, 0],
      [-35, -10],
      [-60, -10],
      [-50, 5],
      [-40, 10],
      [-55, 15],
      [-30, -5],
      [-45, -25],
      [-60, 5],
    ],
    { noCollision: true, scale: 2.5, randomRotation: true },
  ),
  ...scatter(
    'flower-b',
    'flower-group-4',
    [
      [-48, -8],
      [-38, -15],
      [-52, 8],
      [-42, 5],
      [-58, -18],
      [-32, 2],
      [-56, 12],
      [-44, -22],
    ],
    { noCollision: true, scale: 3, randomRotation: true },
  ),
  ...scatter(
    'flower-single-a',
    'flower-single-3',
    [
      [-47, -12],
      [-37, 8],
      [-57, -2],
      [-43, 15],
      [-33, -18],
    ],
    { noCollision: true, scale: 3, randomRotation: true },
  ),
  // ---- Grass tufts in the flower field ----
  ...scatter(
    'field-grass',
    'grass-tall',
    [
      [-50, -20],
      [-40, -5],
      [-55, 10],
      [-35, 5],
      [-60, -15],
      [-45, 12],
    ],
    { noCollision: true, scale: 2, randomRotation: true },
  ),

  // ================ DIRT ROAD (left edge, vertical) ================
  ...scatter(
    'dirt-road',
    'rock-path-wide',
    [
      [-70, -25],
      [-70, -15],
      [-70, -5],
      [-70, 5],
      [-70, 15],
      [-70, 25],
    ],
    { noCollision: false, scale: 3, walkable: true },
  ),
  // ---- Road connecting top to flower field ----
  ...scatter(
    'dirt-road-top',
    'rock-path-wide',
    [
      [-65, -30],
      [-60, -30],
      [-55, -30],
      [-50, -30],
    ],
    { noCollision: false, scale: 3, walkable: true },
  ),

  // ================ ROCK ROAD (diagonal, forest to portal) ================
  ...scatter(
    'rock-road',
    'rock-path-wide',
    [
      [40, -20],
      [48, -12],
      [56, -4],
      [64, 4],
      [72, 12],
      [80, 20],
      [85, 30],
      [88, 40],
      [90, 50],
      [90, 60],
      [90, 70],
    ],
    { noCollision: false, scale: 2.0, walkable: true },
  ),
  ...scatter(
    'road-rock',
    'rock-path-small',
    [
      [44, -18],
      [52, -8],
      [60, 0],
      [68, 8],
      [76, 18],
      [83, 28],
      [86, 38],
    ],
    { noCollision: false, scale: 1.5, randomRotation: true, walkable: true },
  ),

  // ================ VILLAGE AREA (bottom-left) with bush fence ================
  // ---- West fence ----
  ...scatter(
    'village-fence-w',
    'bush-common',
    [
      [-85, 40],
      [-85, 48],
      [-85, 56],
      [-85, 64],
      [-85, 72],
      [-85, 80],
    ],
    { sizeX: 1.5, sizeZ: 1.5, scale: 1.2 },
  ),
  // ---- South fence ----
  ...scatter(
    'village-fence-s',
    'bush-common',
    [
      [-80, 85],
      [-72, 85],
      [-64, 85],
      [-56, 85],
      [-48, 85],
    ],
    { sizeX: 1.5, sizeZ: 1.5, scale: 1.2 },
  ),
  // ---- East fence ----
  ...scatter(
    'village-fence-e',
    'bush-common',
    [
      [-45, 80],
      [-45, 72],
      [-45, 64],
      [-45, 56],
      [-45, 48],
      [-45, 40],
    ],
    { sizeX: 1.5, sizeZ: 1.5, scale: 1.2 },
  ),
  // ---- North fence (with flowers) ----
  ...scatter(
    'village-fence-n',
    'bush-flowers',
    [
      [-80, 38],
      [-72, 38],
      [-64, 38],
      [-56, 38],
      [-48, 38],
    ],
    { sizeX: 1.5, sizeZ: 1.5, scale: 1.2 },
  ),
  // ---- Village interior rocks (building placeholders) ----
  ...scatter(
    'village-rock',
    'rock-medium-1',
    [
      [-70, 55],
      [-60, 65],
      [-72, 72],
    ],
    { sizeX: 2, sizeZ: 2, scale: 2.0, randomRotation: true },
  ),
  deco('village-rock-b', 'rock-medium-2', -55, 50, {
    sizeX: 2,
    sizeZ: 2,
    scale: 2.0,
  }),

  // ================ SCATTERED GRASS & SMALL DECORATIONS ================
  ...scatter(
    'grass-a',
    'grass-short',
    [
      [-20, -40],
      [0, -30],
      [-10, -50],
      [10, -15],
      [-25, 20],
      [5, 30],
      [-15, 45],
      [20, 50],
      [-30, 60],
      [15, 70],
    ],
    { noCollision: true, scale: 1.0, randomRotation: true },
  ),
  ...scatter(
    'grass-b',
    'grass-tall',
    [
      [-5, -45],
      [15, -25],
      [-20, 10],
      [0, 40],
      [-10, 55],
      [25, 65],
      [-25, 75],
    ],
    { noCollision: true, scale: 1.0, randomRotation: true },
  ),

  // ---- A few scattered rocks ----
  deco('lone-rock-1', 'rock-medium-3', 5, 10, {
    sizeX: 1.5,
    sizeZ: 1.5,
    scale: 1.5,
    rotationY: 0.8,
  }),
  deco('lone-rock-2', 'rock-medium-1', -15, 35, {
    sizeX: 1.5,
    sizeZ: 1.5,
    scale: 1.2,
    rotationY: 2.1,
  }),

  // ================ PORTALS ================
  {
    id: 'grass-combat-portal',
    type: 'combatPortal',
    position: { x: -60, z: 60 },
    size: { x: 0.8, z: 0.8 },
    combatSetup: PORTAL_COMBAT_SETUP,
  },
  {
    id: 'grass-to-rock',
    type: 'zonePortal',
    position: { x: 85, z: 80 },
    size: { x: 0.8, z: 0.8 },
    targetZoneId: 'rock-zone',
    targetSpawnPosition: { x: -11, z: 0 },
  },
]

// ---- Grass zone: starting area with nature, village, forest ----
export const GRASS_ZONE: ZoneDefinition = {
  id: 'grass-zone',
  name: 'Green Meadow',
  groundType: 'grass',
  width: 200,
  height: 200,
  defaultSpawn: { x: -65, z: 0 },
  objects: grassObjects,
}

// ---- Rock zone: secondary area with zone transition back to grass ----
export const ROCK_ZONE: ZoneDefinition = {
  id: 'rock-zone',
  name: 'Rocky Plateau',
  groundType: 'rock',
  width: 30,
  height: 30,
  defaultSpawn: { x: 0, z: 0 },
  objects: [
    {
      id: 'rock-deco-1',
      type: 'decoration',
      position: { x: -4, z: 6 },
      size: { x: 1, z: 1 },
    },
    {
      id: 'rock-to-grass',
      type: 'zonePortal',
      position: { x: -13, z: 0 },
      size: { x: 0.8, z: 0.8 },
      targetZoneId: 'grass-zone',
      targetSpawnPosition: { x: 80, z: 75 },
    },
  ],
}

// ---- World map connecting all zones ----
export const WORLD_MAP: WorldMap = {
  zones: [GRASS_ZONE, ROCK_ZONE],
  startZoneId: 'grass-zone',
}
