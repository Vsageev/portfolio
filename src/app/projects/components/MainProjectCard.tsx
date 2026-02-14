import Link from "next/link";
import Image from "next/image";
import { MainProject } from "@/data/mainProjects";
import styles from "../page.module.css";

type MainProjectCardProps = {
  project: MainProject;
};

export function MainProjectCard({ project }: MainProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`} className={styles.mainProjectCard}>
      <div className={styles.mainProjectImageContainer}>
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.mainProjectImage}
        />
      </div>
      <div className={styles.mainProjectContent}>
        <h3 className={styles.mainProjectTitle}>{project.title}</h3>
        <p className={styles.mainProjectDescription}>{project.description}</p>
      </div>
    </Link>
  );
}
