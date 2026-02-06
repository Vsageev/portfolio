"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./Minesweeper.module.css";

/* ── Constants ────────────────────────────────────────────── */

const ROWS = 10;
const COLS = 10;
const MINE_COUNT = 12;

/* ── Types ────────────────────────────────────────────────── */

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacentMines: number;
}

type GameState = "idle" | "playing" | "ended";

/* ── Helpers ──────────────────────────────────────────────── */

function createEmptyGrid(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0,
    }))
  );
}

function getNeighbors(r: number, c: number): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

function placeMines(
  grid: Cell[][],
  safeRow: number,
  safeCol: number
): void {
  // Collect safe zone (first click cell + its neighbors)
  const safeSet = new Set<string>();
  safeSet.add(`${safeRow},${safeCol}`);
  for (const [nr, nc] of getNeighbors(safeRow, safeCol)) {
    safeSet.add(`${nr},${nc}`);
  }

  // Gather all candidate positions
  const candidates: [number, number][] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r},${c}`;
      if (!safeSet.has(key)) {
        candidates.push([r, c]);
      }
    }
  }

  // Fisher-Yates shuffle and pick MINE_COUNT positions
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const minePositions = candidates.slice(0, MINE_COUNT);
  for (const [r, c] of minePositions) {
    grid[r][c].mine = true;
  }

  // Compute adjacent mine counts
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].mine) continue;
      let count = 0;
      for (const [nr, nc] of getNeighbors(r, c)) {
        if (grid[nr][nc].mine) count++;
      }
      grid[r][c].adjacentMines = count;
    }
  }
}

function floodReveal(grid: Cell[][], r: number, c: number): void {
  const stack: [number, number][] = [[r, c]];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    if (grid[cr][cc].revealed || grid[cr][cc].flagged) continue;
    grid[cr][cc].revealed = true;
    if (grid[cr][cc].adjacentMines === 0 && !grid[cr][cc].mine) {
      for (const [nr, nc] of getNeighbors(cr, cc)) {
        if (!grid[nr][nc].revealed && !grid[nr][nc].mine) {
          stack.push([nr, nc]);
        }
      }
    }
  }
}

function countRevealed(grid: Cell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.revealed) count++;
    }
  }
  return count;
}

function countFlags(grid: Cell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.flagged) count++;
    }
  }
  return count;
}

/* ── Number color class helper ────────────────────────────── */

const NUM_CLASSES: Record<number, string> = {
  1: styles.num1,
  2: styles.num2,
  3: styles.num3,
  4: styles.num4,
  5: styles.num5,
  6: styles.num6,
  7: styles.num7,
  8: styles.num8,
};

function numClass(n: number): string {
  return NUM_CLASSES[n] || "";
}

/* ── Component ────────────────────────────────────────────── */

export default function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid);
  const [state, setState] = useState<GameState>("idle");
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [triggeredCell, setTriggeredCell] = useState<[number, number] | null>(
    null
  );

  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const boardRef = useRef<HTMLDivElement>(null);

  /* ── Timer management ──────────────────────────────────── */

  const stopTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 200);
  }, []);

  /* ── Cleanup on unmount ────────────────────────────────── */

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  /* ── Start / reset ─────────────────────────────────────── */

  const stopGame = useCallback(() => {
    stopTimer();
    setState("idle");
  }, [stopTimer]);

  const startGame = useCallback(() => {
    stopTimer();
    setGrid(createEmptyGrid());
    setState("playing");
    setWon(false);
    setElapsed(0);
    setTriggeredCell(null);
  }, [stopTimer]);

  /* ── Win check ─────────────────────────────────────────── */

  const checkWin = useCallback(
    (g: Cell[][]) => {
      const revealed = countRevealed(g);
      if (revealed === ROWS * COLS - MINE_COUNT) {
        stopTimer();
        const finalTime = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        setElapsed(finalTime);
        setState("ended");
        setWon(true);
        fireConfetti();
      }
    },
    [stopTimer]
  );

  /* ── Left click: reveal ────────────────────────────────── */

  const handleReveal = useCallback(
    (r: number, c: number) => {
      if (state !== "playing") return;

      setGrid((prev) => {
        const g = prev.map((row) => row.map((cell) => ({ ...cell })));
        const cell = g[r][c];

        if (cell.revealed || cell.flagged) return prev;

        // First click: place mines, start timer
        const hasMines = g.some((row) => row.some((cl) => cl.mine));
        if (!hasMines) {
          placeMines(g, r, c);
          startTimer();
        }

        if (cell.mine) {
          // Hit a mine - Loss
          cell.revealed = true;
          stopTimer();
          const finalTime = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
          setElapsed(finalTime);
          setTriggeredCell([r, c]);
          setState("ended");
          setWon(false);

          // Reveal all mines
          for (let rr = 0; rr < ROWS; rr++) {
            for (let cc = 0; cc < COLS; cc++) {
              if (g[rr][cc].mine) {
                g[rr][cc].revealed = true;
              }
            }
          }

          fireExplosion();
          return g;
        }

        // Normal reveal with flood fill
        floodReveal(g, r, c);

        // Schedule win check after state update
        setTimeout(() => checkWin(g), 0);

        return g;
      });
    },
    [state, startTimer, stopTimer, checkWin]
  );

  /* ── Right click / long press: flag ────────────────────── */

  const handleFlag = useCallback(
    (r: number, c: number) => {
      if (state !== "playing") return;

      setGrid((prev) => {
        const g = prev.map((row) => row.map((cell) => ({ ...cell })));
        const cell = g[r][c];
        if (cell.revealed) return prev;
        cell.flagged = !cell.flagged;
        return g;
      });
    },
    [state]
  );

  /* ── Long press handlers for mobile ────────────────────── */

  const handleTouchStart = useCallback(
    (r: number, c: number) => {
      longPressTimerRef.current = setTimeout(() => {
        handleFlag(r, c);
      }, 400);
    },
    [handleFlag]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current !== undefined) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  /* ── Derived state ─────────────────────────────────────── */

  const flagCount = countFlags(grid);
  const bugsRemaining = MINE_COUNT - flagCount;
  const nonMineTotal = ROWS * COLS - MINE_COUNT;
  const revealedCount = countRevealed(grid);
  const remainingCells = nonMineTotal - revealedCount;

  let description: string;
  if (state === "idle") {
    description = `Clear the board \u2014 find all ${MINE_COUNT} bugs`;
  } else if (state === "playing") {
    description = `${revealedCount}/${nonMineTotal} cells cleared`;
  } else if (won) {
    description = `Board cleared in ${elapsed}s! All bugs found!`;
  } else {
    description = `Hit a bug after ${elapsed}s. ${remainingCells} cells left.`;
  }

  const timerDisplay =
    state === "playing"
      ? `\uD83D\uDC1B ${bugsRemaining} | ${elapsed}s`
      : undefined;

  /* ── Cell class + content resolver ─────────────────────── */

  function getCellProps(
    cell: Cell,
    r: number,
    c: number
  ): { className: string; content: string } {
    const isTriggered =
      triggeredCell !== null &&
      triggeredCell[0] === r &&
      triggeredCell[1] === c;
    const gameEnded = state === "ended";

    // Game ended (loss): special rendering
    if (gameEnded && !won) {
      if (cell.flagged && cell.mine) {
        return { className: styles.cellFlagCorrect, content: "\uD83D\uDEA9" };
      }
      if (cell.flagged && !cell.mine) {
        return { className: styles.cellFlagWrong, content: "\uD83D\uDEA9" };
      }
      if (cell.mine && cell.revealed) {
        return {
          className: isTriggered
            ? styles.cellMineTriggered
            : styles.cellMine,
          content: "\uD83D\uDC1B",
        };
      }
    }

    // Flagged (during play or after win)
    if (cell.flagged && !cell.revealed) {
      return { className: styles.cellFlagged, content: "\uD83D\uDEA9" };
    }

    // Unrevealed
    if (!cell.revealed) {
      return { className: styles.cellHidden, content: "" };
    }

    // Revealed with number
    if (cell.adjacentMines > 0 && !cell.mine) {
      return {
        className: `${styles.cellRevealed} ${numClass(cell.adjacentMines)}`,
        content: String(cell.adjacentMines),
      };
    }

    // Revealed empty
    return { className: styles.cellRevealed, content: "" };
  }

  /* ── JSX ────────────────────────────────────────────────── */

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
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="2" x2="12" y2="7" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="2" y1="12" x2="7" y2="12" />
          <line x1="17" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="8.17" y2="8.17" />
          <line x1="15.83" y1="15.83" x2="19.07" y2="19.07" />
          <line x1="4.93" y1="19.07" x2="8.17" y2="15.83" />
          <line x1="15.83" y1="8.17" x2="19.07" y2="4.93" />
        </svg>
      }
      title="Minesweeper"
      description={description}
      state={state}
      won={won}
      timer={timerDisplay}
      onStart={startGame}
      onStop={stopGame}
      gameId="minesweeper"
      startLabel="Start"
      retryLabel="Try again"
    >
      {state !== "idle" && (
        <div onContextMenu={(e) => e.preventDefault()}>
          <div className={styles.stats}>
            <span>{"\uD83D\uDC1B"} {bugsRemaining} remaining</span>
            <span>{revealedCount}/{nonMineTotal} cleared</span>
          </div>
          <div
            ref={boardRef}
            className={`${styles.board} ${state === "ended" ? styles.boardDisabled : ""}`}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const { className, content } = getCellProps(cell, r, c);
                const isInteractive =
                  !cell.revealed && state === "playing";
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${styles.cell} ${className}`}
                    onClick={
                      isInteractive && !cell.flagged
                        ? () => handleReveal(r, c)
                        : undefined
                    }
                    onContextMenu={
                      isInteractive
                        ? (e) => {
                            e.preventDefault();
                            handleFlag(r, c);
                          }
                        : undefined
                    }
                    onTouchStart={
                      isInteractive
                        ? () => handleTouchStart(r, c)
                        : undefined
                    }
                    onTouchEnd={isInteractive ? handleTouchEnd : undefined}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </GameCard>
  );
}
