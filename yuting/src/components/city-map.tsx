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
    if (spots.length === 0) return {};

    const visitedSpots = spots.filter((s) => s.visited);
    const unvisitedSpots = spots.filter((s) => !s.visited);

    // Calculate bounds for axis range
    const lats = spots.map((s) => s.lat);
    const lngs = spots.map((s) => s.lng);
    const minLat = Math.min(...lats) - 0.02;
    const maxLat = Math.max(...lats) + 0.02;
    const minLng = Math.min(...lngs) - 0.02;
    const maxLng = Math.max(...lngs) + 0.02;

    return {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: 'rgba(53,33,24,0.9)',
        borderColor: '#c99a6c',
        textStyle: { color: '#ffdea5', fontFamily: 'Manrope' },
      },
      grid: { top: 20, bottom: 20, left: 20, right: 20 },
      xAxis: {
        type: 'value' as const,
        min: minLng,
        max: maxLng,
        show: false,
      },
      yAxis: {
        type: 'value' as const,
        min: minLat,
        max: maxLat,
        show: false,
        inverse: true, // Map convention: higher lat = north = top
      },
      series: [
        {
          name: '未访问景点',
          type: 'scatter' as const,
          xAxisIndex: 0,
          yAxisIndex: 0,
          symbolSize: 12,
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
          data: unvisitedSpots.map((s) => [s.lng, s.lat, s.name]),
          zlevel: 1,
        },
        {
          name: '已访问景点',
          type: 'effectScatter' as const,
          xAxisIndex: 0,
          yAxisIndex: 0,
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
          data: visitedSpots.map((s) => [s.lng, s.lat, s.name]),
          zlevel: 2,
        },
      ],
    };
  }, [spots]);

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
