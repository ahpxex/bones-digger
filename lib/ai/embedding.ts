import type { KnowledgeCard } from "@/lib/types";
import { KNOWLEDGE_CARDS } from "@/lib/knowledge/bones";

const EMBED_MODEL =
  process.env.DASHSCOPE_EMBEDDING_MODEL ?? "text-embedding-v4";
const EMBED_DIM = Number(process.env.DASHSCOPE_EMBEDDING_DIM ?? "1024");
const EMBED_BASE =
  process.env.DASHSCOPE_BASE_URL ??
  "https://dashscope.aliyuncs.com/compatible-mode/v1";

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
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY not set — cannot call embeddings.");
  }
  const resp = await fetch(`${EMBED_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
      dimensions: EMBED_DIM,
      encoding_format: "float",
    }),
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
    const texts = KNOWLEDGE_CARDS.map(cardToText);
    const batchSize = 16;
    const vectors: Float32Array[] = new Array(texts.length);
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const part = await embedBatch(batch);
      for (let j = 0; j < part.length; j++) {
        vectors[i + j] = part[j]!;
      }
    }
    const built: CachedCard[] = KNOWLEDGE_CARDS.map((card, i) => ({
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
  if (!process.env.DASHSCOPE_API_KEY) return null;
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
    const byId = new Map(KNOWLEDGE_CARDS.map((c) => [c.id, c]));
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
