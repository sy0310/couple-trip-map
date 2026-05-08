import { createContext, useContext, useState, useCallback } from 'react'
import Taro from '@tarojs/taro'
import type { ThemeId, ThemeTokens } from './themeTokens'
import { THEMES, THEME_LIST } from './themeTokens'

interface ThemeContextType {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  tokens: ThemeTokens
  themes: ThemeId[]
}

const ThemeContext = createContext<ThemeContextType>({
  theme: '木色',
  setTheme: () => {},
  tokens: THEMES['木色'],
  themes: THEME_LIST,
})

const STORAGE_KEY = 'yuting-theme'

function getInitialTheme(): ThemeId {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY) as ThemeId | undefined
    if (saved && THEMES[saved]) return saved
  } catch {}
  return '木色'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme)

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t)
    Taro.setStorageSync(STORAGE_KEY, t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, tokens: THEMES[theme], themes: THEME_LIST }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
