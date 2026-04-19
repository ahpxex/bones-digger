import {
  KNOWLEDGE_CARDS,
  cardFor,
  speciesLatin,
  positionLatin,
} from "@/lib/knowledge/bones";
import type {
  AnalysisDimension,
  AnalysisResult,
  EvidenceItem,
  RankingEntry,
  Species,
} from "@/lib/types";
import type { AnalyzeInput, Provider } from "./provider";

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPECIES_PICKS: Species[] = ["马", "黄牛", "鹿", "羊", "猪", "狗"];

export const mockProvider: Provider = {
  name: "mock",
  async analyze(input: AnalyzeInput) {
    const rand = mulberry32(seedFromString(input.id));
    const top = SPECIES_PICKS[Math.floor(rand() * SPECIES_PICKS.length)]!;
    const candidatesForTop = KNOWLEDGE_CARDS.filter(
      (c) => c.species === top,
    );
    const pickedCard =
      candidatesForTop[Math.floor(rand() * candidatesForTop.length)];
    if (!pickedCard) {
      throw new Error("No knowledge card found for mock verdict");
    }

    const position = pickedCard.position;
    const topConfidence = 0.72 + rand() * 0.22;
    const remaining = 1 - topConfidence;
    const competitors: Species[] = SPECIES_PICKS.filter((s) => s !== top);
    const splits = [0.55, 0.25, 0.12, 0.05, 0.03];
    const ranking: RankingEntry[] = [
      { species: top, position, confidence: topConfidence },
    ];
    competitors.slice(0, 4).forEach((s, i) => {
      ranking.push({
        species: s,
        position,
        confidence: remaining * (splits[i] ?? 0.02),
      });
    });

    const dimensions: Record<AnalysisDimension, number> = {
      整体形态: 0.6 + rand() * 0.35,
      关键结构: 0.7 + rand() * 0.28,
      截面断面: 0.55 + rand() * 0.35,
      表面纹理: 0.5 + rand() * 0.35,
      表面痕迹: 0.45 + rand() * 0.35,
      尺寸比例: 0.6 + rand() * 0.32,
    };

    const evidence: EvidenceItem[] = pickedCard.features
      .slice(0, 4)
      .map((feature, idx) => ({
        id: `ev-${idx + 1}`,
        key: feature.split("：")[0]!.split(/[，,；。]/)[0]!,
        observation: `图像观察：${feature.replace(/^[^：]*：/, "")}`,
        referenceFeature: feature,
        sourceSpecies: top,
        sourcePosition: position,
        weight: 0.35 - idx * 0.07,
      }));

    const related = [
      cardFor(top, position),
      ...KNOWLEDGE_CARDS.filter(
        (c) => c.position === position && c.species !== top,
      ).slice(0, 2),
    ].filter(Boolean) as typeof KNOWLEDGE_CARDS;

    const reasoning = [
      `【分割】SAM 3.1 在输入图像中识别出骨骼主体，去除周围泥土与比例尺干扰。`,
      `【形态观察】主体轮廓与 ${top}${position} 的标准形态相符：${pickedCard.features[0]}。`,
      `【关键结构】进一步识别到：${pickedCard.features.slice(1, 3).join("；")}。`,
      `【交叉验证】RAG 检索到 ${related.length} 条相关专家条目，${top}${position} 的匹配度最高。`,
      `【判定】综合以上观察，判定为 ${top}${position}，置信度 ${(topConfidence * 100).toFixed(1)}%。`,
    ].join("\n\n");

    const latinSpecies = speciesLatin(top);
    const latinPosition = positionLatin(position);

    return {
      verdict: {
        species: top,
        speciesLatin: latinSpecies,
        position,
        positionLatin: latinPosition,
        confidence: topConfidence,
        ranking: ranking.sort((a, b) => b.confidence - a.confidence),
      },
      dimensions,
      evidence,
      reasoning,
      knowledgeCards: related,
      heatmapPath: undefined,
    } satisfies Omit<
      AnalysisResult,
      "id" | "imagePath" | "segmentedPath" | "timestamp" | "provider" | "processingMs"
    >;
  },
};
