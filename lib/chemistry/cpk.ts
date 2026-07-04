import type { ElementSymbol } from "./types";

/** Standard CPK element colors on light backgrounds. */
export const CPK_COLORS: Record<ElementSymbol, string> = {
  C: "#0a0a0a",
  O: "#e02020",
  N: "#2040e0",
  H: "#ffffff",
};

/** Covalent radii in angstroms — scaled for ball-and-stick rendering. */
export const COVALENT_RADIUS: Record<ElementSymbol, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
};

export const BOND_COLOR = "#b0b0b0";
export const BOND_RADIUS = 0.085;

export const ELEMENT_LABELS: Record<ElementSymbol, string> = {
  C: "Carbon",
  O: "Oxygen",
  N: "Nitrogen",
  H: "Hydrogen",
};

const ATOMIC_NUMBER_TO_SYMBOL: Record<number, ElementSymbol> = {
  1: "H",
  6: "C",
  7: "N",
  8: "O",
};

export function atomicNumberToSymbol(atomicNumber: number): ElementSymbol | null {
  return ATOMIC_NUMBER_TO_SYMBOL[atomicNumber] ?? null;
}
