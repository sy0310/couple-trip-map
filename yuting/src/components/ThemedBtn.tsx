"use client";

import { useTheme } from "./ThemeProvider";

interface ThemedBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  full?: boolean;
  disabled?: boolean;
  small?: boolean;
}

export function ThemedBtn({ children, onClick, variant = "primary", full, disabled, small }: ThemedBtnProps) {
  const { tokens: T } = useTheme();
  const isPrimary = variant === "primary";

  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: full ? "100%" : "auto",
      padding: small ? "7px 16px" : "11px 20px", borderRadius: 10,
      border: variant === "outline" ? `1.5px solid ${T.border}` : "none",
      background: isPrimary ? T.accent : variant === "ghost" ? "transparent" : T.bgCardAlt,
      color: isPrimary ? "white" : variant === "ghost" ? T.accent : T.inkMid,
      fontSize: small ? 12 : 14, fontWeight: 600,
      fontFamily: "var(--font-dm-sans), sans-serif",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      letterSpacing: "0.02em", transition: "opacity 0.15s, transform 0.1s",
    }}>{children}</button>
  );
}

interface ThemedInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

export function ThemedInput({ label, value, onChange, placeholder, type = "text" }: ThemedInputProps) {
  const { tokens: T } = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 11, color: T.inkMid, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5, fontFamily: "var(--font-dm-sans), sans-serif" }}>{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: `1.5px solid ${T.border}`, background: T.bgCardAlt,
        color: T.ink, fontSize: 14, fontFamily: "var(--font-dm-sans), sans-serif",
        outline: "none", transition: "border-color 0.2s",
      }} />
    </div>
  );
}

interface ThemedTextareaProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function ThemedTextarea({ label, value, onChange, placeholder, rows = 3 }: ThemedTextareaProps) {
  const { tokens: T } = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 11, color: T.inkMid, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5, fontFamily: "var(--font-dm-sans), sans-serif" }}>{label}</label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: `1.5px solid ${T.border}`, background: T.bgCardAlt,
        color: T.ink, fontSize: 13, lineHeight: 1.6,
        fontFamily: "var(--font-dm-sans), sans-serif", outline: "none", resize: "none",
      }} />
    </div>
  );
}
