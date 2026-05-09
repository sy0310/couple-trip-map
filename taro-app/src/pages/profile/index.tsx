import { useContext, useState, useEffect } from 'react'
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AppContext } from '../../context'
import { getUser, logout, isAccountLinked, getLinkedEmail, getLinkedAuthUserId, unlinkAccount, getUserId } from '../../services/auth'
import {
  getCoupleInfo,
  generateBindingCode,
  acceptBindingCode,
  deleteCoupleBinding,
  updateCoupleDates,
} from '@shared/lib/couples'
import {
  getVisitedProvinces,
  getTimelines,
  addTimeline,
  deleteTimeline,
  updateUserProfile,
} from '@shared/lib/trips'
import { TOTAL_PROVINCES } from '@shared/lib/provinces'
import { useTheme } from '../../components/theme/ThemeProvider'
import type { ThemeId } from '../../components/theme/themeTokens'
import { THEME_LIST } from '../../components/theme/themeTokens'
import { PageHeader } from '../../components/page-header'
import { StatBadge } from '../../components/stat-badge'
import { ProgressBar } from '../../components/progress-bar'
import { ThemedBtn } from '../../components/themed-btn'
import { Pill } from '../../components/pill'
import { ModalSheet } from '../../components/modal-sheet'

interface UserInfo {
  id: string
  nickname: string
  avatar_url: string | null
  email: string | null
  city: string | null
  bio: string | null
  birthday: string | null
}

interface CoupleData {
  id: string
  partnerId: string
  partnerNickname: string
  sinceDate: string | null
  anniversary: string | null
}

interface TimelineEntry {
  id: string
  date: string
  title: string
  description: string | null
  icon: string | null
  type: string
}

const TIMELINE_TYPE_OPTIONS = ['里程碑', '周年', '旅行']
const TIMELINE_TYPE_VALUES = ['milestone', 'anniversary', 'trip']

