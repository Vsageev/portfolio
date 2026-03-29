"use client";

import { useEffect } from "react";

export default function ConsoleGreeting() {
  useEffect(() => {
    console.log(
      [
        "",
        " ╔════════════════════════════╗",
        " ║   //TODO_RENAME            ║",
        " ╚════════════════════════════╝",
        "",
      ].join("\n")
    );
    console.log(
      "%cFind me elsewhere:",
      "font-weight: bold; font-size: 14px; color: #ccc;"
    );
    console.log("📺 YouTube  → https://www.youtube.com/@todorename");
    console.log("📧 Email    → sageevlad0302@gmail.com");
    console.log("✈️ Telegram → https://t.me/vvvolan");
  }, []);

  return null;
}
