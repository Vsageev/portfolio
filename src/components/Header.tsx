import Link from "next/link";
import Image from "next/image";
import styles from "../app/page.module.css";

type HeaderProps = {
  activeTab?: 'apprequest' | 'aboutme';
};

export function Header({ activeTab = 'apprequest' }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <Image
          src="/portrait.png"
          alt="Portrait"
          width={48}
          height={48}
          className={styles.portrait}
        />
        <h1 className={styles.title}>//TODO_RENAME blog</h1>
      </div>
      <nav className={styles.tabs}>
        <Link
          href="/"
          className={`${styles.tab} ${activeTab === 'apprequest' ? styles.activeTab : ''}`}
        >
          App Request
        </Link>
        <Link
          href="/about"
          className={`${styles.tab} ${activeTab === 'aboutme' ? styles.activeTab : ''}`}
        >
          About Me
        </Link>
      </nav>
    </header>
  );
}
