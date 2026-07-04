import { labSkillCategories } from "@/lib/data";

export default function LaboratoryMatrix() {
  return (
    <section className="lab-matrix" aria-labelledby="lab-skills-heading">
      <h2 id="lab-skills-heading" className="lab-matrix__heading">
        biochemistry &amp; laboratory engineering
      </h2>

      <ul className="lab-matrix__groups">
        {labSkillCategories.map((category) => (
          <li key={category.domain} className="lab-matrix__group">
            <span className="lab-matrix__category">{category.domain}</span>
            <ul className="lab-matrix__tags" aria-label={category.domain}>
              {category.skills.map((skill) => (
                <li key={skill}>
                  <span className="lab-matrix__tag">{skill}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
