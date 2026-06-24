# 3D 数字标本模型 (digital specimen models)

The result page + homepage showcase load a per-species GLB from this folder:

- `horse.glb`  → shown when the verdict is **马** (horse)
- `cattle.glb` → shown when the verdict is **黄牛** (cattle)

If a file is missing/fails to load, the viewer falls back to the built-in
procedural bone mesh — nothing breaks. Wired in
`src/components/splat/viewer-preview.tsx`.

## Currently bundled (real photogrammetry scans)

Real museum skull scans from Carleton College's **CARCAS** comparative-anatomy
collection (`3dviewer.sites.carleton.edu/carcas`), optimized for the web with
`@gltf-transform/cli` (textures → 1024px WebP, geometry quantized via
KHR_mesh_quantization — both render with vanilla `useGLTF`, no extra decoder):

- `horse.glb`  — **Horse Skull** (species-correct), ~14 MB
- `cattle.glb` — **Goat Skull** (closest free bovid stand-in for cattle), ~7 MB

Both are < 25 MB (Cloudflare Workers per-asset limit). The horse is
species-perfect; the cattle is a bovid stand-in (no free cattle skull scan was
directly downloadable).

## Swapping for an even better / exact model (≈1 min)

Download a **GLB** (< 25 MB) and overwrite the file:

- Cattle skull — Sketchfab "Cow Skull": https://sketchfab.com/3d-models/cow-skull-83f4ee24948a4d338aad0afe1a3f41ed
- Smithsonian Open Access (CC0): https://3d.si.edu

If a downloaded model is > 25 MB, shrink it:
`bunx @gltf-transform/cli optimize in.glb out.glb --texture-size 1024 --texture-compress webp --compress quantize`
