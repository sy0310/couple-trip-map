'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { getProvinceByName, getGeoJsonFileName } from '@/lib/provinces';

const LeafletCityMap = dynamic(() => import('./city-leaflet-map').then((mod) => mod.CityLeafletMap), { ssr: false });

function LoadingState() {
  return (
    <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
      加载地图中...
    </div>
  );
}

interface WoodReliefCityMapProps {
  cityName: string;
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

export function WoodReliefCityMap({ cityName, spots, onSpotClick }: WoodReliefCityMapProps) {
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);
  const [allSpots, setAllSpots] = useState<{ name: string; lat: number; lng: number; visited: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const visitedSet = useMemo(() => new Set(spots.filter((s) => s.visited).map((s) => s.name)), [spots]);

  useEffect(() => {
    // Find the province that contains this city
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
      .then((data) => {
        // Extract city sub-region from province GeoJSON
        const cityData = getProvinceByName(targetProvinceName)?.cities.find((c) => c.name === cityName);
        const cityAdcodePrefix = cityData?.adcode?.slice(0, 4) || '';

        const cityFeatures = (data as { features?: { properties?: { name?: string; adcode?: string } }[] }).features?.filter((f) => {
          if (cityAdcodePrefix && f.properties?.adcode?.startsWith(cityAdcodePrefix)) return true;
          if (cityName && f.properties?.name?.includes(cityName)) return true;
          return false;
        }) || [];

        let filteredGeoJson = data;
        if (cityFeatures.length > 0) {
          filteredGeoJson = { ...data, features: cityFeatures };
        }

        setGeoJson(filteredGeoJson);

        // Build all scenic spots for this city — only visited ones
        if (cityData?.scenicSpots && cityData.scenicSpots.length > 0) {
          const allSpotsWithVisited = cityData.scenicSpots
            .filter((s) => visitedSet.has(s.name))
            .map((s) => ({
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              visited: true,
            }));
          setAllSpots(allSpotsWithVisited);
        }

        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [cityName, visitedSet]);

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

  return (
    <LeafletCityMap
      cityName={cityName}
      geoJson={geoJson}
      allSpots={allSpots}
      passedSpots={spots}
      onSpotClick={onSpotClick}
    />
  );
}
