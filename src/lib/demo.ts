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
 * Full-size demo specimens live in KV under `demo/{id}.jpg` (seeded once via
 * `wrangler kv key put`). Returns the raw bytes, or null if absent.
 */
export async function readDemoFile(id: string): Promise<Uint8Array | null> {
  if (!/^demo-\d+$/.test(id)) return null;
  const buf = await env.BONES.get(`demo/${id}.jpg`, "arrayBuffer");
  if (!buf) return null;
  return new Uint8Array(buf);
}
