import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/stores/appStore'

// ---- Reset store state before each test ----
beforeEach(() => {
  useAppStore.setState({
    screen: 'login',
    loggedInUser: null,
  })
})

describe('appStore', () => {
  it('starts on login screen with no user', () => {
    const state = useAppStore.getState()
    expect(state.screen).toBe('login')
    expect(state.loggedInUser).toBeNull()
  })

  it('login sets user and navigates to characterSelect', () => {
    useAppStore.getState().login('testUser')
    const state = useAppStore.getState()
    expect(state.screen).toBe('characterSelect')
    expect(state.loggedInUser).toBe('testUser')
  })

  it('logout clears user and returns to login', () => {
    useAppStore.getState().login('testUser')
    useAppStore.getState().logout()
    const state = useAppStore.getState()
    expect(state.screen).toBe('login')
    expect(state.loggedInUser).toBeNull()
  })

  it('navigates to character create screen', () => {
    useAppStore.getState().login('testUser')
    useAppStore.getState().goToCharacterCreate()
    expect(useAppStore.getState().screen).toBe('characterCreate')
  })

  it('navigates back to character select screen', () => {
    useAppStore.getState().login('testUser')
    useAppStore.getState().goToCharacterCreate()
    useAppStore.getState().goToCharacterSelect()
    expect(useAppStore.getState().screen).toBe('characterSelect')
  })

  it('enters the game', () => {
    useAppStore.getState().login('testUser')
    useAppStore.getState().enterGame()
    expect(useAppStore.getState().screen).toBe('inGame')
  })
})
