"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import type { Group } from "three";
import { buildBoneSpecimen } from "@/lib/3d/bone-geometries";
import type { BonePosition, Species } from "@/lib/types";

function BoneSpecimen({
  species,
  position,
}: {
  species: Species;
  position: BonePosition;
}) {
  const ref = useRef<Group>(null);
  const entries = useMemo(
    () => buildBoneSpecimen(species, position),
    [species, position],
  );
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.35;
      ref.current.rotation.z = Math.sin(Date.now() * 0.00025) * 0.08;
    }
  });
  return (
    <group ref={ref}>
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

export function SplatPreviewViewer({
  glbUrl,
  species = "马",
  position = "股骨",
}: {
  glbUrl?: string;
  species?: Species;
  position?: BonePosition;
}) {
  const hasGlb = typeof glbUrl === "string" && glbUrl.length > 0;
  const label = hasGlb
    ? "SAM 3D · single-image reconstruction"
    : `SAM 3D 管线 · ${species}·${position} 离线数字标本`;
  const hint = hasGlb
    ? "drag to rotate · wheel to zoom"
    : "drag to rotate · wheel to zoom · procedural specimen";
  return (
    <div className="relative h-[420px] w-full overflow-hidden">
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
          <Suspense
            fallback={<BoneSpecimen species={species} position={position} />}
          >
            <Bounds fit clip observe margin={1.15}>
              <GlbModel url={glbUrl!} />
            </Bounds>
          </Suspense>
        ) : (
          <BoneSpecimen species={species} position={position} />
        )}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.9, 0]}
          receiveShadow
        >
          <circleGeometry args={[3.6, 64]} />
          <meshStandardMaterial color="#ebe4d2" roughness={1} />
        </mesh>
        <OrbitControls enableDamping makeDefault />
      </Canvas>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-sans text-[11px] tracking-[0.22em] text-ink-muted">
        <span>{label}</span>
        <span>{hint}</span>
      </div>
    </div>
  );
}
