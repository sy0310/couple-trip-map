"use client";

import { useTheme } from "./ThemeProvider";

const GRAIN_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function GrainOverlay() {
  const { tokens } = useTheme();
  if (!tokens.grain) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{
        zIndex: 200,
        opacity: 0.04,
        backgroundImage: `url(${GRAIN_SVG})`,
      }}
    />
  );
}
