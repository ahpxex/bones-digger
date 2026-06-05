import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from "three";
import type { BonePosition, Species } from "@/lib/types";

export type GeometryEntry = {
  geometry: BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  color?: string;
};

type SpeciesMod = {
  scale: number;
  slenderness: number;
  robustness: number;
};

const SPECIES_MOD: Record<Species, SpeciesMod> = {
  马:   { scale: 1.05, slenderness: 1.25, robustness: 0.95 },
  黄牛: { scale: 1.00, slenderness: 0.85, robustness: 1.20 },
  水牛: { scale: 1.10, slenderness: 0.78, robustness: 1.28 },
  鹿:   { scale: 0.85, slenderness: 1.12, robustness: 0.82 },
  羊:   { scale: 0.72, slenderness: 0.95, robustness: 0.92 },
  猪:   { scale: 0.82, slenderness: 0.70, robustness: 1.05 },
  狗:   { scale: 0.62, slenderness: 1.00, robustness: 0.72 },
  未知: { scale: 1.00, slenderness: 1.00, robustness: 1.00 },
};

const BONE_COLOR = "#e8dcc0";
const ENAMEL_COLOR = "#f3ead6";
const SOCKET_COLOR = "#433529";
const GUM_COLOR = "#d8cbb1";

const RUMINANT: Species[] = ["黄牛", "水牛", "鹿", "羊"];
const CLOVEN: Species[] = ["黄牛", "水牛", "鹿", "羊", "猪"];

