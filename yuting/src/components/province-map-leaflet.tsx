'use client';

import { useMemo, Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PROVINCES, getGeoJsonFileName } from '@/lib/provinces';

interface ProvinceMapProps {
  provinceName: string;
  visitedCities: string[];
  cityCoords: { name: string; lat: number; lng: number; photoCount: number }[];
  onCityClick?: (name: string) => void;
  onBack?: () => void;
}

function Skeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#352118' }}>
      <span className="text-sm" style={{ color: '#9A8B7A' }}>加载地图中...</span>
    </div>
  );
}

const LeafletProvinceMap = dynamic(
  () => import('./province-map-leaflet-inner').then((m) => m.LeafletProvinceMap),
  { ssr: false, loading: () => <Skeleton /> }
);

export function ProvinceMap({ provinceName, visitedCities, cityCoords, onCityClick }: ProvinceMapProps) {
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fileName = getGeoJsonFileName(provinceName);
    if (fileName) {
      fetch(`/geojson/${fileName}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => setGeoJson(data))
        .catch((e) => console.warn('GeoJSON fetch failed:', e.message));
    }
  }, [provinceName]);

  const center = useMemo((): [number, number] => {
    const prov = PROVINCES.find((p) => p.name === provinceName);
    if (prov) return [prov.lat, prov.lng];
    if (cityCoords.length > 0) {
      const avgLat = cityCoords.reduce((s, c) => s + c.lat, 0) / cityCoords.length;
      const avgLng = cityCoords.reduce((s, c) => s + c.lng, 0) / cityCoords.length;
      return [avgLat, avgLng];
    }
    return [35, 110];
  }, [provinceName, cityCoords]);

  const citiesWithCoords = useMemo(() => {
    const result: { name: string; lat: number; lng: number; visited: boolean }[] = [];
    const prov = PROVINCES.find((p) => p.name === provinceName);
    if (prov) {
      prov.cities.forEach((c) => {
        if (visitedCities.includes(c.name)) {
          result.push({
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            visited: true,
          });
        }
      });
    }
    console.log('[ProvinceMap]', { provinceName, visitedCities, rendered: result.map(r => r.name) });
    return result;
  }, [provinceName, visitedCities]);

  return (
    <Suspense fallback={<Skeleton />}>
      <LeafletProvinceMap
        center={center}
        citiesWithCoords={citiesWithCoords}
        geoJson={geoJson}
        onCityClick={onCityClick}
      />
    </Suspense>
  );
}
