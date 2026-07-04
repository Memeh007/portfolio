"use client";

import { caffeine } from "@/data/molecules/caffeine";
import MoleculeLegend from "@/components/molecule/MoleculeLegend";
import MoleculeScene from "@/components/molecule/MoleculeScene";

export default function BackgroundCanvas() {
  return (
    <div className="background-canvas" aria-hidden="true">
      <MoleculeScene molecule={caffeine} />
      <MoleculeLegend />
    </div>
  );
}
