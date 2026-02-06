"use client";

import { useState } from "react";
import { projects } from "@/data/projects";
import { ProjectCard } from "./components/ProjectCard";
import styles from "./page.module.css";

type Tab = "projects" | "app-of-the-day";

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("projects");

  return (
    <div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "projects" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
        <button
          className={`${styles.tab} ${activeTab === "app-of-the-day" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("app-of-the-day")}
        >
          App of the day
        </button>
      </div>

      {activeTab === "projects" && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className={styles.placeholderText}>I'm still working content for this tab. Please check back later.</p>
        </div>
      )}

      {activeTab === "app-of-the-day" && (
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
