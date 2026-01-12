import styles from "../app/page.module.css";

export type Project = {
  id: number;
  name: string;
  day: string;
  description: string;
  projectUrl: string;
  youtubeUrl: string;
  gifUrl: string;
};

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.projectDate}>{project.day}</div>
        <h3 className={styles.projectName}>{project.name}</h3>
        <p style={{ color: 'var(--accents-5)', fontSize: '0.875rem' }}>
          {project.description}
        </p>
      </div>
      {project.gifUrl && (
        <div className={styles.gifContainer}>
          <img src={project.gifUrl} alt={project.name} className={styles.gif} />
        </div>
      )}
      <div className={styles.cardActions}>
        <a href={project.projectUrl} className={`${styles.button} ${styles.primaryButton}`}>
          View Project
        </a>
        <a href={project.youtubeUrl} className={`${styles.button} ${styles.secondaryButton}`}>
          Watch Video
        </a>
      </div>
    </div>
  );
}
