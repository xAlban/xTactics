import { useState, useCallback, useRef } from 'react'
import { useGameModeStore } from '@/stores/gameModeStore'
import type {
  EquipmentSlot,
  Item,
  ItemCategory,
  InventorySlot,
} from '@/types/player'
import type { LucideIcon } from 'lucide-react'
import {
  Shield,
  Wind,
  Minus,
  Footprints,
  CircleDot,
  Heart,
  Sparkles,
  Circle,
  KeyRound,
  Package,
} from 'lucide-react'

// ---- Map icon string to Lucide component ----
const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Wind,
  Minus,
  Footprints,
  CircleDot,
  Heart,
  Sparkles,
  Circle,
  KeyRound,
}

// ---- Player class colors (matches UnitCube) ----
const CLASS_COLORS: Record<string, string> = {
  bomberman: '#c0392b',
  archer: '#27ae60',
  knight: '#2980b9',
  mage: '#8e44ad',
}

// ---- Equipment slot display order and labels ----
const EQUIPMENT_SLOTS: { slot: EquipmentSlot; label: string }[] = [
  { slot: 'head', label: 'Head' },
  { slot: 'cape', label: 'Cape' },
  { slot: 'ring1', label: 'Ring 1' },
  { slot: 'ring2', label: 'Ring 2' },
  { slot: 'belt', label: 'Belt' },
  { slot: 'boots', label: 'Boots' },
]

// ---- Tab filter type: all categories + 'all' ----
type TabFilter = ItemCategory | 'all'

// ---- Category tabs ----
const CATEGORY_TABS: { category: TabFilter; label: string }[] = [
  { category: 'all', label: 'All' },
  { category: 'equipment', label: 'Equipment' },
  { category: 'consumable', label: 'Consumables' },
  { category: 'resource', label: 'Resources' },
  { category: 'key', label: 'Key Items' },
]

// ---- Stat display labels ----
const STAT_LABELS: Record<string, string> = {
  health: 'Health',
  power: 'Power',
  intelligence: 'Intelligence',
  agility: 'Agility',
  luck: 'Luck',
}

// ---- Renders a Lucide icon from an icon name string ----
function ItemIcon({
  iconName,
  size = 16,
}: {
  iconName?: string
  size?: number
}) {
  const IconComponent = iconName ? ICON_MAP[iconName] : null
  if (!IconComponent) {
    return <Package size={size} className="text-white/30" />
  }
  return <IconComponent size={size} />
}

