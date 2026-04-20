/**
 * SAM 3D Objects — single-image to 3D GLB reconstruction.
 *
 * Replaces the earlier 3DGS + COLMAP + splatfacto pipeline entirely.
 * Upstream: Meta facebook/sam-3d-objects (open weights on HuggingFace,
 * hosted endpoints at fal.ai and Replicate).
 */

export interface Sam3DResult {
  /** Buffer of the generated .glb mesh file */
  glb: Buffer;
  /** Provider that actually produced the result */
  provider: "stub" | "fal" | "replicate";
}

/**
 * Generate a 3D GLB model from a single bone image.
 * Returns null when no provider is configured (skipping the 3D step is fine).
 */
export async function reconstruct3D(
  imageBuffer: Buffer,
  mime: string,
): Promise<Sam3DResult | null> {
  const provider = process.env.SAM3D_PROVIDER ?? "none";
  if (provider === "none") return null;

  if (provider === "fal" && process.env.FAL_KEY) {
    return await reconstructViaFal(imageBuffer, mime);
  }
  if (provider === "replicate" && process.env.REPLICATE_API_TOKEN) {
    return await reconstructViaReplicate(imageBuffer, mime);
  }
  if (provider === "stub") {
    // Return null so the UI falls back to the procedural placeholder mesh.
    return null;
  }
  return null;
}

async function reconstructViaFal(
  imageBuffer: Buffer,
  mime: string,
): Promise<Sam3DResult> {
  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:${mime};base64,${base64}`;

  // fal.ai queue endpoint
  const submitResp = await fetch(
    "https://queue.fal.run/fal-ai/sam-3/3d-objects",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.FAL_KEY}`,
      },
      body: JSON.stringify({
        image_url: dataUri,
        // Quality knobs — conservative defaults for demo latency
        resolution: 512,
      }),
    },
  );
  if (!submitResp.ok) {
    throw new Error(
      `fal.ai SAM 3D submit failed: ${submitResp.status} ${await submitResp.text()}`,
    );
  }
  const submitted = (await submitResp.json()) as {
    request_id: string;
    status_url: string;
    response_url: string;
  };

  // Poll until completed (up to ~60s)
  let status = "IN_QUEUE";
  let polls = 0;
  while (polls < 45 && status !== "COMPLETED" && status !== "FAILED") {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await fetch(submitted.status_url, {
      headers: { Authorization: `Key ${process.env.FAL_KEY}` },
    });
    const sj = (await s.json()) as { status: string };
    status = sj.status;
    polls += 1;
  }
  if (status !== "COMPLETED") {
    throw new Error(`fal.ai SAM 3D did not complete: ${status}`);
  }

  const result = await fetch(submitted.response_url, {
    headers: { Authorization: `Key ${process.env.FAL_KEY}` },
  });
  const payload = (await result.json()) as {
    glb?: { url: string };
    model_mesh?: { url: string };
    mesh?: { url: string };
  };
  const glbUrl =
    payload.glb?.url ?? payload.model_mesh?.url ?? payload.mesh?.url;
  if (!glbUrl) {
    throw new Error(
      `fal.ai SAM 3D response missing GLB URL: ${JSON.stringify(payload).slice(0, 300)}`,
    );
  }
  const glbResp = await fetch(glbUrl);
  const arr = new Uint8Array(await glbResp.arrayBuffer());
  return { glb: Buffer.from(arr), provider: "fal" };
}

async function reconstructViaReplicate(
  imageBuffer: Buffer,
  mime: string,
): Promise<Sam3DResult> {
  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:${mime};base64,${base64}`;

  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
    },
    body: JSON.stringify({
      version:
        process.env.REPLICATE_SAM3D_VERSION ??
        "facebookresearch/sam-3d-objects",
      input: { image: dataUri },
    }),
  });
  if (!create.ok) {
    throw new Error(
      `Replicate SAM 3D submit failed: ${create.status} ${await create.text()}`,
    );
  }
  const prediction = (await create.json()) as {
    id: string;
    urls: { get: string };
  };
  let status = "starting";
  let output: unknown;
  for (let i = 0; i < 40 && status !== "succeeded" && status !== "failed"; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
    });
    const data = (await poll.json()) as { status: string; output?: unknown };
    status = data.status;
    output = data.output;
  }
  if (status !== "succeeded" || !output) {
    throw new Error(`Replicate SAM 3D did not succeed: ${status}`);
  }
  const glbUrl = Array.isArray(output) ? String(output[0]) : String(output);
  const g = await fetch(glbUrl);
  const arr = new Uint8Array(await g.arrayBuffer());
  return { glb: Buffer.from(arr), provider: "replicate" };
}
