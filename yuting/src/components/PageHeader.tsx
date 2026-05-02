"use client";

import { useTheme } from "./ThemeProvider";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightEl?: React.ReactNode;
  transparent?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  rightEl,
  transparent,
}: PageHeaderProps) {
  const { tokens: T } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px 10px",
        background: transparent ? "transparent" : T.bg + "F2",
        backdropFilter: transparent ? "none" : "blur(12px)",
        borderBottom: transparent ? "none" : `1px solid ${T.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            border: `1px solid ${T.border}`,
            background: T.bgCard,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-noto-serif-sc), serif",
          fontWeight: 600, fontSize: 16, color: T.ink,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      {rightEl}
    </div>
  );
}
