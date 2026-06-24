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
 * Doubao (Volcengine ARK) vision-language provider. ARK exposes the standard
 * OpenAI-compatible Chat Completions API, so we drive it with raw `fetch` for
 * full control over the two ARK-specific knobs the AI SDK doesn't surface:
 *   - `thinking: { type: "enabled" | "disabled" }` — toggles the reasoning pass
 *   - `response_format: { type: "json_object" }` — forces strict JSON output
 */

const DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const DEFAULT_MODEL = "doubao-seed-2-1-pro-260628";

type ChatResponse = {
  choices?: { message?: { content?: string; reasoning_content?: string } }[];
};

async function callDoubaoChannel(
  cfg: { baseURL: string; apiKey: string; timeoutMs: number },
  model: string,
  input: AnalyzeInput,
  retrieved: KnowledgeCard[],
  thinking: boolean,
): Promise<AnalysisResponse> {
  const system = buildSystemPrompt(knowledgeToPrompt(retrieved), thinking);
  const userPrompt = input.hints
    ? `请鉴定以下骨骼照片。用户补充信息：${input.hints}`
    : "请鉴定以下骨骼照片。";

  const body = {
    model,
    thinking: { type: thinking ? "enabled" : "disabled" },
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.mime};base64,${input.imageBase64}`,
            },
          },
        ],
      },
    ],
  };

  const resp = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.timeoutMs),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(
      `Doubao request failed (model=${model}): ${resp.status} ${errText.slice(0, 400)}`,
    );
  }

  const json = (await resp.json()) as ChatResponse;
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) {
    throw new Error(
      `Doubao returned empty content (model=${model}): ${JSON.stringify(json).slice(0, 400)}`,
    );
  }

  return parseAnalysisText(text, retrieved, `Doubao(${model})`);
}

export const doubaoProvider: Provider = {
  name: "doubao",
  async analyze(input: AnalyzeInput, retrieved: KnowledgeCard[]) {
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ARK_API_KEY is not set. Set it in .dev.vars / wrangler secret, or switch AI_PROVIDER=mock.",
      );
    }
    const baseURL = process.env.ARK_BASE_URL ?? DEFAULT_BASE_URL;
    // One Doubao model serves both channels — the thinking flag is the only
    // difference. Overridable per channel if a lighter realtime model is wired.
    const realtimeModel =
      process.env.ARK_VLM_MODEL_REALTIME ??
      process.env.ARK_VLM_MODEL ??
      DEFAULT_MODEL;
    const thinkingModel =
      process.env.ARK_VLM_MODEL_THINKING ??
      process.env.ARK_VLM_MODEL ??
      realtimeModel;
    // The reasoning pass is materially slower, so it gets a longer deadline.
    const realtimeTimeout = Number(process.env.ARK_REALTIME_TIMEOUT_MS ?? "60000");
    const thinkingTimeout = Number(process.env.ARK_THINKING_TIMEOUT_MS ?? "180000");

    // Doubao's reasoning pass is very slow (minutes), so the deep channel is
    // opt-in. With it off, every upload uses the fast single pass (thinking
    // disabled). Set ARK_THINKING_CHANNEL=on to escalate low-confidence samples.
    const thinkingEnabled = process.env.ARK_THINKING_CHANNEL === "on";

    return runDualChannel({
      realtimeModel,
      thinkingModel,
      retrieved,
      providerTag: "doubao",
      thinkingEnabled,
      callChannel: (model, thinking) =>
        callDoubaoChannel(
          {
            baseURL,
            apiKey,
            timeoutMs: thinking ? thinkingTimeout : realtimeTimeout,
          },
          model,
          input,
          retrieved,
          thinking,
        ),
    });
  },
};
