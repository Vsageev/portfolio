"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./TypingRacer.module.css";

// ── Constants ────────────────────────────────────────────

const GAME_DURATION = 60; // seconds
const WIN_SCORE = 30;
const SPAWN_INTERVAL = 2000; // ms
const BASE_FALL_SPEED = 0.4; // px per frame
const SPEED_INCREASE = 0.008; // additional speed per second elapsed
const AREA_HEIGHT = 400; // match CSS .gameArea height
const SCORE_BAR_HEIGHT = 36;
const INPUT_AREA_HEIGHT = 56;
const PLAYABLE_HEIGHT = AREA_HEIGHT - SCORE_BAR_HEIGHT - INPUT_AREA_HEIGHT;

const CODE_WORDS = [
  "const",
  "async",
  "function",
  "return",
  "useState",
  "interface",
  "Promise",
  "export",
  "import",
  "await",
  "yield",
  "class",
  "static",
  "render",
  "deploy",
  "commit",
  "merge",
  "debug",
  "refactor",
  "iterate",
];

// ── Helpers ──────────────────────────────────────────────

function getPoints(word: string): number {
  if (word.length <= 4) return 1;
  if (word.length <= 7) return 2;
  return 3;
}

function getTierClass(points: number): string {
  if (points === 1) return styles.wordTier1;
  if (points === 2) return styles.wordTier2;
  return styles.wordTier3;
}

function pickRandomWord(): string {
  return CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
}

// ── Types ────────────────────────────────────────────────

interface FallingWord {
  id: number;
  text: string;
  points: number;
  x: number; // percentage 0-100 for left position
  y: number; // pixels from top of wordContainer
  speed: number;
  el: HTMLDivElement | null;
  state: "falling" | "matched" | "missed";
}

// ── Component ────────────────────────────────────────────

