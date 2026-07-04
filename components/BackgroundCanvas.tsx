"use client";

import dynamic from "next/dynamic";
import { caffeine } from "@/data/molecules/caffeine";
import MoleculeLegend from "@/components/molecule/MoleculeLegend";

const MoleculeScene = dynamic(() => import("@/components/molecule/MoleculeScene"), {
  ssr: false,
});

export default function BackgroundCanvas() {
  return (
    <div className="background-canvas" aria-hidden="true">
      <MoleculeScene molecule={caffeine} />
      <MoleculeLegend />
    </div>
  );
}
