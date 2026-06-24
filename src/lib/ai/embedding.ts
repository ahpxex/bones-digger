import type { KnowledgeCard } from "@/lib/types";
import { ANALYSIS_KNOWLEDGE_CARDS } from "@/lib/knowledge/bones";

/**
 * Embedding config is provider-aware. Doubao (Volcengine ARK) and Qwen
 * (DashScope) both expose the OpenAI-compatible `/embeddings` endpoint, so the
 * only differences are base URL, key, model, and whether `dimensions` is honoured.
 */
type EmbedConfig = {
  base: string;
  apiKey: string | undefined;
  model: string;
  /** Sent only when the model supports vector-dimension reduction. */
  dimensions?: number;
};

function embedConfig(): EmbedConfig {
  if ((process.env.AI_PROVIDER ?? "mock") === "doubao") {
    return {
      base: process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3",
      apiKey: process.env.ARK_API_KEY,
      model:
        process.env.ARK_EMBEDDING_MODEL ?? "doubao-embedding-large-text-240915",
      // doubao-embedding-large-text-240915 returns a fixed 4096-dim vector.
    };
  }
  return {
    base:
      process.env.DASHSCOPE_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: process.env.DASHSCOPE_API_KEY,
    model: process.env.DASHSCOPE_EMBEDDING_MODEL ?? "text-embedding-v4",
    dimensions: Number(process.env.DASHSCOPE_EMBEDDING_DIM ?? "1024"),
  };
}

type CachedCard = {
  id: string;
  vector: Float32Array;
};

let kbCache: CachedCard[] | null = null;
let kbBuildPromise: Promise<CachedCard[]> | null = null;

function cardToText(card: KnowledgeCard): string {
  return `${card.species} ${card.position}：${card.features.join("；")}`;
}

async function embedBatch(texts: string[]): Promise<Float32Array[]> {
  const cfg = embedConfig();
  if (!cfg.apiKey) {
    throw new Error(
      "Embedding API key not set (ARK_API_KEY / DASHSCOPE_API_KEY) — cannot call embeddings.",
    );
  }
  const body: Record<string, unknown> = {
    model: cfg.model,
    input: texts,
    encoding_format: "float",
  };
  if (cfg.dimensions) body.dimensions = cfg.dimensions;
  const resp = await fetch(`${cfg.base}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Embedding request failed: ${resp.status} ${err}`);
  }
  const json = (await resp.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  const out: Float32Array[] = new Array(texts.length);
  for (const item of json.data) {
    out[item.index] = Float32Array.from(item.embedding);
  }
  return out;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

async function buildKnowledgeIndex(): Promise<CachedCard[]> {
  if (kbCache) return kbCache;
  if (kbBuildPromise) return kbBuildPromise;

  kbBuildPromise = (async () => {
    const texts = ANALYSIS_KNOWLEDGE_CARDS.map(cardToText);
    // DashScope text-embedding-v4 caps batch at 10 per call
    const batchSize = 10;
    const vectors: Float32Array[] = new Array(texts.length);
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const part = await embedBatch(batch);
      for (let j = 0; j < part.length; j++) {
        vectors[i + j] = part[j]!;
      }
    }
    const built: CachedCard[] = ANALYSIS_KNOWLEDGE_CARDS.map((card, i) => ({
      id: card.id,
      vector: vectors[i]!,
    }));
    kbCache = built;
    return built;
  })();

  try {
    return await kbBuildPromise;
  } finally {
    kbBuildPromise = null;
  }
}

export async function retrieveByEmbedding(
  query: string,
  topK = 8,
): Promise<KnowledgeCard[] | null> {
  if (!embedConfig().apiKey) return null;
  try {
    const index = await buildKnowledgeIndex();
    const [qVec] = await embedBatch([query]);
    if (!qVec) return null;
    const scored = index
      .map((entry) => ({
        entry,
        score: cosine(qVec, entry.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    const byId = new Map(ANALYSIS_KNOWLEDGE_CARDS.map((c) => [c.id, c]));
    return scored
      .map((s) => byId.get(s.entry.id))
      .filter((c): c is KnowledgeCard => Boolean(c));
  } catch (err) {
    console.warn(
      "[rag] embedding retrieval failed, falling back to bigram:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
