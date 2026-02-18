import type { PlayerClass } from '@/types/player'
import type { UnitTeam } from '@/types/combat'

// ---- Animation states for 3D models ----
export type AnimationState = 'idle' | 'walk' | 'attack' | 'death' | 'run'

// ---- Configuration for a single 3D model ----
export interface ModelConfig {
  path: string
  scale: number
  rotationY: number
  yOffset: number
  fallbackColor: string
  animationMap?: Record<string, string>
  animationState?: AnimationState
}

// ---- Model configs per player class ----
export const UNIT_MODELS: Record<PlayerClass, ModelConfig> = {
  bomberman: {
    path: 'models/units/Kimono_Male.gltf',
    scale: 0.5,
    rotationY: 0,
    yOffset: 0,
    fallbackColor: '#c0392b',
    animationMap: {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run',
      attack: 'Attack',
      death: 'Death',
    },
  },
  archer: {
    path: 'models/units/BaseCharacter.gltf',
    scale: 0.5,
    rotationY: 0,
    yOffset: 0,
    fallbackColor: '#27ae60',
    animationMap: {
      idle: 'Idle',
      walk: 'Walk',
      attack: 'Attack',
      death: 'Death',
    },
  },
  knight: {
    path: 'models/units/BaseCharacter.gltf',
    scale: 0.5,
    rotationY: 0,
    yOffset: 0,
    fallbackColor: '#2980b9',
    animationMap: {
      idle: 'Idle',
      walk: 'Walk',
      attack: 'Attack',
      death: 'Death',
    },
  },
  mage: {
    path: 'models/units/Wizard.gltf',
    scale: 0.5,
    rotationY: 0,
    yOffset: 0,
    fallbackColor: '#8e44ad',
    animationMap: {
      idle: 'Idle',
      walk: 'Walk',
      attack: 'Attack',
      death: 'Death',
    },
  },
}

// ---- Enemy default model ----
export const ENEMY_MODEL: ModelConfig = {
  path: 'models/units/Goblin_Male.gltf',
  scale: 0.5,
  rotationY: 0,
  yOffset: 0,
  fallbackColor: '#8b0000',
}

// ---- Portal model ----
export const PORTAL_MODEL: ModelConfig = {
  path: 'models/units/Goblin_Male.gltf',
  scale: 1.0,
  rotationY: 0,
  yOffset: 0,
  fallbackColor: '#e74c3c',
}

// ---- Resolve model config for a unit ----
export function getUnitModelConfig(
  playerClass: PlayerClass,
  team: UnitTeam,
): ModelConfig {
  return team === 'enemy' ? ENEMY_MODEL : UNIT_MODELS[playerClass]
}

// ---- Collect all model paths for preloading ----
export function getAllModelPaths(): string[] {
  const paths = Object.values(UNIT_MODELS).map((m) => m.path)
  paths.push(ENEMY_MODEL.path)
  paths.push(PORTAL_MODEL.path)
  return [...new Set(paths)]
}
