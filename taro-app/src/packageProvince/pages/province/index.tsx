import { useContext, useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { AppContext } from '../../../context'
import { getVisitedCities } from '@shared/lib/trips'
import { getCoupleId } from '@shared/lib/couples'
import { getProvinceByName, getCityByName, PROVINCES } from '@shared/lib/provinces'
import { useTheme } from '../../../components/theme/ThemeProvider'
import { PageHeader } from '../../../components/page-header'
import { ProgressBar } from '../../../components/progress-bar'
import { SectionLabel } from '../../../components/section-label'
import { StatBadge } from '../../../components/stat-badge'

// Check if a province is a direct-administered municipality (直辖市)
function isMunicipality(name: string): boolean {
  return ['北京', '上海', '天津', '重庆'].includes(name)
}

export default function Province() {
  const { adapter, userId } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const router = useRouter()
  const provinceName = decodeURIComponent(router.params.name || '')

  const [visitedCities, setVisitedCities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const province = getProvinceByName(provinceName)
  const allCities = province?.cities || []
  const visitedCount = visitedCities.length
  const totalCount = allCities.length
  const completion = totalCount > 0 ? (visitedCount / totalCount) * 100 : 0
  const mun = isMunicipality(provinceName)

  // For municipalities, compute visited scenic spots
  const cityInfo = mun && allCities.length > 0 ? allCities[0] : null
  const allSpots = cityInfo?.scenicSpots || []
  const visitedSpots = mun ? visitedCities.length : 0  // for municipality, visitedCities returns city names matching = province name
  const spotCompletion = allSpots.length > 0 ? (visitedSpots / allSpots.length) * 100 : 0

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const cid = await getCoupleId(adapter, userId)
        if (!cid) { setLoading(false); return }
        const cities = await getVisitedCities(adapter, cid, provinceName)
        setVisitedCities(cities)
      } catch {} finally { setLoading(false) }
    })()
  }, [userId, provinceName])

  if (loading) {
    return (
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg }}>
        <Text style={{ color: T.inkFaint, fontSize: 14 }}>加载中...</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, background: T.bg, position: 'relative' }}>
      <ScrollView scrollY style={{ flex: 1, paddingBottom: 80 }}>
        {/* Header Card */}
        <View style={{
          margin: 16, padding: '20px 16px',
          background: T.bgCard, borderRadius: 16,
          border: `1px solid ${T.border}`, boxShadow: T.shadow,
        }}>
          <Text style={{ fontSize: 28, fontWeight: 700, color: T.ink, fontFamily: 'serif' }}>{provinceName}</Text>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginTop: 4 }}>
            {mun ? `${allSpots.length} 个景点` : `${totalCount} 个城市`}
          </Text>

          <View style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <View style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: T.bgCardAlt, borderRadius: 10 }}>
              <Text style={{ fontWeight: 700, fontSize: 22, color: T.accent }}>
                {visitedCount}<Text style={{ fontSize: 12, fontWeight: 400, color: T.inkFaint }}>/{totalCount}</Text>
              </Text>
              <Text style={{ fontSize: 10, color: T.inkFaint }}>{mun ? '已探索' : '城市'}</Text>
            </View>
            <View style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: T.bgCardAlt, borderRadius: 10 }}>
              <Text style={{ fontWeight: 700, fontSize: 22, color: T.gold }}>
                {Math.round(completion)}<Text style={{ fontSize: 12, fontWeight: 400, color: T.inkFaint }}>%</Text>
              </Text>
              <Text style={{ fontSize: 10, color: T.inkFaint }}>完成度</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <ProgressBar value={mun ? spotCompletion : completion} max={100} height={6} />
          </View>
        </View>

        {/* City list */}
        {!mun && (
          <>
            <SectionLabel style={{ margin: '0 16px 8px' }}>城市</SectionLabel>
            <View style={{ padding: '0 16px' }}>
              {allCities.map((city) => {
                const isVisited = visitedCities.includes(city.name)
                return (
                  <View
                    key={city.name}
                    style={{
                      display: 'flex', flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px', marginBottom: 8,
                      background: isVisited ? T.bgCard : T.bgCardAlt,
                      borderRadius: 14, border: `1px solid ${isVisited ? T.accent : T.border}`,
                      opacity: isVisited ? 1 : 0.6,
                    }}
                    onTap={() => {
                      if (isVisited) {
                        Taro.navigateTo({
                          url: `/packageCity/pages/city/index?city=${encodeURIComponent(city.name)}&province=${encodeURIComponent(provinceName)}`,
                        })
                      }
                    }}
                  >
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        background: isVisited ? T.accent : T.border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 14, color: isVisited ? '#fff' : T.inkFaint }}>
                          {isVisited ? '✓' : '·'}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ fontWeight: 600, fontSize: 15, color: T.ink }}>{city.name}</Text>
                        {city.scenicSpots && city.scenicSpots.length > 0 && (
                          <Text style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>
                            {city.scenicSpots.slice(0, 3).map(s => s.name).join('、')}
                            {city.scenicSpots.length > 3 ? ` 等${city.scenicSpots.length}处` : ''}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isVisited && <Text style={{ fontSize: 12, color: T.accent }}>已探索 →</Text>}
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Scenic spots for municipalities */}
        {mun && allSpots.length > 0 && (
          <>
            <SectionLabel style={{ margin: '16px 16px 8px' }}>景点</SectionLabel>
            <View style={{ padding: '0 16px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {allSpots.map((spot) => {
                const visited = visitedSpots > 0 // For municipalities, if any trips exist
                return (
                  <View
                    key={spot.name}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      background: visited ? T.accent : T.bgCardAlt,
                      border: `1px solid ${visited ? T.accent : T.border}`,
                    }}
                    onTap={() => {
                      Taro.navigateTo({
                        url: `/packageCity/pages/city/index?city=${encodeURIComponent(provinceName)}&province=${encodeURIComponent(provinceName)}&spot=${encodeURIComponent(spot.name)}`,
                      })
                    }}
                  >
                    <Text style={{ fontSize: 13, color: visited ? '#fff' : T.inkFaint, fontWeight: visited ? 600 : 400 }}>
                      {spot.name}
                    </Text>
                  </View>
                )
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Travel FAB */}
      <View
        style={{
          position: 'fixed', bottom: 24, right: 20,
          width: 54, height: 54, borderRadius: 27,
          background: T.accent, boxShadow: T.shadowDeep,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
        onTap={() => {
          Taro.navigateTo({
            url: `/pages/trip-edit/index?province=${encodeURIComponent(provinceName)}`,
          })
        }}
      >
        <Text style={{ fontSize: 28, color: '#fff', lineHeight: 1 }}>+</Text>
      </View>
    </View>
  )
}
