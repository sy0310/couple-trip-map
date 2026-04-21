interface SvgCompassProps {
  x: number;
  y: number;
  size?: number;
}

export function SvgCompass({ x, y, size = 50 }: SvgCompassProps) {
  const r = size;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r={r} fill="none" stroke="#c99a6c" strokeWidth={1.5} />
      <circle r={r - 3} fill="none" stroke="#8d6b2a" strokeWidth={0.5} />
      <circle r={r * 0.35} fill="none" stroke="#c99a6c" strokeWidth={0.5} />

      <text y={-r + 12} textAnchor="middle" fontSize={10} fontWeight="700" fill="#c99a6c" style={{ paintOrder: 'stroke', stroke: '#352118', strokeWidth: 2 }}>北</text>
      <text y={r - 6} textAnchor="middle" fontSize={10} fontWeight="600" fill="#8d6b2a">南</text>
      <text x={-r + 10} y={4} textAnchor="middle" fontSize={10} fontWeight="600" fill="#8d6b2a">西</text>
      <text x={r - 10} y={4} textAnchor="middle" fontSize={10} fontWeight="600" fill="#8d6b2a">东</text>

      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const inner = deg % 90 === 0 ? r - 10 : r - 6;
        const x1 = Math.sin(rad) * inner;
        const y1 = -Math.cos(rad) * inner;
        const x2 = Math.sin(rad) * (r - 2);
        const y2 = -Math.cos(rad) * (r - 2);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8d6b2a" strokeWidth={deg % 90 === 0 ? 1 : 0.5} />;
      })}

      <circle r={3} fill="#c41e1e" />
      <circle r={1.5} fill="#e85a5a" />
    </g>
  );
}
