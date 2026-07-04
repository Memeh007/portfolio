const BOND_STROKE = "#000000";
const BOND_WIDTH = 1.25;

/** Serotonin (5-HT) skeleton — horizontal 2D line structure for section dividers. */
const BONDS: readonly [number, number, number, number][] = [
  [26, 38, 36, 38],
  [36, 38, 42, 32],
  [42, 32, 56, 24],
  [56, 24, 74, 24],
  [74, 24, 90, 32],
  [90, 32, 90, 38],
  [90, 38, 74, 46],
  [74, 46, 56, 46],
  [56, 46, 42, 38],
  [56, 24, 66, 14],
  [66, 14, 82, 20],
  [82, 20, 90, 32],
  [42, 32, 36, 22],
  [36, 22, 22, 22],
  [90, 38, 108, 38],
  [108, 38, 126, 38],
  [126, 38, 144, 38],
  [144, 38, 162, 38],
];

const HETEROATOMS = [
  { x: 18, y: 22, element: "O" as const },
  { x: 66, y: 14, element: "N" as const },
  { x: 168, y: 38, element: "N" as const },
];

const CPK = {
  O: "#ff0000",
  N: "#0000ff",
};

export default function MoleculeDivider() {
  return (
    <div className="molecule-divider" aria-hidden="true">
      <svg
        className="molecule-divider__svg"
        viewBox="0 0 186 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Serotonin molecular structure"
      >
        <g
          stroke={BOND_STROKE}
          strokeWidth={BOND_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {BONDS.map(([x1, y1, x2, y2], index) => (
            <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
        {HETEROATOMS.map(({ x, y, element }) => (
          <circle
            key={`${element}-${x}-${y}`}
            cx={x}
            cy={y}
            r={2.75}
            fill={CPK[element]}
          />
        ))}
      </svg>
    </div>
  );
}
