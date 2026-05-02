import { useContext, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AppContext } from '../../app'
import { getUser, logout } from '../../services/auth'
import {
  getCoupleInfo,
  generateBindingCode,
  acceptBindingCode,
  deleteCoupleBinding,
} from '../../../shared/lib/couples'
import styles from './index.module.css'

interface UserInfo {
  id: string
  nickname: string
  avatar_url: string | null
}

interface CoupleData {
  id: string
  partnerId: string
  partnerNickname: string
  sinceDate: string | null
  anniversary: string | null
}

export default function ProfilePage() {
  const { adapter, userId } = useContext(AppContext)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [couple, setCouple] = useState<CoupleData | null>(null)
  const [bindingCode, setBindingCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)

  const loadProfile = async () => {
    if (!userId) return
    const userInfo = await getUser(adapter)
    setUser(userInfo)

    const coupleInfo = await getCoupleInfo(adapter, userId)
    setCouple(coupleInfo)
  }

  useDidShow(() => {
    loadProfile()
  })

  const handleGenerateCode = async () => {
    if (!userId) return
    setCodeLoading(true)
    const code = await generateBindingCode(adapter, userId)
    setCodeLoading(false)
    if (code) {
      setBindingCode(code)
    } else {
      Taro.showToast({ title: '生成失败', icon: 'error' })
    }
  }

  const handleAcceptCode = async () => {
    if (!userId || !inputCode.trim()) return
    setAcceptLoading(true)
    const success = await acceptBindingCode(adapter, userId, inputCode.trim())
    setAcceptLoading(false)
    if (success) {
      Taro.showToast({ title: '绑定成功', icon: 'success' })
      setInputCode('')
      setBindingCode('')
      await loadProfile()
    } else {
      Taro.showToast({ title: '绑定码无效', icon: 'error' })
    }
  }

  const handleUnbind = async () => {
    if (!userId) return
    const res = await wx.showModal({
      title: '解除绑定',
      content: '确定要解除情侣绑定吗？双方旅行记录将保持独立。',
      confirmText: '解除',
      confirmColor: '#c44444',
    })
    if (res.confirm) {
      const success = await deleteCoupleBinding(adapter, userId)
      if (success) {
        Taro.showToast({ title: '已解除绑定', icon: 'success' })
        setCouple(null)
        setBindingCode('')
      }
    }
  }

  const handleLogout = () => {
    wx.showModal({
      title: '退出登录',
      content: '退出后需重新登录才能访问旅行数据',
      confirmText: '确认退出',
      confirmColor: '#c44444',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.reLaunch({ url: '/pages/index/index' })
        }
      },
    })
  }

  const handleCopyCode = () => {
    wx.setClipboardData({ data: bindingCode })
    Taro.showToast({ title: '已复制', icon: 'success' })
  }

  const nickname = user?.nickname || '旅行者'

  return (
    <View className={styles.container}>
      {/* User Section */}
      <View className={styles.userSection}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>{nickname[0]}</Text>
        </View>
        <Text className={styles.nickname}>{nickname}</Text>
      </View>

      {/* Couple Section */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          {couple ? '情侣信息' : '情侣绑定'}
        </Text>

        {couple ? (
          <View>
            <View className={styles.coupleInfo}>
              <View className={styles.partnerAvatar}>
                <Text className={styles.partnerText}>
                  {couple.partnerNickname[0]}
                </Text>
              </View>
              <View>
                <Text className={styles.partnerName}>
                  {couple.partnerNickname}
                </Text>
                {couple.sinceDate && (
                  <Text className={styles.partnerDate}>
                    在一起: {couple.sinceDate}
                  </Text>
                )}
                {couple.anniversary && (
                  <Text className={styles.partnerDate}>
                    纪念日: {couple.anniversary}
                  </Text>
                )}
              </View>
            </View>
            <View className={styles.dangerBtn} onTap={handleUnbind}>
              <Text className={styles.dangerText}>解除情侣绑定</Text>
            </View>
          </View>
        ) : (
          <View>
            {bindingCode ? (
              <View>
                <View className={styles.codeDisplay}>
                  <Text className={styles.codeText}>{bindingCode}</Text>
                  <Text className={styles.codeLabel}>分享给另一半</Text>
                </View>
                <View className={styles.btn} onTap={handleCopyCode}>
                  <Text className={styles.btnText}>复制绑定码</Text>
                </View>
              </View>
            ) : (
              <View className={styles.btn} onTap={handleGenerateCode}>
                <Text className={styles.btnText}>
                  {codeLoading ? '生成中...' : '生成绑定码'}
                </Text>
              </View>
            )}

            <Text
              className={styles.sectionTitle}
              style={{ marginTop: 16 }}
            >
              输入绑定码
            </Text>
            <View className={styles.inputRow}>
              <Input
                className={styles.codeInput}
                placeholder="6位绑定码"
                maxlength={6}
                value={inputCode}
                onInput={(e) =>
                  setInputCode(
                    (e.detail.value || '')
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .slice(0, 6)
                  )
                }
              />
              <View className={styles.btn} onTap={handleAcceptCode}>
                <Text className={styles.btnText}>
                  {acceptLoading ? '绑定中' : '绑定'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Logout */}
      <View className={styles.logoutBtn} onTap={handleLogout}>
        <Text className={styles.logoutText}>退出登录</Text>
      </View>
    </View>
  )
}
