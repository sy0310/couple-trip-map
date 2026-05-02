import { useContext, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, getCurrentInstance } from '@tarojs/taro'
import { AppContext } from '../../../taro-app/src/app'
import { getVisitedCities, getTripCountsByCities } from '@shared/lib/trips'
import { getCoupleId } from '@shared/lib/couples'
import styles from './index.module.css'

interface CityInfo {
  name: string
  tripCount: number
}

export default function ProvincePage() {
  const { adapter, userId } = useContext(AppContext)
  const [cities, setCities] = useState<CityInfo[]>([])
  const [province, setProvince] = useState('')

  useDidShow(async () => {
    const params = getCurrentInstance().router?.params
    const name = (params?.name as string) || ''
    if (!name || !userId) return

    setProvince(name)
    const cid = await getCoupleId(adapter, userId)
    if (!cid) return

    const cityNames = await getVisitedCities(adapter, cid, name)
    const tripCounts = await getTripCountsByCities(adapter, cid, name, cityNames)
    const cityInfos: CityInfo[] = cityNames.map((cityName) => ({
      name: cityName,
      tripCount: tripCounts.get(cityName) || 0,
    }))
    setCities(cityInfos)
  })

  const handleCityTap = (cityName: string) => {
    Taro.navigateTo({
      url: `/packageCity/pages/city/index?city=${encodeURIComponent(cityName)}&province=${encodeURIComponent(province)}`,
    })
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>{province}</Text>
        <Text className={styles.subtitle}>已访问 {cities.length} 个城市</Text>
      </View>
      <View className={styles.cityList}>
        {cities.map((city) => (
          <View
            key={city.name}
            className={styles.cityItem}
            onTap={() => handleCityTap(city.name)}
          >
            <View className={styles.cityInfo}>
              <Text className={styles.cityName}>{city.name}</Text>
              <Text className={styles.cityTripCount}>
                {city.tripCount} 次旅行
              </Text>
            </View>
            <Text className={styles.arrow}>&#8250;</Text>
          </View>
        ))}
        {cities.length === 0 && (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>暂无旅行记录</Text>
          </View>
        )}
      </View>
    </View>
  )
}
