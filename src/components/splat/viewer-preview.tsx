import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds } from "@react-three/drei";
import { Component, Suspense, useMemo, useState, type ReactNode } from "react";
import { buildBoneSpecimen } from "@/lib/3d/bone-geometries";
import type { BonePosition, Species } from "@/lib/types";
import { ClientOnly } from "@/components/ui/client-only";

/**
 * Static per-species reference specimens. Drop GLB files into `public/models/`
 * (`horse.glb` / `cattle.glb`) and they load automatically; if a file is absent
 * the viewer falls back to the procedural specimen (no breakage). See
 * `public/models/README.md`.
 */
const SPECIMEN_MODELS: Record<string, string> = {
  马: "/models/horse.glb",
  黄牛: "/models/cattle.glb",
};

export function specimenModelFor(species: Species): string | undefined {
  return SPECIMEN_MODELS[species];
}

/** Falls back to the procedural mesh if a GLB fails to load (e.g. 404). */
class ModelBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function BoneSpecimen({
  species,
  position,
}: {
  species: Species;
  position: BonePosition;
}) {
  const entries = useMemo(
    () => buildBoneSpecimen(species, position),
    [species, position],
  );
  return (
    <group>
      {entries.map((e, i) => (
        <mesh
          key={i}
          geometry={e.geometry}
          position={e.position}
          rotation={e.rotation}
          scale={e.scale}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={e.color ?? "#e8dcc0"}
            roughness={0.85}
            metalness={0.04}
            envMapIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function GlbModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene} />;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}

export function SplatPreviewViewer({
  glbUrl,
  reconstruction = false,
  species = "马",
  position = "股骨",
}: {
  glbUrl?: string;
  /** True only for a genuine SAM-3D reconstruction of the uploaded image. */
  reconstruction?: boolean;
  species?: Species;
  position?: BonePosition;
}) {
  const hasGlb = typeof glbUrl === "string" && glbUrl.length > 0;
  // Gentle orbit until the viewer touches it — never fights an inspecting judge,
  // and respects reduced-motion.
  const [interacted, setInteracted] = useState(false);
  const autoRotate = !interacted && !prefersReducedMotion();

  const label = reconstruction
    ? "SAM 3D · single-image reconstruction"
    : `${species} · 物种三维模型`;
  const hint = "拖拽旋转 · 滚轮缩放";

  const fallback = <BoneSpecimen species={species} position={position} />;

  return (
    <div className="relative h-[420px] w-full overflow-hidden">
      <ClientOnly
        fallback={
          <div className="absolute inset-0 grid place-items-center font-sans text-[12px] tracking-[0.22em] text-ink-muted">
            加载三维标本 …
          </div>
        }
      >
        <Canvas
          camera={{ position: [3.2, 0.1, 7.0], fov: 28 }}
          className="!bg-transparent"
          shadows
        >
          <ambientLight intensity={0.45} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.4}
            color="#fef7e0"
            castShadow
          />
          <directionalLight
            position={[-5, -1, -3]}
            intensity={0.55}
            color="#b89766"
          />
          <directionalLight
            position={[0, 2, -6]}
            intensity={0.3}
            color="#9d2b33"
          />
          {hasGlb ? (
            <ModelBoundary fallback={fallback}>
              <Suspense fallback={fallback}>
                <Bounds fit clip observe margin={1.15}>
                  <GlbModel url={glbUrl!} />
                </Bounds>
              </Suspense>
            </ModelBoundary>
          ) : (
            fallback
          )}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1.9, 0]}
            receiveShadow
          >
            <circleGeometry args={[3.6, 64]} />
            <meshStandardMaterial color="#ebe4d2" roughness={1} />
          </mesh>
          <OrbitControls
            enableDamping
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={0.9}
            onStart={() => setInteracted(true)}
          />
        </Canvas>
      </ClientOnly>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-sans text-[11px] tracking-[0.22em] text-ink-muted">
        <span>{label}</span>
        <span>{hint}</span>
      </div>
    </div>
  );
}
