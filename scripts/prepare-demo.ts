import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

type DemoEntry = {
  id: string;
  file: string;
  thumb: string;
  label: string;
  hintSpecies: "马" | "牛";
  sourceBasename: string;
};

const PHOTO_SOURCE =
  process.env.PHOTO_SOURCE_DIR ?? "/Users/ahpx/Code/Playground/photos";
const OUT_DIR = path.join(process.cwd(), "public", "demo");
const SAMPLE_COUNT = Number(process.env.DEMO_COUNT ?? "16");

async function main() {
  console.log(`[prepare-demo] source: ${PHOTO_SOURCE}`);
  console.log(`[prepare-demo] target: ${OUT_DIR}`);

  const stat = await fs.stat(PHOTO_SOURCE).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    console.error(
      `source not found or not a directory — skip. Set PHOTO_SOURCE_DIR env var to override.`,
    );
    process.exit(0);
  }

  const all = (await fs.readdir(PHOTO_SOURCE))
    .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
    .sort();
  console.log(`[prepare-demo] found ${all.length} source photos`);
  if (all.length === 0) {
    console.log("no photos to sample, exiting");
    return;
  }

  const halfMark = Math.ceil(all.length / 2);
  const step = Math.max(1, Math.floor(all.length / SAMPLE_COUNT));
  const sampled: string[] = [];
  for (let i = 0; i < all.length && sampled.length < SAMPLE_COUNT; i += step) {
    sampled.push(all[i]!);
  }
  console.log(
    `[prepare-demo] sampling ${sampled.length} photos (every ${step}th)`,
  );

  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const manifest: DemoEntry[] = [];
  for (let i = 0; i < sampled.length; i++) {
    const srcName = sampled[i]!;
    const srcPath = path.join(PHOTO_SOURCE, srcName);
    const idx = all.indexOf(srcName);
    const hintSpecies: "马" | "牛" = idx < halfMark ? "马" : "牛";
    const id = `demo-${String(i + 1).padStart(2, "0")}`;

    const srcBuf = await fs.readFile(srcPath);

    const normalisedBuf = await sharp(srcBuf)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true, fit: "inside" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    const thumbBuf = await sharp(srcBuf)
      .rotate()
      .resize({ width: 480, height: 480, fit: "cover", position: "centre" })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    const normName = `${id}.jpg`;
    const thumbName = `${id}-thumb.jpg`;
    await fs.writeFile(path.join(OUT_DIR, normName), normalisedBuf);
    await fs.writeFile(path.join(OUT_DIR, thumbName), thumbBuf);

    manifest.push({
      id,
      file: `/demo/${normName}`,
      thumb: `/demo/${thumbName}`,
      label: `标本 ${String(i + 1).padStart(2, "0")}`,
      hintSpecies,
      sourceBasename: srcName,
    });

    console.log(
      `  ${id}  ${srcName}  full=${(normalisedBuf.length / 1024).toFixed(0)}KB  thumb=${(thumbBuf.length / 1024).toFixed(0)}KB  hint=${hintSpecies}`,
    );
  }

  await fs.writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  const total =
    manifest.length > 0
      ? await fs
          .readdir(OUT_DIR)
          .then(async (files) => {
            let sum = 0;
            for (const f of files) {
              const s = await fs.stat(path.join(OUT_DIR, f));
              sum += s.size;
            }
            return sum;
          })
      : 0;

  console.log(
    `\n[prepare-demo] done. ${manifest.length} entries. total public/demo/ size = ${(total / 1024 / 1024).toFixed(1)}MB`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
