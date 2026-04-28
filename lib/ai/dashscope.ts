import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import {
  ANALYSIS_SPECIES_LIST,
  cardFor,
  isAnalysisSpecies,
  positionLatin,
  speciesLatin,
} from "@/lib/knowledge/bones";
import type {
  AnalysisDimension,
  AnalysisResult,
  AnalysisSpecies,
  BonePosition,
  KnowledgeCard,
  Verdict,
} from "@/lib/types";
import type { AnalyzeInput, Provider } from "./provider";

const SPECIES_ENUM = ANALYSIS_SPECIES_LIST;
const POSITION_ENUM = [
  "掌骨",
  "跖骨",
  "趾骨",
  "距骨",
  "跟骨",
  "尺骨",
  "桡骨",
  "股骨",
  "胫骨",
  "头骨",
  "牙齿",
  "上颌",
  "下颌",
  "齿式",
  "寰椎",
  "枢椎",
  "肩胛骨",
  "肱骨",
  "其他",
] as const;

const bboxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});

const analysisSchema = z.object({
  verdict: z.object({
    species: z.enum(SPECIES_ENUM),
    position: z.enum(POSITION_ENUM),
    confidence: z.number().min(0).max(1),
  }),
  outOfDistribution: z.boolean().optional().default(false),
  ranking: z
    .array(
      z.object({
        species: z.enum(SPECIES_ENUM),
        position: z.enum(POSITION_ENUM),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(0)
    .max(2)
    .optional()
    .default([]),
  dimensions: z.object({
    整体形态: z.number().min(0).max(1),
    关键结构: z.number().min(0).max(1),
    截面断面: z.number().min(0).max(1),
    表面纹理: z.number().min(0).max(1),
    表面痕迹: z.number().min(0).max(1),
    尺寸比例: z.number().min(0).max(1),
  }),
  evidence: z
    .array(
      z.object({
        key: z.string(),
        observation: z.string(),
        referenceFeature: z.string(),
        weight: z.number().min(0).max(1),
        region: bboxSchema.optional(),
      }),
    )
    .min(0)
    .max(8),
  subjectBox: bboxSchema.optional(),
  reasoning: z.string().min(5).optional().default("（模型未提供推理文本）"),
});

type AnalysisResponse = z.infer<typeof analysisSchema>;

function knowledgeToPrompt(cards: KnowledgeCard[]): string {
  return cards
    .map(
      (c, i) =>
        `${i + 1}. ${c.species}·${c.position}：${c.features.join("；")}`,
    )
    .join("\n");
}

const LOW_CONFIDENCE_THRESHOLD = Number(
  process.env.THINKING_CHANNEL_THRESHOLD ?? "0.72",
);

function buildSystemPrompt(
  knowledgeBlock: string,
  thinking: boolean,
): string {
  return [
    "你是中国社会科学院考古研究所的动物考古学专家，擅长通过骨骼照片进行种属与骨位鉴定。",
    "你将收到一张田野出土动物骨骼照片，以及从专家知识库检索到的相关鉴定特征条目。",
    thinking
      ? "请逐步分析：先描述观察到的形态要素，再对照每一条候选专家特征做正反论证，最后在可追溯的证据下给出判定。"
      : "请结合图像与专家特征给出简洁可信的判定，并标出关键证据的观察区域。",
    "",
    "【输出格式——极其严格】",
    "- 只输出一个纯 JSON 对象，不要用 markdown ``` 代码围栏包裹，不要前后加任何解释文字。",
    "- 输出必须能被 JSON.parse 解析，键名严格按照下面的示例，不得使用同义词。",
    "",
    "完整结构示例（必须完全按此 key 与层次）：",
    "{",
    '  "verdict": { "species": "马", "position": "距骨", "confidence": 0.85 },',
    '  "outOfDistribution": false,',
    '  "ranking": [',
    '    { "species": "马", "position": "距骨", "confidence": 0.85 },',
    '    { "species": "黄牛", "position": "距骨", "confidence": 0.15 }',
    '  ],',
    '  "dimensions": {',
    '    "整体形态": 0.82, "关键结构": 0.91, "截面断面": 0.76,',
    '    "表面纹理": 0.68, "表面痕迹": 0.55, "尺寸比例": 0.80',
    '  },',
    '  "evidence": [',
    '    {',
    '      "key": "滑车结构",',
    '      "observation": "近端可见明显单滑车，内侧有一处突起",',
    '      "referenceFeature": "马距骨：单滑车结构；内侧有明显突起",',
    '      "weight": 0.35,',
    '      "region": { "x": 0.3, "y": 0.12, "w": 0.18, "h": 0.18 }',
    '    }',
    '  ],',
    '  "subjectBox": { "x": 0.18, "y": 0.1, "w": 0.64, "h": 0.75 },',
    '  "reasoning": "【分割】… 【形态观察】… 【判定】…"',
    "}",
    "",
    "- evidence 数组每一项都必须包含 key / observation / referenceFeature / weight 四个字符串或数字字段，可选 region 对象。",
    "- evidence 不足时可为空数组 []，但绝不能省略字段名。",
    "- subjectBox / region 必须是 {x,y,w,h} 对象，绝不能是数组。",
    "",
    "【鉴定规则】",
    "- 证据只能从下列专家特征表里引用，不得编造新特征。",
    "- 这是封闭二分类任务：verdict.species 只能是 \"马\" 或 \"黄牛\"，不能输出狗、鹿、羊、猪、水牛、其他动物或 \"未知\"。",
    "- ranking 必须只包含马和黄牛两个候选，按置信度降序；即使图像不完美，也必须在这两个物种中选择更可能的一类。",
    "- 若只能判断为泛称 \"牛\"，统一输出 \"黄牛\"；骨位无法细分时 position 使用 \"其他\"，不要输出 \"未知\"。",
    "- outOfDistribution 固定为 false。",
    "- subjectBox / evidence[].region 为归一化坐标 [0,1]，(x,y) 为左上角，(w,h) 为宽高。",
    "- dimensions 六维打分：整体形态 / 关键结构 / 截面断面 / 表面纹理 / 表面痕迹 / 尺寸比例，每项 [0,1] 浮点，六个键都必须存在。",
    "- ranking 是对象数组，每项都应是 {\"species\": \"马\", \"position\": \"距骨\", \"confidence\": 0.62}。绝不能是空对象 {}。",
    "",
    "【专家鉴定特征（RAG 检索结果）】",
    knowledgeBlock,
  ].join("\n");
}

function extractJson(text: string): string {
  // Strip any markdown ```json ... ``` fence wrappers
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1]!.trim();
  // If the response contains a leading object, try to extract balanced braces
  const start = text.indexOf("{");
  if (start === -1) return text.trim();
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start).trim();
}

async function callChannel(
  modelId: string,
  input: AnalyzeInput,
  retrieved: KnowledgeCard[],
  thinking: boolean,
): Promise<AnalysisResponse> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DASHSCOPE_API_KEY is not set. Set it in .env.local or switch AI_PROVIDER=mock.",
    );
  }
  const baseURL =
    process.env.DASHSCOPE_BASE_URL ??
    "https://dashscope.aliyuncs.com/compatible-mode/v1";

  const openai = createOpenAI({
    apiKey,
    baseURL,
  });

  const system = buildSystemPrompt(knowledgeToPrompt(retrieved), thinking);
  const userPrompt = input.hints
    ? `请鉴定以下骨骼照片。用户补充信息：${input.hints}`
    : "请鉴定以下骨骼照片。";

  const { text } = await generateText({
    model: openai(modelId),
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image",
            image: `data:${input.mime};base64,${input.imageBase64}`,
          },
        ],
      },
    ],
    providerOptions: {
      openai: {
        extra_body: thinking
          ? { enable_thinking: true }
          : { enable_thinking: false },
      },
    },
  });

  const jsonText = extractJson(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `Qwen returned invalid JSON (model=${modelId}):\n---raw---\n${text.slice(0, 600)}\n---extracted---\n${jsonText.slice(0, 600)}`,
    );
  }

  // Normalise common Qwen oddities before Zod parsing.
  const UNKNOWN_ALIASES = new Set([
    "未定",
    "待定",
    "不确定",
    "未知",
    "未判定",
    "无法判定",
    "无法识别",
    "N/A",
    "n/a",
    "unknown",
    "Unknown",
    "",
  ]);
  const defaultSpecies: AnalysisSpecies =
    (retrieved.find((card) => isAnalysisSpecies(card.species))?.species as
      | AnalysisSpecies
      | undefined) ?? "黄牛";

  const speciesFromKnownLabel = (value: unknown): AnalysisSpecies | undefined => {
    if (typeof value !== "string") return undefined;
    const raw = value.trim();
    const text = raw.toLowerCase();
    if (raw === "马" || text.includes("equus")) return "马";
    if (
      raw === "黄牛" ||
      raw === "牛" ||
      raw === "家牛" ||
      raw === "水牛" ||
      text.includes("bos") ||
      text.includes("bubalus") ||
      raw.includes("牛")
    ) {
      return "黄牛";
    }
    return undefined;
  };

  const clampConfidence = (value: unknown, fallback: number): number => {
    const n =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : Number.NaN;
    if (!Number.isFinite(n)) return fallback;
    return Math.min(1, Math.max(0.01, n));
  };

  const coercePosition = (
    value: unknown,
    fallback: BonePosition = "其他",
  ): BonePosition => {
    if (typeof value !== "string") return fallback;
    const raw = value.trim();
    if ((POSITION_ENUM as readonly string[]).includes(raw)) {
      return raw as BonePosition;
    }
    if (UNKNOWN_ALIASES.has(raw)) return "其他";
    return fallback;
  };

  const buildClosedRanking = (
    rawRanking: unknown[],
    verdictSpecies: AnalysisSpecies,
    verdictPosition: BonePosition,
    verdictConfidence: number,
  ) => {
    const rows = new Map<
      AnalysisSpecies,
      { species: AnalysisSpecies; position: BonePosition; confidence: number }
    >();

    for (const item of rawRanking) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const species = speciesFromKnownLabel(row.species);
      if (!species) continue;
      const confidence = clampConfidence(
        row.confidence,
        species === verdictSpecies ? verdictConfidence : 1 - verdictConfidence,
      );
      const current = rows.get(species);
      if (!current || confidence > current.confidence) {
        rows.set(species, {
          species,
          position: coercePosition(row.position, verdictPosition),
          confidence,
        });
      }
    }

    const otherSpecies: AnalysisSpecies =
      verdictSpecies === "马" ? "黄牛" : "马";
    const verdictRow = rows.get(verdictSpecies);
    if (!verdictRow || verdictRow.confidence < verdictConfidence) {
      rows.set(verdictSpecies, {
        species: verdictSpecies,
        position: verdictPosition,
        confidence: verdictConfidence,
      });
    }
    if (!rows.has(otherSpecies)) {
      rows.set(otherSpecies, {
        species: otherSpecies,
        position: verdictPosition,
        confidence: Math.max(0.01, Math.min(0.49, 1 - verdictConfidence)),
      });
    }

    const top = rows.get(verdictSpecies)!;
    const other = rows.get(otherSpecies)!;
    if (other.confidence >= top.confidence) {
      other.confidence = Math.max(0.01, top.confidence * 0.65);
    }
    return [top, other].sort((a, b) => b.confidence - a.confidence);
  };

  const normaliseRegion = (val: unknown): unknown => {
    if (!val) return undefined;
    if (Array.isArray(val) && val.length >= 4) {
      return {
        x: Number(val[0]),
        y: Number(val[1]),
        w: Number(val[2]),
        h: Number(val[3]),
      };
    }
    if (typeof val === "object") return val;
    return undefined;
  };

  const pickString = (
    obj: Record<string, unknown>,
    keys: string[],
  ): string | undefined => {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === "string" && v.length > 0) return v;
    }
    return undefined;
  };

  const pickNumber = (
    obj: Record<string, unknown>,
    keys: string[],
  ): number | undefined => {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
    }
    return undefined;
  };

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (obj.ranking && !Array.isArray(obj.ranking) && typeof obj.ranking === "object") {
      obj.ranking = [];
    }
    if (obj.evidence && !Array.isArray(obj.evidence) && typeof obj.evidence === "object") {
      obj.evidence = [];
    }
    if (obj.verdict && typeof obj.verdict === "object") {
      const v = obj.verdict as Record<string, unknown>;
      const rawRanking = Array.isArray(obj.ranking) ? obj.ranking : [];
      const rankingSpecies = rawRanking
        .map((r) =>
          r && typeof r === "object"
            ? speciesFromKnownLabel((r as Record<string, unknown>).species)
            : undefined,
        )
        .find((s): s is AnalysisSpecies => Boolean(s));
      const verdictSpecies =
        speciesFromKnownLabel(v.species) ?? rankingSpecies ?? defaultSpecies;
      const verdictPosition = coercePosition(v.position);
      const verdictConfidence = clampConfidence(v.confidence, 0.5);

      v.species = verdictSpecies;
      v.position = verdictPosition;
      v.confidence = verdictConfidence;
      obj.ranking = buildClosedRanking(
        rawRanking,
        verdictSpecies,
        verdictPosition,
        verdictConfidence,
      );
    }
    obj.outOfDistribution = false;
    // Normalise evidence entries: map synonym keys + array-form region
    if (Array.isArray(obj.evidence)) {
      obj.evidence = (obj.evidence as unknown[])
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const row = e as Record<string, unknown>;
          const key = pickString(row, [
            "key",
            "feature",
            "name",
            "title",
            "要点",
            "特征",
            "特征点",
          ]);
          const observation = pickString(row, [
            "observation",
            "description",
            "detail",
            "text",
            "image_observation",
            "图像观察",
            "观察",
          ]);
          const referenceFeature = pickString(row, [
            "referenceFeature",
            "reference",
            "source",
            "basis",
            "expert_feature",
            "专家特征",
            "参考",
            "参考特征",
          ]);
          const weight = pickNumber(row, [
            "weight",
            "score",
            "importance",
            "权重",
          ]);
          const region = normaliseRegion(
            row.region ?? row.bbox ?? row.box ?? row.区域,
          );
          if (!key || !observation || !referenceFeature || weight === undefined) {
            return null;
          }
          const out: Record<string, unknown> = {
            key,
            observation,
            referenceFeature,
            weight,
          };
          if (region) out.region = region;
          return out;
        })
        .filter((x): x is Record<string, unknown> => x !== null);
    }
    // Normalise subjectBox if provided as array
    const sb = normaliseRegion(obj.subjectBox);
    if (sb) obj.subjectBox = sb;
    else delete obj.subjectBox;
  }

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Qwen JSON did not match schema (model=${modelId}):\n${JSON.stringify(result.error.issues, null, 2)}\n---parsed---\n${JSON.stringify(parsed, null, 2)}\n---raw text---\n${text}`,
    );
  }
  return result.data;
}

function verdictFromResp(resp: AnalysisResponse): Verdict {
  const ranking = resp.ranking
    .slice()
    .sort((a, b) => b.confidence - a.confidence);
  return {
    species: resp.verdict.species as AnalysisSpecies,
    speciesLatin: speciesLatin(resp.verdict.species as AnalysisSpecies),
    position: resp.verdict.position as BonePosition,
    positionLatin: positionLatin(resp.verdict.position as BonePosition),
    confidence: resp.verdict.confidence,
    ranking: ranking.map((r) => ({
      species: r.species as AnalysisSpecies,
      position: r.position as BonePosition,
      confidence: r.confidence,
    })),
  };
}

export const dashScopeProvider: Provider = {
  name: "dashscope",
  async analyze(input: AnalyzeInput, retrieved: KnowledgeCard[]) {
    const realtimeModel =
      process.env.DASHSCOPE_VLM_MODEL_REALTIME ??
      process.env.DASHSCOPE_VLM_MODEL ??
      "qwen3.5-flash";
    const thinkingModel =
      process.env.DASHSCOPE_VLM_MODEL_THINKING ?? "qwen3.5-plus";

    // Step 1 — realtime channel (fast, low latency)
    const realtimeResp = await callChannel(
      realtimeModel,
      input,
      retrieved,
      false,
    );
    const realtimeVerdict = verdictFromResp(realtimeResp);

    // Step 2 — thinking channel runs for low-confidence samples.
    const shouldThink = realtimeVerdict.confidence < LOW_CONFIDENCE_THRESHOLD;

    let thinkingResp: AnalysisResponse | null = null;
    let thinkingVerdict: Verdict | undefined;
    if (shouldThink) {
      try {
        thinkingResp = await callChannel(
          thinkingModel,
          input,
          retrieved,
          true,
        );
        thinkingVerdict = verdictFromResp(thinkingResp);
      } catch (err) {
        console.warn(
          "[dashscope] thinking channel failed, keeping realtime verdict:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    // Step 3 — fusion: if thinking exists and disagrees, trust thinking but blend confidence
    let finalResp: AnalysisResponse;
    let finalVerdict: Verdict;
    if (thinkingResp && thinkingVerdict) {
      const agree =
        thinkingVerdict.species === realtimeVerdict.species &&
        thinkingVerdict.position === realtimeVerdict.position;
      if (agree) {
        // Both channels agree → boost confidence
        finalResp = thinkingResp;
        finalVerdict = {
          ...thinkingVerdict,
          confidence: Math.min(
            0.99,
            0.5 * (realtimeVerdict.confidence + thinkingVerdict.confidence) +
              0.08,
          ),
        };
      } else {
        // Disagreement → trust thinking but keep its confidence honest
        finalResp = thinkingResp;
        finalVerdict = thinkingVerdict;
      }
    } else {
      finalResp = realtimeResp;
      finalVerdict = realtimeVerdict;
    }

    const cards: KnowledgeCard[] = [];
    const topCard = cardFor(
      finalVerdict.species,
      finalVerdict.position,
    );
    if (topCard) cards.push(topCard);
    const alt = retrieved
      .filter(
        (c) =>
          !(c.species === finalVerdict.species &&
            c.position === finalVerdict.position),
      )
      .slice(0, 2);
    cards.push(...alt);

    const evidence = finalResp.evidence.map((e, idx) => ({
      id: `ev-${idx + 1}`,
      key: e.key,
      observation: e.observation,
      referenceFeature: e.referenceFeature,
      sourceSpecies: finalVerdict.species,
      sourcePosition: finalVerdict.position,
      weight: e.weight,
      region: e.region,
    }));

    return {
      verdict: finalVerdict,
      dimensions: finalResp.dimensions as Record<AnalysisDimension, number>,
      evidence,
      reasoning: finalResp.reasoning,
      thinkingReasoning: thinkingResp?.reasoning,
      outOfDistribution: false,
      channelVerdicts: {
        realtime: realtimeVerdict,
        thinking: thinkingVerdict,
      },
      subjectBox: finalResp.subjectBox,
      featureRegions: finalResp.evidence
        .filter((e) => e.region)
        .map((e) => ({ ...(e.region as { x: number; y: number; w: number; h: number }), label: e.key, weight: e.weight })),
      knowledgeCards: cards,
      heatmapPath: undefined,
    } satisfies Omit<
      AnalysisResult,
      "id" | "imagePath" | "segmentedPath" | "timestamp" | "provider" | "processingMs" | "retrievalMode"
    >;
  },
};
