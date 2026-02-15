import type { Item, InventorySlot } from '@/types/player'

// ---- Equipment items ----

export const IRON_HELM: Item = {
  id: 'iron-helm',
  name: 'Iron Helm',
  description: 'A sturdy iron helmet that protects the head.',
  category: 'equipment',
  subcategory: 'head',
  equipmentSlot: 'head',
  bonusStats: { health: 5 },
  stackable: false,
  icon: 'Shield',
}

export const TRAVELERS_CAPE: Item = {
  id: 'travelers-cape',
  name: "Traveler's Cape",
  description: 'A light cape worn by wanderers, fluttering in the wind.',
  category: 'equipment',
  subcategory: 'cape',
  equipmentSlot: 'cape',
  bonusStats: { agility: 2 },
  stackable: false,
  icon: 'Wind',
}

export const LEATHER_BELT: Item = {
  id: 'leather-belt',
  name: 'Leather Belt',
  description: 'A thick leather belt that bolsters raw strength.',
  category: 'equipment',
  subcategory: 'belt',
  equipmentSlot: 'belt',
  bonusStats: { power: 3 },
  stackable: false,
  icon: 'Minus',
}

export const SWIFT_BOOTS: Item = {
  id: 'swift-boots',
  name: 'Swift Boots',
  description: 'Lightweight boots enchanted for quick movement.',
  category: 'equipment',
  subcategory: 'boots',
  equipmentSlot: 'boots',
  bonusStats: { agility: 4 },
  stackable: false,
  icon: 'Footprints',
}

export const RUBY_RING: Item = {
  id: 'ruby-ring',
  name: 'Ruby Ring',
  description: 'A ring set with a fiery ruby that sharpens the mind.',
  category: 'equipment',
  subcategory: 'ring',
  equipmentSlot: 'ring1',
  bonusStats: { intelligence: 3 },
  stackable: false,
  icon: 'CircleDot',
}

export const EMERALD_RING: Item = {
  id: 'emerald-ring',
  name: 'Emerald Ring',
  description: 'A ring with a gleaming emerald that brings good fortune.',
  category: 'equipment',
  subcategory: 'ring',
  equipmentSlot: 'ring2',
  bonusStats: { luck: 3 },
  stackable: false,
  icon: 'CircleDot',
}

// ---- Consumable items ----

export const HEALTH_POTION: Item = {
  id: 'health-potion',
  name: 'Health Potion',
  description: 'A vial of crimson liquid that restores vitality.',
  category: 'consumable',
  subcategory: 'potion',
  stackable: true,
  icon: 'Heart',
}

export const TELEPORT_POTION: Item = {
  id: 'teleport-potion',
  name: 'Teleport Potion',
  description: 'A swirling blue potion that warps you to another place.',
  category: 'consumable',
  subcategory: 'potion',
  stackable: true,
  icon: 'Sparkles',
}

// ---- Resource items ----

export const PEBBLE: Item = {
  id: 'pebble',
  name: 'Pebble',
  description: 'A smooth, unremarkable pebble. Completely useless.',
  category: 'resource',
  stackable: true,
  icon: 'Circle',
}

// ---- Key items ----

export const KEY_CHAIN: Item = {
  id: 'key-chain',
  name: 'Key Chain',
  description:
    'A jangling key chain with multiple rusty keys. Opens... something.',
  category: 'key',
  stackable: false,
  icon: 'KeyRound',
}

// ---- All items grouped by category ----
export const ALL_ITEMS: Item[] = [
  IRON_HELM,
  TRAVELERS_CAPE,
  LEATHER_BELT,
  SWIFT_BOOTS,
  RUBY_RING,
  EMERALD_RING,
  HEALTH_POTION,
  TELEPORT_POTION,
  PEBBLE,
  KEY_CHAIN,
]

// ---- Default starting inventory for the player ----
export const DEFAULT_INVENTORY: InventorySlot[] = [
  { item: IRON_HELM, quantity: 1 },
  { item: TRAVELERS_CAPE, quantity: 1 },
  { item: LEATHER_BELT, quantity: 1 },
  { item: SWIFT_BOOTS, quantity: 1 },
  { item: RUBY_RING, quantity: 1 },
  { item: EMERALD_RING, quantity: 1 },
  { item: HEALTH_POTION, quantity: 3 },
  { item: TELEPORT_POTION, quantity: 1 },
  { item: PEBBLE, quantity: 5 },
  { item: KEY_CHAIN, quantity: 1 },
]
