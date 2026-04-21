'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { getProvinceByName, getGeoJsonFileName } from '@/lib/provinces';

const LeafletMapView = dynamic(() => import('./province-leaflet-map').then((mod) => mod.ProvinceLeafletMap), { ssr: false });

function LoadingState() {
  return (
    <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
      加载地图中...
    </div>
  );
}

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

  // Pre-calculate bounds and minZoom from GeoJSON (synchronous, no Leaflet map needed)
  const mapInfo = useMemo(() => {
    if (!geoJson) return null;
    const layer = L.geoJSON(geoJson as never);
    const bounds = layer.getBounds();
    return { bounds, center: bounds.getCenter() };
  }, [geoJson]);

  useEffect(() => {
    const fileName = getGeoJsonFileName(provinceName);
    if (!fileName) { setError(true); setLoading(false); return; }

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
    return <LoadingState />;
  }

  if (!mapInfo) {
    return <LoadingState />;
  }

  return (
    <LeafletMapView
      provinceName={provinceName}
      visitedCities={visitedCities}
      geoJson={geoJson}
      mapCenter={mapInfo.center}
      onCityClick={onCityClick}
    />
  );
}
