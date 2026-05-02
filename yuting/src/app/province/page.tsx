'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { RoomPanel } from '@/components/furniture';
import { WoodReliefMap as ProvinceMap } from '@/components/wood-relief-map';
import { WoodReliefCityMap as CityMap } from '@/components/wood-relief-city-map';
import { getCoupleId, getVisitedCities, getVisitedProvinces, getTripsByCity } from '@/lib/trips';
import { AddTripForm } from '@/components/add-trip-form';
import { LoadingScreen } from '@/components/loading-screen';
import { getProvinceByName, normalizeProvinceName, getGeoJsonFileName } from '@/lib/provinces';

const MUNICIPALITIES = new Set(['北京', '上海', '天津', '重庆']);

function ProvinceContent() {
  const searchParams = useSearchParams();
  const provinceName = normalizeProvinceName(searchParams.get('name') || '');

  const provinceData = getProvinceByName(provinceName);
  const cities = useMemo(() => provinceData?.cities.map((c) => c.name) || [`${provinceName}市`], [provinceName]);

  const [visitedCities, setVisitedCities] = useState<string[]>([]);
  const [cityCoords, setCityCoords] = useState<{ name: string; lat: number; lng: number; photoCount: number }[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [cityMapSpots, setCityMapSpots] = useState<{ name: string; lat: number; lng: number; visited: boolean }[]>([]);
  const [totalSpots, setTotalSpots] = useState(0);
  const [geoJsonCityCount, setGeoJsonCityCount] = useState(0);

  useEffect(() => {
    const provinceCities = cities;

    // Fetch GeoJSON to count administrative divisions (for the denominator)
    const geoJsonFile = getGeoJsonFileName(provinceName);
    if (geoJsonFile) {
      fetch(`/geojson/${geoJsonFile}`)
        .then((r) => r.json())
        .then((data) => {
          const count = data?.features?.length || provinceCities.length;
          setGeoJsonCityCount(count > 0 ? count : provinceCities.length);
        })
        .catch(() => setGeoJsonCityCount(provinceCities.length));
    } else {
      queueMicrotask(() => setGeoJsonCityCount(provinceCities.length));
    }

    getCoupleId().then((id) => {
      setCoupleId(id);
      if (id) {
        getVisitedCities(id, provinceName).then((visited) => {
          setVisitedCities(visited);

          // Build city coords for the map
          const coords: typeof cityCoords = [];
          for (const cityName of visited) {
            const cityData = provinceData?.cities.find((c) => c.name === cityName);
            if (cityData) {
              coords.push({ name: cityName, lat: cityData.lat, lng: cityData.lng, photoCount: 0 });
            }
          }
          setCityCoords(coords);

          // For municipalities, build city map scenic spots — only visited for display, track total for count
          if (MUNICIPALITIES.has(provinceName)) {
            const cityData = provinceData?.cities[0];
            const allSpots = cityData?.scenicSpots || [];
            setTotalSpots(allSpots.length);
            if (cityData && allSpots.length > 0) {
              getTripsByCity(id, cityData.name).then((trips) => {
                const visitedSpotNames = new Set(
                  trips.map((t) => t.scenic_spot).filter(Boolean) as string[]
                );
                const mapped = allSpots
                  .filter((s) => visitedSpotNames.has(s.name))
                  .map((s) => ({
                    name: s.name,
                    lat: s.lat,
                    lng: s.lng,
                    visited: true,
                  }));
                setCityMapSpots(mapped);
              });
            }
          }
        });
      }
    });
  }, [provinceName]);

  const totalCities = geoJsonCityCount || cities.length;
  const visitedCount = visitedCities.length;
  const completionRate = totalCities > 0 ? Math.round((visitedCount / totalCities) * 100) : 0;

  const handleCityClick = (city: string) => {
    window.location.href = `/city?name=${encodeURIComponent(city)}&province=${encodeURIComponent(provinceName)}`;
  };

  const handleSpotClick = (spotName: string) => {
    window.location.href = `/city?name=${encodeURIComponent(provinceName)}&province=${encodeURIComponent(provinceName)}&spot=${encodeURIComponent(spotName)}`;
  };

  const handleTripAdded = () => {
    setShowAddForm(false);
    getCoupleId().then((id) => {
      if (!id) return;
      getVisitedCities(id, provinceName).then((visited) => {
        setVisitedCities(visited);
        // Refresh city coords
        const provinceData = getProvinceByName(provinceName);
        const coords: typeof cityCoords = [];
        for (const cityName of visited) {
          const cityData = provinceData?.cities.find((c) => c.name === cityName);
          if (cityData) {
            coords.push({ name: cityName, lat: cityData.lat, lng: cityData.lng, photoCount: 0 });
          }
        }
        setCityCoords(coords);

        // For municipalities, refresh scenic spots — only visited for display
        if (MUNICIPALITIES.has(provinceName)) {
          const cityData = provinceData?.cities[0];
          const allSpots = cityData?.scenicSpots || [];
          setTotalSpots(allSpots.length);
          if (allSpots.length > 0 && cityData) {
            getTripsByCity(id, cityData.name).then((trips) => {
              const visitedSpotNames = new Set(
                trips.map((t) => t.scenic_spot).filter(Boolean) as string[]
              );
              const mapped = allSpots
                .filter((s) => visitedSpotNames.has(s.name))
                .map((s) => ({
                  name: s.name,
                  lat: s.lat,
                  lng: s.lng,
                  visited: true,
                }));
              setCityMapSpots(mapped);
            });
          }
        }
      });
    });
  };

  return (
    <div className="container mx-auto px-4" style={{ flex: 1, overflowY: "auto", paddingBottom: 80, position: "relative" }}>
      {/* Header plaque — province name on a wooden sign */}
      <div className="card text-center relative overflow-hidden mb-6">
        {/* Back button */}
        <button
          onClick={() => { window.location.href = '/' }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(250,245,239,0.95)', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', zIndex: 50, cursor: 'pointer' }}
          aria-label="返回上一级"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2E1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="relative z-10 pt-6 pb-6">
          <h1 className="text-4xl font-bold mb-5" style={{ color: '#3D2E1F', fontFamily: "var(--font-newsreader)" }}>{provinceName}</h1>
          <div className="flex justify-center gap-8 text-base mb-5" style={{ color: '#9A8B7A' }}>
            {MUNICIPALITIES.has(provinceName) ? (
              <>
                <span>已访问 <span className="font-semibold text-lg" style={{ color: '#3D2E1F' }}>{cityMapSpots.length}</span>/{totalSpots} 个景点</span>
                <span>完成度 <span className="font-semibold text-lg" style={{ color: '#c99a6c' }}>{totalSpots > 0 ? Math.round((cityMapSpots.length / totalSpots) * 100) : 0}%</span></span>
              </>
            ) : (
              <>
                <span>已访问 <span className="font-semibold text-lg" style={{ color: '#3D2E1F' }}>{visitedCount}</span>/{totalCities} 个城市</span>
                <span>完成度 <span className="font-semibold text-lg" style={{ color: '#c99a6c' }}>{completionRate}%</span></span>
              </>
            )}
          </div>
          <div className="h-3 bg-[#F3EBE0] rounded-full overflow-hidden max-w-md mx-auto border border-[#E4D5C0]/30">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${MUNICIPALITIES.has(provinceName) ? (totalSpots > 0 ? Math.round((cityMapSpots.length / totalSpots) * 100) : 0) : completionRate}%`, background: 'linear-gradient(90deg, #c99a6c, #b8895e)' }}
            />
          </div>
        </div>
      </div>

      {/* Non-municipality: province map showing cities */}
      {!MUNICIPALITIES.has(provinceName) && (
        <div className="mb-6 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(141,107,42,0.3)' }}>
          <div style={{ height: 380 }}>
            <ProvinceMap
              provinceName={provinceName}
              visitedCities={visitedCities}
              cityCoords={cityCoords}
              onCityClick={handleCityClick}
              onBack={() => {}}
            />
          </div>
        </div>
      )}

      {/* Municipality: city map showing scenic spots with boundary — skip city list */}
      {MUNICIPALITIES.has(provinceName) && (
        <>
          <div className="mb-6 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(141,107,42,0.3)' }}>
            <div style={{ height: 380 }}>
              <CityMap
                cityName={provinceName}
                spots={cityMapSpots}
                onSpotClick={handleSpotClick}
              />
            </div>
          </div>

          {/* Scenic spots list */}
          <RoomPanel title="景点列表">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {cityMapSpots.map((spot) => (
                <button
                  key={spot.name}
                  onClick={() => handleSpotClick(spot.name)}
                  className="p-5 rounded-xl text-center font-medium border shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,154,108,0.15), rgba(184,137,94,0.1))',
                    borderColor: '#c99a6c',
                    color: '#8d6b2a',
                    boxShadow: 'inset 0 0 0 1px rgba(141,107,42,0.15)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="text-lg mb-1" style={{ color: '#c99a6c' }}>●</div>
                  {spot.name}
                </button>
              ))}
            </div>
          </RoomPanel>
        </>
      )}

      {/* Cities — wooden city nameplates on the wall (non-municipalities only) */}
      {!MUNICIPALITIES.has(provinceName) && (
        <RoomPanel title="城市列表">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {visitedCities.map((city) => {
              return (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className="p-5 rounded-xl text-sm text-center font-medium border shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,154,108,0.15), rgba(184,137,94,0.1))',
                    borderColor: '#c99a6c',
                    color: '#8d6b2a',
                    boxShadow: 'inset 0 0 0 1px rgba(141,107,42,0.15)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="text-lg mb-1" style={{ color: '#c99a6c' }}>●</div>
                  {city.replace('市', '')}
                </button>
              );
            })}
          </div>
        </RoomPanel>
      )}

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

      {/* Add Trip Form */}
      {showAddForm && coupleId && (
        <AddTripForm
          coupleId={coupleId}
          defaultProvince={provinceName}
          onSuccess={handleTripAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function ProvincePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProvinceContent />
    </Suspense>
  );
}
