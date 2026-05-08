"use client";

import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { GrainOverlay } from "@/components/GrainOverlay";
import { useTheme } from "@/components/ThemeProvider";

export default function AboutPage() {
  const router = useRouter();
  const { tokens: T } = useTheme();

  const sections = [
    {
      title: "关于遇亭",
      content: "“遇亭”的名字取自开发者俞（Yu）和婷（Ting）的邂逅。这不仅是一个旅行记录工具，更是承载着一段关于距离、思念与相聚的故事。",
      icon: "💕"
    },
    {
      title: "我们的初心",
      content: "对于异地情侣而言，每一次见面都弥足珍贵。我们希望通过地图的形式，将散落在全国各地的相聚时光串联起来，让那些关于火车站、机场和异地街头的记忆，都能在地图上点亮。",
      icon: "📍"
    },
    {
      title: "核心理念",
      content: "遇亭坚持“极简、私密、温情”的设计理念。我们不追求繁琐的社交功能，只希望为您和您的另一半打造一个纯净的数字化记忆空间。",
      icon: "✨"
    }
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.bg, paddingBottom: 80, position: "relative", minHeight: "100vh" }}>
      <GrainOverlay />
      <PageHeader 
        title="关于遇亭" 
        onBack={() => router.back()} 
      />
      
      <div style={{ padding: "20px 16px" }}>
        {/* Logo/Hero Section */}
        <div style={{ textAlign: "center", marginBottom: 32, marginTop: 10 }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 24, background: T.accent, 
            display: "flex", alignItems: "center", justifyContent: "center", 
            margin: "0 auto 16px", boxShadow: T.shadowDeep,
            border: `3px solid ${T.bgCard}`
          }}>
            <span style={{ fontSize: 40 }}>亭</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 24, color: T.ink, marginBottom: 8 }}>遇亭 YuTing</h1>
          <p style={{ fontSize: 13, color: T.inkFaint, fontStyle: "italic" }}>记录我们的每一次相聚</p>
        </div>

        {/* Story Cards */}
        {sections.map((s, i) => (
          <div key={i} style={{ 
            background: T.bgCard, borderRadius: 20, padding: "20px", 
            border: `1px solid ${T.border}`, marginBottom: 16, boxShadow: T.shadow,
            position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", right: -10, top: -10, fontSize: 60, opacity: 0.05 }}>{s.icon}</div>
            <h2 style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 18, color: T.accent, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.7, textAlign: "justify" }}>{s.content}</p>
          </div>
        ))}

        {/* Tech Section */}
        <div style={{ 
          background: `linear-gradient(135deg, ${T.accent}10, ${T.bgCard})`, 
          borderRadius: 20, padding: "20px", border: `1.5px solid ${T.accent}30`, 
          marginBottom: 16, marginTop: 8 
        }}>
          <h2 style={{ fontFamily: "var(--font-noto-serif-sc)", fontWeight: 700, fontSize: 16, color: T.ink, marginBottom: 12 }}>技术背景</h2>
          <p style={{ fontSize: 12, color: T.inkFaint, lineHeight: 1.6 }}>
            遇亭采用现代化的全栈 Serverless 架构构建。前端使用 Next.js 与 Taro 跨端框架，后端基于微信云开发与 Supabase 实时数据库。我们致力于提供流畅、稳定且极具美感的交互体验。
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {["Next.js", "Taro", "Supabase", "Serverless"].map(t => (
              <span key={t} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, background: T.bgCardAlt, color: T.accent, border: `1px solid ${T.border}`, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px 0", marginTop: 10 }}>
          <div style={{ fontSize: 12, color: T.inkFaint, marginBottom: 8 }}>由 sy0310 用心打造</div>
          <div style={{ fontSize: 10, color: T.inkFaint, opacity: 0.6 }}>© 2026 YuTing Project. All rights reserved.</div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
