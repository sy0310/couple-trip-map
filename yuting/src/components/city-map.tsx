'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getCityByName } from '@/lib/provinces';

interface CityMapProps {
  cityName: string;
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

export function CityMap({ cityName, spots, onSpotClick }: CityMapProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Fetch city GeoJSON
  useEffect(() => {
    const city = getCityByName(cityName);
    const adcode = city?.adcode;
    if (!adcode) { setError(true); return; }

    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('GeoJSON not found');
        return res.json();
      })
      .then((geoJson) => {
        const mapName = `city-${cityName}`;
        echarts.registerMap(mapName, geoJson);
        setLoaded(true);
      })
      .catch(() => {
        setError(true);
      });
  }, [cityName]);

  const mapName = useMemo(() => `city-${cityName}`, [cityName]);

  const option = useMemo(() => {
    if (spots.length === 0) return {};

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
        map: mapName,
        roam: true,
        zoom: 1.1,
        label: { show: false },
        itemStyle: {
          areaColor: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#4a2e1d' },
              { offset: 1, color: '#352118' },
            ],
          },
          borderColor: '#8d6b2a',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#6b4a2a',
            borderWidth: 2,
          },
        },
      },
      series: [
        {
          name: '未访问景点',
          type: 'scatter' as const,
          coordinateSystem: 'geo' as const,
          geoIndex: 0,
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
          geoIndex: 0,
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
  }, [mapName, spots]);

  if (error) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        <p>城市地图暂不可用</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        加载地图中...
      </div>
    );
  }

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
