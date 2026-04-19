import type { AnalysisResult, KnowledgeCard } from "@/lib/types";

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
  analyze(input: AnalyzeInput, retrieved: KnowledgeCard[]): Promise<Omit<AnalysisResult, "id" | "imagePath" | "segmentedPath" | "timestamp" | "provider" | "processingMs">>;
}

export function selectProvider(): Provider {
  const mode = process.env.AI_PROVIDER ?? "mock";
  if (mode === "dashscope") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./dashscope") as { dashScopeProvider: Provider };
    return mod.dashScopeProvider;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("./mock") as { mockProvider: Provider };
  return mod.mockProvider;
}
