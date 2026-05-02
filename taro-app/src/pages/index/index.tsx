import { useContext, useState, useRef } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useReady, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro'
import * as echarts from 'echarts'
import { AppContext } from '../../app'
import chinaJson from '../../assets/china.json'
import { buildOption, filterSouthChinaSeaIslands } from './map'
import { getCoupleId, getVisitedProvinces, getVisitedCitiesWithCoords, getAllPhotosForCouple } from '@shared/lib/trips'
import { TOTAL_PROVINCES, normalizeProvinceName } from '@shared/lib/provinces'
import EcCanvas from '../../components/ec-canvas'
import styles from './index.module.css'

interface PhotoItem {
  id: string
  file_url: string
  visitDate?: string
  tripLocation?: string
}

export default function Index() {
  const { adapter, userId } = useContext(AppContext)
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([])
  const [visitedCities, setVisitedCities] = useState<
    { name: string; province: string; lat: number; lng: number; photoCount: number }[]
  >([])
  const [recentPhotos, setRecentPhotos] = useState<PhotoItem[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [chartReady, setChartReady] = useState(false)
  const chartRef = useRef<Record<string, unknown> | null>(null)

  const loadData = async () => {
    if (!userId) return
    const cid = await getCoupleId(adapter, userId)
    setCoupleId(cid)
    if (!cid) return

    const [provinces, cities, photos] = await Promise.all([
      getVisitedProvinces(adapter, cid),
      getVisitedCitiesWithCoords(adapter, cid),
      getAllPhotosForCouple(adapter, cid),
    ])

    setVisitedProvinces(provinces)
    setVisitedCities(cities)
    setRecentPhotos(photos.slice(0, 6))

    // Register GeoJSON and update chart
    const geoJson = filterSouthChinaSeaIslands(chinaJson as unknown as Record<string, unknown>)
    echarts.registerMap('china', geoJson as never)
    setChartReady(true)
  }

  useReady(() => {
    loadData()
  })

  usePullDownRefresh(async () => {
    await loadData()
    Taro.stopPullDownRefresh()
  })

  useShareAppMessage(() => ({
    title: '我们的旅行地图 — 遇亭',
    path: '/pages/index/index',
  }))

  const visitedCount = visitedProvinces.length
  const completionRate = ((visitedCount / TOTAL_PROVINCES) * 100).toFixed(1)

  const themeTokens = {
    accent: '#FF6B81',
    accentLight: '#FF6B8120',
    gold: '#D4A574',
    bgCard: '#FFFFFF',
    bgCardAlt: '#FFF0F0',
    ink: '#2D2D2D',
    inkFaint: '#999999',
    border: '#F0E0E0',
    borderMid: '#E0D0D0',
  }

  const chartOption = chartReady
    ? buildOption(
        themeTokens,
        visitedProvinces,
        visitedCities,
        visitedCount,
        visitedCities.length,
        completionRate
      )
    : null

  const handleProvinceClick = (name: string) => {
    Taro.navigateTo({
      url: `/packageProvince/pages/province/index?name=${encodeURIComponent(name)}`,
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

  const onChartInit = (chart: echarts.ECharts) => {
    chart.on('click', (params: { name: string; seriesType?: string }) => {
      if (params.seriesType === 'effectScatter') {
        handleCityClick(params.name)
      } else {
        handleProvinceClick(normalizeProvinceName(params.name))
      }
    })
  }

  return (
    <View className={styles.container}>
      {/* Map Section */}
      <View className={styles.mapSection}>
        {chartReady && chartOption && (
          <EcCanvas
            ec={{
              option: chartOption,
              onInit: onChartInit,
            }}
            canvasId="china-map"
            style={{ width: '100%', height: '100%' }}
          />
        )}
        {/* Stats Overlay */}
        <View className={styles.statsOverlay}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>省份</Text>
            <Text className={styles.statValue}>{visitedCount}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>城市</Text>
            <Text className={styles.statValue}>{visitedCities.length}</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>完成度</Text>
            <Text className={styles.statValue}>{completionRate}%</Text>
          </View>
        </View>
      </View>

      {/* Recent Photos */}
      {recentPhotos.length > 0 && (
        <View className={styles.photoSection}>
          <Text className={styles.sectionTitle}>最近旅行</Text>
          <View className={styles.photoGrid}>
            {recentPhotos.map((photo) => (
              <View key={photo.id} className={styles.photoCard}>
                <Image
                  src={photo.file_url}
                  mode="aspectFill"
                  className={styles.photoImage}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}