export default function ProfilePage() {
  const { adapter, userId, setUserId } = useContext(AppContext)
  const { tokens: T, theme, setTheme } = useTheme()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [couple, setCouple] = useState<CoupleData | null>(null)
  const [tripCount, setTripCount] = useState(0)
  const [visitedProvinces, setVisitedProvinces] = useState(0)

  // Couple modal
  const [showCoupleModal, setShowCoupleModal] = useState(false)
  const [bindingCode, setBindingCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editBirthday, setEditBirthday] = useState('')
  const [editSinceDate, setEditSinceDate] = useState('')
  const [editAnniversary, setEditAnniversary] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Timeline modal
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [timelines, setTimelines] = useState<TimelineEntry[]>([])
  const [newTimeline, setNewTimeline] = useState({
    date: '',
    title: '',
    description: '',
    icon: '',
    type: 'milestone',
  })
  const [timelineLoading, setTimelineLoading] = useState(false)

  const loadProfile = async (targetId?: string) => {
    // Priority: explicit ID > fresh storage ID > context state (might be stale)
    const id = targetId || getUserId() || userId
    console.log('[loadProfile] loading for ID:', id, 'linkedAuthUser:', getLinkedAuthUserId())
    if (!id) return

    // Reset states to avoid showing stale data from previous identity
    setUser(null)
    setCouple(null)
    setTripCount(0)
    setVisitedProvinces(0)
    setTimelines([])
    
    const userInfo = await getUser(adapter)
    console.log('[loadProfile] userInfo:', JSON.stringify(userInfo))
    setUser(userInfo)

    if (userInfo) {
      setEditNickname(userInfo.nickname || '')
      setEditCity(userInfo.city || '')
      setEditBio(userInfo.bio || '')
      setEditBirthday(userInfo.birthday || '')
    }

    const effectiveUserId = getLinkedAuthUserId() || id
    console.log('[loadProfile] couple query with userId:', effectiveUserId)
    const coupleInfo = await getCoupleInfo(adapter, effectiveUserId)
    console.log('[loadProfile] coupleInfo:', JSON.stringify(coupleInfo))
    setCouple(coupleInfo)

    if (coupleInfo) {
      setEditSinceDate(coupleInfo.sinceDate || '')
      setEditAnniversary(coupleInfo.anniversary || '')

      const [provResult, tripsResult, tlResult] = await Promise.all([
        getVisitedProvinces(adapter, coupleInfo.id),
        adapter.from('trips').select('id').eq('couple_id', coupleInfo.id),
        getTimelines(adapter, coupleInfo.id),
      ])
      setVisitedProvinces(provResult.length)
      setTripCount(tripsResult.data?.length || 0)
      setTimelines(tlResult as TimelineEntry[])
    }
  }

  useEffect(() => {
    loadProfile()
  }, [userId])

  useDidShow(() => {
    loadProfile()
  })

  const handleGenerateCode = async () => {
    if (!userId) return
    setCodeLoading(true)
    const targetId = getLinkedAuthUserId() || userId
    const code = await generateBindingCode(adapter, targetId)
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
    const targetId = getLinkedAuthUserId() || userId
    const success = await acceptBindingCode(adapter, targetId, inputCode.trim())
    setAcceptLoading(false)
    if (success) {
      Taro.showToast({ title: '绑定成功', icon: 'success' })
      setInputCode('')
      setBindingCode('')
      setShowCoupleModal(false)
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
      const targetId = getLinkedAuthUserId() || userId
      const success = await deleteCoupleBinding(adapter, targetId)
      if (success) {
        Taro.showToast({ title: '已解除绑定', icon: 'success' })
        setCouple(null)
        setBindingCode('')
        setShowCoupleModal(false)
      }
    }
  }

  const handleCopyCode = () => {
    wx.setClipboardData({ data: bindingCode })
    Taro.showToast({ title: '已复制', icon: 'success' })
  }

  const handleSaveProfile = async () => {
    const targetUserId = getLinkedAuthUserId() || userId
    if (!targetUserId) return
    setProfileSaving(true)
    try {
      await updateUserProfile(adapter, targetUserId, {
        nickname: editNickname.trim() || undefined,
        city: editCity.trim() || null,
        bio: editBio.trim() || null,
        birthday: editBirthday || null,
      })
      if (couple) {
        await updateCoupleDates(adapter, couple.id, {
          since_date: editSinceDate || null,
          anniversary: editAnniversary || null,
        })
      }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      await loadProfile()
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAddTimeline = async () => {
    if (!couple || !newTimeline.date || !newTimeline.title) return
    setTimelineLoading(true)
    const id = await addTimeline(adapter, couple.id, {
      date: newTimeline.date,
      title: newTimeline.title,
      description: newTimeline.description || null,
      icon: newTimeline.icon || null,
      type: newTimeline.type,
    })
    setTimelineLoading(false)
    if (id) {
      setNewTimeline({ date: '', title: '', description: '', icon: '', type: 'milestone' })
      Taro.showToast({ title: '已添加', icon: 'success' })
      const tls = await getTimelines(adapter, couple.id)
      setTimelines(tls as TimelineEntry[])
    } else {
      Taro.showToast({ title: '添加失败', icon: 'error' })
    }
  }

  const handleDeleteTimeline = async (timelineId: string) => {
    const success = await deleteTimeline(adapter, timelineId)
    if (success && couple) {
      const tls = await getTimelines(adapter, couple.id)
      setTimelines(tls as TimelineEntry[])
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
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  const openSettings = () => {
    setEditNickname(user?.nickname || '')
    setEditCity(user?.city || '')
    setEditBio(user?.bio || '')
    setEditBirthday(user?.birthday || '')
    setEditSinceDate(couple?.sinceDate || '')
    setEditAnniversary(couple?.anniversary || '')
    setShowSettingsModal(true)
  }

  const nickname = user?.nickname || '旅行者'
  const progressPercent = visitedProvinces > 0 ? Math.round((visitedProvinces / TOTAL_PROVINCES) * 100) : 0

  const menuItems = [
    {
      icon: '💕',
      title: couple ? `情侣 · ${couple.partnerNickname || '对方'}` : '情侣绑定',
      sub: couple ? '已绑定，一起记录旅行回忆' : '生成绑定码分享给另一半',
      badge: couple ? '已绑定' : null,
      dot: !couple,
      action: () => setShowCoupleModal(true),
    },
    {
      icon: '🔗',
      title: isAccountLinked() ? '已关联账号' : '绑定已有账号',
      sub: isAccountLinked()
        ? getLinkedEmail() || '已绑定网页版账号'
        : '关联网页版账号，同步旅行数据',
      badge: isAccountLinked() ? '已绑定' : null,
      dot: !isAccountLinked(),
      action: () => Taro.navigateTo({ url: '/pages/link-account/index' }),
    },
    {
      icon: '⚙',
      title: '设置',
      sub: '账号与安全设置',
      badge: null,
      dot: false,
      action: openSettings,
    },
    {
      icon: '⏰',
      title: '纪念日管理',
      sub: '编辑你们的纪念日和重要时刻',
      badge: null,
      dot: false,
      action: () => setShowTimelineModal(true),
    },
    {
      icon: '🗺',
      title: '生成旅行海报',
      sub: '分享你们的旅行地图',
      badge: null,
      dot: false,
      action: () => Taro.navigateTo({ url: '/pages/poster/index' }),
    },
    {
      icon: 'ℹ',
      title: '关于遇亭',
      sub: '了解遇亭的故事与愿景',
      badge: null,
      dot: false,
      action: () => {},
    },
  ]

  return (
    <View style={{ flex: 1, position: 'relative', background: T.bg }}>
      <View style={{ flex: 1 }}>
        <PageHeader title="个人中心" />

        <View style={{ padding: '16px', paddingBottom: 80 }}>
        {/* ID Card */}
        <View style={{
          background: `linear-gradient(135deg, ${T.accent}20, ${T.bgCard})`,
          borderRadius: 20,
          padding: 20,
          border: `1.5px solid ${T.accent}30`,
          marginBottom: 20,
          boxShadow: T.shadowDeep,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative background character */}
          <Text style={{
            position: 'absolute',
            right: -10,
            top: -10,
            fontSize: 100,
            opacity: 0.04,
            fontWeight: 700,
            color: T.ink,
          }}>亭</Text>

          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `3px solid ${T.bgCard}`,
              boxShadow: `0 0 0 2px ${T.accent}40`,
            }}>
              <Text style={{ fontWeight: 700, fontSize: 22, color: 'white' }}>{nickname[0]}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, color: T.inkFaint, letterSpacing: '0.1em', marginBottom: 3 }}>
                AUTHENTICATED EXPLORER
              </Text>
              <Text style={{ fontWeight: 700, fontSize: 20, color: T.ink }}>{nickname}</Text>
              {user?.email && (
                <Text style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{user.email}</Text>
              )}
            </View>
          </View>

          {/* Stats grid */}
          <View style={{
            display: 'flex', flexDirection: 'row',
            borderTop: `1px solid ${T.border}`,
            paddingTop: 14,
          }}>
            <View style={{ flex: 1 }}>
              <StatBadge value={couple ? `${tripCount} 次` : '0 次'} label="旅行次数" />
            </View>
            <View style={{ flex: 1 }}>
              <StatBadge value={couple ? `${visitedProvinces}/${TOTAL_PROVINCES}` : `0/${TOTAL_PROVINCES}`} label="省份" />
            </View>
            <View style={{ flex: 1 }}>
              <StatBadge value={couple ? '已绑定' : '未绑定'} label="情侣状态" accent={!!couple} />
            </View>
            <View style={{ flex: 1 }}>
              <StatBadge value={couple ? `${progressPercent}%` : '0%'} label="完成度" accent={!!couple} />
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={{
          background: T.bgCard, borderRadius: 16, padding: 16,
          border: `1px solid ${T.border}`, marginBottom: 20,
          boxShadow: T.shadow,
        }}>
          <Text style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 12, letterSpacing: '0.06em' }}>
            探索进度 {couple ? `${visitedProvinces}/${TOTAL_PROVINCES}` : `0/${TOTAL_PROVINCES}`}
          </Text>
          <ProgressBar value={couple ? visitedProvinces : 0} max={TOTAL_PROVINCES} showLabel height={10} />
        </View>

        {/* Menu items */}
        {menuItems.map((item, i) => (
          <View
            key={i}
            style={{
              background: T.bgCard, borderRadius: 14, padding: '14px 16px',
              border: `1px solid ${T.border}`, marginBottom: 8,
              display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12,
              boxShadow: T.shadow,
            }}
            onTap={item.action}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              background: T.accentFaint,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              {item.dot && (
                <View style={{
                  position: 'absolute',
                  top: -2, right: -2,
                  width: 8, height: 8, borderRadius: 4,
                  background: T.gold,
                  border: `2px solid ${T.bgCard}`,
                }} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{item.title}</Text>
              <Text style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{item.sub}</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {item.badge && <Pill small accent>{item.badge}</Pill>}
              <Text style={{ fontSize: 14, color: T.inkFaint }}>{'>'}</Text>
            </View>
          </View>
        ))}
      </View>
      </View>

      {/* Couple binding modal */}
      <ModalSheet
        open={showCoupleModal}
        onClose={() => { setShowCoupleModal(false); setBindingCode('') }}
        title={couple ? `情侣 · ${couple.partnerNickname || '对方'}` : '情侣绑定'}
      >
        {couple ? (
          <View>
            <View style={{ textAlign: 'center', padding: '20px 0' }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                background: T.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                border: `3px solid ${T.bgCard}`,
              }}>
                <Text style={{ fontWeight: 700, fontSize: 20, color: 'white' }}>
                  {couple.partnerNickname?.[0] || '?'}
                </Text>
              </View>
              <Text style={{ fontWeight: 700, fontSize: 18, color: T.ink }}>
                {couple.partnerNickname || '对方'}
              </Text>
              <Text style={{ fontSize: 12, color: T.inkFaint, marginTop: 4 }}>已绑定情侣关系</Text>
            </View>
            <View style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(200,50,50,0.03)',
              border: '1px solid rgba(200,50,50,0.1)',
              marginTop: 8,
            }}>
              <Text style={{ fontSize: 13, fontWeight: 600, color: '#C44444', marginBottom: 4 }}>解除绑定</Text>
              <Text style={{ fontSize: 11, color: T.inkFaint, marginBottom: 10 }}>
                解除后双方旅行记录将保持独立
              </Text>
              <ThemedBtn variant="outline" full onTap={handleUnbind}>解除情侣绑定</ThemedBtn>
            </View>
          </View>
        ) : (
          <View>
            <View style={{
              background: T.bgCardAlt, borderRadius: 12, padding: 16,
              border: `1px solid ${T.border}`, marginBottom: 12,
            }}>
              <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>生成绑定码</Text>
              <Text style={{ fontSize: 11, color: T.inkFaint, marginBottom: 12 }}>
                生成唯一绑定码，分享给另一半
              </Text>
              {bindingCode ? (
                <View style={{ textAlign: 'center' }}>
                  <Text style={{
                    fontWeight: 800, fontSize: 28,
                    letterSpacing: '0.2em', color: T.accent,
                    background: T.accentFaint,
                    padding: '12px 20px', borderRadius: 10,
                    border: `1.5px solid ${T.accent}40`,
                    display: 'block', marginBottom: 8,
                  }}>{bindingCode}</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                    <Text style={{ fontSize: 11, color: T.accent }} onTap={handleCopyCode}>复制到剪贴板</Text>
                    <Text style={{ fontSize: 11, color: T.inkFaint }} onTap={() => setBindingCode('')}>重新生成</Text>
                  </View>
                </View>
              ) : (
                <ThemedBtn full onTap={handleGenerateCode} disabled={codeLoading}>
                  {codeLoading ? '生成中...' : '生成绑定码'}
                </ThemedBtn>
              )}
            </View>
            <View style={{
              background: T.bgCardAlt, borderRadius: 12, padding: 16,
              border: `1px solid ${T.border}`,
            }}>
              <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>输入绑定码</Text>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <View style={{
                  flex: 1, borderRadius: 10, border: `1.5px solid ${T.border}`,
                  background: T.bgCard, padding: '0 14px', overflow: 'hidden',
                }}>
                  <Input
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
                    placeholderStyle={`color:${T.inkFaint};fontSize:16px`}
                    style={{
                      height: '44px', width: '100%', fontSize: 16, letterSpacing: '0.2em',
                      textAlign: 'center', fontWeight: 700, color: T.ink,
                    }}
                  />
                </View>
                <ThemedBtn onTap={handleAcceptCode} disabled={!inputCode || acceptLoading}>
                  {acceptLoading ? '绑定中' : '绑定'}
                </ThemedBtn>
              </View>
            </View>
          </View>
        )}
      </ModalSheet>

      {/* Settings modal */}
      <ModalSheet open={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="设置">
        {/* Theme toggle */}
        <View style={{
          background: T.bgCardAlt, borderRadius: 12, padding: 16,
          border: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 12 }}>主题切换</Text>
          <View style={{
            display: 'flex', flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${T.border}`,
          }}>
            {THEME_LIST.map((t) => (
              <View
                key={t}
                style={{
                  flex: 1, padding: '10px 0', textAlign: 'center',
                  background: theme === t ? T.accent : T.bgCard,
                }}
                onTap={() => setTheme(t as ThemeId)}
              >
                <Text style={{
                  fontSize: 13, fontWeight: 600,
                  color: theme === t ? 'white' : T.inkMid,
                }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Profile editing */}
        <View style={{
          background: T.bgCardAlt, borderRadius: 12, padding: 16,
          border: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 12 }}>个人资料</Text>

          {/* Nickname display */}
          <View style={{
            display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: `1px solid ${T.border}`,
          }}>
            <Text style={{ fontSize: 12, color: T.inkFaint }}>昵称</Text>
            <Text style={{ fontSize: 12, color: T.inkMid, fontWeight: 500 }}>{user?.nickname}</Text>
          </View>

          {/* Nickname edit */}
          <View style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>修改昵称</Text>
            <View style={{
              borderRadius: 10, border: `1.5px solid ${T.border}`,
              background: T.bgCard, padding: '0 14px', overflow: 'hidden',
            }}>
              <Input
                placeholder="输入新昵称"
                value={editNickname}
                onInput={(e) => setEditNickname(e.detail.value)}
                placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
                style={{
                  height: '44px', width: '100%', fontSize: 14, color: T.ink,
                }}
              />
            </View>
          </View>

          {/* Since date */}
          <View style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>在一起日期</Text>
            <Picker mode="date" onChange={(e) => setEditSinceDate(e.detail.value)}>
              <View style={{
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${T.border}`, background: T.bgCard,
                boxSizing: 'border-box',
              }}>
                <Text style={{ fontSize: 14, lineHeight: '22px', color: editSinceDate ? T.ink : T.inkFaint }}>
                  {editSinceDate || '请选择日期'}
                </Text>
              </View>
            </Picker>
          </View>

          {/* Anniversary */}
          <View style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>纪念日（可选）</Text>
            <Picker mode="date" onChange={(e) => setEditAnniversary(e.detail.value)}>
              <View style={{
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${T.border}`, background: T.bgCard,
                boxSizing: 'border-box',
              }}>
                <Text style={{ fontSize: 14, lineHeight: '22px', color: editAnniversary ? T.ink : T.inkFaint }}>
                  {editAnniversary || '请选择日期'}
                </Text>
              </View>
            </Picker>
          </View>

          {/* City */}
          <View style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>城市</Text>
            <View style={{
              borderRadius: 10, border: `1.5px solid ${T.border}`,
              background: T.bgCard, padding: '0 14px', overflow: 'hidden',
            }}>
              <Input
                placeholder="如：杭州"
                value={editCity}
                onInput={(e) => setEditCity(e.detail.value)}
                placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
                style={{
                  height: '44px', width: '100%', fontSize: 14, color: T.ink,
                }}
              />
            </View>
          </View>

          {/* Bio */}
          <View style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>签名</Text>
            <View style={{
              borderRadius: 10, border: `1.5px solid ${T.border}`,
              background: T.bgCard, padding: '0 14px', overflow: 'hidden',
            }}>
              <Input
                placeholder="一句话介绍自己"
                value={editBio}
                onInput={(e) => setEditBio(e.detail.value)}
                placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
                style={{
                  height: '44px', width: '100%', fontSize: 14, color: T.ink,
                }}
              />
            </View>
          </View>

          {/* Birthday */}
          <View style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>生日</Text>
            <Picker mode="date" onChange={(e) => setEditBirthday(e.detail.value)}>
              <View style={{
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${T.border}`, background: T.bgCard,
                boxSizing: 'border-box',
              }}>
                <Text style={{ fontSize: 14, lineHeight: '22px', color: editBirthday ? T.ink : T.inkFaint }}>
                  {editBirthday || '请选择生日'}
                </Text>
              </View>
            </Picker>
          </View>

          {/* Email (read-only) */}
          <View style={{
            display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: `1px solid ${T.border}`,
          }}>
            <Text style={{ fontSize: 12, color: T.inkFaint }}>邮箱</Text>
            <Text style={{ fontSize: 12, color: T.inkMid, fontWeight: 500 }}>
              {user?.email || '-'}
            </Text>
          </View>

          {/* UID (read-only) */}
          <View style={{
            display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
            padding: '8px 0',
          }}>
            <Text style={{ fontSize: 12, color: T.inkFaint }}>UID</Text>
            <Text style={{ fontSize: 12, color: T.inkMid, fontWeight: 500, letterSpacing: '0.05em' }}>
              {user?.id ? `${user.id.slice(0, 8)}...` : '-'}
            </Text>
          </View>

          {/* Save button */}
          <View style={{ marginTop: 12 }}>
            <ThemedBtn full onTap={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? '保存中...' : '保存资料'}
            </ThemedBtn>
          </View>
        </View>

        {/* Unlink account */}
        {isAccountLinked() ? (
          <View style={{
            padding: '14px 16px', borderRadius: 12,
            background: T.bgCardAlt,
            border: `1px solid ${T.border}`,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 4, display: 'block' }}>
              解除账号关联
            </Text>
            <Text style={{ fontSize: 11, color: T.inkFaint, marginBottom: 10, display: 'block' }}>
              解除后将继续使用微信身份，网页版数据需通过网页版访问
            </Text>
            <ThemedBtn variant="outline" full onTap={async () => {
              const res = await wx.showModal({
                title: '解除绑定',
                content: '确定要解除账号关联吗？解除后小程序将独立使用微信身份。',
                confirmText: '解除',
                confirmColor: '#c44444',
              })
              if (res.confirm) {
                // Immediate UI reset for instant feedback
                setTripCount(0)
                setVisitedProvinces(0)
                setUser(null)
                setCouple(null)
                setTimelines([])
                
                await unlinkAccount(adapter)
                Taro.showToast({ title: '已解除', icon: 'success' })
                
                // Switch back to WeChat openid
                const originalId = wx.getStorageSync('yuting_user_id')
                if (originalId) setUserId(originalId)
                
                // Use originalId explicitly to avoid waiting for context state update
                await loadProfile(originalId || undefined)
              }
            }}>
              解除绑定
            </ThemedBtn>
          </View>
        ) : null}

        {/* Logout */}
        <View style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(200,50,50,0.03)',
          border: '1px solid rgba(200,50,50,0.1)',
        }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#C44444', marginBottom: 4 }}>退出登录</Text>
          <Text style={{ fontSize: 11, color: T.inkFaint, marginBottom: 10 }}>
            退出后需重新登录才能访问旅行数据
          </Text>
          <ThemedBtn variant="outline" full onTap={handleLogout}>确认退出</ThemedBtn>
        </View>
      </ModalSheet>

      {/* Timeline management modal */}
      <ModalSheet open={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="纪念日管理">
        {/* Add new timeline */}
        <View style={{
          background: T.bgCardAlt, borderRadius: 12, padding: 16,
          border: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10 }}>添加纪念日</Text>

          {/* Date */}
          <Picker mode="date" onChange={(e) => setNewTimeline({ ...newTimeline, date: e.detail.value })}>
            <View style={{
              padding: '10px 14px', borderRadius: 10,
              border: `1.5px solid ${T.border}`, background: T.bgCard,
              marginBottom: 8, boxSizing: 'border-box',
            }}>
              <Text style={{ fontSize: 14, lineHeight: '22px', color: newTimeline.date ? T.ink : T.inkFaint }}>
                {newTimeline.date || '选择日期 *'}
              </Text>
            </View>
          </Picker>

          {/* Title */}
          <View style={{
            borderRadius: 10, border: `1.5px solid ${T.border}`,
            background: T.bgCard, padding: '0 14px', overflow: 'hidden', marginBottom: 8,
          }}>
            <Input
              placeholder="标题，如：初次相遇 *"
              value={newTimeline.title}
              onInput={(e) => setNewTimeline({ ...newTimeline, title: e.detail.value })}
              placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
              style={{
                height: '44px', width: '100%', fontSize: 14, color: T.ink,
              }}
            />
          </View>

          {/* Description */}
          <View style={{
            borderRadius: 10, border: `1.5px solid ${T.border}`,
            background: T.bgCard, padding: '0 14px', overflow: 'hidden', marginBottom: 8,
          }}>
            <Input
              placeholder="描述（可选）"
              value={newTimeline.description}
              onInput={(e) => setNewTimeline({ ...newTimeline, description: e.detail.value })}
              placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
              style={{
                height: '44px', width: '100%', fontSize: 14, color: T.ink,
              }}
            />
          </View>

          {/* Icon + Type row */}
          <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <View style={{
              flex: 1, borderRadius: 10, border: `1.5px solid ${T.border}`,
              background: T.bgCard, padding: '0 14px', overflow: 'hidden',
            }}>
              <Input
                placeholder="图标 emoji"
                maxlength={2}
                value={newTimeline.icon}
                onInput={(e) => setNewTimeline({ ...newTimeline, icon: e.detail.value })}
                placeholderStyle={`color:${T.inkFaint};fontSize:14px`}
                style={{
                  height: '44px', width: '100%', fontSize: 14, color: T.ink,
                }}
              />
            </View>
            <Picker
              mode="selector"
              range={TIMELINE_TYPE_OPTIONS}
              onChange={(e) => setNewTimeline({ ...newTimeline, type: TIMELINE_TYPE_VALUES[Number(e.detail.value)] || 'milestone' })}
            >
              <View style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${T.border}`, background: T.bgCard,
                boxSizing: 'border-box',
              }}>
                <Text style={{ fontSize: 14, lineHeight: '22px', color: T.ink }}>
                  {TIMELINE_TYPE_OPTIONS[TIMELINE_TYPE_VALUES.indexOf(newTimeline.type)] || '里程碑'}
                </Text>
              </View>
            </Picker>
          </View>

          <ThemedBtn
            full
            onTap={handleAddTimeline}
            disabled={timelineLoading || !newTimeline.date || !newTimeline.title}
            small
          >
            {timelineLoading ? '添加中...' : '添加'}
          </ThemedBtn>
        </View>

        {/* Timeline list */}
        {timelines.map((tl) => (
          <View
            key={tl.id}
            style={{
              background: T.bgCard, borderRadius: 12, padding: '12px 16px',
              border: `1px solid ${T.border}`, marginBottom: 8,
              display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10,
            }}
          >
            <Text style={{ fontSize: 20 }}>{tl.icon || '✦'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{tl.title}</Text>
              <Text style={{ fontSize: 11, color: T.inkFaint }}>
                {tl.date}{tl.description ? ` · ${tl.description}` : ''}
              </Text>
            </View>
            <Pill small>{tl.type}</Pill>
            <View
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(200,50,50,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onTap={() => handleDeleteTimeline(tl.id)}
            >
              <Text style={{ fontSize: 14, color: '#C44444' }}>✕</Text>
            </View>
          </View>
        ))}
        {timelines.length === 0 && (
          <Text style={{ textAlign: 'center', fontSize: 12, color: T.inkFaint, padding: 20, display: 'block' }}>
            暂无纪念日，添加第一个吧
          </Text>
        )}
      </ModalSheet>
    </View>
  )
}
