import { createContext, useState } from 'react'
import { useLaunch } from '@tarojs/taro'
import { MiniSupabaseAdapter } from './services/supabase'
import { ensureAuth } from './services/auth'
import type { SupabaseAdapter } from '@shared/lib/adapter'
import './app.module.css'

interface AppContextValue {
  adapter: SupabaseAdapter
  userId: string | null
  loading: boolean
}

export const AppContext = createContext<AppContextValue>({
  adapter: new MiniSupabaseAdapter(),
  userId: null,
  loading: true,
})

function App({ children }: { children: React.ReactNode }) {
  const [adapter] = useState(() => new MiniSupabaseAdapter())
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useLaunch(async () => {
    try {
      const uid = await ensureAuth(adapter)
      setUserId(uid)
    } catch (err) {
      console.error('Auth failed:', err)
    } finally {
      setLoading(false)
    }
  })

  return (
    <AppContext.Provider value={{ adapter, userId, loading }}>
      {children}
    </AppContext.Provider>
  )
}

export default App
