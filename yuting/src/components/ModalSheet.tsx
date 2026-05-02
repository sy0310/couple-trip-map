"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function ModalSheet({ open, onClose, title, children }: ModalSheetProps) {
  const { tokens: T } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [open]);

  if (!open && !visible) return null;

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 120,
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
      background: `rgba(0,0,0,${visible ? 0.5 : 0})`,
      transition: "background 0.3s",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bgCard,
        borderRadius: "20px 20px 0 0", maxHeight: "85%", overflow: "hidden",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 12, paddingBottom: 8, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>
        {title && (
          <div style={{
            padding: "0 20px 14px",
            fontFamily: "var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 16,
            color: T.ink, borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          }}>{title}</div>
        )}
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
