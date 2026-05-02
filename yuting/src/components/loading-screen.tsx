"use client";

import { useTheme } from "@/components/ThemeProvider";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

const themeStyles: Record<string, { gradient: string; glow: string; bar: string; text: string; subText: string }> = {
  木色: {
    gradient: "linear-gradient(135deg, #2c160e 0%, #3a1f14 40%, #26120b 100%)",
    glow: "#775a19",
    bar: "linear-gradient(90deg, #775a19, #e9c176, #775a19)",
    text: "#ffdea5",
    subText: "#dac2b6",
  },
  深夜: {
    gradient: "linear-gradient(135deg, #0a0f1a 0%, #141e30 40%, #0d1520 100%)",
    glow: "#3b5998",
    bar: "linear-gradient(90deg, #4a6fa5, #8ab4f8, #4a6fa5)",
    text: "#c8daf8",
    subText: "#8a9bb5",
  },
  春日: {
    gradient: "linear-gradient(135deg, #fce4ec 0%, #f8d0dc 40%, #fef0f4 100%)",
    glow: "#e8a0b4",
    bar: "linear-gradient(90deg, #d4879a, #f0b8c8, #d4879a)",
    text: "#7a3a50",
    subText: "#b08090",
  },
};

export function LoadingScreen({ message = "加载中...", subMessage }: LoadingScreenProps) {
  const { theme } = useTheme();
  const s = themeStyles[theme] || themeStyles["木色"];

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden"
      style={{ background: s.gradient }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "80%",
          height: "80%",
          maxWidth: 400,
          maxHeight: 400,
          background: s.glow,
          opacity: 0.05,
          filter: "blur(120px)",
        }}
      />

      <h2
        className="italic text-xl tracking-wide mb-6 relative z-10"
        style={{
          color: s.text,
          fontFamily: "'Newsreader', serif",
          textShadow: theme === "春日" ? "none" : "0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        {message}
      </h2>

      <div
        className="w-[80%] max-w-[240px] h-3 rounded-full relative overflow-hidden"
        style={{
          background: theme === "春日" ? "rgba(0,0,0,0.06)" : "#1a0f0a",
          boxShadow: theme === "春日"
            ? "inset 0 2px 4px rgba(0,0,0,0.06)"
            : "inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="h-full rounded-full animate-pulse"
          style={{
            width: "60%",
            background: s.bar,
            boxShadow: `0 0 10px ${s.glow}80`,
          }}
        >
          <div className="absolute inset-0 border-t border-white/20 rounded-full" />
        </div>
      </div>

      {subMessage && (
        <p
          className="text-sm mt-3 tracking-wide font-medium relative z-10"
          style={{
            color: s.subText,
            opacity: 0.7,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          {subMessage}
        </p>
      )}
    </div>
  );
}
