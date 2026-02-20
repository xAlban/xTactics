import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGroundRaycast } from '@/game/hooks/useGroundRaycast'

// ---- Mock Three.js since tests run in jsdom ----
vi.mock('three', () => {
  const Vector3 = vi.fn().mockImplementation(() => ({
    set: vi.fn(),
  }))

  const Raycaster = vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    intersectObjects: vi.fn().mockReturnValue([]),
  }))

  return { Vector3, Raycaster }
})

describe('useGroundRaycast', () => {
  it('returns a getYAt function', () => {
    const fallback = vi.fn().mockReturnValue(5)
    const { result } = renderHook(() =>
      useGroundRaycast({
        groundRef: { current: null },
        walkablesRef: { current: null },
        fallbackGetHeight: fallback,
      }),
    )

    expect(result.current.getYAt).toBeDefined()
    expect(typeof result.current.getYAt).toBe('function')
  })

  it('falls back to terrain height when no refs available', () => {
    const fallback = vi.fn().mockReturnValue(3.5)
    const { result } = renderHook(() =>
      useGroundRaycast({
        groundRef: { current: null },
        walkablesRef: { current: null },
        fallbackGetHeight: fallback,
      }),
    )

    const y = result.current.getYAt(10, 20)
    expect(y).toBe(3.5)
    expect(fallback).toHaveBeenCalledWith(10, 20)
  })
})
