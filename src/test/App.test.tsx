import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'

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

describe('App', () => {
  it('renders the R3F canvas', () => {
    render(<App />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })
})
