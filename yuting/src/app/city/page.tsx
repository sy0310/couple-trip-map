'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { RoomPanel } from '@/components/furniture';
import { WoodReliefCityMap as CityMap } from '@/components/wood-relief-city-map';
import { getCoupleId, getTripsByCity, getPhotosByTrip } from '@/lib/trips';
import { AddTripForm } from '@/components/add-trip-form';
import { normalizeProvinceName, getProvinceByName } from '@/lib/provinces';

function CityContent() {
  const searchParams = useSearchParams();
  const cityName = normalizeProvinceName(searchParams.get('name') || '');
  const provinceName = normalizeProvinceName(searchParams.get('province') || '');
  const spotName = searchParams.get('spot') || '';

  const [tripRecords, setTripRecords] = useState<{
    id: string;
    location_name: string;
    visit_date: string;
    notes: string | null;
    scenic_spot: string | null;
    photo_count: number;
  }[]>([]);
  const [tripPhotos, setTripPhotos] = useState<Record<string, string[]>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [cityMapSpots, setCityMapSpots] = useState<{ name: string; lat: number; lng: number; visited: boolean }[]>([]);
  const [hasCityData, setHasCityData] = useState(false);
  const [totalSpotCount, setTotalSpotCount] = useState(0);

  useEffect(() => {
    getCoupleId().then((id) => {
      setCoupleId(id);

      // Check if this city has scenic spots data
      const provinceData = getProvinceByName(provinceName);
      const cityData = provinceData?.cities.find((c) => c.name === cityName);
      setHasCityData(!!cityData?.scenicSpots && cityData.scenicSpots.length > 0);
      setTotalSpotCount(cityData?.scenicSpots?.length || 0);

      if (id) {
        getTripsByCity(id, cityName).then((trips) => {
          setTripRecords(trips);

          // Build scenic spot map data — only visited spots
          const visitedSpotNames = new Set(
            trips.map((t) => t.scenic_spot).filter(Boolean) as string[]
          );
          const provinceData = getProvinceByName(provinceName);
          const cityData = provinceData?.cities.find((c) => c.name === cityName);
          if (cityData?.scenicSpots && cityData.scenicSpots.length > 0) {
            const mapped = cityData.scenicSpots
              .filter((s) => visitedSpotNames.has(s.name))
              .map((s) => ({
                name: s.name,
                lat: s.lat,
                lng: s.lng,
                visited: true,
              }));
            setCityMapSpots(mapped);
          }

          setLoading(false);

          const photoPromises = trips.map(async (trip) => {
            const photos = await getPhotosByTrip(trip.id);
            return { tripId: trip.id, urls: photos.map((p) => p.file_url) };
          });
          Promise.all(photoPromises).then((results) => {
            const map: Record<string, string[]> = {};
            results.forEach((r) => {
              if (r.urls.length > 0) map[r.tripId] = r.urls;
            });
            setTripPhotos(map);
          });
        });
      } else {
        setLoading(false);
      }
    });
  }, [cityName, provinceName, spotName]);

  // Scroll to matching scenic spot trip when spot param is present
  useEffect(() => {
    if (!spotName || tripRecords.length === 0) return;
    const matchingTrip = tripRecords.find((t) => t.scenic_spot === spotName);
    if (!matchingTrip) return;
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('[data-trip-scenic-spot]');
      elements.forEach((el) => {
        if (el.getAttribute('data-trip-scenic-spot') === spotName) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLElement).style.outline = '2px solid #c99a6c';
          (el as HTMLElement).style.outlineOffset = '4px';
          setTimeout(() => {
            (el as HTMLElement).style.outline = '';
            (el as HTMLElement).style.outlineOffset = '';
          }, 3000);
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [spotName, tripRecords]);

  const handleTripAdded = () => {
    setShowAddForm(false);
    getCoupleId().then((id) => {
      if (!id) return;

      const provinceData = getProvinceByName(provinceName);
      const cityData = provinceData?.cities.find((c) => c.name === cityName);
      setTotalSpotCount(cityData?.scenicSpots?.length || 0);

      getTripsByCity(id, cityName).then((trips) => {
        setTripRecords(trips);

        // Refresh city map spots — only visited
        const visitedSpotNames = new Set(
          trips.map((t) => t.scenic_spot).filter(Boolean) as string[]
        );
        const provinceData = getProvinceByName(provinceName);
        const cityData = provinceData?.cities.find((c) => c.name === cityName);
        if (cityData?.scenicSpots && cityData.scenicSpots.length > 0) {
          const mapped = cityData.scenicSpots
            .filter((s) => visitedSpotNames.has(s.name))
            .map((s) => ({
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              visited: true,
            }));
          setCityMapSpots(mapped);
        }

        const photoPromises = trips.map(async (trip) => {
          const photos = await getPhotosByTrip(trip.id);
          return { tripId: trip.id, urls: photos.map((p) => p.file_url) };
        });
        Promise.all(photoPromises).then((results) => {
          const map: Record<string, string[]> = {};
          results.forEach((r) => {
            if (r.urls.length > 0) map[r.tripId] = r.urls;
          });
          setTripPhotos(map);
        });
      });
    });
  };

  return (
    <div className="container mx-auto px-4" style={{ flex: 1, overflowY: "auto", paddingBottom: 80, position: "relative" }}>
      {/* Header */}
      <div className="card text-center relative overflow-hidden mb-6">
        {/* Back button */}
        <button
          onClick={() => { window.location.href = `/province?name=${encodeURIComponent(provinceName)}` }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(250,245,239,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', zIndex: 50, cursor: 'pointer' }}
          aria-label="返回上一级"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2E1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="relative z-10 pt-6 pb-6">
          <h1 className="text-4xl font-bold mb-1" style={{ color: '#3D2E1F', fontFamily: "var(--font-newsreader)" }}>{cityName}</h1>
          {provinceName && <p className="text-base" style={{ color: '#9A8B7A' }}>{provinceName}</p>}
          <div className="flex justify-center gap-8 text-base mt-5" style={{ color: '#9A8B7A' }}>
            <span>已访问 <span className="font-semibold text-lg" style={{ color: '#3D2E1F' }}>{cityMapSpots.length}</span>/{totalSpotCount} 个景点</span>
            <span>完成度 <span className="font-semibold text-lg" style={{ color: '#c99a6c' }}>{totalSpotCount > 0 ? Math.round((cityMapSpots.length / totalSpotCount) * 100) : 0}%</span></span>
          </div>
          {totalSpotCount > 0 && (
            <div className="h-3 bg-[#F3EBE0] rounded-full overflow-hidden max-w-md mx-auto mt-3 border border-[#E4D5C0]/30">
              <div
                className="h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${Math.round((cityMapSpots.length / totalSpotCount) * 100)}%`, background: 'linear-gradient(90deg, #c99a6c, #b8895e)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add trip button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #563a31, #705147)',
            color: '#ffffff',
            boxShadow: 'inset 0 1px 0 rgba(255,222,165,0.4), 0 2px 4px rgba(0,0,0,0.3)',
            fontFamily: "var(--font-manrope)",
          }}
        >
          <span>+</span>
          <span>添加旅行</span>
        </button>
      </div>

      {/* City map — show whenever the city has scenic spot data, even if none visited yet */}
      {hasCityData && (
        <div className="mb-6 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(141,107,42,0.3)' }}>
          <div style={{ height: 380 }}>
            <CityMap
              cityName={cityName}
              spots={cityMapSpots}
            />
          </div>
        </div>
      )}

      {/* Trip records */}
      <RoomPanel title="旅行记录">
          {loading ? (
            <div className="text-center py-10" style={{ color: '#9A8B7A' }}>加载中...</div>
          ) : tripRecords.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#FAF5EF] border border-[#E4D5C0]/40 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A882" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: '#9A8B7A' }}>还没有{cityName}的旅行记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tripRecords.map((trip) => {
                const photos = tripPhotos[trip.id] || [];
                return (
                  <div key={trip.id} data-trip-scenic-spot={trip.scenic_spot || ''} className="p-4 bg-[#FAF5EF] rounded-xl border border-[#E4D5C0]/30 transition-colors hover:bg-[#F3EBE0]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs mb-1" style={{ color: '#9A8B7A' }}>{trip.visit_date}</div>
                        <div className="font-semibold" style={{ color: '#3D2E1F' }}>{trip.location_name}</div>
                        {trip.scenic_spot && <div className="text-sm mt-0.5" style={{ color: '#c99a6c' }}>{trip.scenic_spot}</div>}
                        {trip.notes && <div className="text-sm mt-1 leading-relaxed" style={{ color: '#6B5438' }}>{trip.notes}</div>}
                      </div>
                    </div>

                    {/* Photo thumbnails */}
                    {photos.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {photos.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`照片 ${i + 1}`}
                            className="w-16 h-16 rounded-lg object-cover cursor-pointer flex-shrink-0 border border-[#E4D5C0]/40 hover:border-[#c99a6c] transition-colors"
                            onClick={() => setExpandedPhoto(url)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </RoomPanel>

      {/* Add Trip Form */}
      {showAddForm && coupleId && (
        <AddTripForm
          coupleId={coupleId}
          defaultProvince={provinceName}
          defaultCity={cityName}
          onSuccess={handleTripAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Expanded photo viewer */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setExpandedPhoto(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <img
            src={expandedPhoto}
            alt="照片"
            className="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setExpandedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            ✕
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function CityPage() {
  return (
    <Suspense fallback={<div className="container text-center py-24" style={{ color: '#9A8B7A' }}>加载中...</div>}>
      <CityContent />
    </Suspense>
  );
}
