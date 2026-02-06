"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./MemoryGrid.module.css";

// ── Constants ────────────────────────────────────────────

const PAIRS: { emoji: string; label: string }[] = [
  { emoji: "\u269B\uFE0F", label: "React" },
  { emoji: "\uD83E\uDD80", label: "Rust" },
  { emoji: "\uD83D\uDC0D", label: "Python" },
  { emoji: "\uD83D\uDD25", label: "Firebase" },
  { emoji: "\uD83D\uDC33", label: "Docker" },
  { emoji: "\uD83E\uDDCA", label: "Next.js" },
  { emoji: "\uD83D\uDC8E", label: "Ruby" },
  { emoji: "\uD83C\uDF0A", label: "Tailwind" },
];

const TOTAL_PAIRS = PAIRS.length; // 8
const TIME_LIMIT = 45; // seconds
const MISMATCH_DELAY = 800; // ms before flipping mismatched cards back

// ── Helpers ──────────────────────────────────────────────

interface Card {
  id: number;
  pairIndex: number;
  emoji: string;
  label: string;
}

function buildDeck(): Card[] {
  const cards: Card[] = [];
  PAIRS.forEach((pair, pairIndex) => {
    cards.push({ id: pairIndex * 2, pairIndex, emoji: pair.emoji, label: pair.label });
    cards.push({ id: pairIndex * 2 + 1, pairIndex, emoji: pair.emoji, label: pair.label });
  });
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// ── Component ────────────────────────────────────────────

export default function MemoryGrid() {
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [won, setWon] = useState(false);

  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);

  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const matchCountRef = useRef(0);

  // ── Timer tick ─────────────────────────────────────────

  useEffect(() => {
    if (state !== "playing") return;

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);

      if (secs >= TIME_LIMIT) {
        clearInterval(timerRef.current);
        // Time's up -- lose
        setState("ended");
        setWon(false);
        fireExplosion();
      }
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [state]);

  // ── Start / restart ────────────────────────────────────

  const stopGame = useCallback(() => {
    clearInterval(timerRef.current);
    setState("idle");
  }, []);

  const startGame = useCallback(() => {
    const newDeck = buildDeck();
    setDeck(newDeck);
    setFlipped(new Set());
    setMatched(new Set());
    setShaking(new Set());
    setSelected([]);
    setLocked(false);
    setMoves(0);
    setElapsed(0);
    setWon(false);
    matchCountRef.current = 0;
    startTimeRef.current = Date.now();
    setState("playing");
  }, []);

  // ── Card click ─────────────────────────────────────────

  const handleCardClick = useCallback(
    (index: number) => {
      if (state !== "playing") return;
      if (locked) return;
      if (flipped.has(index) || matched.has(index)) return;

      const nextFlipped = new Set(flipped);
      nextFlipped.add(index);
      setFlipped(nextFlipped);

      const nextSelected = [...selected, index];
      setSelected(nextSelected);

      if (nextSelected.length === 2) {
        const [first, second] = nextSelected;
        setMoves((m) => m + 1);

        if (deck[first].pairIndex === deck[second].pairIndex) {
          // Match!
          const nextMatched = new Set(matched);
          nextMatched.add(first);
          nextMatched.add(second);
          setMatched(nextMatched);
          setSelected([]);
          matchCountRef.current += 1;

          // Check win condition
          if (matchCountRef.current === TOTAL_PAIRS) {
            clearInterval(timerRef.current);
            const finalTime = Math.floor(
              (Date.now() - startTimeRef.current) / 1000
            );
            setElapsed(finalTime);
            setState("ended");
            setWon(true);
            fireConfetti();
          }
        } else {
          // Mismatch -- shake, then flip back
          setLocked(true);
          setShaking(new Set([first, second]));

          setTimeout(() => {
            setShaking(new Set());
            const reverted = new Set(nextFlipped);
            reverted.delete(first);
            reverted.delete(second);
            setFlipped(reverted);
            setSelected([]);
            setLocked(false);
          }, MISMATCH_DELAY);
        }
      }
    },
    [state, locked, flipped, matched, selected, deck]
  );

  // ── Description text ───────────────────────────────────

  let description: string;
  if (state === "idle") {
    description = "Match all pairs in under 45 seconds";
  } else if (state === "ended" && won) {
    description = `Completed in ${elapsed}s with ${moves} moves!`;
  } else if (state === "ended") {
    description = `Time\u2019s up! Matched ${matchCountRef.current}/${TOTAL_PAIRS} pairs in ${moves} moves.`;
  } else {
    description = "Match all pairs in under 45 seconds";
  }

  // ── Timer display ──────────────────────────────────────

  const timerDisplay =
    state === "playing" ? `${elapsed}s / ${TIME_LIMIT}s` : undefined;

  // ── Render ─────────────────────────────────────────────

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
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      }
      title="Memory Grid"
      description={description}
      state={state}
      won={won}
      timer={timerDisplay}
      onStart={startGame}
      onStop={stopGame}
      gameId="memory-grid"
      startLabel="Start"
      retryLabel="Try again"
    >
      {state !== "idle" && (
        <>
          <div className={styles.stats}>
            <span>Moves: {moves}</span>
            <span>
              Matched: {matchCountRef.current}/{TOTAL_PAIRS}
            </span>
          </div>
          <div className={styles.grid}>
            {deck.map((card, index) => {
              const isFlipped = flipped.has(index) || matched.has(index);
              const isMatched = matched.has(index);
              const isShaking = shaking.has(index);

              const tileClasses = [
                styles.tile,
                isFlipped ? styles.tileFlipped : "",
                isMatched ? styles.tileMatched : "",
                isShaking ? styles.tileShake : "",
                locked ? styles.tileLocked : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={`${card.id}-${index}`}
                  className={tileClasses}
                  onClick={() => handleCardClick(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    isFlipped ? `${card.label} card` : "Hidden card"
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(index);
                    }
                  }}
                >
                  <div className={styles.tileInner}>
                    <div className={styles.tileFront}>{`{ }`}</div>
                    <div className={styles.tileBack}>{card.emoji}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </GameCard>
  );
}
