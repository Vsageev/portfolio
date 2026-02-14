import { projects } from "@/data/projects";
import { ProjectCard } from "./components/ProjectCard";
import { MainProjectCard } from "./components/MainProjectCard";
import { getAllProjects } from "@/lib/markdown";
import { ProjectsTabs } from "./components/ProjectsTabs";
import styles from "./page.module.css";

export default function ProjectsPage() {
  const mainProjects = getAllProjects();

  return (
    <ProjectsTabs
      mainProjects={mainProjects}
      appOfDayProjects={projects}
    />
  );
}
