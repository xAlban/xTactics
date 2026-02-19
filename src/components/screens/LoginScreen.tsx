import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'

export default function LoginScreen() {
  const login = useAppStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields')
      return
    }
    login(username.trim())
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-black to-gray-900">
      <div className="flex w-80 flex-col items-center gap-6 rounded-lg border border-white/20 bg-black/70 p-8 backdrop-blur">
        {/* ---- Game title ---- */}
        <h1 className="text-4xl font-bold tracking-wider text-white">
          xTactics
        </h1>
        <p className="text-sm text-white/50">Tactical Turn-Based RPG</p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
            className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/50"
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-white/50"
          />

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded bg-white/20 py-2 font-semibold text-white transition-colors hover:bg-white/30"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
