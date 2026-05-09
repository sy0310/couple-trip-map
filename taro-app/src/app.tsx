import { useState } from 'react'
import { useLaunch } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { MiniSupabaseAdapter } from './services/supabase'
import { ensureAuth, getEffectiveUserId } from './services/auth'
import { ThemeProvider } from './components/theme/ThemeProvider'
import type { SupabaseAdapter } from '@shared/lib/adapter'
import { AppContext } from './context'
import './app.wxss'

if (process.env.TARO_ENV === 'weapp') {
  wx.cloud.init({
    env: 'cloud1-d9g3p0n0u17edfd27',
    traceUser: true
  })
}

function App({ children }: { children: React.ReactNode }) {
  const [adapter] = useState(() => new MiniSupabaseAdapter())
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useLaunch(async () => {
    try {
      const { userId: uid } = await ensureAuth(adapter)
      // Use linked auth user ID if account is bound, otherwise use WeChat openid
      setUserId(getEffectiveUserId() || uid)
    } catch {
      const hasLoggedIn = Taro.getStorageSync('has_logged_in')
      if (!hasLoggedIn) {
        Taro.redirectTo({ url: '/pages/login/index' })
        return
      }
    } finally {
      setLoading(false)
    }
  })

  return (
    <ThemeProvider>
      <AppContext.Provider value={{ adapter, userId, loading, setUserId }}>
        {children}
      </AppContext.Provider>
    </ThemeProvider>
  )
}

export default App
