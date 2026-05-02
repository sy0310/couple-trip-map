"use client";

import { useState, useEffect, useCallback } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ModalSheet } from "@/components/ModalSheet";
import { Pill, SectionLabel } from "@/components/StatBadge";
import { useTheme } from "@/components/ThemeProvider";
import { getCoupleId, getPhotosByTrip, updateTrip, deletePhoto as deletePhotoApi, uploadPhotosToTrip } from "@/lib/trips";
import { useAuth } from "@/lib/auth";
import { AddTripForm } from "@/components/add-trip-form";
import { EditTripForm } from "@/components/edit-trip-form";
import { LoadingScreen } from "@/components/loading-screen";

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
  const { tokens: T } = useTheme();
  const [trips, setTrips] = useState<TripPhoto[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [selectingCover, setSelectingCover] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<string | null>(null);
  const [editingTripData, setEditingTripData] = useState<{
    id: string; locationName: string; province: string; city: string;
    scenicSpot: string | null; visitDate: string; notes: string | null;
  } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const { user } = useAuth();

  const loadTrips = useCallback(async () => {
    if (!user) return;
    const cid = await getCoupleId(user.id);
    setCoupleId(cid);
    if (!cid) { setLoading(false); return; }
    const sup = await import("@/lib/supabase-browser");
    const client = sup.createClient();
    const { data: tripsData }: { data: { id: string; location_name: string; province: string; city: string; visit_date: string; notes: string | null; cover_url: string | null }[] | null } = await client.from("trips")
      .select("id, location_name, province, city, visit_date, notes, cover_url")
      .eq("couple_id", cid).order("visit_date", { ascending: false });
    if (!tripsData) { setLoading(false); return; }
    const loaded: TripPhoto[] = [];
    for (const trip of tripsData) {
      const photos = await getPhotosByTrip(trip.id);
      loaded.push({ tripId: trip.id, locationName: trip.location_name, province: trip.province, city: trip.city, visitDate: trip.visit_date, notes: trip.notes, urls: photos.map((p) => p.file_url), coverUrl: trip.cover_url });
    }
    setTrips(loaded); setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => loadTrips());
    if (!coupleId) return;
    let tripsChannel: ReturnType<ReturnType<typeof import("@/lib/supabase-browser").createClient>["channel"]> | null = null;
    import("@/lib/supabase-browser").then((m) => m.createClient()).then((client) => {
      tripsChannel = client.channel("album-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "trips", filter: `couple_id=eq.${coupleId}` }, () => loadTrips())
        .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, () => loadTrips())
        .subscribe();
    });
    return () => { tripsChannel?.unsubscribe(); };
  }, [user, coupleId, loadTrips]);

  const handleTripSuccess = () => { setShowAddTrip(false); setTrips([]); setLoading(true); loadTrips(); };
  const handleEditSuccess = () => { setEditingTrip(null); setTrips([]); setLoading(true); loadTrips(); };

  const handleSetCover = async (tripId: string, url: string) => {
    const sup = await import("@/lib/supabase-browser");
    const client = sup.createClient();
    const { error } = await client.from("trips").update({ cover_url: url } as never).eq("id", tripId);
    if (!error) setTrips((prev) => prev.map((t) => (t.tripId === tripId ? { ...t, coverUrl: url } : t)));
    setSelectingCover(null);
  };

  const handleEditTrip = async (tripId: string) => {
    if (!coupleId) return;
    const sup = await import("@/lib/supabase-browser");
    const client = sup.createClient();
    const { data }: { data: { location_name: string; province: string; city: string; scenic_spot: string | null; visit_date: string; notes: string | null } | null } = await client.from("trips").select("location_name, province, city, scenic_spot, visit_date, notes").eq("id", tripId).single();
    if (data) setEditingTripData({ id: tripId, locationName: data.location_name, province: data.province, city: data.city, scenicSpot: data.scenic_spot, visitDate: data.visit_date, notes: data.notes });
    setEditingTrip(tripId);
  };

  const handleDeletePhoto = async (tripId: string, photoUrl: string) => {
    const photos = await getPhotosByTrip(tripId);
    const photo = photos.find((p) => p.file_url === photoUrl);
    if (!photo) return;
    const ok = await deletePhotoApi(photo.id, photoUrl);
    if (ok) setTrips((prev) => prev.map((t) => (t.tripId === tripId ? { ...t, urls: t.urls.filter((u) => u !== photoUrl) } : t)));
  };

  const handleUploadPhotos = async (tripId: string, files: FileList) => {
    if (!coupleId || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;
    setUploadingPhoto(tripId); setUploadProgress("");
    const uploaded = await uploadPhotosToTrip(tripId, coupleId, fileArray, (done, total) => setUploadProgress(`正在上传 ${done}/${total}...`));
    if (uploaded > 0) {
      const photos = await getPhotosByTrip(tripId);
      setTrips((prev) => prev.map((t) => (t.tripId === tripId ? { ...t, urls: photos.map((p) => p.file_url) } : t)));
    }
    setUploadingPhoto(null); setUploadProgress("");
  };

  const years = [...new Set(trips.map((t) => new Date(t.visitDate).getFullYear().toString()))].sort((a, b) => parseInt(b) - parseInt(a));
  const filteredTrips = selectedYear === "all" ? trips : trips.filter((t) => new Date(t.visitDate).getFullYear().toString() === selectedYear);
  const allPhotos = filteredTrips.flatMap((trip) => trip.urls.map((url) => ({ url, trip, key: `${trip.tripId}-${url}` })));
  const heroTrip = trips.find((t) => t.coverUrl || t.urls[0]);
  const heroCover = heroTrip?.coverUrl || heroTrip?.urls[0];

  if (!user) {
    return (
      <div style={{ flex: 1, overflowY: "auto", background: T.bg, paddingBottom: 80, position: "relative", minHeight: "100vh" }}>
        <GrainOverlay />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: T.inkFaint, fontFamily: "var(--font-noto-serif-sc)", fontStyle: "italic", fontSize: 20, marginBottom: 8 }}>请先登录</p>
            <a href="/login" style={{ color: T.accent, fontSize: 14, textDecoration: "underline" }}>前往登录 →</a>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ flex: 1, background: T.bg, position: "relative" }}>
        <LoadingScreen message="加载相册中..." subMessage="正在翻阅你们的回忆..." />
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, paddingBottom: 80, position: "relative", minHeight: "100vh" }}>
      <GrainOverlay />
      <PageHeader title="旅行相册" subtitle={trips.length > 0 ? `${trips.length} 段回忆 · ${allPhotos.length} 张照片` : "记录美好时光"}
        rightEl={
          <button onClick={() => setShowAddTrip(true)} style={{ width: 34, height: 34, borderRadius: 17, background: T.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        }
      />
      <div style={{ padding: "16px" }}>
        {allPhotos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 80, height: 80, margin: "0 auto 16px", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}`, background: T.bgCardAlt }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <p style={{ fontFamily: "var(--font-noto-serif-sc)", fontStyle: "italic", fontSize: 16, color: T.inkFaint }}>还没有照片</p>
            <p style={{ fontSize: 13, color: T.inkFaint, marginTop: 4, opacity: 0.7 }}>添加旅行时上传照片吧</p>
          </div>
        ) : (
          <>
            {/* Hero polaroid */}
            {heroTrip && heroCover && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ background: T.bgCard, padding: "12px 12px 60px 12px", borderRadius: 4, boxShadow: T.shadowDeep, border: `1px solid ${T.border}`, transform: "rotate(-1deg)", maxWidth: 480, margin: "0 auto" }}>
                  <div style={{ position: "relative", overflow: "hidden", borderRadius: 2, cursor: "pointer" }} onClick={() => setExpandedUrl(heroCover)}>
                    <img src={heroCover} alt={heroTrip.locationName} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
                  </div>
                  <div style={{ marginTop: 16, padding: "0 8px" }}>
                    <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 20, color: T.ink }}>{heroTrip.locationName}</div>
                    <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 4, fontFamily: "var(--font-noto-serif-sc)", fontStyle: "italic" }}>{heroTrip.province} · {heroTrip.city} · {new Date(heroTrip.visitDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Year filter */}
            {years.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                  <Pill accent={selectedYear === "all"} onClick={() => setSelectedYear("all")} small>全部</Pill>
                  {years.map((year) => (
                    <Pill key={year} accent={selectedYear === year} onClick={() => setSelectedYear(year)} small>{year}年</Pill>
                  ))}
                </div>
                <div style={{ flex: 1, height: 1, background: T.border }} />
              </div>
            )}

            {/* Photo gallery grouped by trip */}
            {filteredTrips.map((trip) => {
              if (trip.urls.length === 0) return null;
              const isExpanded = expandedTrip === trip.tripId;
              const cover = trip.coverUrl || trip.urls[0];
              const remainingCount = trip.urls.length - 1;
              return (
                <div key={trip.tripId} style={{ marginBottom: 24 }}>
                  {/* Trip header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 600, fontSize: 16, color: T.ink }}>{trip.locationName}</div>
                      <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{trip.visitDate} · {trip.urls.length} 张照片</div>
                      <button onClick={() => handleEditTrip(trip.tripId)} style={{ marginTop: 4, fontSize: 10, color: T.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>编辑</button>
                    </div>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                  </div>

                  {/* Photo card */}
                  <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                    <div onClick={() => setExpandedTrip(isExpanded ? null : trip.tripId)} style={{ cursor: "pointer", position: "relative" }}>
                      <img src={cover} alt={trip.locationName} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", transition: "transform 0.2s" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "rgba(0,0,0,0.5)", color: "white" }}>{trip.urls.length} 张照片</span>
                          {remainingCount > 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>+{remainingCount} 更多</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {trip.urls.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); setExpandedTrip(trip.tripId); }} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500, background: "rgba(0,0,0,0.6)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>查看全部</button>
                          )}
                          {trip.urls.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectingCover(selectingCover === trip.tripId ? null : trip.tripId); }} style={{ width: 28, height: 28, borderRadius: 14, background: "rgba(0,0,0,0.5)", color: T.gold, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>★</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded grid */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, padding: 16, borderRadius: 14, background: T.bgCardAlt, border: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: T.inkMid }}>全部照片 · {trip.urls.length} 张</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {uploadingPhoto === trip.tripId && <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: T.accentFaint, color: T.accent }}>{uploadProgress}</span>}
                          <label style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: T.bgCard, color: T.accent, border: `1px solid ${T.border}` }}>
                            + 添加照片
                            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple style={{ display: "none" }} onChange={(e) => e.target.files && handleUploadPhotos(trip.tripId, e.target.files)} disabled={uploadingPhoto === trip.tripId} />
                          </label>
                          <button onClick={() => setExpandedTrip(null)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, background: T.bgCard, color: T.inkFaint, border: `1px solid ${T.border}`, cursor: "pointer" }}>收起</button>
                        </div>
                      </div>
                      <div style={{ columns: "3", gap: 8 }}>
                        {trip.urls.map((url) => (
                          <div key={url} style={{ breakInside: "avoid", marginBottom: 8, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, cursor: "pointer", position: "relative" }} onClick={() => setExpandedUrl(url)}>
                            <img src={url} alt="" style={{ width: "100%", display: "block" }} />
                            {url === trip.coverUrl && <div style={{ position: "absolute", top: 6, left: 6, padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: T.goldFaint, color: T.ink }}>封面</div>}
                            <button onClick={(e) => { e.stopPropagation(); if (confirm("删除这张照片？")) handleDeletePhoto(trip.tripId, url); }} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, background: "rgba(0,0,0,0.6)", color: "#ff6b6b", border: "1px solid rgba(255,99,99,0.3)", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cover selection modal */}
                  {selectingCover === trip.tripId && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectingCover(null)}>
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
                      <div style={{ position: "relative", width: "100%", maxWidth: 360, margin: "0 16px", borderRadius: 20, padding: 20, background: T.bgCard, border: `1px solid ${T.border}` }} onClick={(e) => e.stopPropagation()}>
                        <p style={{ textAlign: "center", marginBottom: 16, fontFamily: "var(--font-noto-serif-sc)", fontWeight: 600, fontSize: 14, color: T.ink }}>选择封面照片</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, maxHeight: "60vh", overflowY: "auto", paddingBottom: 16 }}>
                          {trip.urls.map((url) => (
                            <button key={url} onClick={() => handleSetCover(trip.tripId, url)} style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "1", border: url === trip.coverUrl ? `3px solid ${T.accent}` : `2px solid ${T.border}`, cursor: "pointer", padding: 0, background: "none" }}>
                              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              {url === trip.coverUrl && <div style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: 9, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white" }}>✓</div>}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setSelectingCover(null)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: T.accent, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-dm-sans)" }}>取消</button>
                      </div>
                    </div>
                  )}

                  {/* Trip notes */}
                  {trip.notes && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: T.bgCardAlt, border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: T.inkMid, fontFamily: "var(--font-noto-serif-sc)", fontStyle: "italic", margin: 0 }}>{trip.notes}</p>
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
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setExpandedUrl(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)" }} />
          <img src={expandedUrl} alt="照片" style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 12 }} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setExpandedUrl(null)} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 20, background: "rgba(0,0,0,0.6)", color: "white", border: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      )}

      {showAddTrip && (coupleId ? (
        <AddTripForm coupleId={coupleId} onSuccess={handleTripSuccess} onCancel={() => setShowAddTrip(false)} />
      ) : (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAddTrip(false)} />
          <div style={{ position: "relative", borderRadius: 20, padding: 32, maxWidth: 360, width: "90%", textAlign: "center", background: T.bgCard, border: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 16, marginBottom: 12, fontFamily: "var(--font-noto-serif-sc)", fontWeight: 600, color: T.ink }}>请先绑定情侣</p>
            <p style={{ fontSize: 13, marginBottom: 20, color: T.inkFaint }}>添加旅行需要先绑定情侣关系，请在个人中心完成绑定</p>
            <button onClick={() => setShowAddTrip(false)} style={{ padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer", background: T.accent, color: "white", fontSize: 14, fontWeight: 600 }}>知道了</button>
          </div>
        </div>
      ))}

      {editingTrip && editingTripData && (
        <EditTripForm trip={{ ...editingTripData, coupleId: coupleId! }} onSuccess={handleEditSuccess} onCancel={() => { setEditingTrip(null); setEditingTripData(null); }} />
      )}

      <BottomNav />
    </div>
  );
}
