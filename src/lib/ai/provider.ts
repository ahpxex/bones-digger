import type { AnalysisResult, KnowledgeCard } from "@/lib/types";
import { mockProvider } from "./mock";
import { dashScopeProvider } from "./dashscope";

export interface AnalyzeInput {
  id: string;
  imagePath: string;
  segmentedPath?: string;
  imageBase64: string;
  mime: string;
  hints?: string;
}

export interface Provider {
  name: "mock" | "dashscope";
  analyze(
    input: AnalyzeInput,
    retrieved: KnowledgeCard[],
  ): Promise<
    Omit<
      AnalysisResult,
      | "id"
      | "imagePath"
      | "segmentedPath"
      | "timestamp"
      | "provider"
      | "processingMs"
      | "retrievalMode"
    >
  >;
}

export function selectProvider(): Provider {
  const mode = process.env.AI_PROVIDER ?? "mock";
  return mode === "dashscope" ? dashScopeProvider : mockProvider;
}
