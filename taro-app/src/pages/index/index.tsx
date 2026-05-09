import { useContext, useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useReady, useDidShow, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro'
import { AppContext } from '../../context'
import chinaJson from '../../assets/china.json'
import { filterSouthChinaSeaIslands } from './map'
import { getVisitedProvinces, getVisitedCitiesWithCoords, getAllPhotosForCouple } from '@shared/lib/trips'
import { getCoupleId, getCoupleInfo } from '@shared/lib/couples'
import { getUser } from '../../services/auth'
import { TOTAL_PROVINCES, normalizeProvinceName } from '@shared/lib/provinces'
import ChinaMap from '../../components/china-map'
import { useTheme } from '../../components/theme/ThemeProvider'
import { PageHeader } from '../../components/page-header'
import { TripCard } from '../../components/trip-card'
import { SectionLabel } from '../../components/section-label'
import { Pill } from '../../components/pill'
import { StatBadge } from '../../components/stat-badge'

interface PhotoItem {
  id: string
  file_url: string
  created_at: string
  visitDate?: string
  tripLocation?: string
}

export default function Index() {
  const { adapter, userId } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([])
  const [visitedCities, setVisitedCities] = useState<
    { name: string; province: string; lat: number; lng: number; photoCount: number }[]
  >([])
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [coupleInfo, setCoupleInfo] = useState<{ partnerNickname?: string; sinceDate?: string | null }>({})
  const [userInfo, setUserInfo] = useState<{ nickname: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const geoJson = filterSouthChinaSeaIslands(chinaJson as unknown as Record<string, unknown>)

  const loadData = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    // Reset states before loading new data to avoid showing stale data from previous identity
    setVisitedProvinces([])
    setVisitedCities([])
    setAllPhotos([])
    setCoupleId(null)

    try {
      const cid = await getCoupleId(adapter, userId)
      setCoupleId(cid)
      if (!cid) {
        // Still try to load user info even if no couple
        try {
          const user = await getUser(adapter)
          if (user) setUserInfo({ nickname: user.nickname })
        } catch {}
        setLoading(false)
        return
      }
      const [provinces, cities, photos, user] = await Promise.all([
        getVisitedProvinces(adapter, cid),
        getVisitedCitiesWithCoords(adapter, cid),
        getAllPhotosForCouple(adapter, cid),
        getUser(adapter),
      ])

      setVisitedProvinces(provinces)
      setVisitedCities(cities)
      setAllPhotos(photos)
      if (user) setUserInfo({ nickname: user.nickname })

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
      setLoading(false)
    }
  }

  const loadCoupleInfo = async () => {
    if (!userId) return
    try {
      const info = await getCoupleInfo(adapter, userId)
      if (info) {
        setCoupleInfo({ partnerNickname: info.partnerNickname, sinceDate: info.sinceDate })
      } else {
        setCoupleInfo({})
      }
    } catch {}
  }

  useEffect(() => {
    if (userId) {
      loadData()
      loadCoupleInfo()
    }
  }, [userId])

  useDidShow(() => {
    if (userId) {
      loadData()
      loadCoupleInfo()
    }
  })

  useReady(() => {
    if (userId) {
      loadData()
      loadCoupleInfo()
    }
  })

  usePullDownRefresh(async () => {
    await loadData()
    await loadCoupleInfo()
    Taro.stopPullDownRefresh()
  })

  useShareAppMessage(() => ({
    title: '我们的旅行地图 — 遇亭',
    path: '/pages/index/index',
  }))

  const visitedCount = visitedProvinces.length
  const completionRate = ((visitedCount / TOTAL_PROVINCES) * 100).toFixed(1)

  const daysSince = coupleInfo.sinceDate
    ? Math.floor((Date.now() - new Date(coupleInfo.sinceDate).getTime()) / 86400000)
    : null

  const handleProvinceClick = (name: string) => {
    Taro.navigateTo({
      url: `/packageProvince/pages/province/index?name=${encodeURIComponent(normalizeProvinceName(name))}`,
    })
  }

  const handleCityClick = (cityName: string) => {
    const city = visitedCities.find((c) => c.name === cityName)
    if (city) {
      Taro.navigateTo({
        url: `/packageCity/pages/city/index?city=${encodeURIComponent(city.name)}&province=${encodeURIComponent(city.province)}`,
      })
    }
  }

  if (loading) {
    return (
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg }}>
        <Text style={{ color: T.inkFaint, fontSize: 14 }}>加载中...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg, gap: 8 }}>
        <Text style={{ color: T.accent, fontSize: 14 }}>{error}</Text>
        <Text style={{ color: T.inkFaint, fontSize: 12 }}>下拉刷新重试</Text>
      </View>
    )
  }

  if (!coupleId) {
    return (
      <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg, gap: 8 }}>
        <Text style={{ color: T.ink, fontSize: 16, fontWeight: 'bold' }}>欢迎来到遇亭</Text>
        <Text style={{ color: T.inkFaint, fontSize: 13 }}>请先在"我的"页面绑定情侣关系</Text>
      </View>
    )
  }

  const recentPhotos = allPhotos.slice(0, 6)

  return (
    <View style={{ minHeight: '100vh', background: T.bg }}>
      <PageHeader
        title="遇亭"
        subtitle="我们的旅行地图"
        rightEl={
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{userInfo?.nickname?.[0] || '旅'}</Text>
            </View>
            {coupleInfo.partnerNickname && (
              <View style={{ width: 32, height: 32, borderRadius: 16, background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.bg}`, marginLeft: -10 }}>
                <Text style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{coupleInfo.partnerNickname[0]}</Text>
              </View>
            )}
          </View>
        }
      />

      <View style={{ padding: '0 16px', paddingBottom: 16 }}>
        {/* Stats strip */}
        <View style={{ display: 'flex', flexDirection: 'row', margin: '16px 0', background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
          {[
            { v: String(visitedCount), u: `/${TOTAL_PROVINCES}`, l: '省份' },
            { v: String(visitedCities.length), u: '', l: '城市' },
            { v: String(allPhotos.length), u: '次', l: '旅行' },
            { v: String(allPhotos.length), u: '张', l: '照片' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}>
              <Text style={{ fontWeight: 700, fontSize: 20, color: T.accent, lineHeight: 1 }}>
                {s.v}<Text style={{ fontSize: 11, fontWeight: 500, color: T.inkFaint }}>{s.u}</Text>
              </Text>
              <Text style={{ fontSize: 10, color: T.inkFaint, marginTop: 3 }}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Map card */}
        <View style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 16, boxShadow: T.shadow }}>
          <View style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>足迹地图</SectionLabel>
            <Pill accent small>{visitedCount} 省已探索</Pill>
          </View>
          <View style={{ padding: '0 12px 12px', height: 260 }}>
            <ChinaMap
              geoJson={geoJson}
              visitedProvinces={visitedProvinces}
              visitedCities={visitedCities}
              theme={{
                accent: T.accent,
                accentLight: T.accentLight,
                gold: T.gold,
                bgCard: T.bgCard,
                bgCardAlt: T.bgCardAlt,
                ink: T.ink,
                inkFaint: T.inkFaint,
                border: T.border,
                borderMid: T.borderMid,
              }}
              canvasId="china-map"
              onProvinceClick={handleProvinceClick}
              onCityClick={handleCityClick}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <View style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}` }}>
            <Text style={{ fontSize: 11, color: T.inkFaint, fontStyle: 'italic' }}>
              ↑ 点击已探索省份查看详情
            </Text>
          </View>
        </View>

        {/* Recent trips */}
        <SectionLabel action="全部" onAction={() => Taro.navigateTo({ url: '/pages/album/index' })}>
          最近旅行
        </SectionLabel>

        {recentPhotos.length > 0 && (
          <>
            <View style={{ display: 'flex', flexDirection: 'row', gap: 10, marginBottom: 0 }}>
              {recentPhotos.slice(0, 2).map((photo) => (
                <View key={photo.id} style={{ flex: 1 }}>
                  <TripCard
                    location={photo.tripLocation || '旅行'}
                    province=""
                    city=""
                    date={photo.visitDate || photo.created_at.slice(0, 10)}
                    coverUrl={photo.file_url}
                  />
                </View>
              ))}
            </View>
            {recentPhotos[2] && (
              <View style={{ marginTop: 10 }}>
                <TripCard
                  location={recentPhotos[2].tripLocation || '旅行'}
                  province=""
                  city=""
                  date={recentPhotos[2].visitDate || recentPhotos[2].created_at.slice(0, 10)}
                  coverUrl={recentPhotos[2].file_url}
                />
              </View>
            )}
          </>
        )}

        {/* Anniversary counter */}
        {daysSince !== null && (
          <View style={{ marginTop: 16, marginBottom: 16, padding: '14px 16px', background: T.bgCard, borderRadius: 14, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: T.shadow }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, background: T.accentFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ fontSize: 18, color: T.accent }}>♥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: T.inkFaint, marginBottom: 2 }}>在一起</Text>
              <Text style={{ fontWeight: 600, fontSize: 15, color: T.ink }}>
                {coupleInfo.sinceDate || ''} · <Text style={{ color: T.accent }}>{daysSince} 天</Text>
              </Text>
            </View>
            <View style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgCardAlt }}
              onTap={() => Taro.navigateTo({ url: '/pages/stats/index' })}
            >
              <Text style={{ color: T.accent, fontSize: 11, fontWeight: 600 }}>查看</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
