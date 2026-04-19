import { cn } from "@/lib/utils";

export function Seal({
  children,
  size = "md",
  rotate = -2,
  animate = false,
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  rotate?: number;
  animate?: boolean;
  className?: string;
}) {
  const dim = {
    sm: "h-20 w-20 text-[18px]",
    md: "h-28 w-28 text-[22px]",
    lg: "h-40 w-40 text-[32px]",
    xl: "h-56 w-56 text-[44px]",
  }[size];

  return (
    <div
      className={cn(
        "cer-seal cer-seal-distressed inline-flex items-center justify-center text-center leading-none font-serif",
        animate && "cer-seal-animate",
        dim,
        className,
      )}
      style={{
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <span>{children}</span>
    </div>
  );
}

export function VerdictSeal({
  species,
  position,
  confidence,
  animate = true,
}: {
  species: string;
  position: string;
  confidence: number;
  animate?: boolean;
}) {
  return (
    <div
      className={cn(
        "cer-seal cer-seal-distressed relative w-[240px] h-[240px] p-6 flex flex-col items-center justify-center gap-3 font-serif text-center",
        animate && "cer-seal-animate",
      )}
      style={{ transform: "rotate(-3deg)" }}
    >
      <div className="text-[44px] font-bold leading-none tracking-[0.12em]">
        {species}
      </div>
      <div className="w-16 h-px bg-paper/70" />
      <div className="text-[22px] tracking-[0.2em] leading-none">
        {position}
      </div>
      <div className="text-[11px] tracking-[0.3em] uppercase opacity-85 mt-1">
        confidence
      </div>
      <div className="font-mono text-[28px] tabular-nums leading-none">
        {(confidence * 100).toFixed(1)}%
      </div>
    </div>
  );
}
