export function ImageTriptych({
  original,
  segmented,
  heatmap,
}: {
  original: string;
  segmented?: string;
  heatmap?: string;
}) {
  const panels = [
    { label: "原片", src: original, note: "Original" },
    {
      label: "分割",
      src: segmented ?? original,
      note: "SAM 3.1 · subject",
    },
    {
      label: "热力",
      src: heatmap ?? segmented ?? original,
      note: "Attention",
      overlay: !heatmap,
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
            {panel.overlay && (
              <div
                className="absolute inset-0 mix-blend-multiply"
                style={{
                  background:
                    "radial-gradient(circle at 55% 45%, rgba(183, 46, 54, 0.55) 0%, rgba(227, 118, 60, 0.35) 25%, rgba(184, 151, 102, 0.2) 55%, transparent 75%)",
                }}
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
