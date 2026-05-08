import { useContext, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AppContext } from '../../context'
import { loginWithWeChat } from '../../services/auth'
import { useTheme } from '../../components/theme/ThemeProvider'
import { ThemedBtn } from '../../components/themed-btn'

export default function LoginPage() {
  const { adapter } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await loginWithWeChat(adapter)
      Taro.setStorageSync('has_logged_in', true)
      Taro.reLaunch({ url: '/pages/index/index' })
    } catch {
      setError('授权失败，请重试')
      setLoading(false)
    }
  }

  return (
    <View style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      background: T.bg,
      minHeight: '100vh',
    }}>
      <View style={{ marginBottom: 40, textAlign: 'center' }}>
        {/* Brand icon */}
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: `0 8px 24px ${T.accent}40`,
        }}>
          <Text style={{ fontWeight: 700, fontSize: 26, color: 'white' }}>亭</Text>
        </View>
        <Text style={{
          fontWeight: 700,
          fontSize: 28,
          color: T.ink,
          letterSpacing: '0.08em',
          display: 'block',
        }}>遇亭</Text>
        <Text style={{
          fontSize: 13,
          color: T.inkFaint,
          marginTop: 4,
          fontStyle: 'italic',
          display: 'block',
        }}>记录我们的每一次相聚</Text>
      </View>

      {error && (
        <View style={{ width: '100%', maxWidth: 360, marginBottom: 16, textAlign: 'center' }}>
          <Text style={{ fontSize: 13, color: '#ba1a1a', display: 'block' }}>{error}</Text>
        </View>
      )}

      <View style={{ width: '100%', maxWidth: 360 }}>
        <ThemedBtn full variant="primary" onTap={handleLogin} disabled={loading}>
          {loading ? '登录中...' : '微信一键登录'}
        </ThemedBtn>
      </View>

      <Text style={{
        marginTop: 24,
        fontSize: 11,
        color: T.inkFaint,
        textAlign: 'center',
      }}>属于你们两个人的旅行地图</Text>
    </View>
  )
}
