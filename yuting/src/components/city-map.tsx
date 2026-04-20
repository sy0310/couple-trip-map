'use client';

import dynamic from 'next/dynamic';
import { useMemo, Suspense, useEffect, useState } from 'react';
import { getGeoJsonFileName } from '@/lib/provinces';

interface CityMapProps {
  cityName: string;
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

// Dynamically import Leaflet map — avoids SSR `window` reference
const LeafletMap = dynamic(
  () => import('./leaflet-map'),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#352118' }}>
      <span className="text-sm" style={{ color: '#9A8B7A' }}>加载地图中...</span>
    </div>
  );
}

export function CityMap({ cityName, spots, onSpotClick }: CityMapProps) {
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fileName = getGeoJsonFileName(cityName);
    if (fileName) {
      fetch(`/geojson/${fileName}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => setGeoJson(data))
        .catch((e) => console.warn('City GeoJSON fetch failed:', e.message));
    }
  }, [cityName]);

  const center = useMemo(() => {
    if (spots.length === 0) return [39.9042, 116.4074];
    const avgLat = spots.reduce((s, sp) => s + sp.lat, 0) / spots.length;
    const avgLng = spots.reduce((s, sp) => s + sp.lng, 0) / spots.length;
    return [avgLat, avgLng];
  }, [spots]);

  return (
    <div className="w-full h-full" style={{ zIndex: 1 }}>
      <Suspense fallback={<MapSkeleton />}>
        <LeafletMap center={center as [number, number]} spots={spots} onSpotClick={onSpotClick} geoJson={geoJson} />
      </Suspense>
    </div>
  );
}
