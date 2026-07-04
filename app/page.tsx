import BackgroundCanvasLoader from "@/components/BackgroundCanvasLoader";
import FeaturedProjects from "@/components/FeaturedProjects";
import LandingHero from "@/components/LandingHero";
import LoadingGate from "@/components/loading/LoadingGate";
import SiteFooter from "@/components/SiteFooter";
import SkillsMatrix from "@/components/SkillsMatrix";
import LaboratoryMatrix from "@/components/LaboratoryMatrix";

export default function Home() {
  return (
    <LoadingGate>
      <BackgroundCanvasLoader />

      <main className="page">
        <LandingHero />
        <SkillsMatrix />
        <LaboratoryMatrix />
        <FeaturedProjects />
        <SiteFooter />
      </main>
    </LoadingGate>
  );
}
