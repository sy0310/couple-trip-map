'use client';

import dynamic from 'next/dynamic';
import { useMemo, Suspense } from 'react';

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
  const center = useMemo(() => {
    if (spots.length === 0) return [39.9042, 116.4074];
    const avgLat = spots.reduce((s, sp) => s + sp.lat, 0) / spots.length;
    const avgLng = spots.reduce((s, sp) => s + sp.lng, 0) / spots.length;
    return [avgLat, avgLng];
  }, [spots]);

  if (spots.length === 0) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        暂无景点数据
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ zIndex: 1 }}>
      <Suspense fallback={<MapSkeleton />}>
        <LeafletMap center={center as [number, number]} spots={spots} onSpotClick={onSpotClick} />
      </Suspense>
    </div>
  );
}
