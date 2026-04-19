'use client';

import { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

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
    fetch('/china.json')
      .then((res) => res.json())
      .then((geoJson) => {
        echarts.registerMap('china', geoJson);
        setLoaded(true);
        onMapReady?.();
      })
      .catch((err) => console.error('Failed to load China GeoJSON:', err));
  }, [onMapReady]);

  const option = {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(53,33,24,0.9)',
      borderColor: '#c99a6c',
      textStyle: { color: '#ffdea5', fontFamily: 'Manrope' },
      formatter: (params: { name: string; value: number }) => {
        const isVisited = visitedProvinces.includes(params.name);
        return `${params.name}<br/>${isVisited ? '✓ 已走过' : '未探索'}`;
      },
    },
    series: [
      {
        name: '中国地图',
        type: 'map' as const,
        map: 'china',
        roam: false,
        zoom: 1.15,
        label: {
          show: false,
          color: '#3e2a24',
          fontSize: 9,
          fontFamily: 'Manrope',
          fontWeight: 500,
        },
        emphasis: {
          label: { color: '#1f120c', fontSize: 11, fontWeight: 700 },
          itemStyle: {
            areaColor: '#8d6b2a',
            borderColor: '#352118',
            borderWidth: 2,
            shadowColor: 'rgba(53,33,24,0.4)',
            shadowBlur: 10,
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
          borderColor: '#8d6b2a',
          borderWidth: 1,
        },
        data: visitedProvinces.map((name) => ({
          name,
          value: 1,
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
            shadowColor: 'rgba(255,222,165,0.3)',
            shadowBlur: 6,
          },
          label: {
            color: '#ffdea5',
            fontWeight: 700,
            fontSize: 10,
          },
        })),
      },
      // City markers as scatter points
      {
        name: '已访问城市',
        type: 'scatter' as const,
        coordinateSystem: 'geo' as const,
        geoIndex: 0,
        symbolSize: (val: number[], params: { data: { photoCount: number } }) => {
          const base = 8;
          const scale = params.data.photoCount > 10 ? 1.5 : 1;
          return base * scale;
        },
        label: {
          show: false,
        },
        itemStyle: {
          color: {
            type: 'radial' as const,
            x: 0.5, y: 0.5, r: 0.5,
            colorStops: [
              { offset: 0, color: '#ffdea5' },
              { offset: 1, color: '#c99a6c' },
            ],
          },
          borderColor: '#352118',
          borderWidth: 1.5,
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
          value: [city.lng, city.lat, city.photoCount],
          photoCount: city.photoCount,
          coverUrl: city.coverUrl,
        })),
        tooltip: {
          formatter: (params: { data: { name: string; photoCount: number } }) => {
            const d = params.data;
            return `<b>${d.name}</b><br/>${d.photoCount} 张照片`;
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
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ width: '100%', height: '100%' }}
      onEvents={{
        click: (params: { name: string; componentType: string; seriesType: string }) => {
          if (params.seriesType === 'scatter') {
            onCityClick?.(params.name);
          } else {
            onProvinceClick?.(params.name);
          }
        },
      }}
    />
  );
}
