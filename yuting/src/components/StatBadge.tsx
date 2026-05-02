"use client";

import { useTheme } from "./ThemeProvider";

export function StatBadge({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  const { tokens: T } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: 22, color: accent ? T.accent : T.ink, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: T.inkFaint, fontWeight: 400, letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans), sans-serif" }}>{label}</span>
    </div>
  );
}

export function ProgressBar({ value, max, height = 6, showLabel }: { value: number; max: number; height?: number; showLabel?: boolean }) {
  const { tokens: T } = useTheme();
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: T.inkFaint }}>{value} / {max}</span>
          <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>{pct}%</span>
        </div>
      )}
      <div style={{ height, borderRadius: height / 2, background: T.border, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: height / 2, background: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

export function Pill({ children, accent, small, onClick }: { children: React.ReactNode; accent?: boolean; small?: boolean; onClick?: () => void }) {
  const { tokens: T } = useTheme();
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", padding: small ? "2px 8px" : "4px 12px", borderRadius: 100,
      fontSize: small ? 10 : 11, fontWeight: 500, fontFamily: "var(--font-dm-sans), sans-serif",
      background: accent ? T.accentFaint : T.bgCardAlt, color: accent ? T.accent : T.inkMid,
      border: `1px solid ${accent ? T.accentLight + "40" : T.border}`,
      cursor: onClick ? "pointer" : "default", letterSpacing: "0.02em",
    }}>{children}</span>
  );
}

export function SectionLabel({ children, action, onAction }: { children: React.ReactNode; action?: string; onAction?: () => void }) {
  const { tokens: T } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, display: "inline-block" }} />
        <span style={{ fontFamily: "var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 14, color: T.ink, letterSpacing: "0.02em" }}>{children}</span>
      </div>
      {action && <button onClick={onAction} style={{ fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500 }}>{action} →</button>}
    </div>
  );
}
