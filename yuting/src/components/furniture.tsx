'use client';

import { TextureOverlay, WoodAccent } from '@/components/texture';

interface RoomPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * A wooden wall panel — used as the "furniture" container for each feature.
 * Looks like a wooden plank mounted on a wall, with physical thickness and grain.
 */
export function RoomPanel({ children, title, className = '' }: RoomPanelProps) {
  return (
    <div className={`card relative overflow-hidden ${className}`}>
      <TextureOverlay variant="wood" opacity={0.02} />
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
