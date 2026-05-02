export type ThemeId = "木色" | "深夜" | "春日";

export interface ThemeTokens {
  id: ThemeId;
  bg: string;
  bgCard: string;
  bgCardAlt: string;
  ink: string;
  inkMid: string;
  inkFaint: string;
  accent: string;
  accentLight: string;
  accentFaint: string;
  gold: string;
  goldFaint: string;
  navBg: string;
  navBorder: string;
  navText: string;
  navTextMute: string;
  border: string;
  borderMid: string;
  shadow: string;
  shadowDeep: string;
  grain: boolean;
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  木色: {
    id: "木色",
    bg: "#F5EFE4",
    bgCard: "#FFFCF7",
    bgCardAlt: "#F8F2E8",
    ink: "#2C1F14",
    inkMid: "#6B5438",
    inkFaint: "#A89070",
    accent: "#4A7C59",
    accentLight: "#7AAD8A",
    accentFaint: "#D4EAD8",
    gold: "#C9943A",
    goldFaint: "#F5E4C0",
    navBg: "#2C1F14",
    navBorder: "#C9943A",
    navText: "#F5E4C0",
    navTextMute: "#8A7060",
    border: "rgba(100,70,40,0.12)",
    borderMid: "rgba(100,70,40,0.22)",
    shadow: "0 4px 24px rgba(44,31,20,0.12)",
    shadowDeep: "0 12px 48px rgba(44,31,20,0.2)",
    grain: true,
  },
  深夜: {
    id: "深夜",
    bg: "#0E1117",
    bgCard: "#161B24",
    bgCardAlt: "#1C2230",
    ink: "#EDF2F7",
    inkMid: "#8B9DB8",
    inkFaint: "#4A5A6E",
    accent: "#6FB3F5",
    accentLight: "#A8D4FA",
    accentFaint: "#1A3050",
    gold: "#E8C87A",
    goldFaint: "#2A2015",
    navBg: "#070B10",
    navBorder: "#E8C87A",
    navText: "#E8C87A",
    navTextMute: "#4A5A6E",
    border: "rgba(100,130,160,0.12)",
    borderMid: "rgba(100,130,160,0.22)",
    shadow: "0 4px 24px rgba(0,0,0,0.4)",
    shadowDeep: "0 12px 48px rgba(0,0,0,0.6)",
    grain: false,
  },
  春日: {
    id: "春日",
    bg: "#FDF4F7",
    bgCard: "#FFFAFC",
    bgCardAlt: "#FDF0F5",
    ink: "#2A1520",
    inkMid: "#7A4A60",
    inkFaint: "#B890A4",
    accent: "#C4547A",
    accentLight: "#E890AA",
    accentFaint: "#FAE0EA",
    gold: "#E8904A",
    goldFaint: "#FDEBD8",
    navBg: "#2A1520",
    navBorder: "#E890AA",
    navText: "#FAE0EA",
    navTextMute: "#8A6070",
    border: "rgba(180,80,120,0.1)",
    borderMid: "rgba(180,80,120,0.2)",
    shadow: "0 4px 24px rgba(42,21,32,0.1)",
    shadowDeep: "0 12px 48px rgba(42,21,32,0.18)",
    grain: true,
  },
};

export const THEME_LIST: ThemeId[] = ["木色", "深夜", "春日"];
