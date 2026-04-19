import { KNOWLEDGE_CARDS } from "@/lib/knowledge/bones";
import type { KnowledgeCard } from "@/lib/types";

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[\p{P}\s]+/gu, " ")
    .split(" ")
    .filter((t) => t.length > 0);
}

function bigrams(s: string): Set<string> {
  const chars = Array.from(s.replace(/\s+/g, ""));
  const out = new Set<string>();
  for (let i = 0; i < chars.length - 1; i++) {
    out.add(`${chars[i]}${chars[i + 1]}`);
  }
  return out;
}

function score(query: string, card: KnowledgeCard): number {
  const docText = `${card.species} ${card.position} ${card.features.join(" ")}`;
  const q = tokenize(query).join(" ");
  const qg = bigrams(q);
  const dg = bigrams(docText);
  let hit = 0;
  for (const g of qg) {
    if (dg.has(g)) hit += 1;
  }
  const lenPenalty = Math.log(docText.length + 2);
  return hit / lenPenalty;
}

export function retrieveKnowledge(
  query: string,
  topK = 8,
): KnowledgeCard[] {
  const scored = KNOWLEDGE_CARDS.map((card) => ({
    card,
    s: score(query, card),
  }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (scored.length === 0) {
    return KNOWLEDGE_CARDS.slice(0, topK);
  }
  return scored.slice(0, topK).map((x) => x.card);
}
