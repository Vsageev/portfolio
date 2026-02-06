import PointCloudLogo from "@/components/PointCloudLogo";
import styles from "./about.module.css";

export default function About() {
  return (
    <div className={styles.about}>
      <section className={styles.section}>
        <h2>Social Media</h2>
        <div className={styles.socialLinks}>
          <a
            href="https://www.youtube.com/@todorename"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.socialIcon}
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
            </svg>
            YouTube
          </a>
          <a
            href="https://x.com/vsamurai_"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.socialIcon}
            >
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
            X (Twitter)
          </a>
        </div>
      </section>

      <section className={styles.section}>
        <h2>About</h2>
        <p>
          Well. I guess I'm a professional vibecoder now.
        </p>
      </section>

      <div className={styles.logosRow}>
        <PointCloudLogo />
      </div>
    </div>
  );
}
