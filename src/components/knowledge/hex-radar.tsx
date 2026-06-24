/**
 * Inline-SVG hexagonal radar — no chart library.
 *
 * Visualises the relative "richness" of a breed's six archive dimensions
 * (number of documented facts per axis). Each vertex is labelled with the
 * dimension name and is hover/focus/click-aware; the parent owns the active
 * index so a linked detail panel can react.
 */
import { useId } from "react";

export interface RadarLabel {
  zh: string;
  en?: string;
}

export function HexRadar({
  values,
  labels,
  size = 360,
  max,
  activeIndex,
  onChange,
  className = "",
}: {
  values: number[];
  labels: RadarLabel[];
  size?: number;
  /** Upper bound for the axes; defaults to the largest value (min 1). */
  max?: number;
  activeIndex: number;
  onChange: (i: number) => void;
  className?: string;
}) {
  const n = values.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.3;
  const ceiling = Math.max(max ?? Math.max(...values, 1), 1);
  const labelR = r + Math.max(14, size * 0.045);
  const gid = useId().replace(/:/g, "");

  const angle = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const point = (i: number, radius: number) => {
    const a = angle(i);
    return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as const;
  };
  const labelPoint = (i: number) => {
    const a = angle(i);
    return [cx + Math.cos(a) * labelR, cy + Math.sin(a) * labelR] as const;
  };
  const anchorFor = (i: number) => {
    const cos = Math.cos(angle(i));
    if (Math.abs(cos) < 0.3) return "middle" as const;
    return cos > 0 ? ("start" as const) : ("end" as const);
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
      role="img"
      aria-label="六维档案雷达图"
    >
      <defs>
        <radialGradient id={`${gid}-fill`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(157,43,51,0.30)" />
          <stop offset="80%" stopColor="rgba(157,43,51,0.14)" />
          <stop offset="100%" stopColor="rgba(157,43,51,0.06)" />
        </radialGradient>
        <linearGradient id={`${gid}-spoke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(157,43,51,0.15)" />
          <stop offset="100%" stopColor="rgba(184,53,64,0.95)" />
        </linearGradient>
        <radialGradient id={`${gid}-vertex-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(184,53,64,0.55)" />
          <stop offset="100%" stopColor="rgba(184,53,64,0)" />
        </radialGradient>
      </defs>

      {/* outer slow-rotating dashed ring — decorative */}
      <g
        style={{
          transformOrigin: "center",
          animation: "cer-radar-spin 80s linear infinite",
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill="none"
          stroke="rgba(184,151,102,0.4)"
          strokeWidth={1}
          strokeDasharray="2 7"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r + 16}
          fill="none"
          stroke="rgba(184,151,102,0.18)"
          strokeWidth={1}
          strokeDasharray="1 11"
        />
      </g>

      {/* concentric hex rings */}
      {rings.map((s) => (
        <path
          key={s}
          d={ringPath(s)}
          fill={s === 1 ? "rgba(184,151,102,0.04)" : "none"}
          stroke="rgba(184,151,102,0.3)"
          strokeWidth={1}
        />
      ))}

      {/* spokes — active one is highlighted */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = point(i, r);
        const on = i === activeIndex;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={on ? `url(#${gid}-spoke)` : "rgba(184,151,102,0.3)"}
            strokeWidth={on ? 2 : 1}
            strokeLinecap="round"
            style={{ transition: "stroke 200ms ease, stroke-width 200ms ease" }}
          />
        );
      })}

      {/* value polygon (grows from centre on mount) */}
      <g className="cer-radar-grow">
        <path
          d={valuePath}
          fill={`url(#${gid}-fill)`}
          stroke="#9d2b33"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </g>

      {/* active "blade" — strong line from centre to that vertex's value */}
      {(() => {
        const i = activeIndex;
        const v = Math.max(0.06, (values[i] ?? 0) / ceiling);
        const [vx, vy] = point(i, r * v);
        return (
          <line
            x1={cx}
            y1={cy}
            x2={vx}
            y2={vy}
            stroke="#9d2b33"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
        );
      })()}

      {/* vertex value dots */}
      {Array.from({ length: n }, (_, i) => {
        const v = Math.max(0.06, (values[i] ?? 0) / ceiling);
        const [x, y] = point(i, r * v);
        const on = i === activeIndex;
        return (
          <g key={i}>
            {on && (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={size * 0.045}
                  fill={`url(#${gid}-vertex-glow)`}
                  className="cer-radar-aura"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill="none"
                  stroke="#b83540"
                  strokeWidth={1.2}
                  className="cer-radar-pulse"
                />
              </>
            )}
            <circle
              cx={x}
              cy={y}
              r={on ? 4.6 : 2.6}
              fill="#9d2b33"
              stroke={on ? "#f5f1e8" : "none"}
              strokeWidth={on ? 1 : 0}
            />
          </g>
        );
      })}

      {/* center medallion */}
      <circle cx={cx} cy={cy} r={6} fill="rgba(245,241,232,0.9)" stroke="rgba(184,151,102,0.6)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={2.2} fill="#9d2b33" />

      {/* labels + hit areas */}
      {Array.from({ length: n }, (_, i) => {
        const [lx, ly] = labelPoint(i);
        const anchor = anchorFor(i);
        const on = i === activeIndex;
        const label = labels[i];
        return (
          <g
            key={i}
            className="cer-radar-vertex"
            data-on={on}
            onMouseEnter={() => onChange(i)}
            onFocus={() => onChange(i)}
            onClick={() => onChange(i)}
            onTouchStart={() => onChange(i)}
            tabIndex={0}
            role="button"
            aria-label={label?.zh}
          >
            {/* hit area — generous, covers vertex + label */}
            <circle cx={lx} cy={ly} r={Math.max(20, size * 0.062)} fill="transparent" />
            {label && (
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontFamily="var(--font-serif)"
                fontSize={on ? size * 0.044 : size * 0.038}
                fontWeight={on ? 600 : 500}
                fill={on ? "#9d2b33" : "#3a3632"}
                letterSpacing="0.1em"
                style={{
                  transition: "font-size 200ms ease, fill 200ms ease, font-weight 200ms ease",
                  cursor: "pointer",
                }}
              >
                {label.zh}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
