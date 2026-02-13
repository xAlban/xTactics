import type { CombatMapDefinition } from '@/types/grid'

// ---- 8x8 arena with obstacle clusters in each corner ----
export const ARENA_SMALL: CombatMapDefinition = {
  name: 'Arena Small',
  layout: [
    'XX....XX',
    'X......X',
    '........',
    '........',
    '........',
    '........',
    'X......X',
    'XX....XX',
  ],
  tileSize: 1.2,
  tileGap: 0.06,
}

// ---- L-shaped corridor using spaces for missing tiles ----
export const L_CORRIDOR: CombatMapDefinition = {
  name: 'L Corridor',
  layout: [
    '...     ',
    '...     ',
    '...     ',
    '........',
    '........',
    '........',
  ],
  tileSize: 1.2,
  tileGap: 0.06,
}

// ---- Cross-shaped map using spaces for empty corners ----
export const CROSS_MAP: CombatMapDefinition = {
  name: 'Cross',
  layout: [
    '  ...  ',
    '  ...  ',
    '.......',
    '.......',
    '.......',
    '  ...  ',
    '  ...  ',
  ],
  tileSize: 1.2,
  tileGap: 0.06,
}
