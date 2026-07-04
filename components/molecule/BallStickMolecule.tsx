"use client";

import {
  BOND_COLOR,
  BOND_RADIUS,
  COVALENT_RADIUS,
  CPK_COLORS,
} from "@/lib/chemistry/cpk";
import { centerAndScaleAtoms } from "@/lib/chemistry/geometry";
import type { Molecule } from "@/lib/chemistry/types";
import { useMemo } from "react";
import * as THREE from "three";

const VISUAL_SCALE = 0.38;

type BallStickMoleculeProps = {
  molecule: Molecule;
  targetSize?: number;
};

export default function BallStickMolecule({
  molecule,
  targetSize = 3.2,
}: BallStickMoleculeProps) {
  const atoms = useMemo(
    () => centerAndScaleAtoms(molecule.atoms, targetSize),
    [molecule.atoms, targetSize],
  );

  const bonds = useMemo(
    () =>
      molecule.bonds.map(([a, b]) => {
        const start = new THREE.Vector3(atoms[a].x, atoms[a].y, atoms[a].z);
        const end = new THREE.Vector3(atoms[b].x, atoms[b].y, atoms[b].z);
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        const direction = end.clone().sub(start);
        const length = direction.length();
        const orientation = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.normalize(),
        );
        const euler = new THREE.Euler().setFromQuaternion(orientation);
        return { start, end, midpoint, euler, length };
      }),
    [atoms, molecule.bonds],
  );

  return (
    <group>
      {bonds.map((bond, index) => (
        <mesh
          key={`bond-${index}`}
          position={bond.midpoint}
          rotation={bond.euler}
        >
          <cylinderGeometry args={[BOND_RADIUS, BOND_RADIUS, bond.length, 8]} />
          <meshPhysicalMaterial
            color={BOND_COLOR}
            roughness={0.35}
            metalness={0.05}
            clearcoat={0.4}
          />
        </mesh>
      ))}
      {atoms.map((atom, index) => {
        const radius = COVALENT_RADIUS[atom.element] * VISUAL_SCALE;
        const isHydrogen = atom.element === "H";
        return (
          <mesh key={`atom-${index}`} position={[atom.x, atom.y, atom.z]}>
            <sphereGeometry args={[radius, 12, 12]} />
            <meshPhysicalMaterial
              color={CPK_COLORS[atom.element]}
              roughness={isHydrogen ? 0.15 : 0.28}
              metalness={isHydrogen ? 0 : 0.08}
              clearcoat={0.85}
              clearcoatRoughness={0.12}
            />
          </mesh>
        );
      })}
    </group>
  );
}
