"use client";

import {
  BOND_COLOR,
  BOND_RADIUS,
  COVALENT_RADIUS,
  CPK_COLORS,
} from "@/lib/chemistry/cpk";
import { centerAndScaleAtoms } from "@/lib/chemistry/geometry";
import type { Atom, Molecule } from "@/lib/chemistry/types";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";

const VISUAL_SCALE = 0.38;

function AtomSphere({ atom }: { atom: Atom }) {
  const radius = COVALENT_RADIUS[atom.element] * VISUAL_SCALE;
  const isHydrogen = atom.element === "H";

  return (
    <mesh position={[atom.x, atom.y, atom.z]}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshPhysicalMaterial
        color={CPK_COLORS[atom.element]}
        roughness={isHydrogen ? 0.15 : 0.28}
        metalness={isHydrogen ? 0 : 0.08}
        clearcoat={0.85}
        clearcoatRoughness={0.12}
        reflectivity={0.6}
        envMapIntensity={0.9}
      />
    </mesh>
  );
}

function BondCylinder({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const { position, rotation, length } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midpoint = startVec.clone().add(endVec).multiplyScalar(0.5);
    const direction = endVec.clone().sub(startVec);
    const bondLength = direction.length();

    const orientation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    const euler = new THREE.Euler().setFromQuaternion(orientation);

    return {
      position: midpoint,
      rotation: euler,
      length: bondLength,
    };
  }, [start, end]);

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[BOND_RADIUS, BOND_RADIUS, length, 12]} />
      <meshPhysicalMaterial
        color={BOND_COLOR}
        roughness={0.35}
        metalness={0.05}
        clearcoat={0.4}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

function MoleculeModel({ molecule }: { molecule: Molecule }) {
  const groupRef = useRef<Group>(null);

  const atoms = useMemo(
    () => centerAndScaleAtoms(molecule.atoms, 3.4),
    [molecule.atoms],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.1;
    groupRef.current.rotation.x += delta * 0.03;
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {molecule.bonds.map(([a, b], index) => (
        <BondCylinder
          key={`bond-${index}`}
          start={[atoms[a].x, atoms[a].y, atoms[a].z]}
          end={[atoms[b].x, atoms[b].y, atoms[b].z]}
        />
      ))}
      {atoms.map((atom, index) => (
        <AtomSphere key={`atom-${index}`} atom={atom} />
      ))}
    </group>
  );
}

export default function MoleculeScene({ molecule }: { molecule: Molecule }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} />
      <directionalLight position={[-4, -2, 5]} intensity={0.35} />
      <directionalLight position={[0, -4, 2]} intensity={0.2} />
      <MoleculeModel molecule={molecule} />
    </Canvas>
  );
}
