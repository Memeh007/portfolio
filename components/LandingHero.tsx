import { site } from "@/lib/data";
import { withBasePath } from "@/lib/base-path";

export default function LandingHero() {
  return (
    <section className="hero" aria-labelledby="site-title">
      <h1 id="site-title" className="hero__title">
        {site.name}
      </h1>
      <p className="hero__subtitle">{site.tagline}</p>

      <a href={withBasePath(site.resume.href)} className="hero__cv" download>
        {site.resume.label}
      </a>
    </section>
  );
}