// ---- Item tooltip panel ----
function ItemTooltip({
  item,
  position,
  pinned,
  onClose,
}: {
  item: Item
  position: { x: number; y: number }
  pinned: boolean
  onClose: () => void
}) {
  return (
    <div
      className="absolute z-50 w-48 rounded border border-white/20 bg-black/90 p-2 text-xs shadow-lg backdrop-blur-sm"
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {pinned && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute top-1 right-1 text-white/40 hover:text-white"
        >
          ✕
        </button>
      )}
      <div className="font-bold text-white">{item.name}</div>
      <div className="mt-1 text-white/50 capitalize">{item.category}</div>
      <div className="mt-1 text-white/60">{item.description}</div>
      {item.bonusStats && Object.keys(item.bonusStats).length > 0 && (
        <div className="mt-2 border-t border-white/10 pt-1">
          {Object.entries(item.bonusStats).map(([stat, val]) => (
            <div key={stat} className="flex justify-between text-green-400">
              <span>{STAT_LABELS[stat] ?? stat}</span>
              <span>+{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Single equipment slot ----
function EquipmentSlotBox({
  slot,
  label,
  equipped,
  onUnequip,
  onDrop,
  onHover,
  onLeave,
  onClick,
}: {
  slot: EquipmentSlot
  label: string
  equipped: Item | null
  onUnequip: () => void
  onDrop: (itemId: string) => void
  onHover: (item: Item, rect: DOMRect) => void
  onLeave: () => void
  onClick: (item: Item) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const data = e.dataTransfer.getData('text/plain')
      // ---- Ignore drops from other equipment slots ----
      if (data.startsWith('equip:')) return
      if (data) onDrop(data)
    },
    [onDrop],
  )

  return (
    <div
      ref={ref}
      className={`flex h-10 w-full items-center gap-1 rounded border px-1 text-xs ${
        dragOver
          ? 'border-blue-400 bg-blue-400/20'
          : equipped
            ? 'border-white/20 bg-white/10 cursor-grab'
            : 'border-white/10 bg-white/5'
      }`}
      draggable={!!equipped}
      onDragStart={(e) => {
        if (!equipped) {
          e.preventDefault()
          return
        }
        // ---- Tag drag data with equip: prefix so inventory can identify it ----
        e.dataTransfer.setData('text/plain', `equip:${slot}`)
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (equipped) onUnequip()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => {
        if (equipped && ref.current) {
          onHover(equipped, ref.current.getBoundingClientRect())
        }
      }}
      onMouseLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation()
        if (equipped) onClick(equipped)
      }}
    >
      {equipped ? (
        <>
          <ItemIcon iconName={equipped.icon} size={14} />
          <span className="truncate text-white/80">{equipped.name}</span>
        </>
      ) : (
        <span className="text-white/30">{label}</span>
      )}
    </div>
  )
}

// ---- Single inventory grid cell ----
function InventoryCell({
  slot,
  onDragStart,
  onDoubleClick,
  onHover,
  onLeave,
  onClick,
}: {
  slot: InventorySlot | null
  onDragStart: (itemId: string) => void
  onDoubleClick: (itemId: string) => void
  onHover: (item: Item, rect: DOMRect) => void
  onLeave: () => void
  onClick: (item: Item) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  if (!slot) {
    return (
      <div className="flex aspect-square items-center justify-center rounded border border-white/5 bg-white/5" />
    )
  }

  return (
    <div
      ref={ref}
      className="relative flex aspect-square cursor-grab items-center justify-center rounded border border-white/15 bg-white/10 hover:border-white/30 hover:bg-white/15"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', slot.item.id)
        onDragStart(slot.item.id)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick(slot.item.id)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => {
        if (ref.current) {
          onHover(slot.item, ref.current.getBoundingClientRect())
        }
      }}
      onMouseLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation()
        onClick(slot.item)
      }}
    >
      <ItemIcon iconName={slot.item.icon} size={20} />
      {slot.quantity > 1 && (
        <span className="absolute right-0.5 bottom-0.5 text-[10px] font-bold text-white/70">
          {slot.quantity}
        </span>
      )}
    </div>
  )
}

// ---- Main inventory panel ----
export default function InventoryPanel() {
  const player = useGameModeStore((s) => s.player)
  const equipItem = useGameModeStore((s) => s.equipItem)
  const unequipItem = useGameModeStore((s) => s.unequipItem)

  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [tooltip, setTooltip] = useState<{
    item: Item
    position: { x: number; y: number }
    pinned: boolean
  } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ---- Category sort order matching tab order ----
  const CATEGORY_ORDER: Record<string, number> = {
    equipment: 0,
    consumable: 1,
    resource: 2,
    key: 3,
  }

  // ---- Filter inventory by active tab ('all' shows everything sorted by tab order) ----
  const filteredItems =
    activeTab === 'all'
      ? [...player.inventory].sort(
          (a, b) =>
            (CATEGORY_ORDER[a.item.category] ?? 99) -
            (CATEGORY_ORDER[b.item.category] ?? 99),
        )
      : player.inventory.filter((slot) => slot.item.category === activeTab)

  // ---- Fill grid to always show at least 24 cells (6x4) ----
  const gridCells: (InventorySlot | null)[] = [...filteredItems]
  while (gridCells.length < 24) {
    gridCells.push(null)
  }

  // ---- Tooltip dimensions for clamping (w-48 = 192px, estimated height ~140px) ----
  const TOOLTIP_W = 192
  const TOOLTIP_H = 140

  // ---- Tooltip handlers ----
  const handleHover = useCallback(
    (item: Item, rect: DOMRect) => {
      if (tooltip?.pinned) return
      if (!panelRef.current) return
      const panelRect = panelRef.current.getBoundingClientRect()
      const panelW = panelRect.width
      const panelH = panelRect.height

      // ---- Preferred position: right of the hovered element ----
      let x = rect.left - panelRect.left + rect.width + 4
      let y = rect.top - panelRect.top

      // ---- Clamp horizontally: if overflows right, flip to left side ----
      if (x + TOOLTIP_W > panelW) {
        x = rect.left - panelRect.left - TOOLTIP_W - 4
      }
      // ---- If still overflows left, pin to left edge ----
      if (x < 0) x = 4

      // ---- Clamp vertically ----
      if (y + TOOLTIP_H > panelH) {
        y = panelH - TOOLTIP_H - 4
      }
      if (y < 0) y = 4

      setTooltip({ item, position: { x, y }, pinned: false })
    },
    [tooltip?.pinned],
  )

  const handleLeave = useCallback(() => {
    if (tooltip?.pinned) return
    setTooltip(null)
  }, [tooltip?.pinned])

  const handleClick = useCallback(
    (item: Item) => {
      if (tooltip?.pinned && tooltip.item.id === item.id) {
        setTooltip(null)
      } else if (!panelRef.current) {
        return
      } else {
        setTooltip((prev) => (prev ? { ...prev, pinned: true } : null))
      }
    },
    [tooltip],
  )

  const closeTooltip = useCallback(() => {
    setTooltip(null)
  }, [])

  // ---- Equip from inventory via double-click ----
  const handleEquipFromInventory = useCallback(
    (itemId: string) => {
      equipItem(itemId)
      setTooltip(null)
    },
    [equipItem],
  )

  // ---- Equip from drag-and-drop onto equipment slot ----
  const handleDropOnSlot = useCallback(
    (itemId: string) => {
      equipItem(itemId)
      setTooltip(null)
    },
    [equipItem],
  )

  // ---- Unequip from drag-and-drop onto inventory grid ----
  const handleDropOnInventory = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const data = e.dataTransfer.getData('text/plain')
      if (data.startsWith('equip:')) {
        const slot = data.replace('equip:', '') as EquipmentSlot
        unequipItem(slot)
        setTooltip(null)
      }
    },
    [unequipItem],
  )

  const classColor = CLASS_COLORS[player.playerClass] ?? '#ffffff'

  return (
    <div ref={panelRef} className="relative flex h-full w-full gap-0 pt-6">
      {/* ---- Left column: Player model + equipment slots ---- */}
      <div className="flex w-[45%] flex-col items-center gap-1 border-r border-white/10 p-2">
        {/* ---- Player model placeholder ---- */}
        <div
          className="mb-2 flex aspect-square w-full max-w-[120px] items-center justify-center rounded"
          style={{ backgroundColor: classColor }}
        >
          <span className="text-xs font-bold text-white/70 capitalize">
            {player.playerClass}
          </span>
        </div>

        {/* ---- Equipment slots ---- */}
        <div className="flex w-full flex-col gap-1">
          {EQUIPMENT_SLOTS.map(({ slot, label }) => (
            <EquipmentSlotBox
              key={slot}
              slot={slot}
              label={label}
              equipped={player.equipment[slot]}
              onUnequip={() => {
                unequipItem(slot)
                setTooltip(null)
              }}
              onDrop={handleDropOnSlot}
              onHover={handleHover}
              onLeave={handleLeave}
              onClick={handleClick}
            />
          ))}
        </div>
      </div>

      {/* ---- Right column: Tabs + inventory grid ---- */}
      <div className="flex w-[55%] flex-col">
        {/* ---- Category tabs ---- */}
        <div className="flex border-b border-white/10">
          {CATEGORY_TABS.map(({ category, label }) => (
            <button
              key={category}
              onClick={(e) => {
                e.stopPropagation()
                setActiveTab(category)
                setTooltip(null)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`flex-1 px-1 py-1.5 text-[10px] font-medium ${
                activeTab === category
                  ? 'border-b-2 border-green-400 text-green-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ---- Scrollable inventory grid (also a drop zone for unequipping) ---- */}
        <div
          className="flex-1 overflow-y-auto p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnInventory}
        >
          <div className="grid grid-cols-6 gap-1">
            {gridCells.map((slot, i) => (
              <InventoryCell
                key={slot ? slot.item.id : `empty-${i}`}
                slot={slot}
                onDragStart={() => {}}
                onDoubleClick={handleEquipFromInventory}
                onHover={handleHover}
                onLeave={handleLeave}
                onClick={handleClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---- Item tooltip overlay ---- */}
      {tooltip && (
        <ItemTooltip
          item={tooltip.item}
          position={tooltip.position}
          pinned={tooltip.pinned}
          onClose={closeTooltip}
        />
      )}
    </div>
  )
}
