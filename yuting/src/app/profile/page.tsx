"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ModalSheet } from "@/components/ModalSheet";
import { ThemedBtn, ThemedInput } from "@/components/ThemedBtn";
import { ProgressBar, Pill, StatBadge } from "@/components/StatBadge";
import { useTheme } from "@/components/ThemeProvider";
import { getCoupleInfo, generateBindingCode, acceptBindingCode, deleteCoupleBinding, updateCoupleDates, updateUserProfile, getTimelines, addTimeline, updateTimeline, deleteTimeline } from "@/lib/trips";
import { useAuth, signOut } from "@/lib/auth";
import { TOTAL_PROVINCES } from "@/lib/provinces";

export default function ProfilePage() {
  const router = useRouter();
  const { tokens: T, theme, setTheme, themes } = useTheme();
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string | null>(null);
  const [sinceDate, setSinceDate] = useState<string>("");
  const [anniversary, setAnniversary] = useState<string>("");
  const [visitedProvinces, setVisitedProvinces] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [showCoupleModal, setShowCoupleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameSaved, setNicknameSaved] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [bindingCode, setBindingCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [bindError, setBindError] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelines, setTimelines] = useState<{ id: string; date: string; title: string; description: string | null; icon: string | null; type: string }[]>([]);
  const [newTimeline, setNewTimeline] = useState({ date: "", title: "", description: "", icon: "", type: "milestone" });
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const coupleInfo = await getCoupleInfo();
      setCoupleId(coupleInfo?.id ?? null);
      setPartnerNickname(coupleInfo?.partnerNickname ?? null);
      if (coupleInfo?.id) {
        const sup = await import("@/lib/supabase-browser");
        const client = sup.createClient();
        const { count: tripTotal } = await client.from("trips").select("*", { count: "exact", head: true }).eq("couple_id", coupleInfo.id);
        setTripCount(tripTotal ?? 0);
        const { data: provinces }: { data: { province: string }[] | null } = await client.from("trips").select("province").eq("couple_id", coupleInfo.id);
        setVisitedProvinces(new Set((provinces ?? []).map((t) => t.province)).size);
        setSinceDate(coupleInfo.sinceDate || "");
        setAnniversary(coupleInfo.anniversary || "");
        const tls = await getTimelines(coupleInfo.id);
        setTimelines(tls);
      }
      if (user) {
        const sup = await import("@/lib/supabase-browser");
        const client = sup.createClient();
        const { data: profile } = await client.from("users").select("city, bio, birthday").eq("id", user.id).single() as { data: { city: string | null; bio: string | null; birthday: string | null } | null };
        if (profile) {
          setEditCity(profile.city || "");
          setEditBio(profile.bio || "");
          setEditBirthday(profile.birthday || "");
        }
      }
    };
    load();
  }, [user]);

  const nickname = user?.user_metadata?.nickname || user?.email?.split("@")[0] || "旅行者";
  const progressPercent = visitedProvinces > 0 ? Math.round((visitedProvinces / TOTAL_PROVINCES) * 100) : 0;

  const generateCode = async () => {
    setCodeLoading(true);
    const code = await generateBindingCode();
    setCodeLoading(false);
    if (code) setBindingCode(code);
  };

  const acceptCode = async () => {
    if (!inputCode.trim()) return;
    setBindError(""); setAcceptLoading(true);
    const success = await acceptBindingCode(inputCode);
    setAcceptLoading(false);
    if (success) {
      const info = await getCoupleInfo();
      setCoupleId(info?.id ?? null);
      setPartnerNickname(info?.partnerNickname ?? null);
      setShowCoupleModal(false);
    } else setBindError("绑定码无效或已被使用");
  };

  const handleUnbind = async () => {
    const success = await deleteCoupleBinding();
    if (success) { setCoupleId(null); setPartnerNickname(null); setBindingCode(""); setShowCoupleModal(false); }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    await updateUserProfile({ city: editCity || null, bio: editBio || null, birthday: editBirthday || null });
    if (coupleId) {
      await updateCoupleDates(coupleId, { since_date: sinceDate || null, anniversary: anniversary || null });
    }
    setProfileSaving(false);
  };

  const loadTimelines = async () => {
    if (!coupleId) return;
    const tls = await getTimelines(coupleId);
    setTimelines(tls);
  };

  const handleAddTimeline = async () => {
    if (!coupleId || !newTimeline.date || !newTimeline.title) return;
    setTimelineLoading(true);
    const id = await addTimeline(coupleId, newTimeline);
    setTimelineLoading(false);
    if (id) {
      setNewTimeline({ date: "", title: "", description: "", icon: "", type: "milestone" });
      await loadTimelines();
    }
  };

  const handleDeleteTimeline = async (timelineId: string) => {
    await deleteTimeline(timelineId);
    await loadTimelines();
  };

  const handleUpdateNickname = async () => {
    const trimmed = newNickname.trim();
    if (!trimmed) return;
    setNicknameSaving(true); setNicknameError("");
    const sup = await import("@/lib/supabase-browser");
    const client = sup.createClient();
    const { error } = await client.from("users").update({ nickname: trimmed } as never).eq("id", user!.id);
    setNicknameSaving(false);
    if (error) { setNicknameError(error.message); return; }
    setNicknameSaved(true);
    setTimeout(() => setNicknameSaved(false), 2000);
    setNewNickname("");
    await client.auth.updateUser({ data: { nickname: trimmed } });
  };

  if (!user) {
    return (
      <div style={{ flex: 1, background: T.bg, paddingBottom: 80, position: "relative", minHeight: "100vh" }}>
        <GrainOverlay />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <p style={{ color: T.inkFaint, fontFamily: "var(--font-noto-serif-sc)", fontStyle: "italic", fontSize: 18, marginBottom: 12 }}>请先登录</p>
          <ThemedBtn onClick={() => router.push("/login")}>前往登录</ThemedBtn>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, paddingBottom: 80, position: "relative" }}>
      <GrainOverlay />
      <PageHeader title="个人中心" />
      <div style={{ padding: "16px" }}>
        {/* ID Card */}
        <div style={{ background: `linear-gradient(135deg, ${T.accent}20, ${T.bgCard})`, borderRadius: 20, padding: "20px", border: `1.5px solid ${T.accent}30`, marginBottom: 20, boxShadow: T.shadowDeep, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 100, opacity: 0.04, fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, color: T.ink, pointerEvents: "none" }}>亭</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${T.bgCard}`, boxShadow: `0 0 0 2px ${T.accent}40` }}>
              <span style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 22, color: "white" }}>{nickname[0]}</span>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.inkFaint, letterSpacing: "0.1em", marginBottom: 3, fontFamily: "var(--font-dm-sans)" }}>AUTHENTICATED EXPLORER</div>
              <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 20, color: T.ink }}>{nickname}</div>
              {user?.email && <div style={{ fontSize: 11, color: T.inkFaint }}>{user.email}</div>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <StatBadge value={`${tripCount} 次`} label="旅行次数" />
            <StatBadge value={`${visitedProvinces}/${TOTAL_PROVINCES}`} label="省份" />
            <StatBadge value={coupleId ? "已绑定" : "未绑定"} label="情侣状态" accent={!!coupleId} />
            <StatBadge value={`${progressPercent}%`} label="完成度" accent />
          </div>
        </div>

        {/* Progress */}
        <div style={{ background: T.bgCard, borderRadius: 16, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 20, boxShadow: T.shadow }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 12, fontFamily: "var(--font-dm-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>探索进度</div>
          <ProgressBar value={visitedProvinces} max={TOTAL_PROVINCES} showLabel height={10} />
        </div>

        {/* Menu */}
        {[
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
            title: coupleId ? `情侣 · ${partnerNickname || "对方"}` : "情侣绑定",
            sub: coupleId ? "已绑定，一起记录旅行回忆" : "生成绑定码分享给另一半",
            badge: coupleId ? "已绑定" : null,
            dot: !coupleId,
            action: () => setShowCoupleModal(true),
          },
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
            title: "设置",
            sub: "账号与安全设置",
            action: () => setShowSettingsModal(true),
          },
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
            title: "纪念日管理",
            sub: "编辑你们的纪念日和重要时刻",
            action: () => { loadTimelines(); setShowTimelineModal(true); },
          },
          {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
            title: "生成旅行海报",
            sub: "分享你们的旅行地图",
            action: () => router.push("/poster"),
          },
        ].map((item, i) => (
          <button key={i} onClick={item.action} style={{
            width: "100%", background: T.bgCard, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.border}`,
            marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            boxShadow: T.shadow, textAlign: "left",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: T.accentFaint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
              {item.icon}
              {item.dot && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: T.gold, border: `2px solid ${T.bgCard}` }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 600, fontSize: 14, color: T.ink }}>{item.title}</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{item.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {item.badge && <Pill small accent>{item.badge}</Pill>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        ))}
      </div>

      {/* Couple modal */}
      <ModalSheet open={showCoupleModal} onClose={() => { setShowCoupleModal(false); setBindingCode(""); }} title={coupleId ? `情侣 · ${partnerNickname || "对方"}` : "情侣绑定"}>
        {coupleId ? (
          <div>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", border: `3px solid ${T.bgCard}` }}>
                <span style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 20, color: "white" }}>{partnerNickname?.[0] || "?"}</span>
              </div>
              <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 18, color: T.ink }}>{partnerNickname || "对方"}</div>
              <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 4 }}>已绑定情侣关系</div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(200,50,50,0.03)", border: "1px solid rgba(200,50,50,0.1)", marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#C44444", marginBottom: 4 }}>解除绑定</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 10 }}>解除后双方旅行记录将保持独立</div>
              <ThemedBtn variant="outline" full onClick={handleUnbind}>解除情侣绑定</ThemedBtn>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ background: T.bgCardAlt, borderRadius: 12, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>生成绑定码</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 12 }}>生成唯一绑定码，分享给另一半</div>
              {bindingCode ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 28, letterSpacing: "0.2em", color: T.accent, background: T.accentFaint, padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${T.accent}40`, marginBottom: 8 }}>{bindingCode}</div>
                  <button onClick={() => navigator.clipboard.writeText(bindingCode)} style={{ fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>复制到剪贴板</button>
                  <button onClick={() => setBindingCode("")} style={{ fontSize: 11, color: T.inkFaint, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginLeft: 12 }}>重新生成</button>
                </div>
              ) : (
                <ThemedBtn full onClick={generateCode} disabled={codeLoading}>{codeLoading ? "生成中..." : "生成绑定码"}</ThemedBtn>
              )}
            </div>
            <div style={{ background: T.bgCardAlt, borderRadius: 12, padding: "16px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>输入绑定码</div>
              {bindError && <p style={{ fontSize: 11, color: "#C44444", marginBottom: 8 }}>{bindError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <input value={inputCode} onChange={(e) => { setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); setBindError(""); }} placeholder="6位码" maxLength={6}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 16, fontFamily: "monospace", letterSpacing: "0.2em", textAlign: "center", fontWeight: 700, outline: "none" }} />
                <ThemedBtn onClick={acceptCode} disabled={!inputCode || acceptLoading}>{acceptLoading ? "绑定中..." : "绑定"}</ThemedBtn>
              </div>
            </div>
          </div>
        )}
      </ModalSheet>

      {/* Settings modal */}
      <ModalSheet open={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="设置">
        {/* Theme toggle */}
        <div style={{ background: T.bgCardAlt, borderRadius: 12, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 12 }}>主题切换</div>
          <div style={{ display: "flex", gap: 0, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
            {themes.map((t) => (
              <button key={t} onClick={() => setTheme(t)} style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                background: theme === t ? T.accent : T.bgCard,
                color: theme === t ? "white" : T.inkMid,
                fontSize: 13, fontWeight: 600, fontFamily: "var(--font-noto-serif-sc)",
                transition: "all 0.2s",
              }}>{t}</button>
            ))}
          </div>
        </div>
        {/* Profile editing */}
        <div style={{ background: T.bgCardAlt, borderRadius: 12, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 12 }}>个人资料</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.inkFaint }}>昵称</span>
            <span style={{ fontSize: 12, color: T.inkMid, fontWeight: 500 }}>{nickname}</span>
          </div>
          <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <ThemedInput label="修改昵称" value={newNickname} onChange={(v) => { setNewNickname(v); setNicknameError(""); }} placeholder="输入新昵称" />
            <div style={{ display: "flex", gap: 8 }}>
              <ThemedBtn onClick={handleUpdateNickname} disabled={!newNickname.trim() || nicknameSaving} small>{nicknameSaving ? "保存中" : nicknameSaved ? "已保存 ✓" : "修改"}</ThemedBtn>
            </div>
          </div>
          {nicknameError && <p style={{ fontSize: 11, color: "#C44444", marginTop: 8 }}>{nicknameError}</p>}
          <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.inkFaint, display: "block", marginBottom: 6 }}>在一起日期</span>
            <input type="date" value={sinceDate} onChange={(e) => setSinceDate(e.target.value)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, fontFamily: "var(--font-noto-serif-sc)", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.inkFaint, display: "block", marginBottom: 6 }}>纪念日（可选）</span>
            <input type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, fontFamily: "var(--font-noto-serif-sc)", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.inkFaint, display: "block", marginBottom: 6 }}>城市</span>
            <input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="如：杭州" style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, fontFamily: "var(--font-noto-serif-sc)", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.inkFaint, display: "block", marginBottom: 6 }}>签名</span>
            <input value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="一句话介绍自己" style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, fontFamily: "var(--font-noto-serif-sc)", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.inkFaint, display: "block", marginBottom: 6 }}>生日</span>
            <input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, fontFamily: "var(--font-noto-serif-sc)", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 12, color: T.inkFaint }}>邮箱</span>
            <span style={{ fontSize: 12, color: T.inkMid, fontWeight: 500 }}>{user?.email}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ fontSize: 12, color: T.inkFaint }}>UID</span>
            <span style={{ fontSize: 12, color: T.inkMid, fontWeight: 500, fontFamily: "monospace" }}>{user?.id?.slice(0, 8)}...</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <ThemedBtn full onClick={handleSaveProfile} disabled={profileSaving}>{profileSaving ? "保存中..." : "保存资料"}</ThemedBtn>
          </div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(200,50,50,0.03)", border: "1px solid rgba(200,50,50,0.1)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#C44444", marginBottom: 4 }}>退出登录</div>
          <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 10 }}>退出后需重新登录才能访问旅行数据</div>
          <ThemedBtn variant="outline" full onClick={async () => { await signOut(); setShowSettingsModal(false); }}>确认退出</ThemedBtn>
        </div>
      </ModalSheet>

      {/* Timeline management modal */}
      <ModalSheet open={showTimelineModal} onClose={() => setShowTimelineModal(false)} title="纪念日管理">
        {/* Add new timeline */}
        <div style={{ background: T.bgCardAlt, borderRadius: 12, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10 }}>添加纪念日</div>
          <input value={newTimeline.date} onChange={(e) => setNewTimeline({ ...newTimeline, date: e.target.value })} type="date" placeholder="日期" style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box",
          }} />
          <input value={newTimeline.title} onChange={(e) => setNewTimeline({ ...newTimeline, title: e.target.value })} placeholder="标题如：初次相遇" style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box",
          }} />
          <input value={newTimeline.description} onChange={(e) => setNewTimeline({ ...newTimeline, description: e.target.value })} placeholder="描述（可选）" style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box",
          }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={newTimeline.icon} onChange={(e) => setNewTimeline({ ...newTimeline, icon: e.target.value })} placeholder="图标 emoji" maxLength={2} style={{
              flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, outline: "none", boxSizing: "border-box",
            }} />
            <select value={newTimeline.type} onChange={(e) => setNewTimeline({ ...newTimeline, type: e.target.value })} style={{
              flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bgCard, color: T.ink, fontSize: 14, outline: "none", boxSizing: "border-box",
            }}>
              <option value="milestone">里程碑</option>
              <option value="anniversary">周年</option>
              <option value="trip">旅行</option>
            </select>
          </div>
          <ThemedBtn full onClick={handleAddTimeline} disabled={timelineLoading || !newTimeline.date || !newTimeline.title} small>{timelineLoading ? "添加中..." : "添加"}</ThemedBtn>
        </div>
        {/* Timeline list */}
        {timelines.map((tl) => (
          <div key={tl.id} style={{ background: T.bgCard, borderRadius: 12, padding: "12px 16px", border: `1px solid ${T.border}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{tl.icon || "✦"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 600, fontSize: 14, color: T.ink }}>{tl.title}</div>
              <div style={{ fontSize: 11, color: T.inkFaint }}>{tl.date}{tl.description ? ` · ${tl.description}` : ""}</div>
            </div>
            <Pill small>{tl.type}</Pill>
            <button onClick={() => handleDeleteTimeline(tl.id)} style={{
              width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(200,50,50,0.06)", color: "#C44444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>✕</button>
          </div>
        ))}
        {timelines.length === 0 && (
          <p style={{ textAlign: "center", fontSize: 12, color: T.inkFaint, padding: 20 }}>暂无纪念日，添加第一个吧</p>
        )}
      </ModalSheet>

      <BottomNav />
    </div>
  );
}
