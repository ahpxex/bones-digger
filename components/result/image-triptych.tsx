import type { BoundingBox, FeatureRegion } from "@/lib/types";

export function ImageTriptych({
  original,
  segmented,
  heatmap,
  subjectBox,
  featureRegions,
}: {
  original: string;
  segmented?: string;
  heatmap?: string;
  subjectBox?: BoundingBox;
  featureRegions?: FeatureRegion[];
}) {
  const hasRegions = Array.isArray(featureRegions) && featureRegions.length > 0;
  const hasSubject = Boolean(subjectBox);
  const panels = [
    { label: "原片", src: original, note: "Original", kind: "plain" as const },
    {
      label: "分割",
      src: segmented ?? original,
      note: "SAM 3.1 · subject",
      kind: "subject" as const,
    },
    {
      label: "热力",
      src: heatmap ?? segmented ?? original,
      note: hasRegions ? "VLM attention · regions" : "Attention",
      kind: "heatmap" as const,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {panels.map((panel) => (
        <figure
          key={panel.label}
          className="relative cer-hairline bg-paper-warm/40 overflow-hidden"
        >
          <div className="aspect-[3/4] relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={panel.src}
              alt={panel.label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {panel.kind === "subject" && hasSubject && (
              <SubjectOverlay box={subjectBox!} />
            )}
            {panel.kind === "heatmap" && (
              <HeatmapOverlay
                subject={subjectBox}
                regions={featureRegions ?? []}
              />
            )}
          </div>
          <figcaption className="flex items-center justify-between border-t border-bronze/40 bg-paper px-3 py-2">
            <span className="font-serif text-[13px] tracking-[0.22em] text-ink">
              {panel.label}
            </span>
            <span className="font-sans text-[10px] tracking-[0.22em] text-ink-muted uppercase">
              {panel.note}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function pct(v: number): string {
  return `${(Math.max(0, Math.min(1, v)) * 100).toFixed(2)}%`;
}

function SubjectOverlay({ box }: { box: BoundingBox }) {
  return (
    <>
      <div
        className="absolute border border-bronze/80 mix-blend-normal"
        style={{
          left: pct(box.x),
          top: pct(box.y),
          width: pct(box.w),
          height: pct(box.h),
          boxShadow: "0 0 0 1px rgba(245,241,232,0.65)",
        }}
      />
      <div
        className="absolute bg-paper/85 text-[10px] tracking-[0.22em] text-ink font-mono px-1.5 py-[2px]"
        style={{
          left: pct(box.x),
          top: `calc(${pct(box.y)} - 20px)`,
        }}
      >
        SAM · subject
      </div>
    </>
  );
}

function HeatmapOverlay({
  subject,
  regions,
}: {
  subject?: BoundingBox;
  regions: FeatureRegion[];
}) {
  if (regions.length === 0 && !subject) {
    return (
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "radial-gradient(circle at 55% 45%, rgba(183, 46, 54, 0.55) 0%, rgba(227, 118, 60, 0.35) 25%, rgba(184, 151, 102, 0.2) 55%, transparent 75%)",
        }}
      />
    );
  }
  const sortedRegions = [...regions].sort((a, b) => b.weight - a.weight);
  return (
    <>
      {subject && (
        <div
          className="absolute"
          style={{
            left: pct(subject.x),
            top: pct(subject.y),
            width: pct(subject.w),
            height: pct(subject.h),
            background:
              "radial-gradient(ellipse at center, rgba(157,43,51,0.32) 0%, rgba(157,43,51,0.12) 55%, transparent 85%)",
            mixBlendMode: "multiply",
          }}
        />
      )}
      {sortedRegions.map((r, i) => {
        const intensity = 0.35 + 0.55 * r.weight;
        return (
          <div key={`${r.label}-${i}`}>
            <div
              className="absolute"
              style={{
                left: pct(r.x),
                top: pct(r.y),
                width: pct(r.w),
                height: pct(r.h),
                background: `radial-gradient(circle at center, rgba(220, 68, 58, ${intensity}) 0%, rgba(220, 68, 58, ${intensity * 0.55}) 45%, transparent 78%)`,
                mixBlendMode: "screen",
                filter: "blur(2px)",
              }}
            />
            <div
              className="absolute border border-vermilion/80"
              style={{
                left: pct(r.x),
                top: pct(r.y),
                width: pct(r.w),
                height: pct(r.h),
                boxShadow: "0 0 0 1px rgba(245,241,232,0.7)",
              }}
            />
            {i < 3 && (
              <div
                className="absolute font-mono text-[9px] tracking-[0.2em] bg-vermilion text-paper px-1.5 py-[1px]"
                style={{
                  left: pct(r.x),
                  top: `calc(${pct(r.y + r.h)} + 2px)`,
                  maxWidth: "60%",
                }}
              >
                {i + 1}. {r.label}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
