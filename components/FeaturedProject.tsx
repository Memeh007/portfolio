import type { Project } from "@/lib/data";

type FeaturedProjectProps = {
  project: Project;
};

export default function FeaturedProject({ project }: FeaturedProjectProps) {
  const title = (
    <h2
      id={`project-${project.id}`}
      className="project__title"
      style={{ color: project.accent }}
    >
      {project.title}
    </h2>
  );

  return (
    <article className="project" aria-labelledby={`project-${project.id}`}>
      {project.href ? (
        <a
          href={project.href}
          className="project__title-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {title}
        </a>
      ) : (
        title
      )}

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

      {(project.href || project.repository) && (
        <p className="project__links">
          {project.href && (
            <a
              href={project.href}
              className="project__play-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              play now →
            </a>
          )}
          {project.repository && (
            <a
              href={project.repository}
              className="project__repo-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              source
            </a>
          )}
        </p>
      )}

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
