"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

export function BottomNav() {
  const { tokens: T } = useTheme();
  const pathname = usePathname();

  const tabs = [
    { id: "home", label: "地图", href: "/", active: pathname === "/",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.navText : T.navTextMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><path d="M8 2v16" /><path d="M16 6v16" />
        </svg>
      ),
    },
    { id: "album", label: "相册", href: "/album", active: pathname === "/album",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.navText : T.navTextMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
        </svg>
      ),
    },
    { id: "stats", label: "统计", href: "/stats", active: pathname === "/stats",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.navText : T.navTextMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    { id: "profile", label: "我的", href: "/profile", active: pathname === "/profile",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? T.navText : T.navTextMute} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: T.navBg, borderTop: `1.5px solid ${T.navBorder}`,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      height: 64, paddingBottom: 8, zIndex: 100,
    }}>
      {tabs.map((tab) => (
        <Link key={tab.id} href={tab.href} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 3, padding: "4px 0",
          position: "relative", textDecoration: "none",
        }}>
          {tab.active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2, borderRadius: 2, background: T.navBorder }} />}
          {tab.icon(tab.active)}
          <span style={{ fontSize: 10, fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: tab.active ? 600 : 400, color: tab.active ? T.navText : T.navTextMute, letterSpacing: "0.04em" }}>{tab.label}</span>
        </Link>
      ))}
    </div>
  );
}
