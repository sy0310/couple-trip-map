"use client";

import { useTheme } from "./ThemeProvider";

interface TripCardProps {
  location: string;
  province: string;
  city: string;
  date: string;
  notes?: string;
  mood?: string;
  coverUrl?: string | null;
  photoColors?: string[];
  onClick?: () => void;
  cardRadius?: number;
}

export function TripCard({ location, province, city, date, notes, mood, coverUrl, photoColors = ["#A0A0A0", "#808080"], onClick, cardRadius = 14 }: TripCardProps) {
  const { tokens: T } = useTheme();

  return (
    <div onClick={onClick} style={{
      background: T.bgCard, borderRadius: cardRadius, border: `1px solid ${T.border}`,
      overflow: "hidden", cursor: onClick ? "pointer" : "default",
      boxShadow: T.shadow, transition: "transform 0.2s, box-shadow 0.2s",
    }}>
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
        {coverUrl ? (
          <img src={coverUrl} alt={location} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${photoColors[0]} 0%, ${photoColors[1]} 100%)`, position: "relative", overflow: "hidden" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", bottom: 8, left: 10, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{date}</div>
        {mood && <div style={{ position: "absolute", top: 8, right: 10, fontSize: 16 }}>{mood}</div>}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontFamily: "var(--font-noto-serif-sc), serif", fontWeight: 600, fontSize: 14, color: T.ink, marginBottom: 3 }}>{location}</div>
        <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: notes ? 6 : 0 }}>{province} · {city}</div>
        {notes && (
          <div style={{ fontSize: 11, color: T.inkMid, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontStyle: "italic" }}>{notes}</div>
        )}
      </div>
    </div>
  );
}
