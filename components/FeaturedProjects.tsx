import { Fragment } from "react";
import { projects } from "@/lib/data";
import FeaturedProject from "@/components/FeaturedProject";
import MoleculeDivider from "@/components/MoleculeDivider";

export default function FeaturedProjects() {
  return (
    <section className="projects" aria-label="Selected work">
      {projects.map((project, index) => (
        <Fragment key={project.id}>
          <FeaturedProject project={project} />
          {index < projects.length - 1 && <MoleculeDivider />}
        </Fragment>
      ))}
    </section>
  );
}
