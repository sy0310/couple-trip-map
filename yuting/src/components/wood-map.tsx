'use client';

import { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { normalizeProvinceName, provinceToGeoJsonName } from '@/lib/provinces';
import { LoadingScreen } from '@/components/loading-screen';

interface WoodMapProps {
  visitedProvinces: string[];
  visitedCities?: { name: string; province: string; lat: number; lng: number; photoCount: number; coverUrl?: string }[];
  onProvinceClick?: (name: string) => void;
  onCityClick?: (cityName: string) => void;
  onMapReady?: () => void;
  provinceCount?: number;
  cityCount?: number;
  completionRate?: string;
}

// Remove polygon groups where ALL coordinates have latitude < 15 (South China Sea islands / 南沙群岛)
function filterSouthChinaSeaIslands(geoJson: Record<string, unknown>): Record<string, unknown> {
  const features = (geoJson as { features?: unknown[] }).features;
  if (!features) return geoJson;

  for (const feature of features) {
    const f = feature as { geometry?: { type: string; coordinates: number[][][][] } };
    const geometry = f.geometry;
    if (!geometry?.coordinates) continue;

    geometry.coordinates = geometry.coordinates.map((group) => {
      const allCoords = group.flat(2) as unknown as number[][];
      const minLat = Math.min(...allCoords.map((c) => c[1]));
      return minLat < 15 ? [] : group;
    }).filter((g) => g.length > 0);
  }

  return geoJson;
}

export function WoodMap({ visitedProvinces, visitedCities = [], onProvinceClick, onCityClick, onMapReady, provinceCount, cityCount, completionRate }: WoodMapProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [loaded, setLoaded] = useState(false);

  const flightLineData = (() => {
    if (visitedCities.length < 2) return [];
    const coords = visitedCities.map((c) => [c.lng, c.lat] as [number, number]);
    return coords.slice(0, -1).map((from, i) => ({
      fromName: visitedCities[i].name,
      toName: visitedCities[i + 1].name,
      coords: [from, coords[i + 1]],
    }));
  })();

  useEffect(() => {
    fetch('/china.json?v=5')
      .then((res) => res.json())
      .then((geoJson: Record<string, unknown>) => {
        setTimeout(() => {
          const cleaned = filterSouthChinaSeaIslands(geoJson);
          echarts.registerMap('china', cleaned as never);
          setLoaded(true);
          onMapReady?.();
        }, 50);
      })
      .catch((err) => console.error('Failed to load China GeoJSON:', err));
  }, [onMapReady]);

  // Resize ECharts when container changes
  useEffect(() => {
    if (!loaded || !chartRef.current) return;
    const instance = chartRef.current.getEchartsInstance();
    const dom = instance.getDom();
    if (!dom?.parentElement) return;

    const observer = new ResizeObserver(() => {
      instance.resize();
    });
    observer.observe(dom.parentElement);
    return () => observer.disconnect();
  }, [loaded]);

  const option = {
    geo: {
      map: 'china',
      roam: true,
      layoutCenter: ['50%', '50%'],
      layoutSize: '85%',
      aspectScale: 1,
      zoom: 1.0,
      scaleLimit: {
        min: 1.0,
        max: 5,
      },
      label: { show: false },
      light: {
        main: {
          intensity: 1.2,
          shadow: true,
          shadowQuality: 'high' as const,
          alpha: 45,
          beta: 60,
        },
        ambient: {
          intensity: 0.3,
        },
      },
      itemStyle: {
        areaColor: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#c99a6c' },
            { offset: 0.5, color: '#d4a87c' },
            { offset: 1, color: '#b8895e' },
          ],
        },
        borderColor: '#7a5c3e',
        borderWidth: 1.5,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowBlur: 4,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
      },
      emphasis: {
        label: { color: '#1f120c', fontSize: 11, fontWeight: 700 },
        itemStyle: {
          areaColor: '#8d6b2a',
          borderColor: '#352118',
          borderWidth: 2,
          shadowColor: 'rgba(53,33,24,0.5)',
          shadowBlur: 15,
          shadowOffsetX: 3,
          shadowOffsetY: 3,
        },
      },
      regions: visitedProvinces.map((name) => ({
        name: provinceToGeoJsonName(name),
        itemStyle: {
          areaColor: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#352118' },
              { offset: 0.5, color: '#4a2e1d' },
              { offset: 1, color: '#2a1b14' },
            ],
          },
          borderColor: '#ffdea5',
          borderWidth: 1.5,
          shadowColor: 'rgba(255,222,165,0.5)',
          shadowBlur: 20,
          shadowOffsetX: 2,
          shadowOffsetY: 3,
        },
        label: {
          color: '#ffdea5',
          fontWeight: 700,
          fontSize: 10,
        },
      })),
    },
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(53,33,24,0.9)',
      borderColor: '#c99a6c',
      textStyle: { color: '#ffdea5', fontFamily: 'Manrope' },
      formatter: (params: { name: string; seriesType?: string }) => {
        if (params.seriesType === 'scatter') {
          return `<b>${params.name}</b>`;
        }
        const normalizedName = normalizeProvinceName(params.name);
        const isVisited = visitedProvinces.includes(normalizedName);
        return `${params.name}<br/>${isVisited ? '✓ 已走过' : '未探索'}`;
      },
    },
    series: [
      ...(visitedProvinces.length > 0 ? [{
        type: 'map' as const,
        map: 'china',
        roam: false,
        silent: true,
        zlevel: 0,
        itemStyle: {
          areaColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        },
        lineStyle: {
          color: 'rgba(20,12,8,0.55)',
          width: 4,
        },
        emphasis: { disabled: true },
        data: visitedProvinces.map((name) => ({
          name: provinceToGeoJsonName(name),
          itemStyle: { areaColor: 'transparent' },
          lineStyle: {
            color: 'rgba(20,12,8,0.55)',
            width: 4,
          },
        })),
      }] : []),
      // 静态路线底纹
      ...(visitedCities.length >= 2 ? [{
        name: '旅行路线',
        type: 'lines' as const,
        coordinateSystem: 'geo' as const,
        zlevel: 1,
        lineStyle: {
          color: '#ffdea5',
          opacity: 0.15,
          width: 1.5,
          curveness: 0.3,
        },
        silent: true,
        data: flightLineData,
      }] : []),
      // 分段动画箭头
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
              color: '#ffdea5',
            },
            lineStyle: {
              color: '#ffdea5',
              opacity: 0,
              width: 1.5,
              curveness: 0.3,
            },
            data: [{
              fromName: visitedCities[i].name,
              toName: visitedCities[i + 1].name,
              coords: [
                [visitedCities[i].lng, visitedCities[i].lat] as [number, number],
                [visitedCities[i + 1].lng, visitedCities[i + 1].lat] as [number, number],
              ],
            }],
          }))
        : []),
      // 城市序号标记
      ...(visitedCities.length >= 2 ? [{
        name: '旅行节点',
        type: 'scatter' as const,
        coordinateSystem: 'geo' as const,
        zlevel: 4,
        symbolSize: 0,
        label: {
          show: true,
          formatter: (params: { dataIndex: number }) => {
            const n = params.dataIndex + 1;
            const city = visitedCities[params.dataIndex];
            return `{num|${n}}\n{name|${city?.name || ''}}`;
          },
          rich: {
            num: {
              fontSize: 11,
              fontWeight: 700,
              color: '#ffdea5',
              backgroundColor: 'rgba(53,33,24,0.85)',
              borderRadius: 10,
              padding: [3, 6],
              borderColor: '#c99a6c',
              borderWidth: 1,
            },
            name: {
              fontSize: 9,
              color: '#d4a87c',
              padding: [2, 0, 0, 0],
            },
          },
          position: 'top' as const,
          offset: [0, 5],
        },
        data: visitedCities.map((city) => ({
          name: city.name,
          value: [city.lng, city.lat],
        })),
        tooltip: {
          formatter: (params: { name: string; dataIndex: number }) => {
            const city = visitedCities[params.dataIndex];
            return `<b>${params.dataIndex + 1}. ${params.name}</b><br/>${city?.photoCount || 0} 张照片`;
          },
        },
      }] : []),
      {
        name: '已访问城市',
        type: 'effectScatter' as const,
        coordinateSystem: 'geo' as const,
        symbolSize: (_val: number[], params: { dataIndex: number }) => {
          const city = visitedCities[params.dataIndex];
          const base = 10;
          const extra = Math.min(8, Math.floor((city?.photoCount ?? 0) / 10));
          return base + extra;
        },
        showEffectOn: 'render' as const,
        rippleEffect: {
          brushType: 'stroke' as const,
          period: 4,
          scale: 4,
        },
        label: {
          show: false,
        },
        itemStyle: {
          color: '#ffdea5',
          borderColor: '#352118',
          borderWidth: 2,
          shadowColor: 'rgba(255,222,165,0.5)',
          shadowBlur: 8,
        },
        emphasis: {
          itemStyle: {
            borderWidth: 2,
            shadowBlur: 15,
          },
          label: {
            show: true,
            color: '#ffdea5',
            fontSize: 12,
            fontWeight: 700,
            backgroundColor: 'rgba(53,33,24,0.85)',
            padding: [4, 8],
            borderRadius: 4,
          },
        },
        data: visitedCities.map((city) => ({
          name: city.name,
          value: [city.lng, city.lat],
        })),
        tooltip: {
          formatter: (params: { name: string }) => {
            const city = visitedCities.find((c) => c.name === params.name);
            return `<b>${params.name}</b><br/>${city?.photoCount || 0} 张照片`;
          },
        },
        zlevel: 2,
      },
    ],
  };

  if (!loaded) {
    return <LoadingScreen message="加载地图中..." subMessage="正在绘制你们的旅途..." />;
  }

  return (
    <div className="relative w-full h-full">
      <div
        className="absolute top-3 left-3 px-3 py-2 rounded-sm"
        style={{
          background: 'rgba(53,33,24,0.85)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 20,
          border: '1px solid rgba(201,154,108,0.3)',
        }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: 'rgba(255,222,165,0.6)' }}>省份</span>
            <span className="text-sm font-semibold" style={{ color: '#ffdea5' }}>{provinceCount ?? visitedProvinces.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: 'rgba(255,222,165,0.6)' }}>城市</span>
            <span className="text-sm font-semibold" style={{ color: '#ffdea5' }}>{cityCount ?? visitedCities.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: 'rgba(255,222,165,0.6)' }}>完成度</span>
            <span className="text-sm font-semibold" style={{ color: '#ffdea5' }}>{completionRate ?? '0'}%</span>
          </div>
        </div>
      </div>

      <ReactECharts
          ref={chartRef}
          option={option}
          notMerge={true}
          style={{ width: '100%', height: '100%' }}
          onEvents={{
            click: (params: { name: string; componentType: string; seriesType: string }) => {
              if (params.seriesType === 'scatter') {
                onCityClick?.(params.name);
              } else {
                const normalizedName = normalizeProvinceName(params.name);
                onProvinceClick?.(normalizedName);
              }
            },
          }}
        />

      {/* 木纹纹理叠加 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          opacity: 0.06,
          mixBlendMode: 'multiply' as const,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005 0.12' numOctaves='5' seed='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
