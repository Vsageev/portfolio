import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { MainProject, MainProjectWithContent } from "@/data/mainProjects";

const projectsDirectory = path.join(process.cwd(), "content/projects");

/**
 * Strip numeric prefix (e.g. "01_slm" -> "slm")
 */
function stripPrefix(fileName: string): string {
  return fileName.replace(/^\d+_/, "");
}

export function getAllProjectSlugs(): string[] {
  try {
    const fileNames = fs.readdirSync(projectsDirectory);
    return fileNames
      .filter((fileName) => fileName.endsWith(".md"))
      .sort()
      .reverse()
      .map((fileName) => stripPrefix(fileName.replace(/\.md$/, "")));
  } catch (error) {
    return [];
  }
}

/**
 * Resolve a slug (with or without prefix) to the actual file path
 */
function resolveProjectFile(slug: string): string | null {
  // Try exact match first (e.g. "01_slm.md")
  const exactPath = path.join(projectsDirectory, `${slug}.md`);
  if (fs.existsSync(exactPath)) return exactPath;

  // Try finding a prefixed file matching the clean slug
  try {
    const files = fs.readdirSync(projectsDirectory);
    const match = files.find(
      (f) => f.endsWith(".md") && stripPrefix(f.replace(/\.md$/, "")) === slug
    );
    if (match) return path.join(projectsDirectory, match);
  } catch {}

  return null;
}

/**
 * Get project data by slug (without content)
 */
export function getProjectBySlug(slug: string): MainProject | null {
  try {
    const fullPath = resolveProjectFile(slug);
    if (!fullPath) return null;
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);
    const cleanSlug = stripPrefix(slug);

    return {
      slug: cleanSlug,
      title: data.title || "",
      description: data.description || "",
      image: data.image || "",
      github: data.github,
      website: data.website,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get project data with markdown content
 */
export function getProjectWithContent(slug: string): MainProjectWithContent | null {
  try {
    const fullPath = resolveProjectFile(slug);
    if (!fullPath) return null;
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    const cleanSlug = stripPrefix(slug);

    return {
      slug: cleanSlug,
      title: data.title || "",
      description: data.description || "",
      image: data.image || "",
      github: data.github,
      website: data.website,
      content,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get all projects
 */
export function getAllProjects(): MainProject[] {
  const slugs = getAllProjectSlugs();
  const projects = slugs
    .map((slug) => getProjectBySlug(slug))
    .filter((project): project is MainProject => project !== null);

  return projects;
}
