import { useContext, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AppContext } from '../../context'
import { getVisitedProvinces, getVisitedCitiesWithCoords, getAllPhotosForCouple } from '@shared/lib/trips'
import { getCoupleInfo } from '@shared/lib/couples'
import { TOTAL_PROVINCES } from '@shared/lib/provinces'
import { useTheme } from '../../components/theme/ThemeProvider'
import { ProgressBar } from '../../components/progress-bar'
import { Pill } from '../../components/pill'
import { StatBadge } from '../../components/stat-badge'
import { SectionLabel } from '../../components/section-label'
import { PageHeader } from '../../components/page-header'
import { ThemedBtn } from '../../components/themed-btn'

export default function Stats() {
  const { adapter, userId } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const [activeTab, setActiveTab] = useState<'stats' | 'timeline'>('stats')
  const [provinces, setProvinces] = useState<string[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [allPhotos, setAllPhotos] = useState<any[]>([])
  const [daysSince, setDaysSince] = useState(0)
  const [sinceDateLabel, setSinceDateLabel] = useState('')

  const loadData = async () => {
    if (!userId) return
    
    // Reset states before loading new data to avoid showing stale data from previous identity
    setProvinces([])
    setCities([])
    setAllPhotos([])
    setDaysSince(0)
    setSinceDateLabel('')
    
    const coupleInfo = await getCoupleInfo(adapter, userId)
    if (!coupleInfo) return

    const cid = coupleInfo.id
    const [p, c, ph] = await Promise.all([
      getVisitedProvinces(adapter, cid),
      getVisitedCitiesWithCoords(adapter, cid),
      getAllPhotosForCouple(adapter, cid),
    ])
    setProvinces(p)
    setCities(c)
    setAllPhotos(ph)

    if (coupleInfo.sinceDate) {
      const parts = coupleInfo.sinceDate.split('-')
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      const days = Math.floor((Date.now() - d.getTime()) / 86400000)
      setDaysSince(days)
      setSinceDateLabel(`${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`)
    }
  }

  useDidShow(() => { loadData() })

  const byYear: Record<string, number> = {}
  allPhotos.forEach(p => {
    const y = (p.created_at as string | undefined)?.slice(0, 4)
    if (y) byYear[y] = (byYear[y] || 0) + 1
  })
  const years = Object.keys(byYear).sort()
  const maxCount = Math.max(...Object.values(byYear), 1)

  const card = {
    background: T.bgCard,
    borderRadius: 16,
    padding: 16,
    border: `1px solid ${T.border}`,
    marginBottom: 16,
    boxShadow: T.shadow,
  }

  return (
    <ScrollView scrollY style={{ flex: 1, background: T.bg }}>
      <PageHeader title="统计 & 纪念" />

      {/* Tab switcher */}
      <View style={{
        display: 'flex', flexDirection: 'row',
        margin: '12px 16px',
        background: T.bgCardAlt, borderRadius: 12, padding: 3,
        border: `1px solid ${T.border}`,
      }}>
        {(['stats', 'timeline'] as const).map(tab => (
          <View
            key={tab}
            onTap={() => setActiveTab(tab)}
            style={{
              flex: 1, paddingTop: 8, paddingBottom: 8, borderRadius: 10,
              background: activeTab === tab ? T.bgCard : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? T.ink : T.inkFaint,
            }}>
              {tab === 'stats' ? '数据统计' : '周年时间线'}
            </Text>
          </View>
        ))}
      </View>

      {activeTab === 'stats' && (
        <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 80 }}>
          {/* Days + stat badges */}
          <View style={{ ...card, padding: 20 }}>
            <View style={{ textAlign: 'center', marginBottom: 16 }}>
              <Text style={{ fontWeight: 800, fontSize: 48, color: T.accent, lineHeight: 1, display: 'block' }}>
                {daysSince}
              </Text>
              <Text style={{ fontSize: 12, color: T.inkFaint, marginTop: 4, display: 'block' }}>
                在一起的天数
              </Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
              <View style={{ flex: 1 }}><StatBadge value={provinces.length} label="足迹省份" /></View>
              <View style={{ flex: 1 }}><StatBadge value={cities.length} label="探索城市" /></View>
              <View style={{ flex: 1 }}><StatBadge value={allPhotos.length} label="珍贵照片" /></View>
            </View>
          </View>

          {/* Year bar chart */}
          {years.length > 0 && (
            <View style={card}>
              <SectionLabel>按年份旅行次数</SectionLabel>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 100 }}>
                {years.map(y => (
                  <View key={y} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, color: T.accent, fontWeight: 700 }}>{byYear[y]}</Text>
                    <View style={{
                      width: '100%',
                      borderTopLeftRadius: 4, borderTopRightRadius: 4,
                      background: `linear-gradient(to top, ${T.accent}, ${T.accentLight})`,
                      height: Math.max(4, Math.floor((byYear[y] / maxCount) * 72)),
                    }} />
                    <Text style={{ fontSize: 9, color: T.inkFaint }}>{y.slice(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Province progress + pills */}
          <View style={card}>
            <SectionLabel>省份足迹</SectionLabel>
            <ProgressBar value={provinces.length} max={TOTAL_PROVINCES} showLabel height={10} />
            {provinces.length > 0 && (
              <View style={{ marginTop: 14, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {provinces.map(p => <Pill key={p} small>{p}</Pill>)}
              </View>
            )}
          </View>

          <ThemedBtn full onTap={() => Taro.showToast({ title: '功能即将上线', icon: 'none' })}>
            生成旅行海报
          </ThemedBtn>
        </View>
      )}

      {activeTab === 'timeline' && (
        <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 80 }}>
          {/* Together since hero card */}
          <View style={{
            background: `linear-gradient(135deg, ${T.accent}15, ${T.accentFaint})`,
            borderRadius: 20,
            paddingTop: 24, paddingBottom: 24, paddingLeft: 20, paddingRight: 20,
            textAlign: 'center',
            border: `1.5px solid ${T.accent}30`,
            marginBottom: 20, boxShadow: T.shadow,
          }}>
            <Text style={{ fontSize: 12, color: T.accent, fontWeight: 600, letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              TOGETHER SINCE
            </Text>
            <Text style={{ fontWeight: 700, fontSize: 22, color: T.ink, display: 'block' }}>
              {sinceDateLabel || '未设置'}
            </Text>
            <Text style={{ fontWeight: 800, fontSize: 42, color: T.accent, lineHeight: 1, display: 'block', marginTop: 8, marginBottom: 8 }}>
              {daysSince}
            </Text>
            <Text style={{ fontSize: 13, color: T.inkMid, display: 'block' }}>天的相守</Text>
          </View>

          <View style={{ textAlign: 'center', padding: 20 }}>
            <Text style={{ fontSize: 12, color: T.inkFaint }}>纪念日管理功能即将上线</Text>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
