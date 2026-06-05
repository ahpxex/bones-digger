import {
  ANALYSIS_SPECIES_LIST,
  KNOWLEDGE_CARDS,
  cardFor,
  speciesLatin,
  positionLatin,
} from "@/lib/knowledge/bones";
import type {
  AnalysisDimension,
  AnalysisResult,
  AnalysisSpecies,
  EvidenceItem,
  FeatureRegion,
  RankingEntry,
  Verdict,
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

const SPECIES_PICKS: AnalysisSpecies[] = [...ANALYSIS_SPECIES_LIST];

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
    const competitors: AnalysisSpecies[] = SPECIES_PICKS.filter((s) => s !== top);
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

    // Plausible subject bbox centered slightly above middle
    const subjectBox = {
      x: 0.18 + rand() * 0.05,
      y: 0.14 + rand() * 0.05,
      w: 0.58 + rand() * 0.08,
      h: 0.66 + rand() * 0.1,
    };

    const evidence: EvidenceItem[] = pickedCard.features
      .slice(0, 4)
      .map((feature, idx) => {
        const localX =
          subjectBox.x + (0.12 + rand() * 0.55) * subjectBox.w;
        const localY =
          subjectBox.y + (0.08 + rand() * 0.75) * subjectBox.h;
        const regionSize = 0.1 + rand() * 0.08;
        return {
          id: `ev-${idx + 1}`,
          key: feature.split("：")[0]!.split(/[，,；。]/)[0]!,
          observation: `图像观察：${feature.replace(/^[^：]*：/, "")}`,
          referenceFeature: feature,
          sourceSpecies: top,
          sourcePosition: position,
          weight: 0.35 - idx * 0.07,
          region: {
            x: Math.max(0, localX - regionSize / 2),
            y: Math.max(0, localY - regionSize / 2),
            w: regionSize,
            h: regionSize,
          },
        };
      });

    const featureRegions: FeatureRegion[] = evidence
      .map((e) => {
        const r = (e as EvidenceItem & { region?: FeatureRegion }).region;
        return r ? { ...r, label: e.key, weight: e.weight } : null;
      })
      .filter((r): r is FeatureRegion => r !== null);

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

    const thinkingReasoning = [
      `【逐项验证】`,
      `  · ${pickedCard.features[0]} — 在原片左上区域可见清晰特征，与 ${top}${position} 标准一致。`,
      `  · ${pickedCard.features[1] ?? "次要特征"} — 通过角度与比例进一步佐证。`,
      `【排除干扰】`,
      `  · 相似种属 ${competitors[0]}${position} 在关键结构上差异明显，可排除。`,
      `  · 比例尺与出土层位数据未提示异常。`,
      `【最终判定】`,
      `  ${top}${position}，融合后置信度 ${(Math.min(0.99, topConfidence + 0.06) * 100).toFixed(1)}%。`,
    ].join("\n");

    const verdict: Verdict = {
      species: top,
      speciesLatin: speciesLatin(top),
      position,
      positionLatin: positionLatin(position),
      confidence: topConfidence,
      ranking: ranking.sort((a, b) => b.confidence - a.confidence),
    };

    return {
      verdict,
      dimensions,
      evidence,
      reasoning,
      thinkingReasoning,
      outOfDistribution: false,
      channelVerdicts: {
        realtime: verdict,
        thinking: { ...verdict, confidence: Math.min(0.99, topConfidence + 0.06) },
      },
      subjectBox,
      featureRegions,
      knowledgeCards: related,
      heatmapPath: undefined,
    } satisfies Omit<
      AnalysisResult,
      "id" | "imagePath" | "segmentedPath" | "timestamp" | "provider" | "processingMs" | "retrievalMode"
    >;
  },
};
