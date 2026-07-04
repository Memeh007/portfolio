import type { Project } from "@/lib/data";

type FeaturedProjectProps = {
  project: Project;
};

export default function FeaturedProject({ project }: FeaturedProjectProps) {
  return (
    <article className="project" aria-labelledby={`project-${project.id}`}>
      <h2
        id={`project-${project.id}`}
        className="project__title"
        style={{ color: project.accent }}
      >
        {project.title}
      </h2>

      <p className="project__tag">{project.tag}</p>

      <p className="project__blurb">
        {project.blurb.map((segment, index) =>
          segment.type === "term" ? (
            <span key={index} className="project__term">
              {segment.value}
            </span>
          ) : (
            <span key={index}>{segment.value}</span>
          ),
        )}
      </p>

      <ul className="project__tech" aria-label="Technologies used">
        {project.technologies.map((tech) => (
          <li key={tech}>
            <span className="project__pill">{tech}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
