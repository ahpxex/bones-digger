export function ReasoningPanel({ reasoning }: { reasoning: string }) {
  const blocks = reasoning.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="cer-scroll relative px-8 py-10 font-serif text-[15px] leading-[2.1] text-ink">
      <div className="absolute left-4 top-4 bottom-4 w-px bg-vermilion/30" />
      <div className="flex flex-col gap-5 pl-6">
        {blocks.map((block, i) => (
          <p key={i} className="tracking-[0.05em]">
            {block}
          </p>
        ))}
      </div>
    </div>
  );
}
