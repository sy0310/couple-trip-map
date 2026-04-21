'use client';

import { useState, useEffect } from 'react';
import { geojsonToSvgPaths, type SvgPathResult } from '@/lib/geojson-to-svg';
import { getProvinceByName, getGeoJsonFileName } from '@/lib/provinces';
import { SealMarker } from '@/components/seal-marker';
import { SvgCompass } from '@/components/svg-compass';

interface WoodReliefMapProps {
  provinceName: string;
  visitedCities: string[];
  cityCoords: { name: string; lat: number; lng: number; photoCount: number }[];
  onCityClick?: (name: string) => void;
  onBack?: () => void;
}

const SVG_WIDTH = 800;
const SVG_HEIGHT = 380;

export function WoodReliefMap({ provinceName, visitedCities, cityCoords, onCityClick, onBack }: WoodReliefMapProps) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [projectedCoords, setProjectedCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const prov = getProvinceByName(provinceName);
    if (!prov) { setError(true); setLoading(false); return; }

    const fileName = getGeoJsonFileName(provinceName);
    if (!fileName) { setError(true); setLoading(false); return; }

    fetch(`/geojson/${fileName}`)
      .then((r) => {
        if (!r.ok) throw new Error('GeoJSON not found');
        return r.json();
      })
      .then((geoJson) => {
        const result = geojsonToSvgPaths(geoJson, { width: SVG_WIDTH, height: SVG_HEIGHT, padding: 40, tolerance: 1.2 });
        setSvgPaths(result.paths);

        // Project city coordinates using the same bounding box
        const { minLng, maxLng, minLat, maxLat } = result.boundingBox;
        const padding = 40;
        const lngRange = maxLng - minLng || 1;
        const latRange = maxLat - minLat || 1;
        const scaleX = (SVG_WIDTH - padding * 2) / lngRange;
        const scaleY = (SVG_HEIGHT - padding * 2) / latRange;
        const scale = Math.min(scaleX, scaleY);
        const offsetX = padding + ((SVG_WIDTH - padding * 2) - lngRange * scale) / 2;
        const offsetY = padding + ((SVG_HEIGHT - padding * 2) - latRange * scale) / 2;

        const coords: Record<string, { x: number; y: number }> = {};
        for (const city of cityCoords) {
          coords[city.name] = {
            x: (city.lng - minLng) * scale + offsetX,
            y: (maxLat - city.lat) * scale + offsetY,
          };
        }
        setProjectedCoords(coords);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [provinceName, cityCoords]);

  if (error) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        <p>地图加载失败</p>
        {onBack && (
          <button onClick={onBack} className="mt-2 px-4 py-1.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#dac2b6' }}>
            返回列表
          </button>
        )}
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
    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" style={{ background: '#352118' }}>
      <defs>
        <filter id="wood-carve">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.15" numOctaves="4" seed="7" result="noise" />
          <feDiffuseLighting in="noise" surfaceScale="1.5" lightingColor="#c99a6c" diffuseConstant="0.6" result="light">
            <feDistantLight azimuth="135" elevation="50" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="0.6" k2="0.4" k3="0" k4="0" />
        </filter>
        <filter id="seal-shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#1a0f05" flood-opacity="0.6" />
        </filter>
        <filter id="outline-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#8d6b2a" flood-opacity="0.3" />
        </filter>
        <filter id="wood-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.08" numOctaves="3" seed="3" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
          <feBlend in="SourceGraphic" in2="gray" mode="multiply" />
        </filter>
      </defs>

      {/* Background — dark wood */}
      <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="#352118" />

      {/* Province outline — carved relief */}
      <g filter="url(#wood-carve)">
        {svgPaths.map((d, i) => (
          <path key={i} d={d} fill="#2a1a0e" stroke="#8d6b2a" strokeWidth="0.8" opacity="0.9" />
        ))}
      </g>

      {/* Bright outline edge */}
      {svgPaths.map((d, i) => (
        <path key={`outline-${i}`} d={d} fill="none" stroke="#c99a6c" strokeWidth="0.5" filter="url(#outline-glow)" opacity="0.6" />
      ))}

      {/* Red seal markers for visited cities */}
      {Object.entries(projectedCoords).map(([name, { x, y }]) => (
        <SealMarker key={name} x={x} y={y} label={name} size={7} onClick={() => onCityClick?.(name)} />
      ))}

      {/* Traditional Chinese compass */}
      <SvgCompass x={720} y={55} size={42} />

      {/* Wood grain texture */}
      <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="none" filter="url(#wood-grain)" opacity="0.08" pointerEvents="none" />
    </svg>
  );
}
