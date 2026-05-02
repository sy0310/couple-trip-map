"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import { PageHeader } from "@/components/PageHeader";
import { ChinaMap } from "@/components/ChinaMap";
import { getCoupleId, getVisitedProvinces, getVisitedCitiesWithCoords, getAllPhotosForCouple, getCoupleInfo } from "@/lib/trips";
import { TOTAL_PROVINCES } from "@/lib/provinces";

export default function PosterPage() {
  const router = useRouter();
  const { tokens: T } = useTheme();
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<Awaited<ReturnType<typeof getVisitedCitiesWithCoords>>>([]);
  const [allPhotos, setAllPhotos] = useState<Awaited<ReturnType<typeof getAllPhotosForCouple>>>([]);
  const [daysSince, setDaysSince] = useState(0);
  const [partnerNickname, setPartnerNickname] = useState("");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const myLastChar = (user?.user_metadata?.nickname || user?.email?.split("@")[0] || "旅行者").slice(-1);

  useEffect(() => {
    getCoupleId().then((cid) => {
      if (!cid) return;
      Promise.all([getVisitedProvinces(cid), getVisitedCitiesWithCoords(cid), getAllPhotosForCouple(cid), getCoupleInfo()])
        .then(([p, c, ph, ci]) => {
          setProvinces(p); setCities(c); setAllPhotos(ph);
          if (ci?.sinceDate) {
            setDaysSince(Math.floor((Date.now() - new Date(ci.sinceDate).getTime()) / 86400000));
          }
          if (ci?.partnerNickname) {
            setPartnerNickname(ci.partnerNickname);
          }
        });
    });
  }, []);
  const photoCount = allPhotos.length;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, paddingBottom: 80, position: "relative" }}>
      <PageHeader title="旅行海报" onBack={() => router.push("/stats")} />
      <div style={{ padding: "16px" }}>
        <div style={{ background: T.ink, borderRadius: 20, overflow: "hidden", boxShadow: T.shadowDeep, marginBottom: 16 }}>
          <div style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`, padding: "20px 24px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 28, color: "white", letterSpacing: "0.06em" }}>遇亭</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>我们的旅行地图</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>在一起</div>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 800, fontSize: 32, color: "white", lineHeight: 1 }}>{daysSince}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>天</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "20px 24px", background: T.ink }}>
            <div style={{ height: 180, marginBottom: 16, opacity: 0.85 }}>
              <ChinaMap visitedProvinces={provinces} visitedCities={cities} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16 }}>
              {[
                { v: provinces.length, l: "省", u: `/${TOTAL_PROVINCES}` },
                { v: cities.length, l: "城市", u: "" },
                { v: allPhotos.length, l: "旅行", u: "次" },
                { v: photoCount, l: "照片", u: "张" },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 800, fontSize: 18, color: T.accentLight, lineHeight: 1 }}>
                    {item.v}<span style={{ fontSize: 9, opacity: 0.7 }}>{item.u}</span></div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>YUTING · TRAVEL MAP · 2021–2025</div>
            <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{myLastChar} & {partnerNickname.slice(-1) || "?"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
            flex: 1, padding: "13px", borderRadius: 12, background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
            border: "none", cursor: "pointer", color: "white", fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: 14,
            boxShadow: `0 4px 16px ${T.accent}50`,
          }}>{copied ? "已复制 ✓" : "保存图片"}</button>
          <button style={{ flex: 1, padding: "13px", borderRadius: 12, background: T.bgCard, border: `1px solid ${T.border}`,
            cursor: "pointer", color: T.ink, fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: 14, boxShadow: T.shadow,
          }}>分享给朋友</button>
        </div>
      </div>
    </div>
  );
}
