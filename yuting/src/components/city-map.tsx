'use client';

import { useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface CityMapProps {
  cityName: string;
  centerLat: number;
  centerLng: number;
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

export function CityMap({ cityName, centerLat, centerLng, spots, onSpotClick }: CityMapProps) {
  const chartRef = useRef<ReactECharts>(null);

  const option = useMemo(() => {
    const visitedSpots = spots.filter((s) => s.visited);
    const unvisitedSpots = spots.filter((s) => !s.visited);

    return {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(53,33,24,0.9)',
        borderColor: '#c99a6c',
        textStyle: { color: '#ffdea5', fontFamily: 'Manrope' },
      },
      geo: {
        roam: true,
        zoom: 1.2,
        center: [centerLng, centerLat],
        silent: true,
        itemStyle: {
          areaColor: '#352118',
          borderColor: 'transparent',
          borderWidth: 0,
        },
        label: { show: false },
      },
      series: [
        {
          name: '未访问景点',
          type: 'scatter' as const,
          coordinateSystem: 'geo' as const,
          symbolSize: 10,
          label: {
            show: true,
            color: '#9A8B7A',
            fontSize: 10,
            formatter: (p: { name: string }) => p.name,
          },
          itemStyle: {
            color: '#6B5438',
            borderColor: '#C9A882',
            borderWidth: 1,
          },
          data: unvisitedSpots.map((s) => ({
            name: s.name,
            value: [s.lng, s.lat],
          })),
          zlevel: 1,
        },
        {
          name: '已访问景点',
          type: 'effectScatter' as const,
          coordinateSystem: 'geo' as const,
          symbolSize: 14,
          showEffectOn: 'render' as const,
          rippleEffect: {
            brushType: 'stroke' as const,
            period: 4,
            scale: 3,
          },
          label: {
            show: true,
            color: '#ffdea5',
            fontSize: 12,
            fontWeight: 700,
            formatter: (p: { name: string }) => p.name,
          },
          itemStyle: {
            color: '#c99a6c',
            borderColor: '#ffdea5',
            borderWidth: 2,
            shadowColor: 'rgba(255,222,165,0.4)',
            shadowBlur: 8,
          },
          emphasis: {
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 15,
            },
          },
          data: visitedSpots.map((s) => ({
            name: s.name,
            value: [s.lng, s.lat],
          })),
          zlevel: 2,
        },
      ],
    };
  }, [centerLat, centerLng, spots]);

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ width: '100%', height: '100%' }}
      onEvents={{
        click: (params: { name: string; seriesType: string }) => {
          if (params.seriesType === 'scatter' && params.name) {
            onSpotClick?.(params.name);
          }
        },
      }}
    />
  );
}
