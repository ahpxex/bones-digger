"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function BonePlaceholder() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.35;
      ref.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.2;
    }
  });

  return (
    <mesh ref={ref} castShadow>
      <capsuleGeometry args={[0.6, 2.4, 12, 24]} />
      <meshStandardMaterial
        color="#e8ddc2"
        roughness={0.78}
        metalness={0.08}
      />
    </mesh>
  );
}

export function SplatPreviewViewer() {
  return (
    <div className="relative h-[420px] w-full overflow-hidden">
      <Canvas
        camera={{ position: [3.2, 1.5, 3.5], fov: 35 }}
        className="!bg-transparent"
        shadows
      >
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.3}
          color="#fef7e0"
          castShadow
        />
        <directionalLight
          position={[-4, -2, -3]}
          intensity={0.5}
          color="#b89766"
        />
        <BonePlaceholder />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.8, 0]}
          receiveShadow
        >
          <circleGeometry args={[4, 48]} />
          <meshStandardMaterial
            color="#ebe4d2"
            roughness={1}
          />
        </mesh>
      </Canvas>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-sans text-[11px] tracking-[0.22em] text-ink-muted">
        <span>3D Gaussian Splatting · placeholder</span>
        <span>future: 手机环拍 50-150 张 → splatfacto → .splat</span>
      </div>
    </div>
  );
}
