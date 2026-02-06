"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import portrait from "../../public/portrait.png";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Nav.module.css";

export function Nav() {
  const pathname = usePathname();
  const currentSection = pathname?.startsWith("/about")
    ? "about"
    : pathname?.startsWith("/comments")
      ? "comments"
      : pathname?.startsWith("/games")
        ? "games"
        : "projects";

  return (
    <>
      {/* Prismatic top line - visible in light mode only */}
      <div className={styles.prismLine} />

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <Link href="/projects" className={styles.navBreadcrumb}>
              <Image
                src={portrait}
                alt="Portrait"
                width={28}
                height={28}
                className={styles.portrait}
              />
              <span className={styles.navWordmark}>{"//TODO_RENAME"}</span>
              <span className={styles.navSlash}>/</span>
              <span className={styles.navSection}>{currentSection}</span>
            </Link>
          </div>

          <div className={styles.navRight}>
            <Link
              href="/projects"
              className={`${styles.navLink} ${currentSection === "projects" ? styles.navLinkActive : ""}`}
            >
              Projects
            </Link>
            <Link
              href="/games"
              className={`${styles.navLink} ${currentSection === "games" ? styles.navLinkActive : ""}`}
            >
              Games
            </Link>
            <Link
              href="/comments"
              className={`${styles.navLink} ${currentSection === "comments" ? styles.navLinkActive : ""}`}
            >
              Comments
            </Link>
            <Link
              href="/about"
              className={`${styles.navLink} ${currentSection === "about" ? styles.navLinkActive : ""}`}
            >
              About
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
