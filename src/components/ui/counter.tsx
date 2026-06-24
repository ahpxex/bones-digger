import { useEffect, useRef, useState } from "react";

/** Counts up from 0 to `to` when scrolled into view (easeOutCubic). */
export function Counter({
  to,
  durationMs = 1400,
  className = "",
  suffix = "",
}: {
  to: number;
  durationMs?: number;
  className?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVal(to);
      return;
    }
    let raf = 0;
    let startT = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        obs.disconnect();
        const tick = (t: number) => {
          if (!startT) startT = t;
          const p = Math.min(1, (t - startT) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(to * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {val}
      {suffix}
    </span>
  );
}
