import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'

// ---- Mock R3F since jsdom has no WebGL ----
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
}))

vi.mock('@react-three/drei', () => ({
  OrthographicCamera: () => null,
}))

describe('App', () => {
  it('renders the R3F canvas', () => {
    render(<App />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })
})
