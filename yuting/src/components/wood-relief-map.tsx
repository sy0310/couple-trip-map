'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getProvinceByName, getGeoJsonFileName } from '@/lib/provinces';
import { LoadingScreen } from '@/components/loading-screen';

const LeafletMapView = dynamic(() => import('./province-leaflet-map').then((mod) => mod.ProvinceLeafletMap), { ssr: false });

interface WoodReliefMapProps {
  provinceName: string;
  visitedCities: string[];
  cityCoords: { name: string; lat: number; lng: number; photoCount: number }[];
  onCityClick?: (name: string) => void;
  onBack?: () => void;
}

export function WoodReliefMap({ provinceName, visitedCities, cityCoords, onCityClick }: WoodReliefMapProps) {
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fileName = getGeoJsonFileName(provinceName);
    if (!fileName) {
      queueMicrotask(() => { setError(true); setLoading(false); });
      return;
    }

    fetch(`/geojson/${fileName}`)
      .then((r) => {
        if (!r.ok) throw new Error('GeoJSON not found');
        return r.json();
      })
      .then((data) => {
        setGeoJson(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [provinceName]);

  if (error) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        <p>地图加载失败</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="加载地图中..." />;
  }

  return (
    <LeafletMapView
      provinceName={provinceName}
      visitedCities={visitedCities}
      geoJson={geoJson}
      onCityClick={onCityClick}
    />
  );
}
