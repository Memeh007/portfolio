import FeaturedProjects from "@/components/FeaturedProjects";
import GamePromoBanner from "@/components/GamePromoBanner";
import HomeInteractiveShell from "@/components/HomeInteractiveShell";
import LandingHero from "@/components/LandingHero";
import LaboratoryMatrix from "@/components/LaboratoryMatrix";
import SiteFooter from "@/components/SiteFooter";
import SkillsMatrix from "@/components/SkillsMatrix";

export default function Home() {
  return (
    <>
      <GamePromoBanner />
      <HomeInteractiveShell>
        <main className="page">
          <LandingHero />
          <SkillsMatrix />
          <LaboratoryMatrix />
          <FeaturedProjects />
          <SiteFooter />
        </main>
      </HomeInteractiveShell>
    </>
  );
}
