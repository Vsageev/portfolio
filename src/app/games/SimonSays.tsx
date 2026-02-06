"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./SimonSays.module.css";

// ── Constants ────────────────────────────────────────────

const MAX_LEVEL = 10;
const BASE_DELAY = 500; // ms between notes during playback
const MIN_DELAY = 200; // fastest playback speed
const DELAY_REDUCTION = 30; // ms faster per level
const LEVEL_UP_PAUSE = 900; // ms pause to show "Level up!" text
const PLAYBACK_START_PAUSE = 600; // ms before sequence playback begins

interface KeyDef {
  id: number;
  color: string;
  colorClass: string;
  label: string;
}

const KEYS: KeyDef[] = [
  { id: 0, color: "#e5484d", colorClass: "keyRed", label: "Red" },
  { id: 1, color: "#0070f3", colorClass: "keyBlue", label: "Blue" },
  { id: 2, color: "#00c853", colorClass: "keyGreen", label: "Green" },
  { id: 3, color: "#fdcb6e", colorClass: "keyYellow", label: "Yellow" },
  { id: 4, color: "#6c5ce7", colorClass: "keyPurple", label: "Purple" },
  { id: 5, color: "#0984e3", colorClass: "keyCyan", label: "Cyan" },
];

type GamePhase = "idle" | "showing" | "input" | "levelup" | "ended";

// ── Helpers ──────────────────────────────────────────────

function getPlaybackDelay(level: number): number {
  return Math.max(MIN_DELAY, BASE_DELAY - level * DELAY_REDUCTION);
}

function generateNextNote(): number {
  return Math.floor(Math.random() * KEYS.length);
}

// ── Component ────────────────────────────────────────────

