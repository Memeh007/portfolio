"use client";

import { projectCategories, type Project } from "@/data/projects";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

function ProjectRow({
  project,
  index,
  isOpen,
  onToggle,
}: {
  project: Project;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="projects__row">
      <button
        type="button"
        className="projects__trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="projects__id">{String(index + 1).padStart(2, "0")}</span>
        <span className="projects__name">{project.name}</span>
        <span className="projects__indicator" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="panel"
            className="projects__panel-outer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="projects__panel">
              <p className="projects__desc">{project.description}</p>
              <p className="projects__stack">
                <span className="label">stack</span>
                {project.stack.join(" · ")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function ProjectList() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const toggle = useCallback((slug: string) => {
    setOpenSlug((current) => (current === slug ? null : slug));
  }, []);

  return (
    <section className="projects" aria-labelledby="projects-heading">
      <span className="label projects__index">002 / projects</span>
      <h2 id="projects-heading" className="sr-only">
        Projects
      </h2>

      <div className="projects__sections">
        {projectCategories.map((category) => (
          <div key={category.id} className="projects__category">
            <p className="projects__category-label">
              <span className="projects__tag">[{category.tag}]</span>
              {category.label}
            </p>

            <ul className="projects__list">
              {category.projects.map((project, index) => (
                <ProjectRow
                  key={project.slug}
                  project={project}
                  index={index}
                  isOpen={openSlug === project.slug}
                  onToggle={() => toggle(project.slug)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
