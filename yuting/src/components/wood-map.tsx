'use client';

import { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { normalizeProvinceName, provinceToGeoJsonName } from '@/lib/provinces';

interface WoodMapProps {
  visitedProvinces: string[];
  visitedCities?: { name: string; province: string; lat: number; lng: number; photoCount: number; coverUrl?: string }[];
  onProvinceClick?: (name: string) => void;
  onCityClick?: (cityName: string) => void;
  onMapReady?: () => void;
}

export function WoodMap({ visitedProvinces, visitedCities = [], onProvinceClick, onCityClick, onMapReady }: WoodMapProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/china.json?v=4')
      .then((res) => res.json())
      .then((geoJson) => {
        // Remove South China Sea islands (adcode 100000_JD)
        const filteredGeoJson = {
          ...geoJson,
          features: geoJson.features.filter((f: { properties?: Record<string, unknown>; geometry?: unknown }) => {
            const ac = String(f.properties?.adcode ?? '');
            const name = f.properties?.name ?? '';
            // Filter South China Sea: adcode contains JD
            if (ac.includes('JD')) return false;
            // Safety net: empty name + low-latitude geometry
            if (!name && (f.geometry as any)?.coordinates) {
              const allNums = (f.geometry as any).coordinates.flat(10) as number[];
              const lats = allNums.filter((v: unknown, i: number) => typeof v === 'number' && i % 2 === 1) as number[];
              if (lats.length && Math.max(...lats) < 25) return false;
            }
            return true;
          }),
        };
        echarts.registerMap('china', filteredGeoJson);
        setLoaded(true);
        onMapReady?.();
      })
      .catch((err) => console.error('Failed to load China GeoJSON:', err));
  }, [onMapReady]);

  const option = {
    geo: {
      map: 'china',
      roam: true,
      layoutCenter: ['50%', '50%'],
      layoutSize: '102%',
      scaleLimit: {
        min: 0.8,
        max: 3,
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
          shadowBlur: 14,
          shadowOffsetX: 1,
          shadowOffsetY: 1,
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
      // City markers as scatter points on the geo coordinate system
      {
        name: '已访问城市',
        type: 'effectScatter' as const,
        coordinateSystem: 'geo' as const,
        symbolSize: (val: number[]) => {
          const base = 10;
          return base;
        },
        showEffectOn: 'render' as const,
        rippleEffect: {
          brushType: 'stroke' as const,
          period: 4,
          scale: 3,
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
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ background: '#4a3227' }}>
        <span className="text-sm" style={{ color: '#dac2b6' }}>加载地图中...</span>
      </div>
    );
  }

  return (
    <div style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}>
      <ReactECharts
        ref={chartRef}
        option={option}
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
    </div>
  );
}
