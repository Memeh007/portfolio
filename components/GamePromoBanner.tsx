import { site } from "@/lib/data";
import { withBasePath } from "@/lib/base-path";

export default function GamePromoBanner() {
  const spriteUrl = withBasePath("/8bitgame/player-sprite.png");

  return (
    <a
      href={site.gamePromo.href}
      className="game-promo"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${site.gamePromo.label} — opens Pixel Warriors in a new tab`}
    >
      <span
        className="game-promo__sprite"
        style={{ backgroundImage: `url("${spriteUrl}")` }}
        aria-hidden="true"
      />
      <span className="game-promo__label">{site.gamePromo.label}</span>
    </a>
  );
}
