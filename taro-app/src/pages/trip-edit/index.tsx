import { useContext, useState } from 'react'
import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro, { getCurrentInstance, useDidShow } from '@tarojs/taro'
import { AppContext } from '../../app'
import { createTrip, updateTrip } from '../../../../shared/lib/trips'
import { getCoupleId } from '../../../../shared/lib/couples'
import { PROVINCES } from '../../../../shared/lib/provinces'
import styles from './index.module.css'

interface TripForm {
  location_name: string
  province: string
  city: string
  scenic_spot: string
  visit_date: string
  notes: string
}

const EMPTY_FORM: TripForm = {
  location_name: '',
  province: '',
  city: '',
  scenic_spot: '',
  visit_date: '',
  notes: '',
}

export default function TripEditPage() {
  const { adapter, userId } = useContext(AppContext)
  const [form, setForm] = useState<TripForm>(EMPTY_FORM)
  const [tripId, setTripId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  const provinceNames = PROVINCES.map((p) => p.name)
  const selectedProvince = PROVINCES.find((p) => p.name === form.province)
  const cityNames = selectedProvince
    ? selectedProvince.cities.map((c) => c.name)
    : []

  const load = async () => {
    if (!userId) return

    const cid = await getCoupleId(adapter, userId)
    setCoupleId(cid)

    const params = getCurrentInstance().router?.params
    if (params?.tripId) {
      setTripId(params.tripId)
      const result = await adapter
        .from('trips')
        .select('*')
        .eq('id', params.tripId)
        .maybeSingle()

      if (result.data) {
        const trip = result.data as {
          location_name: string
          province: string
          city: string
          scenic_spot: string | null
          visit_date: string
          notes: string | null
        }
        setForm({
          location_name: trip.location_name,
          province: trip.province,
          city: trip.city,
          scenic_spot: trip.scenic_spot ?? '',
          visit_date: trip.visit_date,
          notes: trip.notes ?? '',
        })
      }
    }
  }

  useDidShow(() => {
    load()
  })

  const handleProvinceChange = (e: { detail: { value: number } }) => {
    const provinceName = provinceNames[e.detail.value] ?? ''
    setForm((prev) => ({ ...prev, province: provinceName, city: '' }))
  }

  const handleCityChange = (e: { detail: { value: number } }) => {
    const cityName = cityNames[e.detail.value] ?? ''
    setForm((prev) => ({ ...prev, city: cityName }))
  }

  const handleDateChange = (e: { detail: { value: string } }) => {
    setForm((prev) => ({ ...prev, visit_date: e.detail.value }))
  }

  const handleSubmit = async () => {
    if (!form.location_name.trim()) {
      Taro.showToast({ title: '请输入地点名称', icon: 'error' })
      return
    }
    if (!form.province) {
      Taro.showToast({ title: '请选择省份', icon: 'error' })
      return
    }
    if (!form.city) {
      Taro.showToast({ title: '请选择城市', icon: 'error' })
      return
    }
    if (!form.visit_date) {
      Taro.showToast({ title: '请选择出行日期', icon: 'error' })
      return
    }

    setSaving(true)
    try {
      if (tripId) {
        const ok = await updateTrip(adapter, tripId, {
          location_name: form.location_name.trim(),
          province: form.province,
          city: form.city,
          scenic_spot: form.scenic_spot.trim() || null,
          visit_date: form.visit_date,
          notes: form.notes.trim() || null,
        })
        if (ok) {
          Taro.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => Taro.navigateBack(), 800)
        } else {
          Taro.showToast({ title: '保存失败', icon: 'error' })
        }
      } else {
        if (!coupleId) {
          Taro.showToast({ title: '请先绑定情侣', icon: 'error' })
          return
        }
        const result = await createTrip(adapter, coupleId, {
          location_name: form.location_name.trim(),
          province: form.province,
          city: form.city,
          scenic_spot: form.scenic_spot.trim() || undefined,
          visit_date: form.visit_date,
          notes: form.notes.trim() || undefined,
        })
        if (result) {
          Taro.showToast({
            title: result.existed ? '记录已存在' : '添加成功',
            icon: 'success',
          })
          setTimeout(() => Taro.navigateBack(), 800)
        } else {
          Taro.showToast({ title: '保存失败', icon: 'error' })
        }
      }
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className={styles.form}>
      <Text className={styles.pageTitle}>
        {tripId ? '编辑旅行记录' : '添加旅行记录'}
      </Text>

      {/* Location Name */}
      <View className={styles.field}>
        <Text className={styles.label}>地点名称 *</Text>
        <Input
          className={styles.input}
          placeholder="如：西湖、外滩"
          value={form.location_name}
          onInput={(e) =>
            setForm((prev) => ({
              ...prev,
              location_name: e.detail.value,
            }))
          }
        />
      </View>

      {/* Province Picker */}
      <View className={styles.field}>
        <Text className={styles.label}>省份 *</Text>
        <Picker mode="selector" range={provinceNames} onChange={handleProvinceChange}>
          <View className={styles.picker}>
            <Text className={form.province ? styles.pickerText : styles.pickerPlaceholder}>
              {form.province || '请选择省份'}
            </Text>
          </View>
        </Picker>
      </View>

      {/* City Picker */}
      <View className={styles.field}>
        <Text className={styles.label}>城市 *</Text>
        <Picker
          mode="selector"
          range={cityNames}
          onChange={handleCityChange}
          disabled={!form.province}
        >
          <View className={styles.picker}>
            <Text className={form.city ? styles.pickerText : styles.pickerPlaceholder}>
              {form.city || (form.province ? '请选择城市' : '请先选择省份')}
            </Text>
          </View>
        </Picker>
      </View>

      {/* Scenic Spot */}
      <View className={styles.field}>
        <Text className={styles.label}>景点（选填）</Text>
        <Input
          className={styles.input}
          placeholder="如：断桥残雪"
          value={form.scenic_spot}
          onInput={(e) =>
            setForm((prev) => ({
              ...prev,
              scenic_spot: e.detail.value,
            }))
          }
        />
      </View>

      {/* Visit Date */}
      <View className={styles.field}>
        <Text className={styles.label}>出行日期 *</Text>
        <Picker mode="date" onChange={handleDateChange}>
          <View className={styles.picker}>
            <Text className={form.visit_date ? styles.pickerText : styles.pickerPlaceholder}>
              {form.visit_date || '请选择日期'}
            </Text>
          </View>
        </Picker>
      </View>

      {/* Notes */}
      <View className={styles.field}>
        <Text className={styles.label}>备注（选填）</Text>
        <Textarea
          className={`${styles.input} ${styles.textarea}`}
          placeholder="记录旅行感受..."
          value={form.notes}
          onInput={(e) =>
            setForm((prev) => ({ ...prev, notes: e.detail.value }))
          }
        />
      </View>

      {/* Submit */}
      <View className={styles.submitBtn} onTap={handleSubmit}>
        <Text className={styles.submitText}>
          {saving ? '保存中...' : tripId ? '保存修改' : '添加记录'}
        </Text>
      </View>
    </View>
  )
}
