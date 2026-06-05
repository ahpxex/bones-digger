import { cn } from "@/lib/utils";

export function Frame({
  children,
  className,
  as: As = "div",
  tone = "paper",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  tone?: "paper" | "scroll" | "bare";
}) {
  const base =
    tone === "paper"
      ? "cer-paper cer-corners"
      : tone === "scroll"
        ? "cer-scroll"
        : "";
  return (
    <As className={cn(base, "relative p-8", className)}>{children}</As>
  );
}

export function Divider({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  if (!label) {
    return <div className={cn("cer-rule my-8", className)} />;
  }
  return (
    <div className={cn("my-8 flex items-center gap-4", className)}>
      <div className="cer-rule flex-1" />
      <span className="font-serif text-[13px] tracking-[0.3em] text-bronze-dark">
        {label}
      </span>
      <div className="cer-rule flex-1" />
    </div>
  );
}