export default function SimonSays() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">(
    "idle"
  );
  const [won, setWon] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [level, setLevel] = useState(0);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [feedbackKey, setFeedbackKey] = useState<{
    id: number;
    type: "correct" | "wrong";
  } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [rippleKey, setRippleKey] = useState<number | null>(null);

  // Refs to avoid stale closures
  const sequenceRef = useRef<number[]>([]);
  const inputIndexRef = useRef(0);
  const phaseRef = useRef<GamePhase>("idle");
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const levelRef = useRef(0);

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // ── Cleanup timeouts ──────────────────────────────────

  const clearAllTimeouts = useCallback(() => {
    for (const id of timeoutsRef.current) {
      clearTimeout(id);
    }
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // ── Schedule a timeout (tracked for cleanup) ──────────

  const schedule = useCallback(
    (fn: () => void, ms: number): ReturnType<typeof setTimeout> => {
      const id = setTimeout(() => {
        // Remove from tracking array once executed
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== id);
        fn();
      }, ms);
      timeoutsRef.current.push(id);
      return id;
    },
    []
  );

  // ── Play the sequence ─────────────────────────────────

  const playSequence = useCallback(
    (seq: number[], currentLevel: number) => {
      setPhase("showing");
      phaseRef.current = "showing";
      setActiveKey(null);

      const delay = getPlaybackDelay(currentLevel);

      // Initial pause before playback begins
      schedule(() => {
        seq.forEach((keyId, i) => {
          // Light up key
          schedule(() => {
            setActiveKey(keyId);
            setRippleKey(keyId);
          }, i * delay);

          // Turn off key
          schedule(() => {
            setActiveKey(null);
            setRippleKey(null);
          }, i * delay + delay * 0.6);
        });

        // After full sequence, switch to input phase
        schedule(() => {
          setActiveKey(null);
          setRippleKey(null);
          setPhase("input");
          phaseRef.current = "input";
          inputIndexRef.current = 0;
        }, seq.length * delay + 100);
      }, PLAYBACK_START_PAUSE);
    },
    [schedule]
  );

  // ── Start a new level ─────────────────────────────────

  const startLevel = useCallback(
    (newLevel: number, existingSequence: number[]) => {
      const nextNote = generateNextNote();
      const newSequence = [...existingSequence, nextNote];
      sequenceRef.current = newSequence;
      setLevel(newLevel);
      levelRef.current = newLevel;
      playSequence(newSequence, newLevel);
    },
    [playSequence]
  );

  // ── Start / restart game ──────────────────────────────

  const stopGame = useCallback(() => {
    clearAllTimeouts();
    setGameState("idle");
  }, [clearAllTimeouts]);

  const startGame = useCallback(() => {
    clearAllTimeouts();
    sequenceRef.current = [];
    inputIndexRef.current = 0;
    setWon(false);
    setActiveKey(null);
    setFeedbackKey(null);
    setShowLevelUp(false);
    setRippleKey(null);
    setGameState("playing");
    setPhase("idle");
    phaseRef.current = "idle";

    // Start level 1 after a brief pause
    schedule(() => {
      startLevel(1, []);
    }, 300);
  }, [clearAllTimeouts, schedule, startLevel]);

  // ── Handle player input ───────────────────────────────

  const handleKeyClick = useCallback(
    (keyId: number) => {
      if (phaseRef.current !== "input") return;

      const expectedIndex = inputIndexRef.current;
      const expected = sequenceRef.current[expectedIndex];

      if (keyId === expected) {
        // Correct input
        setFeedbackKey({ id: keyId, type: "correct" });
        setActiveKey(keyId);
        setRippleKey(keyId);

        schedule(() => {
          setFeedbackKey(null);
          setActiveKey(null);
          setRippleKey(null);
        }, 250);

        const nextIndex = expectedIndex + 1;
        inputIndexRef.current = nextIndex;

        // Check if sequence is complete
        if (nextIndex >= sequenceRef.current.length) {
          const currentLevel = levelRef.current;

          if (currentLevel >= MAX_LEVEL) {
            // Win!
            setPhase("ended");
            phaseRef.current = "ended";
            setGameState("ended");
            setWon(true);
            schedule(() => fireConfetti(), 200);
          } else {
            // Level up
            setPhase("levelup");
            phaseRef.current = "levelup";
            setShowLevelUp(true);

            schedule(() => {
              setShowLevelUp(false);
              startLevel(currentLevel + 1, sequenceRef.current);
            }, LEVEL_UP_PAUSE);
          }
        }
      } else {
        // Wrong input
        setFeedbackKey({ id: keyId, type: "wrong" });
        setActiveKey(keyId);
        setPhase("ended");
        phaseRef.current = "ended";

        schedule(() => {
          setFeedbackKey(null);
          setActiveKey(null);
          setGameState("ended");
          setWon(false);
          fireExplosion();
        }, 400);
      }
    },
    [schedule, startLevel]
  );

  // ── Description text ──────────────────────────────────

  let description: string;
  if (gameState === "idle") {
    description = "Memorize the sequence \u2014 reach level 10";
  } else if (gameState === "ended" && won) {
    description = "Level 10 reached! Perfect memory!";
  } else if (gameState === "ended") {
    description = `Made it to level ${level}. Can you do better?`;
  } else if (phase === "showing") {
    description = "Watch carefully...";
  } else if (phase === "input") {
    description = `Your turn! Level ${level}`;
  } else if (phase === "levelup") {
    description = `Your turn! Level ${level}`;
  } else {
    description = "Memorize the sequence \u2014 reach level 10";
  }

  // ── Timer display ─────────────────────────────────────

  const timerDisplay =
    gameState === "playing" ? `Level ${level}/${MAX_LEVEL}` : undefined;

  // ── Render ────────────────────────────────────────────

  const isDisabled = phase !== "input";

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
          <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3 6-1 1-1.5 2.5-1.5 4h-5c0-1.5-.5-3-1.5-4-1.5-1.5-3-3.5-3-6a7 7 0 0 1 7-7z" />
          <path d="M9 19h6" />
          <path d="M10 22h4" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <path d="M12 9.5v2" />
          <path d="M10 8.5l-1.5-1" />
          <path d="M14 8.5l1.5-1" />
        </svg>
      }
      title="Simon Says"
      description={description}
      state={gameState}
      won={won}
      timer={timerDisplay}
      onStart={startGame}
      onStop={stopGame}
      gameId="simon-says"
      startLabel="Start"
      playingLabel="Playing..."
      retryLabel="Try again"
    >
      {gameState !== "idle" && (
        <>
          {showLevelUp && <div className={styles.levelUp}>Level up!</div>}
          {!showLevelUp && <div className={styles.status}>&nbsp;</div>}
          <div className={styles.grid}>
            {KEYS.map((key) => {
              const isActive = activeKey === key.id;
              const feedback = feedbackKey?.id === key.id ? feedbackKey.type : null;
              const showRipple = rippleKey === key.id;

              const classes = [
                styles.key,
                styles[key.colorClass],
                isActive ? styles.keyActive : "",
                isDisabled ? styles.keyDisabled : "",
                feedback === "correct" ? styles.keyCorrect : "",
                feedback === "wrong" ? styles.keyWrong : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={key.id}
                  className={classes}
                  onClick={() => handleKeyClick(key.id)}
                  disabled={isDisabled}
                  aria-label={`${key.label} key`}
                >
                  {showRipple && <span className={styles.ripple} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </GameCard>
  );
}
