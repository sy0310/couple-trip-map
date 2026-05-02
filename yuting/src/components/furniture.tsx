"use client";

function WoodAccent() {
  return (
    <div
      className="absolute top-0 left-6 right-6"
      style={{ height: 3, background: "linear-gradient(180deg, rgba(255,222,165,0.25), transparent)" }}
    />
  );
}

function TextureOverlay({ opacity = 0.02 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity,
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.01 0.2\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
      }}
    />
  );
}

interface RoomPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function RoomPanel({ children, title, className = "" }: RoomPanelProps) {
  return (
    <div className={`card relative overflow-hidden ${className}`}>
      <TextureOverlay />
      <WoodAccent />
      {/* Bottom edge reflection line — simulates light catching the plank bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E4D5C0] to-transparent opacity-30" />
      {title && (
        <div className="relative z-10 mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-[#E4D5C0] to-transparent" />
          <h2 className="text-sm font-medium tracking-widest uppercase text-[#9A8B7A]">{title}</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-[#E4D5C0] to-transparent" />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
