import sharp from "sharp";

export interface SegmentResult {
  buffer: Buffer;
  ext: string;
  usedProvider: "stub" | "replicate";
}

/**
 * Stub SAM 3.1 segmentation.
 *
 * Real SAM 3.1 would be invoked via Replicate or a self-hosted endpoint with
 * a text prompt like "bone, skeleton". Because that requires a credential and
 * adds a demo dependency, we emulate the effect by normalising contrast and
 * softly vignetting the edges so the result still looks like a "focused,
 * desaturated background" pass. When REPLICATE_API_TOKEN is present, we
 * delegate to the real SAM endpoint instead.
 */
export async function segmentBoneSubject(
  imageBuffer: Buffer,
  mime: string,
): Promise<SegmentResult> {
  if (process.env.SAM_PROVIDER === "replicate" && process.env.REPLICATE_API_TOKEN) {
    return await segmentWithReplicate(imageBuffer, mime);
  }
  const resized = await sharp(imageBuffer)
    .rotate()
    .resize({ width: 1024, withoutEnlargement: true, fit: "inside" })
    .modulate({ saturation: 0.55, brightness: 1.02 })
    .linear(1.15, -10)
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;

  const processed = await sharp(resized)
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <defs>
              <radialGradient id="v" cx="50%" cy="50%" r="65%">
                <stop offset="60%" stop-color="white" stop-opacity="0"/>
                <stop offset="100%" stop-color="#f5f1e8" stop-opacity="1"/>
              </radialGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#v)"/>
          </svg>`,
        ),
        blend: "over",
      },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();

  return { buffer: processed, ext: "jpg", usedProvider: "stub" };
}

async function segmentWithReplicate(
  imageBuffer: Buffer,
  mime: string,
): Promise<SegmentResult> {
  const base64 = imageBuffer.toString("base64");
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
  return { buffer: Buffer.from(arr), ext: "png", usedProvider: "replicate" };
}
