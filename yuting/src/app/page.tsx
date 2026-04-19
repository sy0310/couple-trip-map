'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { Room3D } from '@/components/room-3d';
import { TOTAL_PROVINCES } from '@/lib/provinces';
import { getCoupleId, getVisitedProvinces } from '@/lib/trips';

export default function HomePage() {
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    getCoupleId().then((id) => {
      if (id) {
        setCoupleId(id);
        getVisitedProvinces(id).then((provinces) => {
          setVisitedProvinces(provinces);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const visitedCount = visitedProvinces.length;
  const completionRate = ((visitedCount / TOTAL_PROVINCES) * 100).toFixed(1);

  return (
    <Room3D
      visitedProvinces={visitedProvinces}
      visitedCount={loading ? 0 : visitedCount}
      completionRate={loading ? '0.0' : completionRate}
      totalProvinces={TOTAL_PROVINCES}
      onMapClick={() => {
        window.location.href = '/province';
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
