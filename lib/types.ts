export type Species =
  | "马"
  | "黄牛"
  | "水牛"
  | "鹿"
  | "羊"
  | "猪"
  | "狗"
  | "未知";

export type BonePosition =
  | "掌骨"
  | "跖骨"
  | "趾骨"
  | "距骨"
  | "跟骨"
  | "尺骨"
  | "桡骨"
  | "股骨"
  | "胫骨"
  | "头骨"
  | "牙齿"
  | "上颌"
  | "下颌"
  | "齿式"
  | "寰椎"
  | "枢椎"
  | "肩胛骨"
  | "肱骨"
  | "其他";

export type AnalysisDimension =
  | "整体形态"
  | "关键结构"
  | "截面断面"
  | "表面纹理"
  | "表面痕迹"
  | "尺寸比例";

export interface RankingEntry {
  species: Species;
  position: BonePosition;
  confidence: number;
}

export interface EvidenceItem {
  id: string;
  key: string;
  observation: string;
  referenceFeature: string;
  sourceSpecies: Species;
  sourcePosition: BonePosition;
  weight: number;
  /** Optional region on the original image that supports this evidence */
  region?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface KnowledgeCard {
  id: string;
  species: Species;
  position: BonePosition;
  features: string[];
  summary: string;
}

export interface Verdict {
  species: Species;
  speciesLatin?: string;
  position: BonePosition;
  positionLatin?: string;
  confidence: number;
  ranking: RankingEntry[];
}

export interface BoundingBox {
  /** normalised [0,1] coordinates of top-left corner */
  x: number;
  y: number;
  /** normalised [0,1] width and height */
  w: number;
  h: number;
}

export interface FeatureRegion extends BoundingBox {
  label: string;
  weight: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  imagePath: string;
  segmentedPath?: string;
  heatmapPath?: string;
  /** normalised bbox of the bone subject in the original image */
  subjectBox?: BoundingBox;
  /** key feature regions highlighted by the VLM, normalised coords */
  featureRegions?: FeatureRegion[];
  verdict: Verdict;
  dimensions: Record<AnalysisDimension, number>;
  evidence: EvidenceItem[];
  reasoning: string;
  /** Deep chain-of-thought output from the precision (Thinking) channel */
  thinkingReasoning?: string;
  /** When true, subject is outside the knowledge-base scope; UI shows "建议送专家" */
  outOfDistribution?: boolean;
  /** Distinct realtime- and thinking-channel verdicts (before fusion) */
  channelVerdicts?: {
    realtime?: Verdict;
    thinking?: Verdict;
  };
  knowledgeCards: KnowledgeCard[];
  provider: "mock" | "dashscope";
  /** "bigram" (fallback) or "qwen3-embedding" */
  retrievalMode: "bigram" | "qwen3-embedding";
  processingMs: number;
}

export interface AnalysisSummary {
  id: string;
  timestamp: string;
  imagePath: string;
  species: Species;
  position: BonePosition;
  confidence: number;
}
