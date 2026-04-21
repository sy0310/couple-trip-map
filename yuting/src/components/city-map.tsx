'use client';

import dynamic from 'next/dynamic';
import { useMemo, Suspense } from 'react';
import { getCityByName } from '@/lib/provinces';

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
  const center = useMemo((): [number, number] => {
    // Priority: city coordinates from provinces.ts > spots average > Beijing fallback
    const cityData = getCityByName(cityName);
    if (cityData) return [cityData.lat, cityData.lng];
    if (spots.length > 0) {
      const avgLat = spots.reduce((s, sp) => s + sp.lat, 0) / spots.length;
      const avgLng = spots.reduce((s, sp) => s + sp.lng, 0) / spots.length;
      return [avgLat, avgLng];
    }
    return [39.9042, 116.4074];
  }, [cityName, spots]);

  return (
    <div className="w-full h-full" style={{ zIndex: 1 }}>
      <Suspense fallback={<MapSkeleton />}>
        <LeafletMap center={center} spots={spots} onSpotClick={onSpotClick} />
      </Suspense>
    </div>
  );
}
