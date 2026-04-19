import { cn } from "@/lib/utils";

export function SectionTitle({
  children,
  subtitle,
  numeral,
  className,
}: {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  numeral?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-6", className)}>
      <div className="flex-1">
        {numeral && (
          <div className="mb-2 font-serif text-[13px] tracking-[0.3em] text-vermilion">
            {numeral}
          </div>
        )}
        <h2 className="cer-heading-underline inline-block font-serif text-2xl font-semibold tracking-[0.12em] text-ink">
          {children}
        </h2>
      </div>
      {subtitle && (
        <div className="hidden md:block text-right font-sans text-[12px] tracking-[0.22em] text-ink-muted max-w-[40%]">
          {subtitle}
        </div>
      )}
    </div>
  );
}
