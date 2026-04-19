'use client';

import { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface WoodMapProps {
  visitedProvinces: string[];
  onProvinceClick?: (name: string) => void;
  onMapReady?: () => void;
}

export function WoodMap({ visitedProvinces, onProvinceClick, onMapReady }: WoodMapProps) {
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
        click: (params: { name: string }) => {
          onProvinceClick?.(params.name);
        },
      }}
    />
  );
}
