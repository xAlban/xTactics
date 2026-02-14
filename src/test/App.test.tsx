import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { useGameModeStore } from '@/stores/gameModeStore'

// ---- Mock R3F since jsdom has no WebGL ----
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: () => null,
}))

vi.mock('@react-three/drei', () => ({
  OrthographicCamera: () => null,
  OrbitControls: () => null,
}))

// ---- Mock map components that rely on Three.js APIs ----
vi.mock('@/game/map/GridFloor', () => ({
  default: () => <div data-testid="grid-floor" />,
}))

// ---- Mock 3D unit and path components ----
vi.mock('@/game/units/UnitCube', () => ({
  default: () => <div data-testid="unit-cube" />,
}))

vi.mock('@/game/combat/PathPreview', () => ({
  default: () => <div data-testid="path-preview" />,
}))

vi.mock('@/game/combat/FloatingNumberProjector', () => ({
  default: () => <div data-testid="floating-number-projector" />,
}))

// ---- Mock scene components for mode switching ----
vi.mock('@/game/scenes/NormalScene', () => ({
  default: () => <div data-testid="normal-scene" />,
}))

vi.mock('@/game/scenes/BattleScene', () => ({
  default: () => <div data-testid="battle-scene" />,
}))

vi.mock('@/game/objects/CombatPortal', () => ({
  default: () => <div data-testid="combat-portal" />,
}))

// ---- Reset game mode before each test ----
beforeEach(() => {
  useGameModeStore.setState({ mode: 'normal' })
})

describe('App', () => {
  it('renders the R3F canvas', () => {
    render(<App />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })

  it('shows normal scene by default', () => {
    render(<App />)
    expect(screen.getByTestId('normal-scene')).toBeInTheDocument()
    expect(screen.queryByTestId('battle-scene')).not.toBeInTheDocument()
  })

  it('shows exit combat button in combat mode', () => {
    useGameModeStore.setState({ mode: 'combat' })
    render(<App />)
    expect(screen.getByText('Exit Combat')).toBeInTheDocument()
    expect(screen.getByTestId('battle-scene')).toBeInTheDocument()
  })

  it('does not show exit combat button in normal mode', () => {
    render(<App />)
    expect(screen.queryByText('Exit Combat')).not.toBeInTheDocument()
  })
})
