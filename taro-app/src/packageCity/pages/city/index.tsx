import { useContext, useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { AppContext } from '../../../context'
import { getTripsByCity, getPhotosByTripIds } from '@shared/lib/trips'
import { getCoupleId } from '@shared/lib/couples'
import { getProvinceByName } from '@shared/lib/provinces'
import { useTheme } from '../../../components/theme/ThemeProvider'
import { ProgressBar } from '../../../components/progress-bar'
import { SectionLabel } from '../../../components/section-label'

interface TripItem {
  id: string
  location_name: string | null
  province: string
  city: string
  scenic_spot: string | null
  visit_date: string | null
  notes: string | null
  photo_count: number | null
  created_at: string
}

export default function City() {
  const { adapter, userId } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const router = useRouter()
  const cityName = decodeURIComponent(router.params.city || '')
  const provinceName = decodeURIComponent(router.params.province || '')

  const [trips, setTrips] = useState<TripItem[]>([])
  const [photosMap, setPhotosMap] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(true)

  const province = getProvinceByName(provinceName)
  const cityInfo = province?.cities.find(c => c.name === cityName)
  const scenicSpots = cityInfo?.scenicSpots || []
  const visitedSpots = [...new Set(trips.map(t => t.scenic_spot).filter(Boolean) as string[])]
  const totalSpots = scenicSpots.length
  const visitedSpotCount = visitedSpots.length
  const completion = totalSpots > 0 ? (visitedSpotCount / totalSpots) * 100 : 0

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const cid = await getCoupleId(adapter, userId)
        if (!cid) { setLoading(false); return }
        const tripData = await getTripsByCity(adapter, cid, cityName)
        setTrips(tripData as TripItem[])

        if (tripData.length > 0) {
          const tripIds = tripData.map((t: TripItem) => t.id)
          const photos = await getPhotosByTripIds(adapter, tripIds)
          setPhotosMap(photos)
        }
      } catch {} finally { setLoading(false) }
    })()
  }, [userId, cityName])

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
          <Text style={{ fontSize: 28, fontWeight: 700, color: T.ink, fontFamily: 'serif' }}>{cityName}</Text>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginTop: 4 }}>{provinceName}</Text>

          <View style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <View style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: T.bgCardAlt, borderRadius: 10 }}>
              <Text style={{ fontWeight: 700, fontSize: 22, color: T.accent }}>{trips.length}</Text>
              <Text style={{ fontSize: 10, color: T.inkFaint }}>旅行记录</Text>
            </View>
            <View style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: T.bgCardAlt, borderRadius: 10 }}>
              <Text style={{ fontWeight: 700, fontSize: 22, color: T.gold }}>
                {visitedSpotCount}<Text style={{ fontSize: 12, fontWeight: 400, color: T.inkFaint }}>{totalSpots > 0 ? `/${totalSpots}` : ''}</Text>
              </Text>
              <Text style={{ fontSize: 10, color: T.inkFaint }}>景点</Text>
            </View>
          </View>

          {totalSpots > 0 && (
            <View style={{ marginTop: 14 }}>
              <ProgressBar value={completion} max={100} height={6} />
            </View>
          )}
        </View>

        {/* Scenic spots tags */}
        {scenicSpots.length > 0 && (
          <>
            <SectionLabel style={{ margin: '0 16px 8px' }}>景点</SectionLabel>
            <View style={{ padding: '0 16px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {scenicSpots.map((spot) => {
                const isVisited = visitedSpots.includes(spot.name)
                return (
                  <View
                    key={spot.name}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      background: isVisited ? T.accent : T.bgCardAlt,
                      border: `1px solid ${isVisited ? T.accent : T.border}`,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: isVisited ? '#fff' : T.inkFaint, fontWeight: isVisited ? 600 : 400 }}>
                      {spot.name}
                    </Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Trip records */}
        <SectionLabel style={{ margin: '16px 16px 8px' }}>旅行记录</SectionLabel>

        <View style={{ padding: '0 16px' }}>
          {trips.length === 0 && (
            <View style={{ padding: '32px 0', textAlign: 'center' }}>
              <Text style={{ color: T.inkFaint, fontSize: 14 }}>还没有{cityName}的旅行记录</Text>
            </View>
          )}

          {trips.map((trip) => {
            const tripPhotos = photosMap.get(trip.id) || []
            return (
              <View
                key={trip.id}
                style={{
                  marginBottom: 12, background: T.bgCard, borderRadius: 14,
                  border: `1px solid ${T.border}`, padding: 14, boxShadow: T.shadow,
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 600, fontSize: 15, color: T.ink }}>
                      {trip.scenic_spot || trip.location_name || cityName}
                    </Text>
                    {trip.scenic_spot && (
                      <Text style={{ fontSize: 12, color: T.inkFaint }}>{trip.location_name || cityName}</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: T.inkFaint, flexShrink: 0 }}>
                    {trip.visit_date || trip.created_at.slice(0, 10)}
                  </Text>
                </View>

                {trip.notes && (
                  <Text style={{ fontSize: 13, color: T.inkMid, marginBottom: 8, lineHeight: 1.5 }}>
                    {trip.notes}
                  </Text>
                )}

                {tripPhotos.length > 0 && (
                  <ScrollView scrollX style={{ width: '100%' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
                      {tripPhotos.map((url, i) => (
                        <Image
                          key={i}
                          src={url}
                          mode="aspectFill"
                          style={{
                            width: 80, height: 80, borderRadius: 8,
                            background: T.bgCardAlt, flexShrink: 0,
                          }}
                          onTap={() => {
                            Taro.previewImage({ urls: tripPhotos, current: url })
                          }}
                        />
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )
          })}
        </View>
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
            url: `/pages/trip-edit/index?province=${encodeURIComponent(provinceName)}&city=${encodeURIComponent(cityName)}`,
          })
        }}
      >
        <Text style={{ fontSize: 28, color: '#fff', lineHeight: 1 }}>+</Text>
      </View>
    </View>
  )
}
