import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function apply(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => (localStorage.getItem('hkm.theme') as ThemeMode) || 'system')

  useEffect(() => {
    apply(mode)
    localStorage.setItem('hkm.theme', mode)
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => apply('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [mode])

  return <ThemeContext.Provider value={{ mode, setMode: setModeState }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}