export default function TypingRacer() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">(
    "idle"
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [finalScore, setFinalScore] = useState(0);

  const wordContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<FallingWord[]>([]);
  const frameRef = useRef<number>(0);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const timeTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef<number>(0);
  const nextIdRef = useRef(0);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<"idle" | "playing" | "ended">("idle");

  // Keep refs in sync with state
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // ── Cleanup ──────────────────────────────────────────

  const cleanup = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    clearInterval(spawnTimerRef.current);
    clearInterval(timeTimerRef.current);
    // Remove all word elements
    for (const w of wordsRef.current) {
      if (w.el && w.el.parentNode) {
        w.el.remove();
      }
    }
    wordsRef.current = [];
  }, []);

  // ── End Game ─────────────────────────────────────────

  const endGame = useCallback(
    (won: boolean) => {
      const currentScore = scoreRef.current;
      cleanup();
      setFinalScore(currentScore);
      setGameState("ended");
      if (won) {
        fireConfetti();
      } else {
        fireExplosion();
      }
    },
    [cleanup]
  );

  // ── Spawn Word ───────────────────────────────────────

  const spawnWord = useCallback(() => {
    const container = wordContainerRef.current;
    if (!container) return;

    const text = pickRandomWord();
    const points = getPoints(text);
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const speed = BASE_FALL_SPEED + elapsed * SPEED_INCREASE;

    // Random horizontal position (5-85% to avoid clipping)
    const x = 5 + Math.random() * 80;

    const el = document.createElement("div");
    el.className = `${styles.fallingWord} ${getTierClass(points)}`;
    el.textContent = text;
    el.style.left = `${x}%`;
    el.style.transform = `translateY(0px)`;
    container.appendChild(el);

    const id = nextIdRef.current++;
    const word: FallingWord = {
      id,
      text,
      points,
      x,
      y: 0,
      speed,
      el,
      state: "falling",
    };

    wordsRef.current.push(word);
  }, []);

  // ── Animation Loop ───────────────────────────────────

  const runLoop = useCallback(() => {
    const words = wordsRef.current;
    const toRemove: number[] = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.state !== "falling") continue;

      w.y += w.speed;
      if (w.el) {
        w.el.style.transform = `translateY(${w.y}px)`;
      }

      // Check if word reached the bottom
      if (w.y >= PLAYABLE_HEIGHT - 28) {
        w.state = "missed";
        if (w.el) {
          w.el.classList.add(styles.wordMissed);
          // Remove after animation
          const elRef = w.el;
          setTimeout(() => {
            if (elRef.parentNode) elRef.remove();
          }, 400);
        }
        toRemove.push(i);
      }
    }

    // Remove missed words from array (reverse order to keep indices valid)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      words.splice(toRemove[i], 1);
    }

    if (gameStateRef.current === "playing") {
      frameRef.current = requestAnimationFrame(runLoop);
    }
  }, []);

  // ── Start Game ───────────────────────────────────────

  const stopGame = useCallback(() => {
    cleanup();
    setGameState("idle");
  }, [cleanup]);

  const startGame = useCallback(() => {
    cleanup();
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setFinalScore(0);
    nextIdRef.current = 0;
    startTimeRef.current = performance.now();

    setGameState("playing");

    // Spawn first word immediately
    setTimeout(() => {
      spawnWord();
    }, 0);

    // Spawn words on interval
    spawnTimerRef.current = setInterval(() => {
      if (gameStateRef.current !== "playing") return;
      spawnWord();
    }, SPAWN_INTERVAL);

    // Countdown timer
    timeTimerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (performance.now() - startTimeRef.current) / 1000
      );
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        // Time's up — check if won
        const won = scoreRef.current >= WIN_SCORE;
        endGame(won);
      }
    }, 250);

    // Start animation loop
    frameRef.current = requestAnimationFrame(runLoop);

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [cleanup, spawnWord, endGame, runLoop]);

  // ── Handle Input ─────────────────────────────────────

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      const words = wordsRef.current;

      // Check for a match (case-sensitive since these are code keywords)
      const matchIdx = words.findIndex(
        (w) => w.state === "falling" && w.text === value
      );

      if (matchIdx !== -1) {
        const matched = words[matchIdx];
        matched.state = "matched";

        // Rocket animation on the word
        if (matched.el) {
          matched.el.classList.add(styles.wordMatched);

          // Spawn a small rocket emoji at the word's position
          const container = wordContainerRef.current;
          if (container) {
            const rocket = document.createElement("div");
            rocket.className = styles.rocket;
            rocket.textContent = "\u{1F680}";
            rocket.style.left = `${matched.x}%`;
            rocket.style.top = `${matched.y + SCORE_BAR_HEIGHT - 36}px`;
            container.appendChild(rocket);
            setTimeout(() => {
              if (rocket.parentNode) rocket.remove();
            }, 600);
          }

          // Remove word element after animation
          const elRef = matched.el;
          setTimeout(() => {
            if (elRef.parentNode) elRef.remove();
          }, 500);
        }

        // Remove from active list
        words.splice(matchIdx, 1);

        // Update score
        const newScore = scoreRef.current + matched.points;
        setScore(newScore);
        scoreRef.current = newScore;

        // Clear input
        e.target.value = "";

        // Check win condition
        if (newScore >= WIN_SCORE) {
          endGame(true);
        }
      }
    },
    [endGame]
  );

  // ── Cleanup on unmount ───────────────────────────────

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ── Derived state ────────────────────────────────────

  const won = finalScore >= WIN_SCORE;
  const progressPercent = Math.min(
    100,
    ((gameState === "ended" ? finalScore : score) / WIN_SCORE) * 100
  );

  let descText: string;
  if (gameState === "ended") {
    descText = won
      ? `${finalScore} points scored! Code shipped successfully.`
      : `${finalScore}/${WIN_SCORE} points. So close — try again!`;
  } else {
    descText = `Type falling code keywords to score ${WIN_SCORE} points in ${GAME_DURATION}s.`;
  }

  // ── Render ───────────────────────────────────────────

  return (
    <GameCard
      icon={
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h1" />
          <path d="M10 8h1" />
          <path d="M14 8h1" />
          <path d="M18 8h1" />
          <path d="M5 12h2" />
          <path d="M9 12h6" />
          <path d="M17 12h2" />
          <path d="M8 16h8" />
        </svg>
      }
      title="Typing Racer"
      description={descText}
      state={gameState}
      won={won}
      timer={gameState === "playing" ? `${timeLeft}s` : undefined}
      onStart={startGame}
      onStop={stopGame}
      gameId="typing-racer"
      startLabel="Start"
      playingLabel="Typing..."
      retryLabel="Try again"
    >
      <div className={styles.gameArea}>
        {/* Score bar */}
        <div className={styles.scoreBar}>
          <span className={styles.scoreLabel}>
            <span className={styles.scoreValue}>
              {gameState === "ended" ? finalScore : score}
            </span>{" "}
            / <span className={styles.goalValue}>{WIN_SCORE}</span>
          </span>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${progressPercent >= 100 ? styles.progressFillWin : ""}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={styles.scoreLabel}>
            {gameState === "playing" ? `${timeLeft}s` : `${GAME_DURATION}s`}
          </span>
        </div>

        {/* Falling words area */}
        <div ref={wordContainerRef} className={styles.wordContainer} />

        {/* Input area */}
        <div className={styles.inputArea}>
          <input
            ref={inputRef}
            className={styles.typingInput}
            type="text"
            placeholder={
              gameState === "playing"
                ? "Type the falling words..."
                : "Press Start to begin"
            }
            disabled={gameState !== "playing"}
            onChange={handleInput}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Idle overlay */}
        {gameState === "idle" && (
          <div className={styles.idleOverlay}>
            <div className={styles.idleIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h1" />
                <path d="M10 8h1" />
                <path d="M14 8h1" />
                <path d="M18 8h1" />
                <path d="M5 12h2" />
                <path d="M9 12h6" />
                <path d="M17 12h2" />
                <path d="M8 16h8" />
              </svg>
            </div>
            <span className={styles.idleTitle}>Typing Racer</span>
            <span className={styles.idleHint}>
              Type code keywords as they fall. Score {WIN_SCORE} points in{" "}
              {GAME_DURATION}s to win.
            </span>
            <div className={styles.tierList}>
              <span className={styles.tierItem}>
                <span className={styles.tier1Color}>short</span> = 1pt
              </span>
              <span className={styles.tierItem}>
                <span className={styles.tier2Color}>medium</span> = 2pt
              </span>
              <span className={styles.tierItem}>
                <span className={styles.tier3Color}>long</span> = 3pt
              </span>
            </div>
          </div>
        )}

        {/* Ended overlay */}
        {gameState === "ended" && (
          <div className={styles.endedOverlay}>
            <span
              className={`${styles.endedTitle} ${won ? styles.endedTitleWin : styles.endedTitleLose}`}
            >
              {won ? "Mission Complete" : "Time's Up"}
            </span>
            <span className={styles.endedScore}>
              {finalScore} / {WIN_SCORE} points
            </span>
          </div>
        )}
      </div>
    </GameCard>
  );
}
