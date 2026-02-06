"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./ReactionTime.module.css";

const TOTAL_ROUNDS = 5;
const BEST_OF = 3;
const WIN_THRESHOLD = 250;
const PENALTY_MS = 999;
const MIN_DELAY = 1500;
const MAX_DELAY = 5000;

type GameState = "idle" | "playing" | "ended";
type RoundPhase = "waiting" | "ready" | "tooEarly" | "result";

interface RoundResult {
  time: number;
  penalty: boolean;
}

function randomDelay(): number {
  return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
}

function computeAverage(results: RoundResult[]): number {
  const sorted = [...results]
    .map((r) => (r.penalty ? PENALTY_MS : r.time))
    .sort((a, b) => a - b);
  const best = sorted.slice(0, BEST_OF);
  return Math.round(best.reduce((sum, t) => sum + t, 0) / BEST_OF);
}

function badgeClass(result: RoundResult): string {
  if (result.penalty) return styles.badgePenalty;
  if (result.time < WIN_THRESHOLD) return styles.badgeFast;
  if (result.time < 350) return styles.badgeMedium;
  return styles.badgeSlow;
}

export default function ReactionTime() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [roundPhase, setRoundPhase] = useState<RoundPhase>("waiting");
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [average, setAverage] = useState(0);
  const [lastTime, setLastTime] = useState(0);

  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roundStartRef = useRef(0);
  const tooEarlyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cleanup = useCallback(() => {
    clearTimeout(delayTimeoutRef.current);
    clearTimeout(tooEarlyTimeoutRef.current);
    delayTimeoutRef.current = undefined;
    tooEarlyTimeoutRef.current = undefined;
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startRound = useCallback(() => {
    cleanup();
    setRoundPhase("waiting");

    const delay = randomDelay();
    delayTimeoutRef.current = setTimeout(() => {
      roundStartRef.current = performance.now();
      setRoundPhase("ready");
    }, delay);
  }, [cleanup]);

  const advanceOrEnd = useCallback(
    (newResults: RoundResult[]) => {
      const nextRound = newResults.length;
      if (nextRound >= TOTAL_ROUNDS) {
        const avg = computeAverage(newResults);
        setAverage(avg);
        setGameState("ended");
        cleanup();
        if (avg < WIN_THRESHOLD) {
          fireConfetti();
        } else {
          fireExplosion();
        }
      } else {
        setCurrentRound(nextRound);
        // Small pause before next round
        tooEarlyTimeoutRef.current = setTimeout(() => {
          startRound();
        }, 800);
      }
    },
    [cleanup, startRound]
  );

  const handleZoneClick = useCallback(() => {
    if (gameState !== "playing") return;

    if (roundPhase === "waiting") {
      // Clicked too early
      cleanup();
      const newResult: RoundResult = { time: PENALTY_MS, penalty: true };
      const newResults = [...results, newResult];
      setResults(newResults);
      setRoundPhase("tooEarly");

      tooEarlyTimeoutRef.current = setTimeout(() => {
        advanceOrEnd(newResults);
      }, 1000);
    } else if (roundPhase === "ready") {
      // Valid click
      const elapsed = Math.round(performance.now() - roundStartRef.current);
      setLastTime(elapsed);
      const newResult: RoundResult = { time: elapsed, penalty: false };
      const newResults = [...results, newResult];
      setResults(newResults);
      setRoundPhase("result");

      tooEarlyTimeoutRef.current = setTimeout(() => {
        advanceOrEnd(newResults);
      }, 1000);
    }
    // Ignore clicks during tooEarly and result phases
  }, [gameState, roundPhase, results, cleanup, advanceOrEnd]);

  const stopGame = useCallback(() => {
    cleanup();
    setGameState("idle");
  }, [cleanup]);

  const startGame = useCallback(() => {
    cleanup();
    setResults([]);
    setCurrentRound(0);
    setAverage(0);
    setLastTime(0);
    setGameState("playing");
    setRoundPhase("waiting");

    const delay = randomDelay();
    delayTimeoutRef.current = setTimeout(() => {
      roundStartRef.current = performance.now();
      setRoundPhase("ready");
    }, delay);
  }, [cleanup]);

  const won = gameState === "ended" && average < WIN_THRESHOLD;

  let description: string;
  if (gameState === "ended") {
    description = won
      ? `Average: ${average}ms — Lightning reflexes!`
      : `Average: ${average}ms — Keep practicing!`;
  } else {
    description = "Test your reflexes — best 3 of 5 under 250ms";
  }

  const descriptionClassName =
    gameState === "ended" && !won ? styles.descLoss : undefined;

  // Click zone visual state
  let zoneClass = styles.zoneIdle;
  let labelClass = "";
  let label = "Click Start to begin";
  let sublabel = "";

  if (gameState === "playing") {
    switch (roundPhase) {
      case "waiting":
        zoneClass = styles.zoneWaiting;
        labelClass = styles.zoneLabelWaiting;
        label = "Wait...";
        sublabel = "Don't click yet!";
        break;
      case "ready":
        zoneClass = styles.zoneReady;
        labelClass = styles.zoneLabelReady;
        label = "CLICK NOW!";
        sublabel = "";
        break;
      case "tooEarly":
        zoneClass = styles.zoneTooEarly;
        labelClass = styles.zoneLabelTooEarly;
        label = "Too early!";
        sublabel = "999ms penalty";
        break;
      case "result":
        zoneClass = styles.zoneResult;
        labelClass = styles.zoneLabelResult;
        label = `${lastTime}ms`;
        sublabel =
          lastTime < WIN_THRESHOLD
            ? "Nice!"
            : lastTime < 350
            ? "Not bad"
            : "Too slow";
        break;
    }
  }

  if (gameState === "ended") {
    zoneClass = styles.zoneIdle;
    labelClass = styles.zoneLabelResult;
    label = `${average}ms`;
    sublabel = won ? "You passed!" : "Try again to beat 250ms";
  }

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
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      }
      title="Reaction Time"
      description={description}
      descriptionClassName={descriptionClassName}
      state={gameState}
      won={won}
      timer={
        gameState === "playing"
          ? `Round ${currentRound + 1}/${TOTAL_ROUNDS}`
          : undefined
      }
      onStart={startGame}
      onStop={stopGame}
      gameId="reaction-time"
      startLabel="Start"
      playingLabel="Playing..."
      retryLabel="Try again"
    >
      <div
        className={`${styles.clickZone} ${zoneClass}`}
        onClick={handleZoneClick}
      >
        <span className={`${styles.zoneLabel} ${labelClass}`}>{label}</span>
        {sublabel && (
          <span
            className={
              roundPhase === "tooEarly" || roundPhase === "result"
                ? styles.zoneSublabelMono
                : styles.zoneSublabel
            }
          >
            {sublabel}
          </span>
        )}
      </div>
      <div className={styles.roundResults}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
          const result = results[i];
          if (!result) {
            return (
              <span key={i} className={`${styles.badge} ${styles.badgePending}`}>
                —
              </span>
            );
          }
          return (
            <span key={i} className={`${styles.badge} ${badgeClass(result)}`}>
              {result.penalty ? "999ms" : `${result.time}ms`}
            </span>
          );
        })}
      </div>
    </GameCard>
  );
}
