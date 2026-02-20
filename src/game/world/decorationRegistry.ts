// ---- Configuration for decoration 3D models ----
export interface DecorationModelConfig {
  path: string
  scale: number
  yOffset: number
  hasCollision: boolean
}

// ---- Registry mapping decoration IDs to their model configs ----
export const DECORATION_MODELS: Record<string, DecorationModelConfig> = {
  // ---- Trees ----
  'common-tree-1': {
    path: 'models/objects/CommonTree_1.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },
  'common-tree-2': {
    path: 'models/objects/CommonTree_2.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },
  'common-tree-3': {
    path: 'models/objects/CommonTree_3.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },
  'common-tree-4': {
    path: 'models/objects/CommonTree_4.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },
  'common-tree-5': {
    path: 'models/objects/CommonTree_5.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },

  // ---- Bushes ----
  'bush-common': {
    path: 'models/objects/Bush_Common.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },
  'bush-flowers': {
    path: 'models/objects/Bush_Common_Flowers.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },

  // ---- Flowers ----
  'flower-group-3': {
    path: 'models/objects/Flower_3_Group.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },
  'flower-group-4': {
    path: 'models/objects/Flower_4_Group.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },
  'flower-single-3': {
    path: 'models/objects/Flower_3_Single.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },
  'flower-single-4': {
    path: 'models/objects/Flower_4_Single.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },

  // ---- Grass ----
  'grass-short': {
    path: 'models/objects/Grass_Common_Short.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },
  'grass-tall': {
    path: 'models/objects/Grass_Common_Tall.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },

  // ---- Plants & Ferns ----
  fern: {
    path: 'models/objects/Fern_1.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },
  plant: {
    path: 'models/objects/Plant_1.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },

  // ---- Rocks ----
  'rock-medium-1': {
    path: 'models/objects/Rock_Medium_1.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },
  'rock-medium-2': {
    path: 'models/objects/Rock_Medium_2.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },
  'rock-medium-3': {
    path: 'models/objects/Rock_Medium_3.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: true,
  },

  // ---- Rock Paths ----
  'rock-path-wide': {
    path: 'models/objects/RockPath_Round_Wide.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
    
  },
  'rock-path-small': {
    path: 'models/objects/RockPath_Round_Small_1.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },

  // ---- Mushrooms ----
  mushroom: {
    path: 'models/objects/Mushroom_Common.gltf',
    scale: 1.0,
    yOffset: 0,
    hasCollision: false,
  },
}

// ---- Get all decoration model paths for preloading ----
export function getAllDecorationModelPaths(): string[] {
  return Object.values(DECORATION_MODELS).map((config) => config.path)
}
