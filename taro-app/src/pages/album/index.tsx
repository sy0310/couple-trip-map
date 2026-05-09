import { useContext, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { AppContext } from '../../context'
import { createPhotoRecord } from '@shared/lib/trips'
import { getCoupleId } from '@shared/lib/couples'
import { compressImage } from '../../services/storage'
import { useTheme } from '../../components/theme/ThemeProvider'
import { PageHeader } from '../../components/page-header'
import { ThemedBtn } from '../../components/themed-btn'

interface TripPhoto {
  tripId: string
  locationName: string
  visitDate: string
  coverUrl: string | null
  urls: string[]
}

export default function AlbumPage() {
  const { adapter, userId } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const [trips, setTrips] = useState<TripPhoto[]>([])
  const [allUrls, setAllUrls] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadTrips = async () => {
    if (!userId) return
    setLoading(true)
    
    // Reset states before loading new data to avoid showing stale data
    setTrips([])
    setAllUrls([])
    
    try {
      const cid = await getCoupleId(adapter, userId)
      if (!cid) { setLoading(false); return }

      const tripsResult = await adapter
        .from('trips')
        .select('id, location_name, visit_date, cover_url')
        .eq('couple_id', cid)
        .order('visit_date', { ascending: false })

      const tripsData = (tripsResult.data || []) as {
        id: string; location_name: string; visit_date: string; cover_url: string | null
      }[]

      const loaded: TripPhoto[] = []
      const allPics: string[] = []

      for (const trip of tripsData) {
        const photosResult = await adapter
          .from('photos')
          .select('id, file_url')
          .eq('trip_id', trip.id)

        const photos = (photosResult.data || []) as { id: string; file_url: string }[]
        const urls = photos.map((p) => p.file_url)

        loaded.push({
          tripId: trip.id,
          locationName: trip.location_name,
          visitDate: trip.visit_date,
          coverUrl: trip.cover_url || urls[0] || null,
          urls,
        })
        allPics.push(...urls)
      }

      setTrips(loaded)
      setAllUrls(allPics)
    } catch (err) {
      console.error('Failed to load trips:', err)
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => { loadTrips() })

  usePullDownRefresh(async () => {
    await loadTrips()
    Taro.stopPullDownRefresh()
  })

  const handleUpload = async () => {
    try {
      const res = await wx.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      setUploading(true)

      const cid = await getCoupleId(adapter, userId!)
      if (!cid) {
        Taro.showToast({ title: '请先绑定情侣', icon: 'error' })
        setUploading(false)
        return
      }

      const dateStr = new Date().toISOString().split('T')[0]
      const tripResult = await adapter
        .from('trips')
        .insert({
          couple_id: cid,
          location_name: '新旅行',
          province: '待分类',
          city: '待分类',
          visit_date: dateStr,
        })

      const newTrip = (tripResult.data as any[])?.[0] as { id: string } | undefined
      const tripId = newTrip?.id
      if (!tripId) {
        Taro.showToast({ title: '创建旅行失败', icon: 'error' })
        setUploading(false)
        return
      }

      let successCount = 0
      for (const tempPath of res.tempFilePaths) {
        try {
          const compressed = await compressImage(tempPath)
          const ext = compressed.split('.').pop() || 'jpg'
          const fileName = `${cid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const uploadResult = await adapter.storage
            .from('photos')
            .upload(fileName, { tempFilePath: compressed } as never, { contentType: 'image/jpeg' })

          if (uploadResult.error) continue

          const { data } = adapter.storage.from('photos').getPublicUrl(fileName)
          await createPhotoRecord(adapter, tripId, data.publicUrl)
          successCount++
        } catch { /* skip individual failures */ }
      }

      if (successCount > 0) {
        Taro.showToast({ title: `上传成功 ${successCount} 张`, icon: 'success' })
      } else {
        Taro.showToast({ title: '上传失败', icon: 'error' })
      }
      await loadTrips()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoTap = (url: string) => {
    wx.previewImage({ urls: allUrls, current: url })
  }

  return (
    <ScrollView scrollY style={{ flex: 1, background: T.bg }}>
      <PageHeader title="旅行相册" />

      <View style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
        <ThemedBtn small onTap={handleUpload} disabled={uploading}>
          {uploading ? '上传中...' : '上传照片'}
        </ThemedBtn>
      </View>

      {loading && (
        <View style={{ textAlign: 'center', padding: 60 }}>
          <Text style={{ fontSize: 13, color: T.inkFaint }}>加载中...</Text>
        </View>
      )}

      {!loading && trips.length === 0 && (
        <View style={{ textAlign: 'center', padding: '80px 16px' }}>
          <Text style={{ fontSize: 15, color: T.inkFaint, display: 'block' }}>还没有照片</Text>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginTop: 8, display: 'block' }}>
            点击上传按钮添加旅行照片
          </Text>
        </View>
      )}

      {!loading && trips.map((trip) => {
        const isExpanded = expanded === trip.tripId
        if (!trip.coverUrl && trip.urls.length === 0) return null

        return (
          <View key={trip.tripId} style={{ padding: '0 16px', marginBottom: 20 }}>
            {/* Trip header */}
            <View style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1, height: 1, background: T.border }} />
              <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap' }}>
                {trip.locationName}
              </Text>
              <Text style={{ fontSize: 11, color: T.inkFaint, whiteSpace: 'nowrap' }}>
                {trip.visitDate}
              </Text>
              <View style={{ flex: 1, height: 1, background: T.border }} />
            </View>

            {/* Cover image */}
            {trip.coverUrl && (
              <View
                style={{
                  borderRadius: 14, overflow: 'hidden',
                  border: `1px solid ${T.border}`, boxShadow: T.shadow, position: 'relative',
                }}
                onTap={() => {
                  if (trip.urls.length > 1) {
                    setExpanded(isExpanded ? null : trip.tripId)
                  } else if (trip.urls[0]) {
                    handlePhotoTap(trip.urls[0])
                  }
                }}
              >
                <Image src={trip.coverUrl} mode="aspectFill" style={{ width: '100%', height: 200 }} />
                <View style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '10px 14px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <Text style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
                    {trip.urls.length} 张照片
                  </Text>
                  {trip.urls.length > 1 && (
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                      {isExpanded ? '收起' : '查看全部'}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Expanded grid */}
            {isExpanded && trip.urls.length > 1 && (
              <View style={{
                marginTop: 10, padding: 10, borderRadius: 14,
                background: T.bgCardAlt, border: `1px solid ${T.border}`,
                display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6,
              }}>
                {trip.urls.map((url) => (
                  <View
                    key={url}
                    style={{ width: 'calc(33.33% - 4px)', borderRadius: 8, overflow: 'hidden' }}
                    onTap={() => handlePhotoTap(url)}
                  >
                    <Image src={url} mode="aspectFill" style={{ width: '100%', height: 100 }} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}
