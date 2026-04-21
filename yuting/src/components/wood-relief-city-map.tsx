'use client';

import { useState, useEffect } from 'react';
import { geojsonToSvgPaths, type BoundingBox } from '@/lib/geojson-to-svg';
import { getProvinceByName, getGeoJsonFileName } from '@/lib/provinces';
import { SealMarker } from '@/components/seal-marker';
import { SvgCompass } from '@/components/svg-compass';
import { useSvgZoom } from '@/hooks/use-svg-zoom';

interface WoodReliefCityMapProps {
  cityName: string;
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

const SVG_WIDTH = 800;
const SVG_HEIGHT = 380;

export function WoodReliefCityMap({ cityName, spots, onSpotClick }: WoodReliefCityMapProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [projectedSpots, setProjectedSpots] = useState<{ x: number; y: number; name: string; visited: boolean }[]>([]);
  const [allSpots, setAllSpots] = useState<{ x: number; y: number; name: string; visited: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const zoom = useSvgZoom({ width: SVG_WIDTH, height: SVG_HEIGHT, minZoom: 1, maxZoom: 6 });

  useEffect(() => {
    let targetProvinceName = '';
    const allProvinces = ['辽宁', '北京', '上海', '天津', '重庆', '广东', '江苏', '浙江', '四川', '湖北', '湖南', '河南', '山东', '河北', '福建', '安徽', '陕西', '江西', '云南', '广西', '山西', '贵州', '甘肃', '吉林', '新疆', '海南', '内蒙古', '黑龙江', '宁夏', '青海', '西藏', '台湾', '香港', '澳门'];

    for (const prov of allProvinces) {
      const provData = getProvinceByName(prov);
      if (provData?.cities.some((c) => c.name === cityName)) {
        targetProvinceName = prov;
        break;
      }
    }

    if (!targetProvinceName) { setError(true); setLoading(false); return; }

    const fileName = getGeoJsonFileName(targetProvinceName);
    if (!fileName) { setError(true); setLoading(false); return; }

    fetch(`/geojson/${fileName}`)
      .then((r) => {
        if (!r.ok) throw new Error('GeoJSON not found');
        return r.json();
      })
      .then((geoJson) => {
        const cityData = getProvinceByName(targetProvinceName)?.cities.find((c) => c.name === cityName);
        const cityAdcodePrefix = cityData?.adcode?.slice(0, 4) || '';

        const cityFeatures = geoJson.features.filter((f: { properties: { name?: string; adcode?: string } }) => {
          if (cityAdcodePrefix && f.properties?.adcode?.startsWith(cityAdcodePrefix)) return true;
          if (cityName && f.properties?.name?.includes(cityName)) return true;
          return false;
        });

        let bbox: BoundingBox | null = null;

        if (cityFeatures.length > 0) {
          const cityGeoJson = { ...geoJson, features: cityFeatures };
          const result = geojsonToSvgPaths(cityGeoJson, { width: SVG_WIDTH, height: SVG_HEIGHT, padding: 40, tolerance: 1.2 });
          setSvgPaths(result.paths);
          bbox = result.boundingBox;
        } else {
          const result = geojsonToSvgPaths(geoJson, { width: SVG_WIDTH, height: SVG_HEIGHT, padding: 40, tolerance: 1.2 });
          setSvgPaths(result.paths);
          bbox = result.boundingBox;
        }

        if (bbox) {
          const { minLng, maxLng, minLat, maxLat } = bbox;
          const padding = 40;
          const lngRange = maxLng - minLng || 1;
          const latRange = maxLat - minLat || 1;
          const scaleX = (SVG_WIDTH - padding * 2) / lngRange;
          const scaleY = (SVG_HEIGHT - padding * 2) / latRange;
          const scale = Math.min(scaleX, scaleY);
          const offsetX = padding + ((SVG_WIDTH - padding * 2) - lngRange * scale) / 2;
          const offsetY = padding + ((SVG_HEIGHT - padding * 2) - latRange * scale) / 2;

          const project = (lng: number, lat: number) => ({
            x: (lng - minLng) * scale + offsetX,
            y: (maxLat - lat) * scale + offsetY,
          });

          // All scenic spots from province data
          if (cityData?.scenicSpots && cityData.scenicSpots.length > 0) {
            const visitedNames = new Set(spots.filter((s) => s.visited).map((s) => s.name));
            const allProjected = cityData.scenicSpots.map((s) => {
              const p = project(s.lng, s.lat);
              return { x: p.x, y: p.y, name: s.name, visited: visitedNames.has(s.name) };
            });
            setAllSpots(allProjected);
          }

          // Project passed spots
          if (spots.length > 0) {
            const projected = spots.map((spot) => {
              const p = project(spot.lng, spot.lat);
              return { x: p.x, y: p.y, name: spot.name, visited: spot.visited };
            });
            setProjectedSpots(projected);
          }
        }

        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [cityName, spots]);

  if (error) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        <p>地图加载失败</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        加载地图中...
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full"
      style={{ background: '#352118', cursor: 'grab' }}
      onMouseDown={zoom.onMouseDown}
      onMouseMove={zoom.onMouseMove}
      onWheel={zoom.onWheel}
      onTouchStart={zoom.onTouchStart}
      onTouchMove={zoom.onTouchMove}
      onTouchEnd={zoom.onTouchEnd}
    >
      <defs>
        <filter id="city-carve">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.15" numOctaves="4" seed="7" result="noise" />
          <feDiffuseLighting in="noise" surfaceScale="1.5" lightingColor="#c99a6c" diffuseConstant="0.6" result="light">
            <feDistantLight azimuth="135" elevation="50" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="0.6" k2="0.4" k3="0" k4="0" />
        </filter>
        <filter id="outline-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#8d6b2a" flood-opacity="0.3" />
        </filter>
      </defs>

      {/* Extended background */}
      <rect x={-2000} y={-2000} width={SVG_WIDTH + 4000} height={SVG_HEIGHT + 4000} fill="#352118" />

      <g transform={zoom.transform}>
        {/* City outline — carved relief */}
        <g filter="url(#city-carve)">
          {svgPaths.map((d, i) => (
            <path key={i} d={d} fill="#2a1a0e" stroke="#8d6b2a" strokeWidth="0.8" opacity="0.9" />
          ))}
        </g>

        {svgPaths.map((d, i) => (
          <path key={`outline-${i}`} d={d} fill="none" stroke="#c99a6c" strokeWidth="0.5" filter="url(#outline-glow)" opacity="0.6" />
        ))}

        {/* All scenic spots */}
        {allSpots.map((spot) => (
          spot.visited ? (
            <SealMarker
              key={spot.name}
              x={spot.x}
              y={spot.y}
              label={spot.name}
              size={7}
              onClick={() => onSpotClick?.(spot.name)}
            />
          ) : (
            <g key={spot.name} transform={`translate(${spot.x}, ${spot.y})`}>
              <circle r={5} fill="none" stroke="#8d6b2a" strokeWidth="0.8" opacity="0.4" />
              <circle r={2} fill="#8d6b2a" opacity="0.35" />
              <text
                y={-8}
                textAnchor="middle"
                fontSize={8}
                fill="#8d6b2a"
                opacity={0.45}
                style={{ paintOrder: 'stroke', stroke: '#352118', strokeWidth: 2 }}
              >
                {spot.name}
              </text>
            </g>
          )
        ))}
      </g>

      {/* Compass fixed on top */}
      <SvgCompass x={720} y={55} size={42} />
    </svg>
  );
}
