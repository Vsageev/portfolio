import { Layout } from "@/components/Layout";
import styles from "../page.module.css";

export default function About() {
  return (
    <Layout activeTab="aboutme">
      <div className={styles.about}>
        <p>
          //TODO: Add about me content
        </p>
      </div>
    </Layout>
  );
}
