'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { getCoupleId, getTripsByCity, getPhotosByTrip } from '@/lib/trips';
import { updateTrip, deletePhoto as deletePhotoApi, uploadPhotosToTrip } from '@/lib/trips';
import { useAuth } from '@/lib/auth';
import { AddTripForm } from '@/components/add-trip-form';
import { EditTripForm } from '@/components/edit-trip-form';

interface TripPhoto {
  tripId: string;
  locationName: string;
  province: string;
  city: string;
  visitDate: string;
  notes: string | null;
  urls: string[];
  coverUrl: string | null;
}

export default function AlbumPage() {
  const [trips, setTrips] = useState<TripPhoto[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [selectingCover, setSelectingCover] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editingTripData, setEditingTripData] = useState<{
    id: string;
    locationName: string;
    province: string;
    city: string;
    scenicSpot: string | null;
    visitDate: string;
    notes: string | null;
  } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const { user } = useAuth();

  const loadTrips = useCallback(async () => {
    if (!user) return;
    const cid = await getCoupleId(user.id);
    setCoupleId(cid);
    if (!cid) { setLoading(false); return; }

    const sup = await import('@/lib/supabase-browser');
    const client = sup.createClient();
    const { data: tripsData }: { data: { id: string; location_name: string; province: string; city: string; visit_date: string; notes: string | null; cover_url: string | null }[] | null } = await client
      .from('trips')
      .select('id, location_name, province, city, visit_date, notes, cover_url')
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
        coverUrl: trip.cover_url,
      });
    }
    setTrips(loaded);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => loadTrips());

    if (!coupleId) return;
    let tripsChannel: ReturnType<ReturnType<typeof import('@/lib/supabase-browser').createClient>['channel']> | null = null;
    import('@/lib/supabase-browser').then(m => m.createClient()).then(client => {
      tripsChannel = client
        .channel('album-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trips', filter: `couple_id=eq.${coupleId}` },
          () => loadTrips()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'photos' },
          () => loadTrips()
        )
        .subscribe();
    });
    return () => { tripsChannel?.unsubscribe(); };
  }, [user, coupleId, loadTrips]);

  const handleTripSuccess = () => {
    setShowAddTrip(false);
    setTrips([]);
    setLoading(true);
    loadTrips();
  };

  const handleSetCover = async (tripId: string, url: string) => {
    const sup = await import('@/lib/supabase-browser');
    const client = sup.createClient();
    const { error } = await client.from('trips').update({ cover_url: url } as never).eq('id', tripId);
    if (!error) {
      setTrips((prev) => prev.map((t) => t.tripId === tripId ? { ...t, coverUrl: url } : t));
    }
    setSelectingCover(null);
  };

  const handleEditTrip = async (tripId: string) => {
    if (!coupleId) return;
    const sup = await import('@/lib/supabase-browser');
    const client = sup.createClient();
    const { data }: { data: { location_name: string; province: string; city: string; scenic_spot: string | null; visit_date: string; notes: string | null } | null } = await client
      .from('trips')
      .select('location_name, province, city, scenic_spot, visit_date, notes')
      .eq('id', tripId)
      .single();
    if (data) {
      setEditingTripData({
        id: tripId,
        locationName: data.location_name,
        province: data.province,
        city: data.city,
        scenicSpot: data.scenic_spot,
        visitDate: data.visit_date,
        notes: data.notes,
      });
      setEditingTrip(tripId);
    }
  };

  const handleDeletePhoto = async (tripId: string, photoUrl: string) => {
    const photos = await getPhotosByTrip(tripId);
    const photo = photos.find((p) => p.file_url === photoUrl);
    if (!photo) return;
    const ok = await deletePhotoApi(photo.id, photoUrl);
    if (ok) {
      setTrips((prev) =>
        prev.map((t) =>
          t.tripId === tripId ? { ...t, urls: t.urls.filter((u) => u !== photoUrl) } : t
        )
      );
    }
  };

  const handleUploadPhotos = async (tripId: string, files: FileList) => {
    if (!coupleId || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setUploadingPhoto(tripId);
    setUploadProgress('');
    const uploaded = await uploadPhotosToTrip(tripId, coupleId, fileArray, (done, total) => {
      setUploadProgress(`正在上传 ${done}/${total}...`);
    });

    if (uploaded > 0) {
      const photos = await getPhotosByTrip(tripId);
      setTrips((prev) =>
        prev.map((t) =>
          t.tripId === tripId ? { ...t, urls: photos.map((p) => p.file_url) } : t
        )
      );
    }
    setUploadingPhoto(null);
    setUploadProgress('');
  };

  const handleEditSuccess = () => {
    setEditingTrip(null);
    setTrips([]);
    setLoading(true);
    loadTrips();
  };

  const years = [...new Set(trips.map((t) => new Date(t.visitDate).getFullYear().toString()))].sort((a, b) => parseInt(b) - parseInt(a));
  const filteredTrips = selectedYear === 'all' ? trips : trips.filter((t) => new Date(t.visitDate).getFullYear().toString() === selectedYear);

  const allPhotos = filteredTrips.flatMap((trip) =>
    trip.urls.map((url) => ({ url, trip, key: `${trip.tripId}-${url}` }))
  );

  const heroTrip = trips.find((t) => (t.coverUrl || t.urls[0]));
  const heroCover = heroTrip?.coverUrl || heroTrip?.urls[0];

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
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="h-8 w-40 rounded" style={{ background: 'rgba(255,222,165,0.1)', animation: 'pulse 2s ease-in-out infinite' }} />
              <div className="h-4 w-32 mt-2 rounded" style={{ background: 'rgba(218,194,182,0.08)', animation: 'pulse 2s ease-in-out infinite 0.3s' }} />
            </div>
            <div className="h-10 w-28 rounded-lg" style={{ background: 'rgba(201,154,108,0.15)', animation: 'pulse 2s ease-in-out infinite 0.5s' }} />
          </div>

          {/* Hero skeleton */}
          <div className="mb-10" style={{ background: '#352118', boxShadow: '0 15px 45px rgba(0,0,0,0.5)', padding: '12px 12px 60px 12px', borderRadius: '8px' }}>
            <div className="w-full aspect-[4/3] md:aspect-[16/9] rounded" style={{ background: 'rgba(255,222,165,0.06)', animation: 'pulse 2s ease-in-out infinite' }} />
            <div className="mt-4 px-2">
              <div className="h-6 w-48 rounded" style={{ background: 'rgba(255,222,165,0.1)', animation: 'pulse 2s ease-in-out infinite 0.2s' }} />
              <div className="h-4 w-64 mt-2 rounded" style={{ background: 'rgba(218,194,182,0.08)', animation: 'pulse 2s ease-in-out infinite 0.4s' }} />
            </div>
          </div>

          {/* Trip card skeletons */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.15)' }} />
                <div className="text-center">
                  <div className="h-5 w-32 rounded" style={{ background: 'rgba(255,222,165,0.1)', animation: 'pulse 2s ease-in-out infinite' }} />
                  <div className="h-3 w-24 mt-1 rounded" style={{ background: 'rgba(218,194,182,0.06)', animation: 'pulse 2s ease-in-out infinite 0.3s' }} />
                </div>
                <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.15)' }} />
              </div>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,222,165,0.1)' }}>
                <div className="w-full aspect-[4/3]" style={{ background: 'rgba(255,222,165,0.04)', animation: 'pulse 2s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a2e1d 0%, #352118 50%, #2a1b14 100%)' }}>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
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
            {heroTrip && heroCover && (
              <div className="mb-10">
                <div
                  className="relative group transform -rotate-1"
                  style={{
                    background: '#352118',
                    boxShadow: '0 15px 45px rgba(0,0,0,0.5), 0 0 0 8px #4a2e1d, 0 0 0 12px rgba(201,154,108,0.15)',
                    padding: '12px 12px 60px 12px',
                  }}
                >
                  <div className="relative overflow-hidden cursor-pointer" onClick={() => setExpandedUrl(heroCover!)}>
                    <img src={heroCover} alt={heroTrip.locationName} className="w-full aspect-[4/3] md:aspect-[16/9] object-cover" />
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

            {/* Photo gallery grouped by trip */}
            {filteredTrips.map((trip) => {
              if (trip.urls.length === 0) return null;
              const isExpanded = expandedTrip === trip.tripId;
              const cover = trip.coverUrl || trip.urls[0];
              const remainingCount = trip.urls.length - 1;
              return (
                <div key={trip.tripId} className="mb-8 relative">
                  {/* Trip header */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.3)' }} />
                    <div className="text-center whitespace-nowrap">
                      <h3 className="text-xl font-bold" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}>
                        {trip.locationName}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: '#9A8B7A' }}>
                        {trip.visitDate} · {trip.urls.length} 张照片
                      </p>
                      <button
                        onClick={() => handleEditTrip(trip.tripId)}
                        className="mt-1 text-[10px] underline transition-colors"
                        style={{ color: '#c99a6c' }}
                      >
                        编辑
                      </button>
                    </div>
                    <div className="h-px flex-1" style={{ background: 'rgba(218,194,182,0.3)' }} />
                  </div>

                  {/* Photo card */}
                  <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,222,165,0.15)' }}>
                    {/* Cover image — click to expand */}
                    <div onClick={() => setExpandedTrip(isExpanded ? null : trip.tripId)} className="relative cursor-pointer group">
                      <img src={cover} alt={trip.locationName} className="w-full aspect-[4/3] object-cover transition-transform group-hover:scale-[1.02]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Bottom action bar */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.5)', color: '#ffdea5' }}>
                            {trip.urls.length} 张照片
                          </span>
                          {remainingCount > 0 && (
                            <span className="text-xs" style={{ color: 'rgba(255,222,165,0.8)' }}>
                              +{remainingCount} 更多
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* View all button */}
                          {trip.urls.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedTrip(trip.tripId); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              style={{
                                background: 'rgba(0,0,0,0.6)',
                                color: '#ffdea5',
                                border: '1px solid rgba(255,222,165,0.3)',
                              }}
                              aria-label="查看全部照片"
                            >
                              查看全部
                            </button>
                          )}
                          {/* Cover selection button */}
                          {trip.urls.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectingCover(selectingCover === trip.tripId ? null : trip.tripId); }}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all"
                              style={{ background: 'rgba(0,0,0,0.5)', color: '#ffdea5', border: '1px solid rgba(255,222,165,0.3)' }}
                              aria-label="选择封面"
                            >
                              ★
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded photo grid */}
                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-xl border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,222,165,0.1)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium" style={{ color: '#dac2b6' }}>全部照片 · {trip.urls.length} 张</p>
                        <div className="flex gap-2">
                          {uploadingPhoto === trip.tripId && (
                            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(201,154,108,0.2)', color: '#c99a6c' }}>{uploadProgress}</span>
                          )}
                          <label className="px-3 py-1 rounded-lg text-xs cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.15)]" style={{ background: 'rgba(255,255,255,0.1)', color: '#c99a6c' }}>
                            + 添加照片
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              multiple
                              className="hidden"
                              onChange={(e) => e.target.files && handleUploadPhotos(trip.tripId, e.target.files)}
                              disabled={uploadingPhoto === trip.tripId}
                            />
                          </label>
                          <button
                            onClick={() => setExpandedTrip(null)}
                            className="px-3 py-1 rounded-lg text-xs"
                            style={{ background: 'rgba(255,255,255,0.1)', color: '#9A8B7A' }}
                          >
                            收起
                          </button>
                        </div>
                      </div>
                      <div className="columns-3 md:columns-4 gap-2 space-y-2">
                        {trip.urls.map((url) => (
                          <div key={url} className="relative break-inside-avoid rounded-md overflow-hidden border cursor-pointer group transition-transform hover:scale-[1.02]" style={{ borderColor: 'rgba(255,222,165,0.1)' }} onClick={() => setExpandedUrl(url)}>
                            <img src={url} alt="" className="w-full object-cover" />
                            {url === trip.coverUrl && (
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: 'rgba(255,222,165,0.9)', color: '#352118' }}>
                                封面
                              </div>
                            )}
                            {/* Delete photo button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm('删除这张照片？')) handleDeletePhoto(trip.tripId, url); }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: 'rgba(0,0,0,0.6)', color: '#ff6b6b', border: '1px solid rgba(255,99,99,0.3)' }}
                              aria-label="删除照片"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cover selection overlay — modal */}
                  {selectingCover === trip.tripId && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setSelectingCover(null)}>
                      <div className="absolute inset-0 bg-black/70" />
                      <div className="relative w-full max-w-sm mx-4 rounded-2xl p-5 border" style={{ background: '#352118', borderColor: 'rgba(255,222,165,0.15)' }} onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm text-center mb-4 font-medium" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>选择封面照片</p>
                        <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pb-4">
                          {trip.urls.map((url) => (
                            <button
                              key={url}
                              onClick={() => handleSetCover(trip.tripId, url)}
                              className="relative rounded-lg overflow-hidden transition-all aspect-square"
                              style={{ border: url === trip.coverUrl ? '3px solid #ffdea5' : '2px solid rgba(255,222,165,0.2)' }}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {url === trip.coverUrl && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#ffdea5', color: '#352118' }}>
                                  <span className="text-xs">✓</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setSelectingCover(null)}
                          className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium"
                          style={{ background: 'linear-gradient(135deg, #c99a6c, #b8895e)', color: '#221a0f' }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Trip notes */}
                  {trip.notes && (
                    <div className="mt-4 rounded-xl p-5 border" style={{ background: 'rgba(255,242,226,0.04)', borderColor: 'rgba(218,194,182,0.1)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: '#dac2b6', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
                        {trip.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Full-screen photo viewer */}
      {expandedUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setExpandedUrl(null)}>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
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

      {editingTrip && editingTripData && (
        <EditTripForm
          trip={{ ...editingTripData, coupleId: coupleId! }}
          onSuccess={handleEditSuccess}
          onCancel={() => { setEditingTrip(null); setEditingTripData(null); }}
        />
      )}

      <BottomNav />
    </div>
  );
}
