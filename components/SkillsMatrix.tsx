import { skillGroups } from "@/lib/data";

export default function SkillsMatrix() {
  return (
    <section className="skills" aria-labelledby="skills-heading">
      <h2 id="skills-heading" className="skills__heading">
        software / stack
      </h2>

      <ul className="skills__groups">
        {skillGroups.map((group) => (
          <li key={group.level} className="skills__group">
            <span className="skills__level">{group.level}</span>
            <ul className="skills__tags" aria-label={`${group.level} skills`}>
              {group.skills.map((skill) => (
                <li key={skill}>
                  <span className="skills__tag">{skill}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
