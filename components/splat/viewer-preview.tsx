"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import { BufferGeometry, Mesh, Vector2 } from "three";
import { LatheGeometry } from "three";

/**
 * Hand-crafted long-bone profile, revolved around Y axis.
 * x is radial distance from axis; y is height. Smooth-curve through these
 * points yields a femur-like shape with two epiphyseal bulges.
 */
function buildBoneGeometry(): BufferGeometry {
  // Long-bone silhouette revolved around Y. Tuned for femur-like slender
  // shaft with clear dual epiphyseal bulges. Tall & narrow overall.
  // Half-height ~ 1.6, shaft radius ~ 0.14, epiphysis radius ~ 0.42.
  const profile: [number, number][] = [
    [0.0, -1.55],
    [0.22, -1.55],
    [0.35, -1.52],
    [0.42, -1.45],
    [0.44, -1.36],
    [0.42, -1.27],
    [0.36, -1.18],
    [0.27, -1.08],
    [0.2, -0.95],
    [0.16, -0.8],
    [0.14, -0.5],
    [0.14, 0.0],
    [0.14, 0.5],
    [0.16, 0.8],
    [0.2, 0.95],
    [0.28, 1.08],
    [0.36, 1.18],
    [0.42, 1.27],
    [0.44, 1.36],
    [0.42, 1.45],
    [0.35, 1.52],
    [0.22, 1.55],
    [0.0, 1.55],
  ];
  const points = profile.map(([x, y]) => new Vector2(x, y));
  const geom = new LatheGeometry(points, 80, 0, Math.PI * 2);

  // Subtle surface irregularities so it doesn't look plastic-injected.
  const pos = geom.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const r = Math.sqrt(x * x + z * z);
      if (r < 0.02) continue;
      const theta = Math.atan2(z, x);
      const wobble =
        0.006 *
        (Math.sin(theta * 7 + y * 3.1) +
          0.6 * Math.sin(theta * 13 + y * 5.2) +
          0.4 * Math.cos(theta * 5 - y * 2.1));
      const nr = r + wobble;
      pos.setX(i, (x / r) * nr);
      pos.setZ(i, (z / r) * nr);
    }
    pos.needsUpdate = true;
  }
  geom.computeVertexNormals();
  return geom;
}

function BonePlaceholder() {
  const ref = useRef<Mesh>(null);
  const geom = useMemo(() => buildBoneGeometry(), []);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.35;
      ref.current.rotation.z = Math.sin(Date.now() * 0.00025) * 0.08;
    }
  });

  return (
    <mesh ref={ref} geometry={geom} castShadow receiveShadow>
      <meshStandardMaterial
        color="#e8dcc0"
        roughness={0.85}
        metalness={0.04}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

function GlbModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene} />;
}

export function SplatPreviewViewer({ glbUrl }: { glbUrl?: string }) {
  const hasGlb = typeof glbUrl === "string" && glbUrl.length > 0;
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
          <Suspense fallback={<BonePlaceholder />}>
            <Bounds fit clip observe margin={1.15}>
              <GlbModel url={glbUrl!} />
            </Bounds>
          </Suspense>
        ) : (
          <BonePlaceholder />
        )}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.9, 0]}
          receiveShadow
        >
          <circleGeometry args={[3.6, 64]} />
          <meshStandardMaterial color="#ebe4d2" roughness={1} />
        </mesh>
        {hasGlb && <OrbitControls enableDamping makeDefault />}
      </Canvas>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-sans text-[11px] tracking-[0.22em] text-ink-muted">
        <span>
          {hasGlb
            ? "SAM 3D · single-image reconstruction"
            : "骨鉴示意 · procedural long-bone geometry"}
        </span>
        <span>
          {hasGlb
            ? "drag to rotate · wheel to zoom"
            : "SAM 3D 真重建需配置 FAL_KEY"}
        </span>
      </div>
    </div>
  );
}
