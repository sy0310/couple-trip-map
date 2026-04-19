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

  if (!user) {
    return (
      <div className="container">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
            旅行相册
          </h1>
        </div>
        <div className="text-center py-32" style={{ color: '#9A8B7A' }}>
          <p className="text-base mb-2">请先登录</p>
          <a href="/login" className="text-sm underline" style={{ color: '#c99a6c' }}>前往登录 →</a>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
            旅行相册
          </h1>
        </div>
        <div className="text-center py-24" style={{ color: '#9A8B7A' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border flex items-center justify-center"
            style={{ borderColor: 'rgba(255,222,165,0.15)', background: 'rgba(255,255,255,0.04)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <p className="text-sm">加载中...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
            旅行相册
          </h1>
          <p className="text-sm mt-1" style={{ color: '#dac2b6' }}>
            {trips.length > 0 ? `${trips.length} 段回忆 · ${allPhotos.length} 张照片` : '记录美好时光'}
          </p>
        </div>
        <button
          onClick={() => setShowAddTrip(true)}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
            color: '#221a0f',
            boxShadow: '0 4px 12px rgba(201,154,108,0.3)',
          }}
        >
          + 添加旅行
        </button>
      </div>

      {/* Year filter — dark wooden pills */}
      {years.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ borderBottom: '1px solid rgba(255,222,165,0.08)' }}>
          <button
            onClick={() => setSelectedYear('all')}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
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
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
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
      )}

      {allPhotos.length === 0 ? (
        <div className="text-center py-32" style={{ color: '#9A8B7A' }}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center border"
            style={{ borderColor: 'rgba(255,222,165,0.1)', background: 'rgba(255,255,255,0.03)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <p className="text-base">还没有照片</p>
          <p className="text-sm mt-1 opacity-70">添加旅行时上传照片吧</p>
        </div>
      ) : (
        <>
          {/* Masonry-style photo gallery */}
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {allPhotos.map((photo) => (
              <div
                key={photo.key}
                className="group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                style={{ borderColor: 'rgba(255,222,165,0.1)', breakInside: 'avoid' }}
                onClick={() => setExpandedUrl(photo.url)}
              >
                <img src={photo.url} alt="" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-xs" style={{ color: '#ffdea5' }}>{photo.trip.locationName}</div>
                    <div className="text-[11px]" style={{ color: '#dac2b6' }}>{new Date(photo.trip.visitDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trip detail cards */}
          {filteredTrips.filter((t) => t.notes || t.urls.length > 3).length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
                旅行记忆
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTrips.filter((t) => t.notes || t.urls.length > 3).map((trip) => (
                  <div
                    key={trip.tripId}
                    className="rounded-xl p-5 border"
                    style={{
                      background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)',
                      borderColor: 'rgba(255,222,165,0.1)',
                    }}
                  >
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#9A8B7A', letterSpacing: '0.1em' }}>
                      {new Date(trip.visitDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <h3 className="font-semibold mb-0.5" style={{ color: '#ffdea5' }}>{trip.locationName}</h3>
                    <div className="text-xs mb-2" style={{ color: '#dac2b6' }}>{trip.province} · {trip.city}</div>
                    {trip.notes && <p className="text-sm leading-relaxed mb-3" style={{ color: '#dac2b6' }}>{trip.notes}</p>}
                    {trip.urls.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {trip.urls.slice(0, 4).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border cursor-pointer transition-colors hover:border-[#c99a6c]"
                            style={{ borderColor: 'rgba(255,222,165,0.15)' }}
                            onClick={() => setExpandedUrl(url)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Full-screen photo viewer */}
      {expandedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setExpandedUrl(null)}>
          <div className="absolute inset-0 bg-black/90" />
          <img
            src={expandedUrl}
            alt="照片"
            className="relative max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setExpandedUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#ffdea5' }}
          >
            ✕
          </button>
        </div>
      )}

      {showAddTrip && coupleId && (
        <AddTripForm
          coupleId={coupleId}
          onSuccess={handleTripSuccess}
          onCancel={() => setShowAddTrip(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
