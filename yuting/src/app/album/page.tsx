'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { getCoupleId, getTripsByCity, getPhotosByTrip } from '@/lib/trips';
import { useAuth } from '@/lib/auth';
import { AddTripForm } from '@/components/add-trip-form';

interface TripPhoto {
  tripId: string;
  locationName: string;
  province: string;
  city: string;
  visitDate: string;
  notes: string | null;
  urls: string[];
}

export default function AlbumPage() {
  const [trips, setTrips] = useState<TripPhoto[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const { user } = useAuth();

  const loadTrips = useCallback(async () => {
    if (!user) return;
    const cid = await getCoupleId(user.id);
    setCoupleId(cid);
    if (!cid) { setLoading(false); return; }

    const sup = await import('@/lib/supabase-browser');
    const client = sup.createClient();
    const { data: tripsData }: { data: { id: string; location_name: string; province: string; city: string; visit_date: string; notes: string | null }[] | null } = await client
      .from('trips')
      .select('id, location_name, province, city, visit_date, notes')
      .eq('couple_id', cid)
      .order('visit_date', { ascending: false });

    if (!tripsData) { setLoading(false); return; }

    const loaded: TripPhoto[] = [];
    for (const trip of tripsData) {
      const photos = await getPhotosByTrip(trip.id);
      loaded.push({
        tripId: trip.id,
        locationName: trip.location_name,
        province: trip.province,
        city: trip.city,
        visitDate: trip.visit_date,
        notes: trip.notes,
        urls: photos.map((p) => p.file_url),
      });
    }
    setTrips(loaded);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadTrips();
  }, [user, loadTrips]);

  const handleTripSuccess = () => {
    setShowAddTrip(false);
    setTrips([]);
    setLoading(true);
    loadTrips();
  };

  const years = [...new Set(trips.map((t) => new Date(t.visitDate).getFullYear().toString()))].sort((a, b) => parseInt(b) - parseInt(a));
  const filteredTrips = selectedYear === 'all' ? trips : trips.filter((t) => new Date(t.visitDate).getFullYear().toString() === selectedYear);

  const allPhotos = filteredTrips.flatMap((trip) =>
    trip.urls.map((url) => ({ url, trip, key: `${trip.tripId}-${url}` }))
  );

  const heroTrip = trips.find((t) => t.urls.length > 0);

  if (!user) {
    return (
      <div className="min-h-screen relative pb-32" style={{ background: 'linear-gradient(135deg, #4a2e1d 0%, #352118 50%, #2a1b14 100%)' }}>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
          <div className="text-center py-32" style={{ color: '#9A8B7A' }}>
            <p className="text-base mb-2" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: '1.25rem' }}>请先登录</p>
            <a href="/login" className="text-sm underline" style={{ color: '#c99a6c' }}>前往登录 →</a>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative pb-32" style={{ background: 'linear-gradient(135deg, #4a2e1d 0%, #352118 50%, #2a1b14 100%)' }}>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
          <div className="text-center py-24" style={{ color: '#9A8B7A' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border flex items-center justify-center" style={{ borderColor: 'rgba(255,222,165,0.15)', background: 'rgba(255,255,255,0.04)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <p className="text-sm" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>加载中...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a2e1d 0%, #352118 50%, #2a1b14 100%)' }}>
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
              旅行相册
            </h1>
            <p className="text-sm mt-1" style={{ color: '#dac2b6', fontFamily: "'Manrope', sans-serif" }}>
              {trips.length > 0 ? `${trips.length} 段回忆 · ${allPhotos.length} 张照片` : '记录美好时光'}
            </p>
          </div>
          <button
            onClick={() => setShowAddTrip(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
              color: '#221a0f',
              boxShadow: '2px 4px 0 rgba(34,26,15,0.4)',
              borderBottom: '2px solid rgba(218,194,182,0.3)',
            }}
          >
            + 添加旅行
          </button>
        </div>

        {allPhotos.length === 0 ? (
          <div className="text-center py-32" style={{ color: '#9A8B7A' }}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center border" style={{ borderColor: 'rgba(255,222,165,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <p className="text-base" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>还没有照片</p>
            <p className="text-sm mt-1 opacity-70">添加旅行时上传照片吧</p>
          </div>
        ) : (
          <>
            {/* Hero Photo — Polaroid frame */}
            {heroTrip && heroTrip.urls.length > 0 && (
              <div className="mb-12">
                <div
                  className="relative group transform -rotate-1"
                  style={{
                    background: '#352118',
                    boxShadow: '0 15px 45px rgba(0,0,0,0.5), 0 0 0 8px #4a2e1d, 0 0 0 12px rgba(201,154,108,0.15)',
                    padding: '12px 12px 60px 12px',
                  }}
                >
                  <div className="relative overflow-hidden cursor-pointer" onClick={() => setExpandedUrl(heroTrip.urls[0])}>
                    <img src={heroTrip.urls[0]} alt={heroTrip.locationName} className="w-full aspect-[4/3] md:aspect-[16/9] object-cover" />
                    <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]" />
                  </div>
                  <div className="mt-4 px-2 flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
                        {heroTrip.locationName}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: '#dac2b6', fontFamily: "'Newsreader', serif", fontStyle: 'italic', opacity: 0.8 }}>
                        {heroTrip.province} · {heroTrip.city} · {new Date(heroTrip.visitDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Year filter */}
            {years.length > 0 && (
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.3)' }} />
                <div className="flex gap-2 overflow-x-auto pb-2 max-w-[60%]">
                  <button
                    onClick={() => setSelectedYear('all')}
                    className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                    style={{
                      background: selectedYear === 'all' ? 'linear-gradient(135deg, #c99a6c, #b8895e)' : 'rgba(255,255,255,0.06)',
                      color: selectedYear === 'all' ? '#221a0f' : '#9A8B7A',
                      border: selectedYear === 'all' ? 'none' : '1px solid rgba(255,222,165,0.12)',
                    }}
                  >
                    全部
                  </button>
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                      style={{
                        background: selectedYear === year ? 'linear-gradient(135deg, #c99a6c, #b8895e)' : 'rgba(255,255,255,0.06)',
                        color: selectedYear === year ? '#221a0f' : '#9A8B7A',
                        border: selectedYear === year ? 'none' : '1px solid rgba(255,222,165,0.12)',
                      }}
                    >
                      {year}年
                    </button>
                  ))}
                </div>
                <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.3)' }} />
              </div>
            )}

            {/* Horizontal scroll — rotated photo cards */}
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.3)' }} />
                <h3 className="text-xl italic font-medium whitespace-nowrap" style={{ color: '#c99a6c', fontFamily: "'Newsreader', serif" }}>
                  其他回忆
                </h3>
                <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.3)' }} />
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                {allPhotos.slice(0, 12).map((photo, i) => {
                  const rotations = ['rotate-2', '-rotate-1', 'rotate-3', '-rotate-2', 'rotate-1'];
                  const rotation = rotations[i % rotations.length];
                  return (
                    <div
                      key={photo.key}
                      className={`flex-none w-52 snap-center cursor-pointer transition-all duration-300 hover:scale-105 ${rotation}`}
                      onClick={() => setExpandedUrl(photo.url)}
                    >
                      <div className="p-2 rounded-sm shadow-xl border" style={{ background: 'rgba(141,67,31,0.4)', borderColor: 'rgba(111,45,10,0.3)' }}>
                        <img src={photo.url} alt="" className="w-full h-36 object-cover rounded-sm" style={{ filter: 'grayscale(0.2)', transition: 'filter 0.5s' }} onMouseEnter={(e) => (e.currentTarget.style.filter = 'grayscale(0)')} onMouseLeave={(e) => (e.currentTarget.style.filter = 'grayscale(0.2)')} />
                      </div>
                      <div className="mt-2 px-1">
                        <p className="text-xs truncate" style={{ color: '#dac2b6', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
                          {photo.trip.locationName}
                        </p>
                        <p className="text-[10px]" style={{ color: '#9A8B7A' }}>
                          {new Date(photo.trip.visitDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Trip memory cards */}
            {filteredTrips.filter((t) => t.notes || t.urls.length > 3).length > 0 && (
              <div className="relative mb-12">
                <div className="p-6 md:p-8 rounded-xl relative overflow-hidden border" style={{ background: 'rgba(255,242,226,0.05)', borderColor: 'rgba(218,194,182,0.1)' }}>
                  <h2 className="text-2xl mb-6 relative z-10" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
                    旅行记忆
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {filteredTrips.filter((t) => t.notes || t.urls.length > 3).map((trip) => (
                      <div
                        key={trip.tripId}
                        className="rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 hover:shadow-lg"
                        style={{
                          background: 'linear-gradient(180deg, rgba(74,46,29,0.8) 0%, rgba(53,33,24,0.9) 100%)',
                          borderColor: 'rgba(255,222,165,0.08)',
                          boxShadow: '2px 4px 0 rgba(34,26,15,0.3)',
                        }}
                        onClick={() => trip.urls.length > 0 && setExpandedUrl(trip.urls[0])}
                      >
                        {trip.urls.length > 0 && (
                          <img src={trip.urls[0]} alt="" className="w-full h-48 object-cover" />
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: '#9A8B7A' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                            {new Date(trip.visitDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <h3 className="text-lg font-bold mb-1" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}>
                            {trip.locationName}
                          </h3>
                          <div className="text-xs mb-3" style={{ color: '#dac2b6' }}>{trip.province} · {trip.city}</div>
                          {trip.notes && (
                            <p className="text-sm leading-relaxed" style={{ color: '#dac2b6' }}>
                              {trip.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full-screen photo viewer */}
      {expandedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setExpandedUrl(null)}>
          <div className="absolute inset-0 bg-black/90" />
          <img src={expandedUrl} alt="照片" className="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setExpandedUrl(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(0,0,0,0.6)', color: '#ffdea5' }}>
            ✕
          </button>
        </div>
      )}

      {showAddTrip && (
        coupleId ? (
          <AddTripForm
            coupleId={coupleId}
            onSuccess={handleTripSuccess}
            onCancel={() => setShowAddTrip(false)}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddTrip(false)} />
            <div className="relative rounded-2xl overflow-hidden p-8 max-w-sm w-full mx-4 text-center" style={{ background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)', border: '1px solid rgba(255,222,165,0.1)' }}>
              <p className="text-base mb-3" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
                请先绑定情侣
              </p>
              <p className="text-sm mb-6" style={{ color: '#9A8B7A' }}>
                添加旅行需要先绑定情侣关系，请在个人中心完成绑定
              </p>
              <button onClick={() => setShowAddTrip(false)} className="px-6 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg, #c99a6c, #b8895e)', color: '#221a0f' }}>
                知道了
              </button>
            </div>
          </div>
        )
      )}

      <BottomNav />
    </div>
  );
}
