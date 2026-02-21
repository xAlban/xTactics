import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { useGameModeStore } from '@/stores/gameModeStore'
import { useAppStore } from '@/stores/appStore'

// ---- Mock R3F since jsdom has no WebGL ----
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: () => null,
}))

// ---- Mock Rapier physics (no WASM in jsdom) ----
vi.mock('@react-three/rapier', () => ({
  Physics: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RigidBody: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CuboidCollider: () => null,
  CapsuleCollider: () => null,
  interactionGroups: () => 0,
}))

vi.mock('@react-three/drei', () => ({
  OrthographicCamera: () => null,
  OrbitControls: () => null,
  Clone: () => null,
  useGLTF: Object.assign(
    () => ({ scene: { traverse: () => {}, children: [] }, animations: [] }),
    { preload: () => {} },
  ),
  useFBX: Object.assign(() => ({ traverse: () => {}, children: [] }), {
    preload: () => {},
  }),
}))

// ---- Mock map components that rely on Three.js APIs ----
vi.mock('@/game/map/GridFloor', () => ({
  default: () => <div data-testid="grid-floor" />,
}))

// ---- Mock 3D unit and path components ----
vi.mock('@/game/units/UnitModel', () => ({
  default: () => <div data-testid="unit-model" />,
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

// ---- Mock GLTFModel for character screens ----
vi.mock('@/game/models/GLTFModel', () => ({
  default: () => <div data-testid="model-renderer" />,
}))

// ---- Reset stores before each test ----
beforeEach(() => {
  useAppStore.setState({ screen: 'login', loggedInUser: null })
  useGameModeStore.setState({ mode: 'normal' })
})

describe('App', () => {
  it('shows login screen by default', () => {
    render(<App />)
    expect(screen.getByText('xTactics')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
  })

  it('shows character select screen after login', () => {
    useAppStore.setState({
      screen: 'characterSelect',
      loggedInUser: 'testUser',
    })
    render(<App />)
    expect(screen.getByText('Select Character')).toBeInTheDocument()
  })

  it('shows character create screen', () => {
    useAppStore.setState({
      screen: 'characterCreate',
      loggedInUser: 'testUser',
    })
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Create Character' }),
    ).toBeInTheDocument()
  })

  it('renders the game when inGame', () => {
    useAppStore.setState({ screen: 'inGame', loggedInUser: 'testUser' })
    render(<App />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('normal-scene')).toBeInTheDocument()
  })

  it('shows battle scene in combat mode when inGame', () => {
    useAppStore.setState({ screen: 'inGame', loggedInUser: 'testUser' })
    useGameModeStore.setState({ mode: 'combat' })
    render(<App />)
    expect(screen.getByTestId('battle-scene')).toBeInTheDocument()
  })
})
