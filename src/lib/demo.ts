import { env } from "cloudflare:workers";
import manifest from "@/lib/demo-manifest.json";

export interface DemoEntry {
  id: string;
  file: string;
  thumb: string;
  label: string;
  hintSpecies: "马" | "牛";
  sourceBasename: string;
}

/**
 * The demo manifest is bundled at build time (small static data); thumbnails
 * are served as plain static assets from `/demo/*-thumb.jpg`.
 */
export async function loadDemoManifest(): Promise<DemoEntry[]> {
  return manifest as DemoEntry[];
}

/**
 * Full-size demo specimens are bundled as static assets in `public/demo/{id}.jpg`
 * (served at `/demo/{id}.jpg`). We fetch the asset using the request origin;
 * a legacy KV copy (`demo/{id}.jpg`) is used as a fallback if present.
 */
export async function readDemoFile(
  id: string,
  origin?: string,
): Promise<Uint8Array | null> {
  if (!/^demo-\d+$/.test(id)) return null;

  // Preferred: the bundled static asset.
  if (origin) {
    try {
      const res = await fetch(new URL(`/demo/${id}.jpg`, origin));
      if (res.ok) {
        return new Uint8Array(await res.arrayBuffer());
      }
    } catch {
      // fall through to KV
    }
  }

  // Legacy fallback: KV (only if it was hand-seeded).
  const buf = await env.BONES.get(`demo/${id}.jpg`, "arrayBuffer");
  if (!buf) return null;
  return new Uint8Array(buf);
}
