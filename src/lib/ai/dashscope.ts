import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { KnowledgeCard } from "@/lib/types";
import {
  type AnalysisResponse,
  buildSystemPrompt,
  knowledgeToPrompt,
  parseAnalysisText,
  runDualChannel,
} from "./analysis";
import type { AnalyzeInput, Provider } from "./provider";

/**
 * Qwen3.5 VLM via Alibaba DashScope's OpenAI-compatible endpoint. Kept as an
 * alternate provider; the schema, normalisation, and dual-channel fusion are
 * shared with Doubao in `./analysis`.
 */

async function callQwenChannel(
  input: AnalyzeInput,
  retrieved: KnowledgeCard[],
  modelId: string,
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

  const openai = createOpenAI({ apiKey, baseURL });

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

  return parseAnalysisText(text, retrieved, `Qwen(${modelId})`);
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

    return runDualChannel({
      realtimeModel,
      thinkingModel,
      retrieved,
      providerTag: "dashscope",
      callChannel: (model, thinking) =>
        callQwenChannel(input, retrieved, model, thinking),
    });
  },
};
