"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, signUp, useAuth } from "@/lib/auth";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ThemedBtn, ThemedInput } from "@/components/ThemedBtn";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { tokens: T } = useTheme();

  if (!authLoading && user) { router.push("/"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("请输入有效的邮箱地址"); return; }
    if (password.length < 6) { setError("密码至少需要6个字符"); return; }
    if (isSignUp && nickname.trim().length < 1) { setError("请输入昵称"); return; }
    setLoading(true); setError("");
    const { error: err } = isSignUp ? await signUp(email, password, nickname) : await signInWithPassword(email, password);
    if (err) setError(err); else router.push("/");
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: T.bg, position: "relative", overflowY: "auto" }}>
      <GrainOverlay />
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 8px 24px ${T.accent}40` }}>
          <span style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 26, color: "white" }}>亭</span>
        </div>
        <div style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 28, color: T.ink, letterSpacing: "0.08em" }}>遇亭</div>
        <div style={{ fontSize: 13, color: T.inkFaint, marginTop: 4, fontStyle: "italic" }}>记录我们的每一次相聚</div>
      </div>
      <div style={{ width: "100%", maxWidth: 360, background: T.bgCard, borderRadius: 20, border: `1px solid ${T.border}`, padding: "24px 20px", boxShadow: T.shadowDeep }}>
        <div style={{ display: "flex", background: T.bgCardAlt, borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {["登录", "注册"].map((label) => {
            const isLogin = label === "登录";
            const active = isLogin ? !isSignUp : isSignUp;
            return (
              <button key={label} onClick={() => { setIsSignUp(!isLogin); setError(""); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? T.bgCard : "transparent", color: active ? T.ink : T.inkFaint,
                  fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: "var(--font-dm-sans)",
                  boxShadow: active ? T.shadow : "none", transition: "all 0.2s" }}>{label}</button>
            );
          })}
        </div>
        <form onSubmit={handleSubmit}>
          <ThemedInput label="邮箱地址" value={email} onChange={(v) => { setEmail(v); setError(""); }} placeholder="your@email.com" type="email" />
          {isSignUp && <ThemedInput label="昵称" value={nickname} onChange={(v) => { setNickname(v); setError(""); }} placeholder="你的昵称" />}
          <ThemedInput label="密码" value={password} onChange={(v) => { setPassword(v); setError(""); }} placeholder="至少6个字符" type="password" />
          {error && <p style={{ fontSize: 12, color: "#ba1a1a", marginBottom: 10 }}>{error}</p>}
          <ThemedBtn full disabled={loading}>{loading ? "处理中..." : (isSignUp ? "注册" : "登录")}</ThemedBtn>
        </form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setNickname(""); }} style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer" }}>
            {isSignUp ? "已有账号？返回登录" : "没有账号？立即注册"}
          </button>
        </div>
      </div>
      <div style={{ marginTop: 24, fontSize: 11, color: T.inkFaint, textAlign: "center" }}>属于你们两个人的旅行地图</div>
    </div>
  );
}
