import { promises as fs } from "node:fs";
import path from "node:path";

export interface DemoEntry {
  id: string;
  file: string;
  thumb: string;
  label: string;
  hintSpecies: "马" | "牛";
  sourceBasename: string;
}

export async function loadDemoManifest(): Promise<DemoEntry[]> {
  const manifestPath = path.join(
    process.cwd(),
    "public",
    "demo",
    "manifest.json",
  );
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw) as DemoEntry[];
  } catch {
    return [];
  }
}

export async function readDemoFile(id: string): Promise<Buffer | null> {
  if (!/^demo-\d+$/.test(id)) return null;
  const abs = path.join(process.cwd(), "public", "demo", `${id}.jpg`);
  try {
    return await fs.readFile(abs);
  } catch {
    return null;
  }
}
