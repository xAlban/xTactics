import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useAppStore } from '@/stores/appStore'
import { useCharacterStore } from '@/stores/characterStore'
import { UNIT_MODELS } from '@/game/models/modelRegistry'
import ModelRenderer from '@/game/models/GLTFModel'
import type { PlayerClass } from '@/types/player'
import { MAX_CHARACTER_SLOTS } from '@/types/character'
import { MOUSE } from 'three'
import { ArrowLeft } from 'lucide-react'

// ---- Available classes with display info ----
const CLASSES: { id: PlayerClass; name: string; description: string }[] = [
  {
    id: 'bomberman',
    name: 'Bomberman',
    description: 'Explosive specialist with area damage',
  },
  {
    id: 'archer',
    name: 'Archer',
    description: 'Ranged fighter with precision strikes',
  },
  {
    id: 'knight',
    name: 'Knight',
    description: 'Armored warrior with strong defense',
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Spellcaster with elemental mastery',
  },
]

export default function CharacterCreateScreen() {
  const { goToCharacterSelect } = useAppStore()
  const { slots } = useCharacterStore()
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState<PlayerClass>('bomberman')
  const [error, setError] = useState('')

  // ---- Find next empty slot index ----
  const emptySlotIndex = slots.findIndex((s) => s === null)
  const canCreate = emptySlotIndex !== -1

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name')
      return
    }
    if (trimmed.length > 20) {
      setError('Name must be 20 characters or less')
      return
    }
    if (!canCreate) {
      setError('All character slots are full')
      return
    }

    useCharacterStore
      .getState()
      .createCharacter(emptySlotIndex, trimmed, selectedClass)
    goToCharacterSelect()
  }

  const config = UNIT_MODELS[selectedClass]

  return (
    <div className="flex h-full w-full bg-gradient-to-b from-black to-gray-900">
      {/* ---- Left: 3D model preview ---- */}
      <div className="flex flex-1 items-center justify-center">
        <div className="h-[500px] w-[400px]">
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
            <OrbitControls
              makeDefault
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={2}
              mouseButtons={{
                LEFT: -1 as MOUSE,
                MIDDLE: MOUSE.ROTATE,
              }}
              target={[0, 0, 0]}
            />
          </Canvas>
        </div>
      </div>

      {/* ---- Right: character creation form ---- */}
      <div className="flex w-96 flex-col justify-center gap-6 p-8">
        {/* ---- Back button ---- */}
        <button
          onClick={goToCharacterSelect}
          className="flex w-fit items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <h2 className="text-2xl font-bold text-white">Create Character</h2>

        {/* ---- Name input ---- */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/60">Character Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            maxLength={20}
            placeholder="Enter a name..."
            className="rounded border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/50"
            autoFocus
          />
          <p className="text-xs text-white/30">{name.length}/20</p>
        </div>

        {/* ---- Class selector ---- */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/60">Class</label>
          <div className="flex flex-col gap-2">
            {CLASSES.map((cls) => {
              const classConfig = UNIT_MODELS[cls.id]
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`flex items-center gap-3 rounded border px-3 py-2 text-left transition-all ${
                    selectedClass === cls.id
                      ? 'border-white/50 bg-white/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {/* ---- Color swatch ---- */}
                  <div
                    className="h-6 w-6 rounded"
                    style={{
                      backgroundColor: classConfig.fallbackColor,
                    }}
                  />
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-xs opacity-60">{cls.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!canCreate && (
          <p className="text-sm text-amber-400">
            All {MAX_CHARACTER_SLOTS} character slots are full. Delete a
            character to create a new one.
          </p>
        )}

        {/* ---- Create button ---- */}
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="rounded bg-white/20 py-2.5 font-semibold text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create Character
        </button>
      </div>
    </div>
  )
}
