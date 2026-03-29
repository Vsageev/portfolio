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
    console.log("Contact me:");
    console.log("  Email    → sageevlad0302@gmail.com");
    console.log("  Telegram → https://t.me/vvvolan");
  }, []);

  return null;
}
