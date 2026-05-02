import { provinceToGeoJsonName, normalizeProvinceName } from '@shared/lib/provinces'

export interface ThemeTokens {
  accent: string
  accentLight: string
  gold: string
  bgCard: string
  bgCardAlt: string
  ink: string
  inkFaint: string
  border: string
  borderMid: string
}

/**
 * Remove South China Sea island features from GeoJSON
 * (they distort the map at typical zoom levels).
 */
export function filterSouthChinaSeaIslands(
  geoJson: Record<string, unknown>
): Record<string, unknown> {
  const cleaned = JSON.parse(JSON.stringify(geoJson))
  const features = (cleaned as { features?: unknown[] }).features
  if (!features) return geoJson
  for (const feature of features) {
    const f = feature as {
      geometry?: { type: string; coordinates: number[][][][] }
    }
    const geometry = f.geometry
    if (!geometry?.coordinates) continue
    geometry.coordinates = geometry.coordinates
      .map((group) => {
        const allCoords = group.flat(2) as unknown as number[][]
        const minLat = Math.min(...allCoords.map((c) => c[1]))
        return minLat < 15 ? [] : group
      })
      .filter((g) => g.length > 0)
  }
  return cleaned
}

interface CityData {
  name: string
  province: string
  lat: number
  lng: number
  photoCount: number
}

/**
 * Build the ECharts option for the China travel map.
 */
export function buildOption(
  T: ThemeTokens,
  visitedProvinces: string[],
  visitedCities: CityData[],
  provinceCount: number,
  cityCount: number,
  completionRate: string
) {
  const flightLineData =
    visitedCities.length < 2
      ? []
      : visitedCities.slice(0, -1).map((c, i) => ({
          fromName: visitedCities[i].name,
          toName: visitedCities[i + 1].name,
          coords: [
            [c.lng, c.lat],
            [visitedCities[i + 1].lng, visitedCities[i + 1].lat],
          ],
        }))

  return {
    geo: {
      map: 'china',
      roam: true,
      layoutCenter: ['50%', '50%'],
      layoutSize: '100%',
      aspectScale: 1,
      zoom: 1.25,
      scaleLimit: { min: 1.01, max: 6 },
      label: { show: false },
      itemStyle: {
        areaColor: T.bgCardAlt,
        borderColor: T.border,
        borderWidth: 1.5,
      },
      emphasis: {
        label: { color: T.ink, fontSize: 11, fontWeight: 700 },
        itemStyle: {
          areaColor: T.accentLight,
          borderColor: T.ink,
          borderWidth: 2,
        },
      },
      regions: visitedProvinces.map((name) => ({
        name: provinceToGeoJsonName(name),
        itemStyle: {
          areaColor: T.accent,
          borderColor: T.gold,
          borderWidth: 1.5,
        },
        label: { color: '#fff', fontWeight: 700, fontSize: 10 },
      })),
    },
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: T.bgCard,
      borderColor: T.borderMid,
      textStyle: { color: T.ink },
      formatter: (params: { name: string; seriesType?: string }) => {
        if (params.seriesType === 'scatter') return `${params.name}`
        const normalizedName = normalizeProvinceName(params.name)
        const isVisited = visitedProvinces.includes(normalizedName)
        return `${params.name}\n${isVisited ? '已走过' : '未探索'}`
      },
    },
    series: [
      // Lines connecting visited cities
      ...(visitedCities.length >= 2
        ? [
            {
              name: '旅行路线',
              type: 'lines' as const,
              coordinateSystem: 'geo' as const,
              zlevel: 1,
              lineStyle: {
                color: T.gold,
                opacity: 0.2,
                width: 1.5,
                curveness: 0.3,
              },
              silent: true,
              data: flightLineData,
            },
          ]
        : []),
      // Animated lines between cities
      ...(visitedCities.length >= 2
        ? visitedCities.slice(0, -1).map((city, i) => ({
            name: `旅行路线-${i + 1}`,
            type: 'lines' as const,
            coordinateSystem: 'geo' as const,
            zlevel: 3,
            effect: {
              show: true,
              period: 5 + i * 2.5,
              trailLength: 0.5,
              symbol: 'arrow' as const,
              symbolSize: 8,
              color: T.gold,
            },
            lineStyle: {
              color: T.gold,
              opacity: 0,
              width: 1.5,
              curveness: 0.3,
            },
            data: [
              {
                fromName: visitedCities[i].name,
                toName: visitedCities[i + 1].name,
                coords: [
                  [visitedCities[i].lng, visitedCities[i].lat],
                  [visitedCities[i + 1].lng, visitedCities[i + 1].lat],
                ],
              },
            ],
          }))
        : []),
      // City number labels
      ...(visitedCities.length >= 2
        ? [
            {
              name: '旅行节点',
              type: 'scatter' as const,
              coordinateSystem: 'geo' as const,
              zlevel: 4,
              symbolSize: 0,
              data: visitedCities.map((city) => ({
                name: city.name,
                value: [city.lng, city.lat],
              })),
            },
          ]
        : []),
      // Visited cities scatter
      {
        name: '已访问城市',
        type: 'effectScatter' as const,
        coordinateSystem: 'geo' as const,
        symbolSize: (
          _val: number[],
          params: { dataIndex: number }
        ) =>
          10 +
          Math.min(
            8,
            Math.floor(
              (visitedCities[params.dataIndex]?.photoCount ?? 0) / 10
            )
          ),
        showEffectOn: 'render' as const,
        rippleEffect: {
          brushType: 'stroke' as const,
          period: 4,
          scale: 4,
        },
        label: { show: false },
        itemStyle: {
          color: T.gold,
          borderColor: T.bgCard,
          borderWidth: 2,
        },
        emphasis: {
          itemStyle: { borderWidth: 2 },
          label: {
            show: true,
            color: T.ink,
            fontSize: 12,
            fontWeight: 700,
            backgroundColor: T.bgCard,
            padding: [4, 8],
          },
        },
        data: visitedCities.map((city) => ({
          name: city.name,
          value: [city.lng, city.lat],
        })),
        tooltip: {
          formatter: (params: { name: string }) =>
            `${params.name}\n${
              visitedCities.find((c) => c.name === params.name)
                ?.photoCount || 0
            } 张照片`,
        },
        zlevel: 2,
      },
    ],
  }
}
