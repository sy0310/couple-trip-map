import { useContext, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { AppContext } from '../../context'
import { createPhotoRecord, deletePhoto, updateTrip } from '@shared/lib/trips'
import { getCoupleId } from '@shared/lib/couples'
import { compressImage } from '../../services/storage'
import { useTheme } from '../../components/theme/ThemeProvider'
import { PageHeader } from '../../components/page-header'
import { ThemedBtn } from '../../components/themed-btn'
import { EditTripModal } from '../../components/edit-trip-modal'
import { ModalSheet } from '../../components/modal-sheet'

interface TripPhoto {
  tripId: string
  locationName: string
  province: string
  city: string
  scenicSpot: string | null
  visitDate: string
  notes: string | null
  coverUrl: string | null
  urls: { id: string, file_url: string }[]
}

export default function AlbumPage() {
  const { adapter, userId } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const [trips, setTrips] = useState<TripPhoto[]>([])
  const [allUrls, setAllUrls] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  // Edit states
  const [editingTrip, setEditingTrip] = useState<TripPhoto | null>(null)
  const [selectingCover, setSelectingCover] = useState<string | null>(null)

  const loadTrips = async () => {
    if (!userId) return
    setLoading(true)
    
    try {
      const cid = await getCoupleId(adapter, userId)
      setCoupleId(cid)
      if (!cid) { setLoading(false); return }

      const tripsResult = await adapter
        .from('trips')
        .select('id, location_name, province, city, scenic_spot, visit_date, notes, cover_url')
        .eq('couple_id', cid)
        .order('visit_date', { ascending: false })

      const tripsData = (tripsResult.data || []) as any[]

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
          province: trip.province,
          city: trip.city,
          scenicSpot: trip.scenic_spot,
          visitDate: trip.visit_date,
          notes: trip.notes,
          coverUrl: trip.cover_url || urls[0] || null,
          urls: photos,
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
      const res = await Taro.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      setUploading(true)

      const cid = coupleId || await getCoupleId(adapter, userId!)
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
          // Remove manual compression to avoid EXIF/Rotation issues
          const ext = tempPath.split('.').pop() || 'jpg'
          const fileName = `${cid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const uploadResult = await adapter.storage
            .from('photos')
            .upload(fileName, { tempFilePath: tempPath } as never, { contentType: 'image/jpeg' })

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
    Taro.previewImage({ urls: allUrls, current: url })
  }

  const handleDeletePhoto = async (photoId: string, url: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: async (res) => {
        if (res.confirm) {
          const ok = await deletePhoto(adapter, photoId, url)
          if (ok) {
            Taro.showToast({ title: '已删除', icon: 'success' })
            loadTrips()
          } else {
            Taro.showToast({ title: '删除失败', icon: 'error' })
          }
        }
      }
    })
  }

  const handleSetCover = async (tripId: string, url: string) => {
    const ok = await updateTrip(adapter, tripId, { cover_url: url })
    if (ok) {
      Taro.showToast({ title: '设置成功', icon: 'success' })
      setSelectingCover(null)
      loadTrips()
    } else {
      Taro.showToast({ title: '设置失败', icon: 'error' })
    }
  }

  return (
    <View style={{ minHeight: '100vh', background: T.bg }}>
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
            <View style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1, height: 1, background: T.border }} />
              <View style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink, display: 'block' }}>
                  {trip.locationName}
                </Text>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={{ fontSize: 10, color: T.inkFaint }}>
                    {trip.visitDate}
                  </Text>
                  <Text 
                    onTap={() => setEditingTrip(trip)}
                    style={{ fontSize: 10, color: T.accent, textDecoration: 'underline' }}
                  >
                    编辑
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1, height: 1, background: T.border }} />
            </View>

            {/* Cover image */}
            {trip.coverUrl && (
              <View
                style={{
                  borderRadius: 14, overflow: 'hidden',
                  border: `1px solid ${T.border}`, boxShadow: T.shadow, position: 'relative',
                }}
              >
                <Image 
                  src={trip.coverUrl} 
                  mode="aspectFill" 
                  style={{ width: '100%', height: 200 }} 
                  showMenuByLongpress 
                  onTap={() => {
                    if (trip.urls.length > 1) setExpanded(isExpanded ? null : trip.tripId)
                  }}
                />
                
                <View style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '10px 14px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
                      {trip.urls.length} 张照片
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                    {trip.urls.length > 1 && (
                      <View 
                        onTap={(e) => {
                          e.stopPropagation()
                          setSelectingCover(trip.tripId)
                        }}
                        style={{ 
                          width: 32, height: 32, borderRadius: 16, background: 'rgba(0,0,0,0.5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <Text style={{ color: T.gold, fontSize: 14 }}>★</Text>
                      </View>
                    )}
                    {trip.urls.length > 1 && (
                      <View 
                        onTap={() => setExpanded(isExpanded ? null : trip.tripId)}
                        style={{ 
                          padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#fff' }}>
                          {isExpanded ? '收起' : '查看全部'}
                        </Text>
                      </View>
                    )}
                  </View>
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
                {trip.urls.map((p) => (
                  <View
                    key={p.id}
                    style={{ width: 'calc(33.33% - 4px)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                    onTap={() => handlePhotoTap(p.file_url)}
                  >
                    <Image src={p.file_url} mode="aspectFill" style={{ width: '100%', height: 100 }} showMenuByLongpress />
                    
                    {/* Actions overlay */}
                    <View style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.4)', padding: '4px 0',
                      display: 'flex', flexDirection: 'row', justifyContent: 'center',
                    }}>
                      <Text 
                        catchTap={() => handleDeletePhoto(p.id, p.file_url)}
                        style={{ color: '#ffbaba', fontSize: 10, fontWeight: 600 }}
                      >
                        删除
                      </Text>
                    </View>

                    {/* Cover badge */}
                    {p.file_url === trip.coverUrl && (
                      <View style={{
                        position: 'absolute', top: 4, left: 4, padding: '2px 4px',
                        borderRadius: 4, background: T.gold,
                      }}>
                        <Text style={{ fontSize: 8, color: '#fff', fontWeight: 600 }}>封面</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )
      })}

      <View style={{ height: 40 }} />

      {/* Modals */}
      {editingTrip && (
        <EditTripModal 
          open={!!editingTrip}
          trip={{
            id: editingTrip.tripId,
            locationName: editingTrip.locationName,
            province: editingTrip.province,
            city: editingTrip.city,
            scenicSpot: editingTrip.scenicSpot,
            visitDate: editingTrip.visitDate,
            notes: editingTrip.notes,
            coupleId: coupleId!,
          }}
          onClose={() => setEditingTrip(null)}
          onSuccess={() => {
            setEditingTrip(null)
            loadTrips()
          }}
        />
      )}

      {/* Cover Selection Modal (Centered Like Web) */}
      {selectingCover && (
        <View 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 200, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onTap={() => setSelectingCover(null)}
        >
          <View 
            catchTap={(e) => e.stopPropagation()}
            style={{
              width: '90%', background: T.bgCard, borderRadius: 20,
              padding: 20, border: `1px solid ${T.border}`,
              boxShadow: T.shadowDeep,
            }}
          >
            <Text style={{ 
              textAlign: 'center', display: 'block', marginBottom: 16, 
              fontWeight: 600, fontSize: 15, color: T.ink 
            }}>
              选择封面照片
            </Text>
            
            <ScrollView scrollY style={{ maxHeight: '50vh' }}>
              <View style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, 
                paddingBottom: 16 
              }}>
                {trips.find(t => t.tripId === selectingCover)?.urls.map((p) => (
                  <View 
                    key={p.id}
                    onTap={() => handleSetCover(selectingCover!, p.file_url)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
                      position: 'relative',
                      border: p.file_url === trips.find(t => t.tripId === selectingCover)?.coverUrl 
                        ? `3px solid ${T.accent}` : `1px solid ${T.border}`
                    }}
                  >
                    <Image src={p.file_url} mode="aspectFill" style={{ width: '100%', height: '100%' }} />
                    {p.file_url === trips.find(t => t.tripId === selectingCover)?.coverUrl && (
                      <View style={{
                        position: 'absolute', top: 2, right: 2, width: 14, height: 14,
                        borderRadius: 7, background: T.accent, display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Text style={{ color: '#fff', fontSize: 8 }}>✓</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <ThemedBtn secondary full onTap={() => setSelectingCover(null)}>
              取消
            </ThemedBtn>
          </View>
        </View>
      )}
    </View>
  )
}
