import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useAppStore } from '@/stores/appStore'
import { useCharacterStore } from '@/stores/characterStore'
import { UNIT_MODELS } from '@/game/models/modelRegistry'
import ModelRenderer from '@/game/models/GLTFModel'
import type { CharacterSlot } from '@/types/character'
import { MAX_CHARACTER_SLOTS } from '@/types/character'
import { Plus, Trash2, LogOut } from 'lucide-react'

// ---- Class display names ----
const CLASS_NAMES: Record<string, string> = {
  bomberman: 'Bomberman',
  archer: 'Archer',
  knight: 'Knight',
  mage: 'Mage',
}

// ---- 3D model preview for a character slot ----
function CharacterPreview({ slot }: { slot: CharacterSlot }) {
  const config = UNIT_MODELS[slot.player.playerClass]

  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 40 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <group position={[0, -1, 0]}>
        <Suspense fallback={null}>
          <ModelRenderer
            config={{
              ...config,
              scale: 0.5,
              yOffset: 0,
              animationState: 'idle',
            }}
          />
        </Suspense>
      </group>
    </Canvas>
  )
}

// ---- Filled character slot card ----
function FilledSlot({
  slot,
  onSelect,
  onDelete,
}: {
  slot: CharacterSlot
  onSelect: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      onClick={onSelect}
      className="group relative flex h-80 w-56 cursor-pointer flex-col overflow-hidden rounded-lg border border-white/20 bg-black/70 transition-all hover:border-white/50 hover:bg-black/80"
    >
      {/* ---- 3D model preview ---- */}
      <div className="h-48 w-full">
        <CharacterPreview slot={slot} />
      </div>

      {/* ---- Character info ---- */}
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-3">
        <p className="text-lg font-bold text-white">{slot.player.name}</p>
        <p className="text-sm text-white/60">
          {CLASS_NAMES[slot.player.playerClass] ?? slot.player.playerClass}
        </p>
        <p className="text-sm text-white/40">
          Level {slot.player.levelProgress.level}
        </p>
      </div>

      {/* ---- Delete button ---- */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (confirmDelete) {
            onDelete()
          } else {
            setConfirmDelete(true)
            // ---- Reset confirmation after 3 seconds ----
            setTimeout(() => setConfirmDelete(false), 3000)
          }
        }}
        className={`absolute right-2 top-2 rounded p-1.5 transition-colors ${
          confirmDelete
            ? 'bg-red-500/80 text-white'
            : 'bg-black/50 text-white/40 opacity-0 hover:text-red-400 group-hover:opacity-100'
        }`}
        title={confirmDelete ? 'Click again to confirm' : 'Delete character'}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// ---- Empty character slot card ----
function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex h-80 w-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-white/20 bg-black/40 transition-all hover:border-white/40 hover:bg-black/60"
    >
      <Plus size={40} className="text-white/30" />
      <p className="text-sm font-medium text-white/40">Create New</p>
    </div>
  )
}

export default function CharacterSelectScreen() {
  const { loggedInUser, logout, goToCharacterCreate, enterGame } = useAppStore()
  const { slots, selectCharacter } = useCharacterStore()

  const handleSelect = (slotIndex: number) => {
    selectCharacter(slotIndex)
    enterGame()
  }

  const handleDelete = (slotIndex: number) => {
    useCharacterStore.getState().deleteCharacter(slotIndex)
  }

  return (
    <div className="flex h-full w-full flex-col items-center bg-gradient-to-b from-black to-gray-900">
      {/* ---- Header ---- */}
      <div className="flex w-full items-center justify-between px-8 py-4">
        <h1 className="text-2xl font-bold text-white">xTactics</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/50">{loggedInUser}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      {/* ---- Character slots ---- */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <h2 className="text-xl font-semibold text-white/80">
          Select Character
        </h2>
        <div className="flex gap-6">
          {Array.from({ length: MAX_CHARACTER_SLOTS }).map((_, i) => {
            const slot = slots[i]
            return slot ? (
              <FilledSlot
                key={i}
                slot={slot}
                onSelect={() => handleSelect(i)}
                onDelete={() => handleDelete(i)}
              />
            ) : (
              <EmptySlot key={i} onClick={goToCharacterCreate} />
            )
          })}
        </div>
      </div>
    </div>
  )
}
