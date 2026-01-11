import { ReactNode } from "react";
import { Header } from "./Header";
import styles from "../app/page.module.css";

type LayoutProps = {
  children: ReactNode;
  activeTab?: 'apprequest' | 'aboutme';
};

export function Layout({ children, activeTab = 'apprequest' }: LayoutProps) {
  return (
    <main className={styles.main}>
      <Header activeTab={activeTab} />
      <section className={styles.content}>
        {children}
      </section>
    </main>
  );
}
