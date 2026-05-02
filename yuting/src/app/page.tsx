"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ChinaMap } from "@/components/ChinaMap";
import { GrainOverlay } from "@/components/GrainOverlay";
import { PageHeader } from "@/components/PageHeader";
import { TripCard } from "@/components/TripCard";
import { SectionLabel } from "@/components/StatBadge";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import { TOTAL_PROVINCES } from "@/lib/provinces";
import {
  getCoupleId,
  getVisitedProvinces,
  getVisitedCitiesWithCoords,
  getAllPhotosForCouple,
  getCoupleInfo,
} from "@/lib/trips";

export default function HomePage() {
  const router = useRouter();
  const { tokens: T } = useTheme();
  const { user } = useAuth();
  const myName = user?.user_metadata?.nickname || user?.email?.split("@")[0] || "旅行者";
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [visitedCities, setVisitedCities] = useState<
    Awaited<ReturnType<typeof getVisitedCitiesWithCoords>>
  >([]);
  const [allPhotos, setAllPhotos] = useState<
    Awaited<ReturnType<typeof getAllPhotosForCouple>>
  >([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [coupleInfo, setCoupleInfo] = useState<{
    partnerNickname?: string;
    sinceDate?: string | null;
  }>({});
  const [loading, setLoading] = useState(true);

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
    Promise.all([getCoupleId(), getCoupleInfo()]).then(([id, info]) => {
      if (id) {
        setCoupleId(id);
        setCoupleInfo(info ?? {});
        loadData(id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    let tripsChannel: ReturnType<
      ReturnType<typeof import("@/lib/supabase-browser").createClient>["channel"]
    > | null = null;
    import("@/lib/supabase-browser")
      .then((m) => m.createClient())
      .then((client) => {
        tripsChannel = client
          .channel("home-trip-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "trips",
              filter: `couple_id=eq.${coupleId}`,
            },
            () => loadData(coupleId)
          )
          .subscribe();
      });
    return () => {
      tripsChannel?.unsubscribe();
    };
  }, [coupleId]);

  const visitedCount = visitedProvinces.length;
  const completionRate = ((visitedCount / TOTAL_PROVINCES) * 100).toFixed(1);
  const recentTrips = allPhotos.slice(0, 3);
  const daysSince = coupleInfo.sinceDate
    ? Math.floor((Date.now() - new Date(coupleInfo.sinceDate).getTime()) / 86400000)
    : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, paddingBottom: 80, position: "relative" }}>
      <GrainOverlay />
      <PageHeader
        title="遇亭"
        subtitle="我们的旅行地图"
        rightEl={
          <div style={{ display: "flex", alignItems: "center", gap: -10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "var(--font-noto-serif-sc)" }}>{myName?.[0] || "旅"}</span>
            </div>
            {coupleInfo.partnerNickname && (
              <div style={{ width: 32, height: 32, borderRadius: 16, background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.bg}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "var(--font-noto-serif-sc)" }}>{coupleInfo.partnerNickname}</span>
              </div>
            )}
          </div>
        }
      />
      <div style={{ padding: "0 16px" }}>
        {/* Stats strip */}
        <div style={{ display: "flex", gap: 0, margin: "16px 0", background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: T.shadow }}>
          {[
            { v: visitedCount, l: "省份", u: `/${TOTAL_PROVINCES}` },
            { v: visitedCities.length, l: "城市", u: "" },
            { v: allPhotos.length, l: "旅行", u: "次" },
            { v: allPhotos.length, l: "照片", u: "张" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "14px 0", textAlign: "center", borderRight: i < 3 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 700, fontSize: 20, color: T.accent, lineHeight: 1 }}>{s.v}<span style={{ fontSize: 11, fontWeight: 500, color: T.inkFaint }}>{s.u}</span></div>
              <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 3, letterSpacing: "0.04em" }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Map */}
        <div style={{ background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 16, boxShadow: T.shadow }}>
          <div style={{ padding: "12px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SectionLabel>足迹地图</SectionLabel>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 500, fontFamily: "var(--font-dm-sans)", background: T.accentFaint, color: T.accent, border: `1px solid ${T.accentLight}40` }}>{visitedCount} 省已探索</span>
          </div>
          <div style={{ padding: "0 12px 12px", height: 260 }}>
            <ChinaMap visitedProvinces={visitedProvinces} visitedCities={visitedCities}
              onProvinceClick={(name) => router.push(`/province?name=${encodeURIComponent(name)}`)}
              onCityClick={(cityName) => {
                const city = visitedCities.find((c) => c.name === cityName);
                if (city) router.push(`/city?name=${encodeURIComponent(city.name)}&province=${encodeURIComponent(city.province)}`);
              }}
              provinceCount={visitedCount} cityCount={visitedCities.length} completionRate={loading ? "0.0" : completionRate}
            />
          </div>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.inkFaint, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: T.accent }}>↑</span> 点击已探索省份查看详情
          </div>
        </div>
        {/* Recent trips */}
        <SectionLabel action="全部" onAction={() => router.push("/album")}>最近旅行</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {recentTrips.slice(0, 2).map((photo) => (
            <TripCard key={photo.id} location={photo.tripLocation || "旅行"} province="" city="" date={photo.created_at.slice(0, 10)} coverUrl={photo.file_url} />
          ))}
        </div>
        {recentTrips[2] && (
          <div style={{ marginTop: 10 }}><TripCard location={recentTrips[2].tripLocation || "旅行"} province="" city="" date={recentTrips[2].created_at.slice(0, 10)} coverUrl={recentTrips[2].file_url} /></div>
        )}
        {/* Anniversary counter */}
        {daysSince !== null && (
          <div style={{ marginTop: 16, marginBottom: 16, padding: "14px 16px", background: T.bgCard, borderRadius: 14, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, boxShadow: T.shadow }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: T.accentFaint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 2 }}>在一起</div>
              <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 600, fontSize: 15, color: T.ink }}>{coupleInfo.sinceDate || ""} · <span style={{ color: T.accent }}>{daysSince} 天</span></div>
            </div>
            <button onClick={() => router.push("/stats")} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgCardAlt, color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>查看</button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
