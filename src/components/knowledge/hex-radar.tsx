/**
 * Lightweight inline-SVG hexagonal radar — no chart library.
 * Visualises the relative "richness" of a breed's six archive dimensions
 * (number of documented facts per axis). Purely decorative-but-data-driven.
 */
export function HexRadar({
  values,
  size = 132,
  max,
  className = "",
}: {
  values: number[];
  size?: number;
  /** Upper bound for the axes; defaults to the largest value (min 1). */
  max?: number;
  className?: string;
}) {
  const n = values.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const ceiling = Math.max(max ?? Math.max(...values, 1), 1);

  // Angle for axis i, starting at the top (-90°) going clockwise.
  const angle = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const point = (i: number, radius: number) => {
    const a = angle(i);
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const ringPath = (scale: number) =>
    Array.from({ length: n }, (_, i) => {
      const [x, y] = point(i, r * scale);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ") + " Z";

  const valuePath =
    Array.from({ length: n }, (_, i) => {
      const v = Math.max(0.06, (values[i] ?? 0) / ceiling);
      const [x, y] = point(i, r * v);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ") + " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden
    >
      {/* concentric rings */}
      {rings.map((s) => (
        <path
          key={s}
          d={ringPath(s)}
          fill="none"
          stroke="rgba(184,151,102,0.28)"
          strokeWidth={1}
        />
      ))}
      {/* spokes */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = point(i, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(184,151,102,0.28)"
            strokeWidth={1}
          />
        );
      })}
      {/* value polygon (grows from centre) */}
      <g className="cer-radar-grow">
        <path
          d={valuePath}
          fill="rgba(157,43,51,0.18)"
          stroke="#9d2b33"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {Array.from({ length: n }, (_, i) => {
          const v = Math.max(0.06, (values[i] ?? 0) / ceiling);
          const [x, y] = point(i, r * v);
          return <circle key={i} cx={x} cy={y} r={2.4} fill="#9d2b33" />;
        })}
      </g>
    </svg>
  );
}
