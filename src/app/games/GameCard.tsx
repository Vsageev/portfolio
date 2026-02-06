"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { useActiveGame } from "./ActiveGameContext";
import styles from "./GameCard.module.css";

interface GameCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  descriptionClassName?: string;
  state: "idle" | "playing" | "ended";
  won: boolean;
  timer?: ReactNode;
  onStart: () => void;
  onStop?: () => void;
  gameId?: string;
  noScroll?: boolean;
  startLabel?: string;
  playingLabel?: string;
  retryLabel?: string;
  showContent?: boolean;
  children?: ReactNode;
}

export default function GameCard({
  icon,
  title,
  description,
  descriptionClassName,
  state,
  won,
  timer,
  onStart,
  onStop,
  gameId,
  noScroll,
  startLabel = "Start",
  playingLabel = "Running...",
  retryLabel = "Try again",
  showContent,
  children,
}: GameCardProps) {
  const { register, stopOthers } = useActiveGame();
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameId) return;
    return register(gameId, () => onStopRef.current?.());
  }, [gameId, register]);

  const handleStart = useCallback(() => {
    if (gameId) stopOthers(gameId);
    onStart();
    if (!noScroll) {
      requestAnimationFrame(() => {
        wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [gameId, stopOthers, onStart, noScroll]);

  const contentVisible = showContent ?? state !== "idle";
  const btnLabel =
    state === "playing" ? playingLabel : state === "ended" ? retryLabel : startLabel;

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.cardIcon}>{icon}</div>
        <div className={styles.cardInfo}>
          <h4 className={styles.cardTitle}>{title}</h4>
          <p
            className={`${styles.cardDesc} ${
              state === "ended" && won ? styles.cardDescWin : ""
            } ${descriptionClassName ?? ""}`}
          >
            {description}
          </p>
        </div>
        {timer && <span className={styles.timer}>{timer}</span>}
        <button
          className={styles.startBtn}
          onClick={handleStart}
          disabled={state === "playing"}
        >
          {btnLabel}
        </button>
      </div>
      {children && (
        <div style={contentVisible ? undefined : { display: "none" }}>
          {children}
        </div>
      )}
    </div>
  );
}
