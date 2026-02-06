import { Project } from "@/data/projects";
import styles from "../page.module.css";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.dayLabel}>{project.day}</div>
      <h3 className={styles.projectName}>{project.name}</h3>
      <p className={styles.description}>{project.description}</p>

      {project.gifUrl && (
        <div className={styles.gifContainer}>
          <img src={project.gifUrl} alt={project.name} className={styles.gif} />
        </div>
      )}

      <div className={styles.cardActions}>
        <a
          href={project.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.btnPrimary}
        >
          View Project
        </a>
        <a
          href={project.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.btnSecondary}
        >
          Watch Video
        </a>
      </div>
    </div>
  );
}
