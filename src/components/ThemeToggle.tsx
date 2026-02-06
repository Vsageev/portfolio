"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function readThemeFromDom(): Theme {
  if (typeof document === "undefined") {
    return "dark";
  }
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial: Theme = stored === "light" || stored === "dark" ? stored : readThemeFromDom();

    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
    if (stored !== initial) {
      localStorage.setItem("theme", initial);
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        padding: 4,
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 100,
        cursor: "pointer",
        transition: "border-color var(--ease)",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: theme === "dark" ? "var(--bg-elevated)" : "transparent",
          color: theme === "dark" ? "var(--text-primary)" : "var(--text-muted)",
          boxShadow: theme === "dark" ? "var(--shadow-sm)" : "none",
          transition: "all var(--ease)",
        }}
      >
        {/* Moon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: theme === "light" ? "var(--bg-elevated)" : "transparent",
          color: theme === "light" ? "var(--text-primary)" : "var(--text-muted)",
          boxShadow: theme === "light" ? "var(--shadow-sm)" : "none",
          transition: "all var(--ease)",
        }}
      >
        {/* Sun */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
    </button>
  );
}
