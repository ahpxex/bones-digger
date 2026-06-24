import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { formatTimestamp } from "@/lib/utils";
import type { AnalysisSummary } from "@/lib/types";

/**
 * Per-card phase in the sequential "forensic scan" reveal.
 *  pending  → not yet unlocked by the cascade (queued)
 *  loading  → image fetch in flight
 *  scanning → image arrived; animated "检测中" before the verdict materialises
 *  done     → result info (species · timestamp · confidence) is revealed
 */
type Phase = "pending" | "loading" | "scanning" | "done";

/** How long the scanning animation runs before the result locks in. */
const SCAN_MS = 1150;

export function RevealCard({
  item,
  index,
  activated,
  onImageReady,
  onDelete,
}: {
  item: AnalysisSummary;
  index: number;
  activated: boolean;
  onImageReady: () => void;
  onDelete: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const advancedRef = useRef(false);

  const phase: Phase = !activated
    ? "pending"
    : errored
      ? "done"
      : !loaded
        ? "loading"
        : !scanDone
          ? "scanning"
          : "done";

  // When the image arrives, run the scan timer; only once the scan completes
  // (phase → done) do we unlock the next card in the cascade. Gating on
  // "done" rather than "loaded" keeps the reveal sequential even when images
  // arrive near-instantly from a warm cache.
  useEffect(() => {
    if (loaded && !advancedRef.current) {
      advancedRef.current = true;
      const t = window.setTimeout(() => setScanDone(true), SCAN_MS);
      return () => window.clearTimeout(t);
    }
  }, [loaded]);

  // Notify parent to unlock the next card once this one is fully revealed.
  useEffect(() => {
    if (scanDone) onImageReady();
  }, [scanDone, onImageReady]);

  // If activation is flipped on but the image is already cached, onLoad may
  // have fired before we wired the handler — catch that via complete check.
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (activated && imgRef.current?.complete && !loaded) {
      setLoaded(true);
    }
  }, [activated, loaded]);

  const busy = phase === "loading" || phase === "scanning";

  return (
    <article
      data-phase={phase}
      className="cer-paper cer-corners cer-glow-hover relative flex flex-col gap-4 overflow-hidden p-5"
      style={{
        opacity: phase === "pending" ? 0.55 : 1,
        transition: "opacity 600ms ease",
      }}
    >
      <Link
        to="/analyze/$id"
        params={{ id: item.id }}
        className="group flex flex-col gap-4"
      >
        {/* ===== image stage ===== */}
        <div className="relative aspect-[4/3] overflow-hidden bg-indigo-deep/80 cer-hairline">
          {/* the actual image — mounted only once unlocked so the fetch is gated */}
          {activated && (
            <img
              ref={imgRef}
              src={item.imagePath}
              alt={`${item.species}·${item.position}`}
              onLoad={() => setLoaded(true)}
              onError={() => {
                setErrored(true);
                setScanDone(true);
              }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
              style={{
                opacity: loaded && !busy ? 1 : loaded ? 0.45 : 0,
                filter:
                  phase === "scanning"
                    ? "saturate(0.5) contrast(1.08) brightness(0.85)"
                    : "none",
                transition: "opacity 500ms ease, filter 500ms ease",
              }}
            />
          )}

          {/* pending / loading skeleton shimmer */}
          {!loaded && (
            <div className="absolute inset-0 cer-scan-skeleton">
              <div className="cer-scan-shimmer" />
            </div>
          )}

          {/* HUD overlay while loading/scanning */}
          {busy && <ScanHud index={index} scanning={phase === "scanning"} />}

          {/* locked-in badge once done */}
          {phase === "done" && (
            <div className="cer-scan-locked">
              <span className="cer-scan-lock-pulse" />
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          )}
        </div>

        {/* ===== result rail ===== */}
        <div className="relative min-h-[58px]">
          {phase !== "done" ? (
            <DetectingRail phase={phase} />
          ) : (
            <div key="result" className="cer-scan-result-in flex items-baseline justify-between">
              <div>
                <div className="font-serif text-xl font-semibold tracking-[0.12em] text-ink group-hover:text-vermilion transition-colors">
                  {item.species}·{item.position}
                </div>
                <div className="mt-1 font-mono text-[12px] tracking-[0.12em] text-ink-muted">
                  {formatTimestamp(item.timestamp)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-[10px] tracking-[0.24em] text-bronze-dark">
                  confidence
                </div>
                <div className="font-mono text-[18px] text-vermilion tabular-nums">
                  {(item.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* footer — id + delete */}
      <div className="flex items-center justify-between border-t border-bronze/30 pt-3 text-[11px] tracking-[0.2em] text-ink-muted">
        <span className="font-mono">{item.id}</span>
        <button
          type="button"
          onClick={onDelete}
          className="text-ink-muted transition-colors hover:text-vermilion"
        >
          删除
        </button>
      </div>
    </article>
  );
}

/** Corner brackets, scan sweep line and index glyph — the "forensic HUD". */
function ScanHud({ index, scanning }: { index: number; scanning: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* corner brackets */}
      <span className="cer-scan-corner left-1.5 top-1.5 border-l border-t" />
      <span className="cer-scan-corner right-1.5 top-1.5 border-r border-t" />
      <span className="cer-scan-corner bottom-1.5 left-1.5 border-b border-l" />
      <span className="cer-scan-corner bottom-1.5 right-1.5 border-b border-r" />

      {/* moving scan sweep — only once we have pixels to scan */}
      {scanning && <span className="cer-scan-sweep" />}

      {/* index tag */}
      <div className="absolute left-2 top-2 font-mono text-[9px] tracking-[0.2em] text-bronze-light/90">
        SPEC #{String(index + 1).padStart(2, "0")}
      </div>
    </div>
  );
}

/** The "检测中 · · ·" rail shown below the image before the verdict locks in. */
function DetectingRail({ phase }: { phase: Phase }) {
  const label =
    phase === "pending"
      ? "待命"
      : phase === "loading"
        ? "调取影像"
        : "特征比对";
  const tag =
    phase === "pending"
      ? "STANDBY"
      : phase === "loading"
        ? "FETCHING"
        : "ANALYZING";
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] tracking-[0.22em] text-bronze-dark uppercase">
          {tag}
        </span>
        <span className="font-serif text-[12px] tracking-[0.16em] text-ink-muted">
          {label}
        </span>
        <span className="cer-scan-dots">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </span>
      </div>
      {/* progress bar only ticks while scanning; loading relies on the skeleton shimmer */}
      {phase === "scanning" ? (
        <div className="cer-scan-progress">
          <span
            className="cer-scan-progress-bar"
            style={{ animationDuration: `${SCAN_MS}ms` }}
          />
        </div>
      ) : (
        <div className="cer-scan-progress opacity-30">
          <span className="cer-scan-progress-bar" style={{ transform: "scaleX(0)", animation: "none" }} />
        </div>
      )}
    </div>
  );
}