function wobbleLathe(geom: LatheGeometry, ampScale = 1): BufferGeometry {
  const pos = geom.attributes.position;
  if (!pos) {
    geom.computeVertexNormals();
    return geom;
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r < 0.02) continue;
    const theta = Math.atan2(z, x);
    const wobble =
      ampScale *
      0.006 *
      (Math.sin(theta * 7 + y * 3.1) +
        0.6 * Math.sin(theta * 13 + y * 5.2) +
        0.4 * Math.cos(theta * 5 - y * 2.1));
    const nr = r + wobble;
    pos.setX(i, (x / r) * nr);
    pos.setZ(i, (z / r) * nr);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

type LongBonePreset = {
  halfHeight: number;
  shaftRadius: number;
  epiphysisRadius: number;
  proximalBulge: number;
  distalBulge: number;
};

const LONG_BONE_PRESETS: Partial<Record<BonePosition, LongBonePreset>> = {
  股骨: { halfHeight: 1.55, shaftRadius: 0.14, epiphysisRadius: 0.42, proximalBulge: 1.0, distalBulge: 1.05 },
  肱骨: { halfHeight: 1.30, shaftRadius: 0.15, epiphysisRadius: 0.44, proximalBulge: 1.12, distalBulge: 1.0 },
  胫骨: { halfHeight: 1.50, shaftRadius: 0.13, epiphysisRadius: 0.40, proximalBulge: 1.05, distalBulge: 0.9 },
  桡骨: { halfHeight: 1.25, shaftRadius: 0.11, epiphysisRadius: 0.32, proximalBulge: 0.9, distalBulge: 1.0 },
  尺骨: { halfHeight: 1.30, shaftRadius: 0.10, epiphysisRadius: 0.30, proximalBulge: 1.18, distalBulge: 0.72 },
  掌骨: { halfHeight: 1.70, shaftRadius: 0.10, epiphysisRadius: 0.28, proximalBulge: 0.95, distalBulge: 1.0 },
  跖骨: { halfHeight: 1.75, shaftRadius: 0.10, epiphysisRadius: 0.28, proximalBulge: 0.95, distalBulge: 1.0 },
};

function buildLongBone(preset: LongBonePreset, mod: SpeciesMod): BufferGeometry {
  const H = preset.halfHeight * mod.slenderness;
  const R = preset.shaftRadius / Math.max(mod.slenderness, 0.7);
  const E = preset.epiphysisRadius * mod.robustness;
  const pH = preset.proximalBulge;
  const dH = preset.distalBulge;

  const profile: [number, number][] = [
    [0.0, -H],
    [E * dH * 0.55, -H],
    [E * dH * 0.85, -H * 0.98],
    [E * dH, -H * 0.93],
    [E * dH, -H * 0.88],
    [E * dH * 0.9, -H * 0.82],
    [E * dH * 0.72, -H * 0.75],
    [R * 1.35, -H * 0.65],
    [R * 1.12, -H * 0.55],
    [R, -H * 0.3],
    [R, 0.0],
    [R, H * 0.3],
    [R * 1.12, H * 0.55],
    [R * 1.35, H * 0.65],
    [E * pH * 0.72, H * 0.75],
    [E * pH * 0.9, H * 0.82],
    [E * pH, H * 0.88],
    [E * pH, H * 0.93],
    [E * pH * 0.85, H * 0.98],
    [E * pH * 0.55, H],
    [0.0, H],
  ];
  const points = profile.map(([x, y]) => new Vector2(x, y));
  const geom = new LatheGeometry(points, 80, 0, Math.PI * 2);
  return wobbleLathe(geom, 1);
}

function buildPhalanx(mod: SpeciesMod): GeometryEntry[] {
  const H = 0.55 * mod.scale;
  const R = 0.22 * mod.robustness;
  const E = 0.32 * mod.robustness;
  const profile: [number, number][] = [
    [0.0, -H],
    [E * 0.6, -H],
    [E, -H * 0.9],
    [E * 0.95, -H * 0.7],
    [R * 1.0, -H * 0.4],
    [R, 0.0],
    [R * 1.0, H * 0.4],
    [E * 0.95, H * 0.7],
    [E, H * 0.9],
    [E * 0.6, H],
    [0.0, H],
  ];
  const points = profile.map(([x, y]) => new Vector2(x, y));
  const geom = new LatheGeometry(points, 64, 0, Math.PI * 2);
  return [{ geometry: wobbleLathe(geom, 0.7), color: BONE_COLOR }];
}

function buildTalus(species: Species, mod: SpeciesMod): GeometryEntry[] {
  const S = 0.72 * mod.scale;
  if (species === "马") {
    const trochlea = new TorusGeometry(S * 0.58, S * 0.22, 24, 48, Math.PI);
    const body = new BoxGeometry(S * 1.3, S * 0.7, S * 0.75);
    return [
      { geometry: trochlea, rotation: [Math.PI / 2, 0, 0], position: [0, S * 0.1, 0], color: BONE_COLOR },
      { geometry: body, position: [0, -S * 0.3, 0], color: BONE_COLOR },
    ];
  }
  if (CLOVEN.includes(species)) {
    const bump = () => new TorusGeometry(S * 0.48, S * 0.17, 20, 40, Math.PI);
    const body = new BoxGeometry(S * 1.3, S * 0.6, S * 1.35);
    return [
      { geometry: bump(), position: [0, S * 0.05, -S * 0.35], rotation: [Math.PI / 2, 0, 0], color: BONE_COLOR },
      { geometry: bump(), position: [0, S * 0.05, S * 0.35], rotation: [Math.PI / 2, 0, 0], color: BONE_COLOR },
      { geometry: body, position: [0, -S * 0.35, 0], color: BONE_COLOR },
    ];
  }
  // Canid / unknown: compact trochlea
  const trochlea = new TorusGeometry(S * 0.5, S * 0.2, 24, 40, Math.PI);
  const body = new BoxGeometry(S * 1.1, S * 0.6, S * 0.7);
  return [
    { geometry: trochlea, rotation: [Math.PI / 2, 0, 0], position: [0, S * 0.08, 0], color: BONE_COLOR },
    { geometry: body, position: [0, -S * 0.28, 0], color: BONE_COLOR },
  ];
}

function buildCalcaneus(mod: SpeciesMod): GeometryEntry[] {
  const H = 1.1 * mod.scale * mod.slenderness;
  const W = 0.45 * mod.robustness;
  return [
    { geometry: new BoxGeometry(W * 0.8, H, W), color: BONE_COLOR },
    { geometry: new SphereGeometry(W * 0.6, 24, 16), position: [0, H / 2 + W * 0.1, 0], color: BONE_COLOR },
    { geometry: new SphereGeometry(W * 0.55, 24, 16), position: [0, -H / 2 + W * 0.15, W * 0.3], color: BONE_COLOR },
    { geometry: new BoxGeometry(W * 0.9, W * 0.5, W * 0.7), position: [0, -H / 2 + W * 0.2, -W * 0.2], color: BONE_COLOR },
  ];
}

function buildScapula(mod: SpeciesMod): GeometryEntry[] {
  const S = 1.6 * mod.scale;
  const shape = new Shape();
  shape.moveTo(0, S * 0.7);
  shape.quadraticCurveTo(-S * 0.9, S * 0.3, -S * 0.65, -S * 0.6);
  shape.quadraticCurveTo(-S * 0.3, -S * 0.85, 0, -S * 0.85);
  shape.quadraticCurveTo(S * 0.3, -S * 0.85, S * 0.65, -S * 0.6);
  shape.quadraticCurveTo(S * 0.9, S * 0.3, 0, S * 0.7);
  const blade = new ExtrudeGeometry(shape, {
    depth: 0.08 * mod.robustness,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  blade.translate(0, 0, -0.04);
  const ridge = new BoxGeometry(0.1, S * 1.25, 0.28 * mod.robustness);
  const glenoidSocket = new SphereGeometry(S * 0.18 * mod.robustness, 24, 16);
  return [
    { geometry: blade, color: BONE_COLOR },
    { geometry: ridge, position: [0, -0.1, 0.2 * mod.robustness], color: BONE_COLOR },
    { geometry: glenoidSocket, position: [0, -S * 0.85, 0], color: BONE_COLOR },
  ];
}

function buildJaw(
  kind: "下颌" | "上颌",
  species: Species,
  mod: SpeciesMod,
): GeometryEntry[] {
  const isCarnivore = species === "狗";
  const isUngulate = CLOVEN.includes(species) || species === "马";
  const L = (isUngulate ? 2.2 : 1.6) * mod.scale;
  const H = 0.42 * mod.robustness;
  const jawThickness = 0.16 * mod.robustness;

  const makeArm = (side: 1 | -1): GeometryEntry => {
    const shape = new Shape();
    shape.moveTo(0, -L / 2);
    shape.quadraticCurveTo(side * 0.25, 0, side * 0.42, L * 0.35);
    shape.lineTo(side * 0.35, L * 0.48);
    shape.lineTo(side * 0.1, L / 2);
    shape.lineTo(-side * 0.02, L / 2);
    shape.lineTo(-side * 0.02, -L / 2);
    shape.lineTo(0, -L / 2);
    const g = new ExtrudeGeometry(shape, {
      depth: H,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    return {
      geometry: g,
      rotation: [Math.PI / 2, 0, 0],
      position: [0, kind === "上颌" ? jawThickness * 0.5 : -jawThickness * 0.5, 0],
      color: BONE_COLOR,
    };
  };

  const teeth: GeometryEntry[] = [];
  const nTeeth = isCarnivore ? 6 : isUngulate ? 7 : 5;
  const teethY = kind === "上颌" ? -H * 0.4 : H * 0.4;
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < nTeeth; i++) {
      const t = i / Math.max(nTeeth - 1, 1);
      const z = -L * 0.35 + t * L * 0.78;
      const size = isCarnivore ? 0.085 : 0.095;
      teeth.push({
        geometry: new BoxGeometry(size * 0.9, size * (isCarnivore && (i === 2 || i === 4) ? 1.6 : 1.0), size * 0.9),
        position: [side * 0.36, teethY, z],
        color: ENAMEL_COLOR,
      });
    }
  }
  return [makeArm(-1), makeArm(1), ...teeth];
}

function buildCranium(species: Species, mod: SpeciesMod): GeometryEntry[] {
  const isUngulate = CLOVEN.includes(species) || species === "马";
  const snoutL = (isUngulate ? 1.5 : 0.95) * mod.scale;
  const vaultR = 0.55 * mod.scale;
  return [
    { geometry: new SphereGeometry(vaultR, 48, 32), position: [0, 0, -snoutL * 0.2], color: BONE_COLOR },
    {
      geometry: new BoxGeometry(vaultR * 1.05, vaultR * 0.82, snoutL),
      position: [0, -0.05, snoutL * 0.5],
      color: BONE_COLOR,
    },
    { geometry: new SphereGeometry(vaultR * 0.18, 20, 16), position: [-vaultR * 0.55, vaultR * 0.12, snoutL * 0.05], color: SOCKET_COLOR },
    { geometry: new SphereGeometry(vaultR * 0.18, 20, 16), position: [vaultR * 0.55, vaultR * 0.12, snoutL * 0.05], color: SOCKET_COLOR },
    { geometry: new SphereGeometry(vaultR * 0.1, 14, 10), position: [0, -vaultR * 0.2, snoutL * 1.0], color: SOCKET_COLOR },
  ];
}

function buildTooth(mod: SpeciesMod): GeometryEntry[] {
  const W = 0.32 * mod.scale;
  const H = 0.6 * mod.scale;
  const crown = new CylinderGeometry(W * 0.5, W * 0.48, H * 0.4, 24);
  const root = new CylinderGeometry(W * 0.4, W * 0.15, H * 0.7, 24);
  return [
    { geometry: crown, position: [0, H * 0.35, 0], color: ENAMEL_COLOR },
    { geometry: root, position: [0, -H * 0.15, 0], color: BONE_COLOR },
  ];
}

function buildDentalStrip(species: Species, mod: SpeciesMod): GeometryEntry[] {
  const isCarnivore = species === "狗";
  const n = isCarnivore ? 10 : 14;
  const spacing = 0.18 * mod.scale;
  const base = new BoxGeometry(n * spacing + 0.1, 0.12, 0.25);
  const out: GeometryEntry[] = [
    { geometry: base, position: [0, -0.06, 0], color: GUM_COLOR },
  ];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * spacing;
    const isCanine = isCarnivore && (i === 3 || i === 6);
    const h = isCanine ? 0.38 : 0.22;
    out.push({
      geometry: new BoxGeometry(0.13, h, 0.17),
      position: [x, h / 2, 0],
      color: ENAMEL_COLOR,
    });
  }
  return out;
}

function buildVertebra(
  kind: "寰椎" | "枢椎",
  mod: SpeciesMod,
): GeometryEntry[] {
  const R = 0.55 * mod.scale;
  const ring = new TorusGeometry(R, R * 0.2, 20, 40);
  const wing = new BoxGeometry(R * 1.55, R * 0.14, R * 0.55);
  const entries: GeometryEntry[] = [
    { geometry: ring, rotation: [Math.PI / 2, 0, 0], color: BONE_COLOR },
    { geometry: wing, color: BONE_COLOR },
  ];
  if (kind === "枢椎") {
    const peg = new CylinderGeometry(R * 0.13, R * 0.17, R * 1.1, 20);
    entries.push({ geometry: peg, position: [0, 0, R * 0.5], rotation: [Math.PI / 2, 0, 0], color: BONE_COLOR });
  }
  return entries;
}

function clovenDistalBumps(preset: LongBonePreset, mod: SpeciesMod): GeometryEntry[] {
  const H = preset.halfHeight * mod.slenderness;
  const E = preset.epiphysisRadius * mod.robustness;
  return [
    { geometry: new SphereGeometry(E * 0.55, 22, 16), position: [-E * 0.55, -H * 1.03, 0], color: BONE_COLOR },
    { geometry: new SphereGeometry(E * 0.55, 22, 16), position: [E * 0.55, -H * 1.03, 0], color: BONE_COLOR },
  ];
}

export function buildBoneSpecimen(
  species: Species,
  position: BonePosition,
): GeometryEntry[] {
  const mod = SPECIES_MOD[species] ?? SPECIES_MOD["未知"];
  const longBonePreset = LONG_BONE_PRESETS[position];

  if (longBonePreset) {
    const shaft: GeometryEntry = { geometry: buildLongBone(longBonePreset, mod), color: BONE_COLOR };
    if ((position === "掌骨" || position === "跖骨") && RUMINANT.includes(species)) {
      return [shaft, ...clovenDistalBumps(longBonePreset, mod)];
    }
    return [shaft];
  }

  switch (position) {
    case "趾骨":
      return buildPhalanx(mod);
    case "距骨":
      return buildTalus(species, mod);
    case "跟骨":
      return buildCalcaneus(mod);
    case "肩胛骨":
      return buildScapula(mod);
    case "下颌":
    case "上颌":
      return buildJaw(position, species, mod);
    case "头骨":
      return buildCranium(species, mod);
    case "牙齿":
      return buildTooth(mod);
    case "齿式":
      return buildDentalStrip(species, mod);
    case "寰椎":
      return buildVertebra("寰椎", mod);
    case "枢椎":
      return buildVertebra("枢椎", mod);
    default:
      return [
        { geometry: buildLongBone(LONG_BONE_PRESETS["股骨"]!, mod), color: BONE_COLOR },
      ];
  }
}
