import { useState, useContext } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { linkExistingAccount, isAccountLinked, getLinkedEmail, getEffectiveUserId } from '../../services/auth'
import { useTheme } from '../../components/theme/ThemeProvider'
import { PageHeader } from '../../components/page-header'
import { ThemedBtn } from '../../components/themed-btn'
import { MiniSupabaseAdapter } from '../../services/supabase'
import { AppContext } from '../../context'

export default function LinkAccountPage() {
  const { tokens: T } = useTheme()
  const { setUserId } = useContext(AppContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const linkedEmail = getLinkedEmail()

  if (isAccountLinked() && linkedEmail) {
    return (
      <View style={{ flex: 1, background: T.bg }}>
        <PageHeader title="账号绑定" />
        <View style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 600, color: T.ink, marginBottom: 12, display: 'block', textAlign: 'center' }}>
            已绑定账号
          </Text>
          <Text style={{ fontSize: 13, color: T.inkFaint, marginBottom: 20, display: 'block', textAlign: 'center' }}>
            {linkedEmail}
          </Text>
          <ThemedBtn onTap={() => Taro.navigateBack()}>返回</ThemedBtn>
        </View>
      </View>
    )
  }

  const handleLink = async () => {
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)
    setError('')

    const adapter = new MiniSupabaseAdapter()
    const result = await linkExistingAccount(adapter, email, password)

    if (result.success) {
      Taro.showToast({ title: '绑定成功', icon: 'success' })
      
      // Update global user state with the newly linked auth ID
      const newId = getEffectiveUserId()
      if (newId) setUserId(newId)

      setTimeout(() => Taro.navigateBack(), 1500)
    } else {
      setError(result.error || '绑定失败')
    }

    setLoading(false)
  }

  return (
    <View style={{ flex: 1, background: T.bg }}>
      <PageHeader title="绑定已有账号" />

      <View style={{ padding: 24 }}>
        <View style={{
          background: T.accentFaint,
          borderRadius: 12, padding: 14,
          border: `1px solid ${T.accent}20`,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 12, color: T.inkFaint, display: 'block' }}>
            绑定后，您将可以在小程序中访问您在网页版创建的旅行记录、情侣信息等数据。
          </Text>
        </View>

        {error ? (
          <View style={{
            background: 'rgba(200,50,50,0.06)',
            borderRadius: 10, padding: 12, marginBottom: 16,
          }}>
            <Text style={{ fontSize: 12, color: '#C44444', display: 'block' }}>{error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6, display: 'block' }}>
            邮箱
          </Text>
          <View style={{
            borderRadius: 10, border: `1.5px solid ${T.border}`,
            background: T.bgCard, padding: '0 14px', overflow: 'hidden',
          }}>
            <Input
              placeholder="输入网页版账号邮箱"
              value={email}
              onInput={(e) => { setEmail(e.detail.value); setError('') }}
              placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
              style={{ height: '44px', width: '100%', fontSize: 14, color: T.ink }}
            />
          </View>
        </View>

        {/* Password */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6, display: 'block' }}>
            密码
          </Text>
          <View style={{
            borderRadius: 10, border: `1.5px solid ${T.border}`,
            background: T.bgCard, padding: '0 14px', overflow: 'hidden',
            display: 'flex', flexDirection: 'row', alignItems: 'center',
          }}>
            <Input
              placeholder="输入网页版账号密码"
              password={!showPassword}
              value={password}
              onInput={(e) => { setPassword(e.detail.value); setError('') }}
              placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
              style={{ flex: 1, height: '44px', fontSize: 14, color: T.ink }}
            />
            <View
              style={{ padding: '0 4px' }}
              onTap={() => setShowPassword(!showPassword)}
            >
              <Text style={{ fontSize: 12, color: T.accent }}>
                {showPassword ? '隐藏' : '显示'}
              </Text>
            </View>
          </View>
        </View>

        <ThemedBtn
          full
          onTap={handleLink}
          disabled={loading || !email || !password}
        >
          {loading ? '绑定中...' : '绑定账号'}
        </ThemedBtn>

        <Text style={{
          marginTop: 16, fontSize: 11, color: T.inkFaint,
          textAlign: 'center', display: 'block',
        }}>
          绑定后仍可使用微信快捷登录
        </Text>
      </View>
    </View>
  )
}
