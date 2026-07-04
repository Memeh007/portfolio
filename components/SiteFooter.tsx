import { site } from "@/lib/data";
import { withBasePath } from "@/lib/base-path";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <a href={withBasePath(site.resume.href)} className="footer__cv" download>
        {site.resume.label}
      </a>
      <p className="footer__copy">
        © {new Date().getFullYear()} {site.name}
      </p>
    </footer>
  );
}
