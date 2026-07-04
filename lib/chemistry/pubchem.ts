import { atomicNumberToSymbol } from "./cpk";
import type { Atom, Molecule } from "./types";

type PubChem3DResponse = {
  PC_Compounds: Array<{
    id: { id: { cid: number } };
    atoms: { element: number[] };
    bonds: { aid1: number[]; aid2: number[] };
    coords: Array<{
      conformers: Array<{
        x: number[];
        y: number[];
        z: number[];
      }>;
    }>;
  }>;
};

/**
 * Fetch a PubChem 3D conformer and parse it into a Molecule.
 * https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
 */
export async function fetchPubChem3D(
  cid: number,
  meta: Pick<Molecule, "id" | "name" | "formula">,
): Promise<Molecule> {
  const response = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/JSON?record_type=3d`,
  );

  if (!response.ok) {
    throw new Error(`PubChem request failed: ${response.status}`);
  }

  const data = (await response.json()) as PubChem3DResponse;
  const compound = data.PC_Compounds[0];
  const conformer = compound.coords[0]?.conformers[0];

  if (!conformer) {
    throw new Error(`No 3D conformer found for CID ${cid}`);
  }

  const atoms: Atom[] = compound.atoms.element.map((atomicNumber, index) => {
    const element = atomicNumberToSymbol(atomicNumber);
    if (!element) {
      throw new Error(`Unsupported atomic number: ${atomicNumber}`);
    }

    return {
      element,
      x: conformer.x[index],
      y: conformer.y[index],
      z: conformer.z[index],
    };
  });

  const bonds: [number, number][] = compound.bonds.aid1.map((aid1, index) => {
    const aid2 = compound.bonds.aid2[index];
    return [aid1 - 1, aid2 - 1] as [number, number];
  });

  return {
    ...meta,
    pubchemCid: cid,
    atoms,
    bonds,
  };
}
