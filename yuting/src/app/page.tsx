'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { Room3D } from '@/components/room-3d';
import { TOTAL_PROVINCES } from '@/lib/provinces';
import { getCoupleId, getVisitedProvinces, getVisitedCitiesWithCoords, getAllPhotosForCouple } from '@/lib/trips';

export default function HomePage() {
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [visitedCities, setVisitedCities] = useState<Awaited<ReturnType<typeof getVisitedCitiesWithCoords>>>([]);
  const [allPhotos, setAllPhotos] = useState<Awaited<ReturnType<typeof getAllPhotosForCouple>>>([]);
  const [loading, setLoading] = useState(true);

  const [coupleId, setCoupleId] = useState<string | null>(null);

  const loadData = async (cid: string) => {
    const [provinces, cities, photos] = await Promise.all([
      getVisitedProvinces(cid),
      getVisitedCitiesWithCoords(cid),
      getAllPhotosForCouple(cid),
    ]);
    setVisitedProvinces(provinces);
    setVisitedCities(cities);
    setAllPhotos(photos);
    setLoading(false);
  };

  useEffect(() => {
    getCoupleId().then((id) => {
      if (id) {
        setCoupleId(id);
        loadData(id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    const sup = import('@/lib/supabase-browser').then(m => m.createClient());
    sup.then(client => {
      const tripsChannel = client
        .channel('home-trip-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trips', filter: `couple_id=eq.${coupleId}` },
          () => loadData(coupleId)
        )
        .subscribe();
    });
  }, [coupleId]);

  const visitedCount = visitedProvinces.length;
  const completionRate = ((visitedCount / TOTAL_PROVINCES) * 100).toFixed(1);

  return (
    <Room3D
      visitedProvinces={visitedProvinces}
      visitedCities={visitedCities}
      allPhotos={allPhotos}
      visitedCount={loading ? 0 : visitedCount}
      completionRate={loading ? '0.0' : completionRate}
      totalProvinces={TOTAL_PROVINCES}
      onProvinceClick={(name) => {
        window.location.href = `/province?name=${encodeURIComponent(name)}`;
      }}
      onCityClick={(cityName) => {
        const city = visitedCities.find((c) => c.name === cityName);
        if (city) {
          window.location.href = `/city?name=${encodeURIComponent(city.name)}&province=${encodeURIComponent(city.province)}`;
        }
      }}
      onDiaryClick={() => {
        window.location.href = '/album';
      }}
      onAlbumClick={() => {
        window.location.href = '/album';
      }}
      onProfileClick={() => {
        window.location.href = '/profile';
      }}
    >
      <BottomNav />
    </Room3D>
  );
}
