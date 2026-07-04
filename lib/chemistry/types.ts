export type ElementSymbol = "H" | "C" | "N" | "O";

export type Atom = {
  element: ElementSymbol;
  x: number;
  y: number;
  z: number;
};

export type Molecule = {
  id: string;
  name: string;
  formula: string;
  pubchemCid: number;
  atoms: Atom[];
  bonds: [number, number][];
};
