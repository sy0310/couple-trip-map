"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ProgressBar, Pill, SectionLabel, StatBadge } from "@/components/StatBadge";
import { getCoupleId, getVisitedProvinces, getVisitedCitiesWithCoords, getAllPhotosForCouple } from "@/lib/trips";
import { TOTAL_PROVINCES } from "@/lib/provinces";

export default function StatsPage() {
  const router = useRouter();
  const { tokens: T } = useTheme();
  const [activeTab, setActiveTab] = useState<"stats" | "timeline">("stats");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<Awaited<ReturnType<typeof getVisitedCitiesWithCoords>>>([]);
  const [allPhotos, setAllPhotos] = useState<Awaited<ReturnType<typeof getAllPhotosForCouple>>>([]);

  useEffect(() => {
    getCoupleId().then((cid) => {
      if (!cid) return;
      Promise.all([getVisitedProvinces(cid), getVisitedCitiesWithCoords(cid), getAllPhotosForCouple(cid)])
        .then(([p, c, ph]) => { setProvinces(p); setCities(c); setAllPhotos(ph); });
    });
  }, []);

  const byYear: Record<string, number> = {};
  allPhotos.forEach((p) => { const y = p.created_at?.slice(0, 4); if (y) byYear[y] = (byYear[y] || 0) + 1; });
  const years = Object.keys(byYear).sort();
  const maxCount = Math.max(...Object.values(byYear), 1);
  const daysSince = Math.floor((Date.now() - new Date("2021-07-14").getTime()) / 86400000);
  const photoCount = allPhotos.length;
  const anniversaries = [
    { date: "2021-07-14", label: "初次相遇", icon: "✦", note: "在杭州西湖边，那天下着小雨", past: true },
    { date: "2022-07-14", label: "一周年", icon: "♡", note: "一起去了苏州，住在平江路", past: true },
    { date: "2023-07-14", label: "两周年", icon: "◈", note: "大理洱海边看落日，许了愿望", past: true },
    { date: "2024-07-14", label: "三周年", icon: "❋", note: "故宫博物院，拍了很多照片", past: true },
    { date: "2025-07-14", label: "四周年", icon: "✿", note: "即将到来...", past: false },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, paddingBottom: 80, position: "relative" }}>
      <GrainOverlay />
      <PageHeader title="统计 & 纪念" />
      <div style={{ display: "flex", margin: "12px 16px", background: T.bgCardAlt, borderRadius: 12, padding: 3, border: `1px solid ${T.border}` }}>
        {[{ id: "stats", l: "数据统计" }, { id: "timeline", l: "周年时间线" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
            background: activeTab === tab.id ? T.bgCard : "transparent",
            color: activeTab === tab.id ? T.ink : T.inkFaint, fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400, fontFamily: "var(--font-dm-sans)",
            boxShadow: activeTab === tab.id ? T.shadow : "none", transition: "all 0.2s",
          }}>{tab.l}</button>
        ))}
      </div>
      {activeTab === "stats" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: T.bgCard, borderRadius: 16, padding: "20px", border: `1px solid ${T.border}`, marginBottom: 16, boxShadow: T.shadow }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 800, fontSize: 48, color: T.accent, lineHeight: 1 }}>{daysSince}</div>
              <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 4 }}>在一起的天数</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
              <StatBadge value={allPhotos.length} label="旅行天数" />
              <StatBadge value={cities.length} label="探索城市" />
              <StatBadge value={photoCount} label="珍贵照片" />
            </div>
          </div>
          <div style={{ background: T.bgCard, borderRadius: 16, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 16, boxShadow: T.shadow }}>
            <SectionLabel>按年份旅行次数</SectionLabel>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
              {years.map((y) => (
                <div key={y} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, color: T.accent, fontWeight: 700 }}>{byYear[y]}</div>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `linear-gradient(to top, ${T.accent}, ${T.accentLight})`, height: `${(byYear[y] / maxCount) * 72}px`, minHeight: 4 }} />
                  <div style={{ fontSize: 9, color: T.inkFaint }}>{y.slice(2)}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.bgCard, borderRadius: 16, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 16, boxShadow: T.shadow }}>
            <SectionLabel>省份足迹</SectionLabel>
            <ProgressBar value={provinces.length} max={TOTAL_PROVINCES} showLabel height={10} />
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>{provinces.map((p) => <Pill key={p} accent small>{p}</Pill>)}</div>
          </div>
          <button onClick={() => router.push("/poster")} style={{
            width: "100%", padding: "14px", borderRadius: 14, background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
            border: "none", cursor: "pointer", color: "white", fontFamily: "var(--font-noto-serif-sc)", fontWeight: 600, fontSize: 15,
            boxShadow: `0 6px 20px ${T.accent}50`, letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            生成旅行海报
          </button>
        </div>
      )}
      {activeTab === "timeline" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: `linear-gradient(135deg, ${T.accent}15, ${T.accentFaint})`, borderRadius: 20, padding: "24px 20px", textAlign: "center", border: `1.5px solid ${T.accent}30`, marginBottom: 20, boxShadow: T.shadow }}>
            <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 }}>TOGETHER SINCE</div>
            <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 22, color: T.ink }}>2021年7月14日</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 800, fontSize: 42, color: T.accent, lineHeight: 1, margin: "8px 0" }}>{daysSince}</div>
            <div style={{ fontSize: 13, color: T.inkMid }}>天的相守</div>
          </div>
          <div style={{ position: "relative", paddingLeft: 24, paddingBottom: 20 }}>
            <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${T.accent}, ${T.accentFaint})` }} />
            {anniversaries.map((ann) => (
              <div key={ann.date} style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ position: "absolute", left: -18, top: 10, width: 14, height: 14, borderRadius: 7, background: ann.past ? T.accent : T.bgCard, border: `2px solid ${T.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "white" }}>{ann.past ? "✓" : ""}</div>
                <div style={{ background: T.bgCard, borderRadius: 14, border: `1px solid ${ann.past ? T.accent + "30" : T.border}`, padding: "14px 16px", opacity: ann.past ? 1 : 0.6, boxShadow: T.shadow }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{ann.icon}</span>
                    <span style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 16, color: T.ink }}>{ann.label}</span>
                    {!ann.past && <Pill small>即将到来</Pill>}
                  </div>
                  <div style={{ fontSize: 11, color: T.accent, marginBottom: 6, fontWeight: 500 }}>{ann.date}</div>
                  <div style={{ fontSize: 12, color: T.inkMid, fontStyle: "italic", lineHeight: 1.5 }}>{ann.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
