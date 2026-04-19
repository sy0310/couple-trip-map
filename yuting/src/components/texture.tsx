import { CSSProperties } from 'react';

/**
 * A texture overlay using SVG feTurbulence noise.
 * Creates organic, tactile texture on any surface.
 */
export function TextureOverlay({
  variant = 'wood',
  opacity = 0.04,
}: {
  variant?: 'wood' | 'grain';
  opacity?: number;
}) {
  const svgData = (function () {
    if (variant === 'wood') {
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04 0.4' numOctaves='6' seed='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;
    }
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='15' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;
  })();

  const style: CSSProperties = {
    content: "''",
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
    opacity,
    backgroundImage: `url("${svgData}")`,
    backgroundSize: variant === 'wood' ? '200px 200px' : '100px 100px',
    backgroundRepeat: 'repeat',
    mixBlendMode: 'multiply',
  };

  return <div style={style} />;
}

/**
 * A wood-grain top accent bar — simulates the edge of a wooden plank.
 */
export function WoodAccent({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute top-0 left-0 right-0 h-[3px] ${className}`}
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, #C9A882 15%, #A68B6B 50%, #C9A882 85%, transparent 100%)',
        opacity: 0.5,
      }}
    />
  );
}
