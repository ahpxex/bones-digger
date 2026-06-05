export interface SegmentResult {
  buffer: Uint8Array;
  ext: string;
  usedProvider: "stub" | "replicate";
}

/**
 * SAM 3.1 segmentation.
 *
 * The default ("stub") path is a passthrough: it returns the input frame
 * unchanged. The "segmented" look (desaturation + vignette) is applied at
 * display time in the browser (see ImageTriptych), so no server-side image
 * codec is required — which keeps this runnable on Cloudflare Workers.
 *
 * When SAM_PROVIDER=replicate and a REPLICATE_API_TOKEN is present, we delegate
 * to the real SAM endpoint and return the produced mask image.
 */
export async function segmentBoneSubject(
  imageBuffer: Uint8Array,
  mime: string,
): Promise<SegmentResult> {
  if (
    process.env.SAM_PROVIDER === "replicate" &&
    process.env.REPLICATE_API_TOKEN
  ) {
    return await segmentWithReplicate(imageBuffer, mime);
  }
  return { buffer: imageBuffer, ext: "jpg", usedProvider: "stub" };
}

async function segmentWithReplicate(
  imageBuffer: Uint8Array,
  mime: string,
): Promise<SegmentResult> {
  const base64 = Buffer.from(imageBuffer).toString("base64");
  const dataUri = `data:${mime};base64,${base64}`;

  const createResp = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
    },
    body: JSON.stringify({
      version: process.env.REPLICATE_SAM_VERSION ?? "meta/sam-3",
      input: {
        image: dataUri,
        text_prompts: "bone, skeleton, fossil",
      },
    }),
  });

  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Replicate SAM request failed: ${createResp.status} ${err}`);
  }

  const prediction = (await createResp.json()) as {
    id: string;
    urls: { get: string };
  };

  let status = "starting";
  let output: unknown;
  for (let i = 0; i < 30 && status !== "succeeded" && status !== "failed"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
    });
    const data = (await poll.json()) as { status: string; output?: unknown };
    status = data.status;
    output = data.output;
  }

  if (status !== "succeeded" || !output) {
    throw new Error(`SAM segmentation did not succeed: ${status}`);
  }

  const outUrl = Array.isArray(output) ? String(output[0]) : String(output);
  const imgResp = await fetch(outUrl);
  const arr = new Uint8Array(await imgResp.arrayBuffer());
  return { buffer: arr, ext: "png", usedProvider: "replicate" };
}
