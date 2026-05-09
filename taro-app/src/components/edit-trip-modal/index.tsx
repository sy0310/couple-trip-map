import { useState, useContext } from 'react'
import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ModalSheet } from '../modal-sheet'
import { ThemedBtn } from '../themed-btn'
import { useTheme } from '../theme/ThemeProvider'
import { AppContext } from '../../context'
import { PROVINCES, normalizeProvinceName } from '@shared/lib/provinces'
import { updateTrip, deleteTrip, createPhotoRecord } from '@shared/lib/trips'
import { compressImage } from '../../services/storage'

interface EditTripModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  trip: {
    id: string
    locationName: string
    province: string
    city: string
    scenicSpot: string | null
    visitDate: string
    notes: string | null
    coupleId: string
  }
}

export function EditTripModal({ open, onClose, onSuccess, trip }: EditTripModalProps) {
  const { adapter } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const [province, setProvince] = useState(trip.province)
  const [city, setCity] = useState(trip.city)
  const [scenicSpot, setScenicSpot] = useState(trip.scenicSpot || '')
  const [visitDate, setVisitDate] = useState(trip.visitDate)
  const [notes, setNotes] = useState(trip.notes || '')
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const provinceNames = PROVINCES.map(p => p.name)
  const provinceIndex = provinceNames.indexOf(province)

  const handleProvinceChange = (e) => {
    setProvince(provinceNames[e.detail.value])
  }

  const handleDateChange = (e) => {
    setVisitDate(e.detail.value)
  }

  const handleSubmit = async () => {
    if (!province || !city || !visitDate) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    setSubmitting(true)
    const normalizedProvince = normalizeProvinceName(province)
    const locationName = scenicSpot
      ? `${normalizedProvince}·${city}·${scenicSpot}`
      : `${normalizedProvince}·${city}`

    const ok = await updateTrip(adapter, trip.id, {
      location_name: locationName,
      province: normalizedProvince,
      city,
      scenic_spot: scenicSpot || null,
      visit_date: visitDate,
      notes: notes || null,
    })

    if (ok) {
      Taro.showToast({ title: '保存成功', icon: 'success' })
      onSuccess()
    } else {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setSubmitting(true)
    const ok = await deleteTrip(adapter, trip.id)
    if (ok) {
      Taro.showToast({ title: '已删除', icon: 'success' })
      onSuccess()
    } else {
      Taro.showToast({ title: '删除失败', icon: 'error' })
    }
    setSubmitting(false)
  }

  const handleAddPhotos = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      
      Taro.showLoading({ title: '正在上传...' })
      let successCount = 0
      for (const tempPath of res.tempFilePaths) {
        try {
          // No manual compression to preserve EXIF orientation
          const ext = tempPath.split('.').pop() || 'jpg'
          const fileName = `${trip.coupleId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const uploadResult = await adapter.storage
            .from('photos')
            .upload(fileName, { tempFilePath: tempPath } as never, { contentType: 'image/jpeg' })

          if (uploadResult.error) continue

          const { data } = adapter.storage.from('photos').getPublicUrl(fileName)
          await createPhotoRecord(adapter, trip.id, data.publicUrl)
          successCount++
        } catch (e) {
          console.error('Upload individual photo failed:', e)
        }
      }
      Taro.hideLoading()
      if (successCount > 0) {
        Taro.showToast({ title: `成功添加 ${successCount} 张`, icon: 'success' })
        // We don't close the modal yet, maybe the user wants to edit other fields
      }
    } catch (err) {
      console.error('Choose image failed:', err)
    }
  }

  return (
    <ModalSheet open={open} onClose={onClose} title="编辑旅行">
      <View style={{ gap: 16, display: 'flex', flexDirection: 'column' }}>
        {/* Province */}
        <View>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>省份</Text>
          <Picker mode="selector" range={provinceNames} value={provinceIndex} onChange={handleProvinceChange}>
            <View style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 14,
            }}>
              {province || '选择省份'}
            </View>
          </Picker>
        </View>

        {/* City */}
        <View>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>城市</Text>
          <Input
            value={city}
            onInput={(e) => setCity(e.detail.value)}
            placeholder="例如：广州"
            style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 14,
              height: 'auto',
            }}
          />
        </View>

        {/* Scenic Spot */}
        <View>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>地点/景点（可选）</Text>
          <Input
            value={scenicSpot}
            onInput={(e) => setScenicSpot(e.detail.value)}
            placeholder="例如：长隆欢乐世界"
            style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 14,
              height: 'auto',
            }}
          />
        </View>

        {/* Visit Date */}
        <View>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>日期</Text>
          <Picker mode="date" value={visitDate} onChange={handleDateChange}>
            <View style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 14,
            }}>
              {visitDate || '选择日期'}
            </View>
          </Picker>
        </View>

        {/* Notes */}
        <View>
          <Text style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6, display: 'block' }}>备注（可选）</Text>
          <Textarea
            value={notes}
            onInput={(e) => setNotes(e.detail.value)}
            placeholder="写下这次旅行的感受..."
            autoHeight
            style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.ink,
              fontSize: 14,
              width: 'auto',
              minHeight: 60,
            }}
          />
        </View>

        {/* Add photos */}
        <View style={{ marginTop: 10 }}>
          <ThemedBtn secondary small onTap={handleAddPhotos}>
            + 添加更多照片
          </ThemedBtn>
        </View>

        {/* Actions */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <View style={{ flex: 1 }}>
            <ThemedBtn secondary onTap={onClose}>取消</ThemedBtn>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedBtn onTap={handleSubmit} disabled={submitting}>
              {submitting ? '保存中...' : '保存修改'}
            </ThemedBtn>
          </View>
        </View>

        {/* Delete action */}
        <View style={{ marginTop: 10, paddingBottom: 20 }}>
          {!showDeleteConfirm ? (
            <View
              onTap={handleDelete}
              style={{
                textAlign: 'center',
                padding: 10,
                color: '#ff6b6b',
                fontSize: 13,
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: 8,
                background: 'rgba(255,107,107,0.05)',
              }}
            >
              删除这段旅行
            </View>
          ) : (
            <View style={{
              padding: 12,
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 13, color: '#ff6b6b', marginBottom: 12, display: 'block', textAlign: 'center' }}>
                确定删除？照片也将被一并移除。
              </Text>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <ThemedBtn secondary small onTap={() => setShowDeleteConfirm(false)}>取消</ThemedBtn>
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    onTap={handleDelete}
                    style={{
                      textAlign: 'center',
                      padding: 8,
                      background: '#ff6b6b',
                      color: '#fff',
                      fontSize: 13,
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    确认删除
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </ModalSheet>
  )
}
