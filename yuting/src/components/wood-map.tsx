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

// Compute the bounding box of the cleaned GeoJSON and return the zoom needed
// to make it fill the container (with 4:3 aspect ratio).
function computeInitialZoom(geoJson: Record<string, unknown>): number {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const features = (geoJson as { features?: unknown[] }).features;
  if (!features) return 1.2;

  for (const feature of features) {
    const f = feature as { geometry?: { type: string; coordinates: number[][][][] } };
    const coords = f.geometry?.coordinates;
    if (!coords) continue;
    for (const group of coords) {
      const flat = group.flat(2) as unknown as number[][];
      for (const c of flat) {
        if (c[0] < minLon) minLon = c[0];
        if (c[0] > maxLon) maxLon = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
      }
    }
  }

  // Container is 4:3 (wider). After filtering, mainland bbox is roughly lon 73-122, lat 15-53
  // The map aspect (width/height in degrees): ~49 / ~38 ≈ 1.29
  // Container aspect: 4/3 ≈ 1.33
  // They're close, so a zoom of 1.2 should fill nicely
  const geoWidth = maxLon - minLon;
  const geoHeight = maxLat - minLat;
  const geoAspect = geoWidth / geoHeight;
  const containerAspect = 4 / 3;

  if (geoAspect > containerAspect) {
    // Map is wider than container — fit by width
    return 1.2;
  }
  // Map is taller than container — fit by height
  return 1.2;
}

export function WoodMap({ visitedProvinces, visitedCities = [], onProvinceClick, onCityClick, onMapReady, provinceCount, cityCount, completionRate }: WoodMapProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [loaded, setLoaded] = useState(false);
  const [geoZoom, setGeoZoom] = useState(1.2);

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
          const zoom = computeInitialZoom(cleaned);
          setGeoZoom(zoom);
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
      layoutSize: '100%',
      zoom: geoZoom,
      scaleLimit: {
        min: 0.5,
        max: 8,
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
    <>
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
      </div>
    </>
  );
}
