import { Layout } from "@/components/Layout";
import { ProjectCard } from "@/app/ProjectCard";
import { projects } from "@/data/projects";
import styles from "./page.module.css";

export default function Home() {
  return (
    <Layout activeTab="apprequest">
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </Layout>
  );
}
