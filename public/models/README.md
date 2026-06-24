# 3D 物种模型 (species 3D models)

The result-page 3D viewer loads a per-species GLB from this folder:

- `horse.glb`  → shown when the verdict is **马** (horse)
- `cattle.glb` → shown when the verdict is **黄牛** (cattle)

If a file is missing/fails to load, the viewer falls back to the built-in
procedural bone mesh — nothing breaks. Wired in
`src/components/splat/viewer-preview.tsx`.

## Currently bundled (auto-downloaded)

- `horse.glb`  — the classic three.js sample horse (animated), from
  `mrdoob/three.js` `examples/models/gltf/Horse.glb`.
- `cattle.glb` — cow from Mozilla **Hubs** animal avatars
  (`Hubs-Foundation/hubs-blender-files`).

These are stylized low-poly placeholders — fine for the demo, swappable anytime.

## Swapping for a higher-fidelity model (≈1 min)

Download a **GLB** (keep it < ~15 MB for fast demo load) and overwrite the file:

- Cattle skull — Sketchfab "Cow Skull": https://sketchfab.com/3d-models/cow-skull-83f4ee24948a4d338aad0afe1a3f41ed
- Horse skeleton — Sketchfab "Horse Skeleton": https://sketchfab.com/3d-models/horse-skeleton-eaca504567604e879b8ab2cf2763025e
- Smithsonian Open Access (CC0, no attribution): https://3d.si.edu

On Sketchfab: open model → **Download 3D Model** → choose **glTF/GLB** →
rename to `horse.glb` / `cattle.glb` → replace here.
