import { useContext, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow, getCurrentInstance, useShareAppMessage } from '@tarojs/taro'
import { AppContext } from '../../../taro-app/src/app'
import { getTripsByCity, getPhotosByTrip } from '@shared/lib/trips'
import { getCoupleId } from '@shared/lib/couples'
import styles from './index.module.css'

interface TripWithPhotos {
  id: string
  location_name: string
  scenic_spot: string | null
  visit_date: string
  notes: string | null
  photos: string[]
}

export default function CityPage() {
  const { adapter, userId } = useContext(AppContext)
  const [trips, setTrips] = useState<TripWithPhotos[]>([])
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')

  useDidShow(async () => {
    const params = getCurrentInstance().router?.params
    const cityName = (params?.city as string) || ''
    const provinceName = (params?.province as string) || ''
    if (!cityName || !userId) return

    setCity(cityName)
    setProvince(provinceName)

    const cid = await getCoupleId(adapter, userId)
    if (!cid) return

    const tripRows = await getTripsByCity(adapter, cid, cityName)
    const tripsWithPhotos: TripWithPhotos[] = []
    for (const trip of tripRows) {
      const photos = await getPhotosByTrip(adapter, trip.id)
      tripsWithPhotos.push({
        ...trip,
        photos: photos.map((p) => p.file_url),
      })
    }
    setTrips(tripsWithPhotos)
  })

  useShareAppMessage(() => ({
    title: `${province} ${city} - 遇亭`,
    path: `/packageCity/pages/city/index?city=${encodeURIComponent(city)}&province=${encodeURIComponent(province)}`,
  }))

  const handlePhotoTap = (urls: string[], current: string) => {
    wx.previewImage({
      urls,
      current,
    })
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>{city}</Text>
        <Text className={styles.subtitle}>
          {province} · {trips.length} 次旅行
        </Text>
      </View>

      {trips.map((trip) => (
        <View key={trip.id} className={styles.tripCard}>
          <View className={styles.tripInfo}>
            <Text className={styles.tripLocation}>{trip.location_name}</Text>
            {trip.scenic_spot && (
              <Text className={styles.tripSpot}>{trip.scenic_spot}</Text>
            )}
            <Text className={styles.tripDate}>{trip.visit_date}</Text>
          </View>

          {trip.notes && (
            <Text className={styles.tripNotes}>{trip.notes}</Text>
          )}

          {trip.photos.length > 0 && (
            <View className={styles.photoGrid}>
              {trip.photos.map((url, idx) => (
                <Image
                  key={idx}
                  src={url}
                  mode="aspectFill"
                  className={styles.photoImage}
                  onTap={() => handlePhotoTap(trip.photos, url)}
                />
              ))}
            </View>
          )}
        </View>
      ))}

      {trips.length === 0 && (
        <View className={styles.empty}>
          <Text className={styles.emptyText}>暂无旅行记录</Text>
        </View>
      )}
    </View>
  )
}
