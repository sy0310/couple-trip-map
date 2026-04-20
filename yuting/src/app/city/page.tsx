'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { RoomPanel } from '@/components/furniture';
import { CityMap } from '@/components/city-map';
import { getCoupleId, getTripsByCity, getPhotosByTrip } from '@/lib/trips';
import { AddTripForm } from '@/components/add-trip-form';

import { normalizeProvinceName, getProvinceByName } from '@/lib/provinces';

const CITY_ATTRACTIONS: Record<string, { name: string; type: string }[]> = {
  '北京': [
    { name: '故宫', type: '历史文化' },
    { name: '天安门广场', type: '地标' },
    { name: '颐和园', type: '园林' },
    { name: '长城', type: '历史古迹' },
    { name: '天坛', type: '历史文化' },
  ],
  '上海': [
    { name: '外滩', type: '地标' },
    { name: '东方明珠', type: '地标' },
    { name: '豫园', type: '园林' },
    { name: '上海博物馆', type: '文化' },
  ],
  '广州': [
    { name: '广州塔', type: '地标' },
    { name: '陈家祠', type: '历史文化' },
    { name: '沙面', type: '历史建筑' },
    { name: '珠江夜游', type: '休闲娱乐' },
  ],
};

function CityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cityName = normalizeProvinceName(searchParams.get('name') || '');
  const provinceName = normalizeProvinceName(searchParams.get('province') || '');

  const [attractions] = useState(CITY_ATTRACTIONS[cityName] || []);
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

  useEffect(() => {
    getCoupleId().then((id) => {
      setCoupleId(id);
      if (id) {
        getTripsByCity(id, cityName).then((trips) => {
          setTripRecords(trips);

          // Build scenic spot map data
          const visitedSpotNames = new Set(
            trips.map((t) => t.scenic_spot).filter(Boolean) as string[]
          );
          const provinceData = getProvinceByName(provinceName);
          const cityData = provinceData?.cities.find((c) => c.name === cityName);
          if (cityData?.scenicSpots) {
            const mapped = cityData.scenicSpots.map((s) => ({
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              visited: visitedSpotNames.has(s.name),
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
  }, [cityName]);

  const handleTripAdded = () => {
    setShowAddForm(false);
    getCoupleId().then((id) => {
      if (!id) return;
      getTripsByCity(id, cityName).then((trips) => {
        setTripRecords(trips);

        // Refresh city map spots
        const visitedSpotNames = new Set(
          trips.map((t) => t.scenic_spot).filter(Boolean) as string[]
        );
        const provinceData = getProvinceByName(provinceName);
        const cityData = provinceData?.cities.find((c) => c.name === cityName);
        if (cityData?.scenicSpots) {
          const mapped = cityData.scenicSpots.map((s) => ({
            name: s.name,
            lat: s.lat,
            lng: s.lng,
            visited: visitedSpotNames.has(s.name),
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
    <div className="container">
      {/* Header */}
      <div className="card text-center relative overflow-hidden mb-6">
        {/* Back button */}
        <button
          onClick={() => router.push(`/province?name=${encodeURIComponent(provinceName)}`)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[#F3EBE0]"
          style={{ background: 'rgba(250,245,239,0.8)', zIndex: 10 }}
          aria-label="返回上一级"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2E1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-1" style={{ color: '#3D2E1F', fontFamily: "var(--font-newsreader)" }}>{cityName}</h1>
          {provinceName && <p className="text-base" style={{ color: '#9A8B7A' }}>{provinceName}</p>}
          <div className="flex justify-center gap-3 mt-5">
            <span className="text-sm px-4 py-1.5 rounded-full border border-[#E4D5C0]/40" style={{ background: '#FAF5EF', color: '#9A8B7A' }}>
              旅行 {loading ? '...' : tripRecords.length} 次
            </span>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City map with scenic spots */}
        {cityMapSpots.length > 0 && (
          <RoomPanel title="景点地图">
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(141,107,42,0.3)' }}>
              <div style={{ height: 420 }}>
                <CityMap
                  cityName={cityName}
                  spots={cityMapSpots}
                />
              </div>
            </div>
          </RoomPanel>
        )}

        {/* Attractions */}
        {attractions.length > 0 && (
          <RoomPanel title="热门景点">
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
              {attractions.map((a) => (
                <div
                  key={a.name}
                  className="flex-shrink-0 text-center bg-[#FAF5EF] rounded-xl p-4 min-w-[100px] snap-start transition-transform hover:scale-105 duration-200 border border-[#E4D5C0]/40"
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#FF6B81]/10 to-[#FF8E53]/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B81" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-[#3D2E1F]">{a.name}</div>
                  <div className="text-[11px] text-[#9A8B7A] mt-0.5">{a.type}</div>
                </div>
              ))}
            </div>
          </RoomPanel>
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
                  <div key={trip.id} className="p-4 bg-[#FAF5EF] rounded-xl border border-[#E4D5C0]/30 transition-colors hover:bg-[#F3EBE0]">
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
      </div>

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
