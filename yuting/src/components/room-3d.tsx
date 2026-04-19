'use client';

import { useState } from 'react';
import { TOTAL_PROVINCES } from '@/lib/provinces';
import { WoodMap } from '@/components/wood-map';

interface Room3DProps {
  children?: React.ReactNode;
  onProvinceClick?: (name: string) => void;
  onCityClick?: (cityName: string) => void;
  onDiaryClick?: () => void;
  onAlbumClick?: () => void;
  onProfileClick?: () => void;
  visitedProvinces?: string[];
  visitedCities?: { name: string; province: string; lat: number; lng: number; photoCount: number; coverUrl?: string }[];
  visitedCount?: number;
  completionRate?: string;
  totalProvinces?: number;
}

export function Room3D({
  children,
  onProvinceClick,
  onCityClick,
  onDiaryClick,
  onAlbumClick,
  onProfileClick,
  visitedProvinces = [],
  visitedCities = [],
  visitedCount = 0,
  completionRate = '0.0',
  totalProvinces = TOTAL_PROVINCES,
}: Room3DProps) {
  const [hoveredMap, setHoveredMap] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* ═══════════════ TOP APP BAR ═══════════════ */}
      <header className="relative w-full pt-4 pb-2 px-6 flex justify-between items-center z-40">
        <button
          className="p-2 rounded-full hover:bg-surface-tint/10 transition-opacity opacity-80 hover:opacity-100 active:scale-95"
          onClick={onProfileClick}
          aria-label="菜单"
        >
          <span className="text-xl" style={{ color: '#3e2a24' }}>☰</span>
        </button>
        <div
          className="px-4 py-1 rounded-sm wood-walnut"
          style={{
            color: '#ffdea5',
            borderBottom: '2px solid #1f120c',
          }}
        >
          <h1
            className="font-headline text-lg italic m-0"
            style={{ fontFamily: "'Newsreader', serif" }}
          >
            遇亭
          </h1>
        </div>
        <button
          className="p-2 rounded-full hover:bg-surface-tint/10 transition-opacity opacity-80 hover:opacity-100 active:scale-95"
          aria-label="设置"
        >
          <span className="text-xl" style={{ color: '#3e2a24' }}>⚙</span>
        </button>
      </header>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="flex-grow relative px-4 pb-28 flex flex-col gap-6 mt-4">
        {/* ── RELIEF MAP ── */}
        <div
          className="relative w-full rounded-lg overflow-hidden wood-pine wood-recess border-2 border-[#b5865a] shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
        >
          <div className="relative w-full" style={{ aspectRatio: '4/3', minHeight: 200 }}>
            <WoodMap
              visitedProvinces={visitedProvinces}
              visitedCities={visitedCities}
              onProvinceClick={onProvinceClick}
              onCityClick={onCityClick}
            />
          </div>

          {/* Visit counter badge */}
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-sm"
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 15,
            }}
          >
            <span className="text-xs" style={{ color: 'rgba(255,222,165,0.9)', fontWeight: 500, letterSpacing: '0.05em' }}>
              已走过 {visitedCount}/{totalProvinces}
            </span>
          </div>
        </div>

        {/* ── RECENT MOMENTS (Photo Frames) ── */}
        <div className="flex gap-3 w-full">
          {/* Left frame */}
          <div
            className="relative flex-1 rounded-sm p-1.5 cursor-pointer wood-walnut border border-[#1f120c]"
            style={{
              boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
              transform: 'rotate(-2deg)',
              transition: 'transform 0.3s ease',
            }}
            onClick={onProfileClick}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(-2deg)')}
          >
            <div
              className="w-full overflow-hidden shadow-inner"
              style={{
                aspectRatio: '4/3',
                background: 'linear-gradient(180deg, #87CEEB 0%, #DEB887 50%, #8B7355 100%)',
              }}
            >
              {/* Placeholder — real photo when loaded */}
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs" style={{ color: 'rgba(255,222,165,0.5)' }}>👤</span>
              </div>
            </div>
            <div
              className="absolute bottom-1 right-2 px-1 py-0.5 text-[8px]"
              style={{
                background: 'rgba(255,248,243,0.9)',
                color: '#221a0f',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontFamily: "var(--font-manrope)",
              }}
            >
              我们的故事
            </div>
          </div>

          {/* Right frame */}
          <div
            className="relative flex-1 rounded-sm p-1.5 cursor-pointer wood-walnut border border-[#1f120c] mt-4"
            style={{
              boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
              transform: 'rotate(3deg)',
              transition: 'transform 0.3s ease',
            }}
            onClick={onAlbumClick}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(3deg)')}
          >
            <div
              className="w-full overflow-hidden shadow-inner"
              style={{
                aspectRatio: '4/3',
                background: 'linear-gradient(180deg, #4682B4 0%, #87CEEB 40%, #F5DEB3 70%, #DEB887 100%)',
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs" style={{ color: 'rgba(255,222,165,0.5)' }}>📷</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DESK SURFACE (perspective blur) ── */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[300px] pointer-events-none -z-10 rounded-[50%]"
          style={{
            background: 'linear-gradient(0deg, #2a1b14, #4a3227)',
            filter: 'blur(40px)',
            opacity: 0.6,
            transform: 'translateX(-50%) scaleY(0.5)',
            bottom: -80,
          }}
        />

        {/* ── DIARY / JOURNAL ── */}
        <div
          className="w-full rounded-sm p-6 relative"
          style={{
            background: '#ffffff',
            boxShadow: '0 25px 50px rgba(20, 10, 5, 0.6)',
            borderLeft: '8px solid #352118',
            transform: 'rotate(1deg)',
            transition: 'transform 0.5s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(1deg)')}
        >
          {/* Parchment texture overlay */}
          <div className="absolute inset-0 rounded-sm pointer-events-none parchment-texture" />

          {/* Page dots */}
          <div className="absolute top-3 right-3 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(135,115,105,0.2)' }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(135,115,105,0.2)' }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(135,115,105,0.2)' }} />
          </div>

          {/* Title section */}
          <div className="mb-6 pb-3" style={{ borderBottom: '1px solid rgba(218,194,182,0.3)' }}>
            <h2
              className="font-headline text-2xl tracking-tight mb-1"
              style={{ fontFamily: "'Newsreader', serif", color: '#221a0f' }}
            >
              旅行手帐
            </h2>
            <p
              className="font-body text-sm leading-relaxed"
              style={{ fontFamily: "'Manrope', sans-serif", color: '#54433a' }}
            >
              {visitedCount > 0
                ? `已走过 ${visitedCount} 个省份，${completionRate}% 的完成度...`
                : '还没有旅行记录，开始记录你们的旅途吧...'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              className="w-full flex items-center justify-between py-3 px-5 rounded active:scale-[0.98] transition-transform duration-300"
              style={{
                background: 'linear-gradient(135deg, #563a31, #705147)',
                color: '#ffffff',
                boxShadow: 'inset 0 1px 0 rgba(255,222,165,0.4), 0 2px 4px rgba(0,0,0,0.3)',
                fontFamily: "var(--font-newsreader)",
                fontSize: '16px',
                fontStyle: 'italic',
              }}
              onClick={onDiaryClick}
            >
              <span>记录新回忆</span>
              <span className="text-lg">→</span>
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded transition-colors border"
              style={{
                background: '#f5e6d3',
                color: '#54433a',
                borderColor: 'rgba(218,194,182,0.2)',
                fontFamily: "var(--font-manrope)",
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
              onClick={onDiaryClick}
            >
              <span className="text-sm">◷</span>
              <span>浏览档案</span>
            </button>
          </div>
        </div>
      </main>

      {children}
    </div>
  );
}
