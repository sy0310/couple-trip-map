'use client';

import { useState } from 'react';

interface SealMarkerProps {
  x: number;
  y: number;
  label?: string;
  size?: number;
  onClick?: () => void;
}

export function SealMarker({ x, y, label, size = 6, onClick }: SealMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const r = hovered ? size + 2 : size;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <circle r={r + 3} fill="none" stroke={hovered ? '#e85a5a' : '#c41e1e'} strokeWidth={hovered ? 2 : 1} opacity={hovered ? 0.6 : 0.3} />
      <circle r={r} fill="#c41e1e" stroke="#a01515" strokeWidth={0.5} style={{ filter: 'url(#seal-shadow)' }} />
      <circle r={r * 0.65} fill="none" stroke="#e85a5a" strokeWidth={0.4} opacity={0.7} />
      {label && (
        <text
          y={hovered ? -r - 6 : -r - 4}
          textAnchor="middle"
          fontSize={hovered ? 10 : 9}
          fontWeight={hovered ? 700 : 600}
          fill="#c41e1e"
          style={{ paintOrder: 'stroke', stroke: '#FAF5EF', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
