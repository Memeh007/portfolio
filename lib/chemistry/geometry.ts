import type { Atom } from "./types";

export function centerAndScaleAtoms(atoms: Atom[], targetSize = 2.8): Atom[] {
  if (atoms.length === 0) return atoms;

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const atom of atoms) {
    minX = Math.min(minX, atom.x);
    minY = Math.min(minY, atom.y);
    minZ = Math.min(minZ, atom.z);
    maxX = Math.max(maxX, atom.x);
    maxY = Math.max(maxY, atom.y);
    maxZ = Math.max(maxZ, atom.z);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const scale = targetSize / extent;

  return atoms.map((atom) => ({
    ...atom,
    x: (atom.x - cx) * scale,
    y: (atom.y - cy) * scale,
    z: (atom.z - cz) * scale,
  }));
}
