import { CPK_COLORS, ELEMENT_LABELS } from "@/lib/chemistry/cpk";
import type { ElementSymbol } from "@/lib/chemistry/types";

const LEGEND_ELEMENTS: ElementSymbol[] = ["C", "O", "N", "H"];

export default function MoleculeLegend() {
  return (
    <aside className="molecule-legend" aria-label="Element color key">
      <ul className="molecule-legend__list">
        {LEGEND_ELEMENTS.map((element) => (
          <li key={element} className="molecule-legend__item">
            <span
              className={`molecule-legend__swatch${element === "H" ? " molecule-legend__swatch--h" : ""}`}
              style={{ backgroundColor: CPK_COLORS[element] }}
            />
            <span className="molecule-legend__label">{ELEMENT_LABELS[element]}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
