'use client';

import { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { normalizeProvinceName, provinceToGeoJsonName } from '@/lib/provinces';

interface GeoJsonFeature {
  properties?: { adcode?: string | number; name?: string };
  geometry?: { coordinates: unknown[] };
}

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
    fetch('/china.json?v=4')
      .then((res) => res.json())
      .then((geoJson) => {
        // Remove South China Sea islands (adcode 100000_JD)
        const filteredGeoJson = {
          ...geoJson,
          features: geoJson.features.filter((f: GeoJsonFeature) => {
            const ac = String(f.properties?.adcode ?? '');
            const name = f.properties?.name ?? '';
            // Filter South China Sea: adcode contains JD
            if (ac.includes('JD')) return false;
            // Safety net: empty name + low-latitude geometry
            if (!name && f.geometry?.coordinates) {
              const allNums = f.geometry.coordinates.flat(10) as number[];
              const lats = allNums.filter((v: unknown, i: number) => typeof v === 'number' && i % 2 === 1) as number[];
              if (lats.length && Math.max(...lats) < 25) return false;
            }
            return true;
          }),
        };
        echarts.registerMap('china', filteredGeoJson);
        setLoaded(true);
        onMapReady?.();
        setTimeout(() => chartRef.current?.getEchartsInstance().resize(), 100);
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
      // Flight lines connecting visited cities
      ...(visitedCities.length >= 2 ? [{
        name: '旅行路线',
        type: 'lines' as const,
        coordinateSystem: 'geo' as const,
        effect: {
          show: true,
          period: 5,
          trailLength: 0.4,
          symbol: 'arrow' as const,
          symbolSize: 6,
          color: '#ffdea5',
        },
        lineStyle: {
          color: '#ffdea5',
          opacity: 0.25,
          width: 1.5,
          curveness: 0.3,
        },
        data: flightLineData,
        zlevel: 1,
      }] : []),
      // City markers as scatter points on the geo coordinate system
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
    return (
      <div className="flex items-center justify-center w-full h-full" style={{ background: '#4a3227' }}>
        <span className="text-sm" style={{ color: '#dac2b6' }}>加载地图中...</span>
      </div>
    );
  }

  return (
    <>
      {/* Progress statistics panel */}
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
    </>
  );
}
