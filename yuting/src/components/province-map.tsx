'use client';

import { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getProvinceByName } from '@/lib/provinces';

interface ProvinceMapProps {
  provinceName: string;
  visitedCities: string[];
  cityCoords: { name: string; lat: number; lng: number; photoCount: number }[];
  onCityClick?: (name: string) => void;
  onBack?: () => void;
}

export function ProvinceMap({ provinceName, visitedCities, cityCoords, onCityClick, onBack }: ProvinceMapProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const prov = getProvinceByName(provinceName);
    if (!prov) {
      queueMicrotask(() => setError(true));
      return;
    }

    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${prov.adcode}_full.json`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('GeoJSON not found');
        return res.json();
      })
      .then((geoJson) => {
        const mapName = `prov-${provinceName}`;
        echarts.registerMap(mapName, geoJson);
        setLoaded(true);
      })
      .catch(() => {
        setError(true);
      });
  }, [provinceName]);

  if (error) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        <p>地图加载失败</p>
        <button
          onClick={onBack}
          className="mt-2 px-4 py-1.5 rounded-lg text-sm"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#dac2b6' }}
        >
          返回列表
        </button>
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

  const mapName = `prov-${provinceName}`;

  const option = {
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
      label: {
        show: true,
        color: '#dac2b6',
        fontSize: 10,
      },
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
        name: '已访问城市',
        type: 'scatter' as const,
        coordinateSystem: 'geo' as const,
        geoIndex: 0,
        symbolSize: 12,
        label: {
          show: true,
          color: '#ffdea5',
          fontSize: 11,
          fontWeight: 700,
          formatter: (p: { name: string }) => p.name,
        },
        itemStyle: {
          color: '#c99a6c',
          borderColor: '#ffdea5',
          borderWidth: 2,
          shadowColor: 'rgba(255,222,165,0.4)',
          shadowBlur: 6,
        },
        emphasis: {
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 12,
          },
        },
        data: cityCoords.map((c) => ({
          name: c.name,
          value: [c.lng, c.lat, c.photoCount],
        })),
        zlevel: 2,
      },
    ],
  };

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ width: '100%', height: '100%' }}
      onEvents={{
        click: (params: { name: string; componentType: string; seriesType: string }) => {
          if (params.seriesType === 'scatter' && params.name) {
            onCityClick?.(params.name);
          }
        },
      }}
    />
  );
}
