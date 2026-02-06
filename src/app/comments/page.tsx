"use client";

import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { FormEvent, useState } from "react";
import styles from "./page.module.css";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function CommentsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const comments = useQuery(api.comments.list);
  const addComment = useMutation(api.comments.add);

  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = body.trim().length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    const result = await addComment({ body: body.trim() });
    if (result.ok) {
      setBody("");
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.sectionHeader}>
        <h3>Comments</h3>
        {comments && comments.length > 0 && (
          <span className={styles.countBadge}>{comments.length}</span>
        )}
      </div>

      {isLoading ? null : isAuthenticated ? (
        <div className={styles.writeSection}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <textarea
              className={styles.bodyInput}
              placeholder="Write something..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={2}
            />
            {error && <p className={styles.formError}>{error}</p>}
            <div className={styles.formFooter}>
              <button className={styles.signOutBtn} type="button" onClick={() => void signOut()}>
                Sign out
              </button>
              <button type="submit" className={styles.submitBtn} disabled={!canSubmit}>
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className={styles.signInSection}>
          <button
            className={styles.signInBtn}
            onClick={() => void signIn("twitter", { redirectTo: "/comments" })}
          >
            <svg className={styles.xIcon} viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Sign in with X
          </button>
        </div>
      )}

      {comments === undefined ? (
        <div className={styles.loading}>
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
        </div>
      ) : comments.length === 0 ? (
        <p className={styles.emptyText}>No comments yet</p>
      ) : (
        <div className={styles.reviewGrid}>
          {comments.map((comment) => (
            <div key={comment._id} className={styles.reviewCard}>
              <div className={styles.reviewTop}>
                {comment.twitterHandle ? (
                  <a
                    href={`https://x.com/${comment.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.avatarLink}
                  >
                    {comment.image ? (
                      <img src={comment.image} alt="" className={styles.avatarImg} />
                    ) : (
                      <div className={styles.avatar}>
                        {getInitial(comment.author)}
                      </div>
                    )}
                  </a>
                ) : comment.image ? (
                  <img src={comment.image} alt="" className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatar}>
                    {getInitial(comment.author)}
                  </div>
                )}
                <div className={styles.reviewMeta}>
                  {comment.twitterHandle ? (
                    <a
                      href={`https://x.com/${comment.twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.reviewAuthorLink}
                    >
                      {comment.author}
                      <span className={styles.handle}>@{comment.twitterHandle}</span>
                    </a>
                  ) : (
                    <span className={styles.reviewAuthor}>{comment.author}</span>
                  )}
                  <span className={styles.reviewTime}>{timeAgo(comment._creationTime)}</span>
                </div>
              </div>
              {comment.note && (
                <span className={styles.noteIcon} data-note={comment.note}><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></span>
              )}
              <p className={styles.reviewBody}>{comment.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
