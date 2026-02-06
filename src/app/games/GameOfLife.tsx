"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "./GameCard";
import { fireConfetti } from "./confetti";
import styles from "./GameOfLife.module.css";

// ── Constants ────────────────────────────────────────────

const COLS = 40;
const ROWS = 30;
const CELL_SIZE = 14;
const CANVAS_W = COLS * CELL_SIZE;
const CANVAS_H = ROWS * CELL_SIZE;
const TARGET_GEN = 100;
const TARGET_ALIVE = 50;
const TICK_MS = 100;

// ── Stamp definitions ────────────────────────────────────
// Each stamp is an array of [row, col] offsets relative to the click position.

type Stamp = { name: string; cells: [number, number][] };

const STAMPS: Stamp[] = [
  {
    name: "Glider",
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  },
  {
    name: "Blinker",
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  {
    name: "Pulsar",
    cells: [
      // Top-left quadrant pattern (symmetric across 4 quadrants)
      [0, 2], [0, 3], [0, 4],
      [0, 8], [0, 9], [0, 10],
      [2, 0], [2, 5], [2, 7], [2, 12],
      [3, 0], [3, 5], [3, 7], [3, 12],
      [4, 0], [4, 5], [4, 7], [4, 12],
      [5, 2], [5, 3], [5, 4],
      [5, 8], [5, 9], [5, 10],
      [7, 2], [7, 3], [7, 4],
      [7, 8], [7, 9], [7, 10],
      [8, 0], [8, 5], [8, 7], [8, 12],
      [9, 0], [9, 5], [9, 7], [9, 12],
      [10, 0], [10, 5], [10, 7], [10, 12],
      [12, 2], [12, 3], [12, 4],
      [12, 8], [12, 9], [12, 10],
    ],
  },
  {
    name: "Glider Gun",
    cells: [
      // Simplified Gosper glider gun (fits reasonably in grid)
      [0, 24],
      [1, 22], [1, 24],
      [2, 12], [2, 13], [2, 20], [2, 21], [2, 34], [2, 35],
      [3, 11], [3, 15], [3, 20], [3, 21], [3, 34], [3, 35],
      [4, 0], [4, 1], [4, 10], [4, 16], [4, 20], [4, 21],
      [5, 0], [5, 1], [5, 10], [5, 14], [5, 16], [5, 17], [5, 22], [5, 24],
      [6, 10], [6, 16], [6, 24],
      [7, 11], [7, 15],
      [8, 12], [8, 13],
    ],
  },
  {
    name: "R-pentomino",
    cells: [
      [0, 1], [0, 2],
      [1, 0], [1, 1],
      [2, 1],
    ],
  },
];

// ── Cell age tracking ────────────────────────────────────
// 0 = dead, positive = alive for N generations, -1 = just died (dying flash)

type Grid = Int8Array;

function makeGrid(): Grid {
  return new Int8Array(COLS * ROWS);
}

function idx(col: number, row: number): number {
  return row * COLS + col;
}

function countNeighbors(grid: Grid, col: number, row: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && grid[idx(nc, nr)] > 0) {
        count++;
      }
    }
  }
  return count;
}

function stepGrid(current: Grid): Grid {
  const next = makeGrid();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = idx(col, row);
      const alive = current[i] > 0;
      const neighbors = countNeighbors(current, col, row);

      if (alive) {
        if (neighbors === 2 || neighbors === 3) {
          // Survive: increment age, cap at 127 to stay in Int8 range
          next[i] = current[i] < 127 ? (current[i] + 1) as number : 127;
        } else {
          // Die: mark as -1 for the dying flash
          next[i] = -1;
        }
      } else {
        if (neighbors === 3) {
          // Birth: age = 1
          next[i] = 1;
        } else {
          // Stay dead (clear any previous dying flash)
          next[i] = 0;
        }
      }
    }
  }
  return next;
}

function countAlive(grid: Grid): number {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > 0) count++;
  }
  return count;
}

// ── Drawing ──────────────────────────────────────────────

function getComputedColor(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  bgColor: string,
  accentColor: string,
  textPrimaryColor: string,
  errorColor: string,
  borderColor: string
) {
  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid lines (very subtle)
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;
  for (let col = 1; col < COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL_SIZE, 0);
    ctx.lineTo(col * CELL_SIZE, CANVAS_H);
    ctx.stroke();
  }
  for (let row = 1; row < ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL_SIZE);
    ctx.lineTo(CANVAS_W, row * CELL_SIZE);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Cells
  const pad = 1;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const age = grid[idx(col, row)];
      if (age === 0) continue;

      if (age === -1) {
        // Dying cell: flash red
        ctx.fillStyle = errorColor;
        ctx.globalAlpha = 0.6;
      } else if (age <= 2) {
        // Newly born: bright accent glow
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 1;
      } else if (age <= 6) {
        // Maturing: transition from accent to text-primary
        const t = (age - 2) / 4;
        ctx.fillStyle = lerpColor(accentColor, textPrimaryColor, t);
        ctx.globalAlpha = 1;
      } else {
        // Mature cell
        ctx.fillStyle = textPrimaryColor;
        ctx.globalAlpha = 0.85;
      }

      ctx.fillRect(
        col * CELL_SIZE + pad,
        row * CELL_SIZE + pad,
        CELL_SIZE - pad * 2,
        CELL_SIZE - pad * 2
      );
    }
  }
  ctx.globalAlpha = 1;
}

// Simple hex color lerp
function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${rr.toString(16).padStart(2, "0")}${rg.toString(16).padStart(2, "0")}${rb.toString(16).padStart(2, "0")}`;
}

// ── Stamp preview ghost ──────────────────────────────────

function drawStampPreview(
  ctx: CanvasRenderingContext2D,
  stamp: Stamp,
  col: number,
  row: number,
  accentColor: string
) {
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.35;
  const pad = 1;
  for (const [dr, dc] of stamp.cells) {
    const c = col + dc;
    const r = row + dr;
    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
      ctx.fillRect(
        c * CELL_SIZE + pad,
        r * CELL_SIZE + pad,
        CELL_SIZE - pad * 2,
        CELL_SIZE - pad * 2
      );
    }
  }
  ctx.globalAlpha = 1;
}

// ── Component ────────────────────────────────────────────

type Phase = "idle" | "setup" | "running" | "ended";

export default function GameOfLife() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [won, setWon] = useState(false);
  const [gen, setGen] = useState(0);
  const [aliveCount, setAliveCount] = useState(0);
  const [activeStamp, setActiveStamp] = useState<number | null>(null);
  const [finalCount, setFinalCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid>(makeGrid());
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const genRef = useRef(0);
  const hoverRef = useRef<{ col: number; row: number } | null>(null);

  // Cache resolved CSS colors
  const colorsRef = useRef({
    bg: "#111",
    accent: "#0070f3",
    textPrimary: "#fafafa",
    error: "#e5484d",
    border: "#333",
  });

  const resolveColors = useCallback(() => {
    colorsRef.current = {
      bg: getComputedColor("--bg-elevated") || "#111",
      accent: getComputedColor("--accent") || "#0070f3",
      textPrimary: getComputedColor("--text-primary") || "#fafafa",
      error: getComputedColor("--error") || "#e5484d",
      border: getComputedColor("--border") || "#333",
    };
  }, []);

  // ── Render the canvas ──────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c = colorsRef.current;
    drawGrid(ctx, gridRef.current, c.bg, c.accent, c.textPrimary, c.error, c.border);

    // If in setup mode and a stamp is selected, draw ghost preview
    if (activeStamp !== null && hoverRef.current) {
      drawStampPreview(
        ctx,
        STAMPS[activeStamp],
        hoverRef.current.col,
        hoverRef.current.row,
        c.accent
      );
    }
  }, [activeStamp]);

  // ── Initial render + color resolution ──────────────────

  useEffect(() => {
    resolveColors();
    render();
  }, [resolveColors, render]);

  // ── Canvas mouse interaction (setup phase) ─────────────

  const getCellFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { col: number; row: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / CELL_SIZE);
      const row = Math.floor(y / CELL_SIZE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
      return { col, row };
    },
    []
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== "setup") return;
      const cell = getCellFromEvent(e);
      if (!cell) return;

      const grid = gridRef.current;

      if (activeStamp !== null) {
        // Place stamp
        const stamp = STAMPS[activeStamp];
        for (const [dr, dc] of stamp.cells) {
          const c = cell.col + dc;
          const r = cell.row + dr;
          if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
            grid[idx(c, r)] = 1;
          }
        }
      } else {
        // Toggle single cell
        const i = idx(cell.col, cell.row);
        grid[i] = grid[i] > 0 ? 0 : 1;
      }

      setAliveCount(countAlive(grid));
      render();
    },
    [phase, activeStamp, getCellFromEvent, render]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== "setup") {
        hoverRef.current = null;
        return;
      }
      const cell = getCellFromEvent(e);
      hoverRef.current = cell;
      // Re-render to show stamp ghost preview
      if (activeStamp !== null) {
        render();
      }
    },
    [phase, activeStamp, getCellFromEvent, render]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    hoverRef.current = null;
    if (activeStamp !== null) {
      render();
    }
  }, [activeStamp, render]);

  // ── Simulation loop ────────────────────────────────────

  useEffect(() => {
    if (phase !== "running") return;

    intervalRef.current = setInterval(() => {
      gridRef.current = stepGrid(gridRef.current);
      genRef.current += 1;
      const alive = countAlive(gridRef.current);

      setGen(genRef.current);
      setAliveCount(alive);

      // Render the updated grid
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const c = colorsRef.current;
          drawGrid(ctx, gridRef.current, c.bg, c.accent, c.textPrimary, c.error, c.border);
        }
      }

      // Check end condition
      if (genRef.current >= TARGET_GEN) {
        clearInterval(intervalRef.current);
        const didWin = alive >= TARGET_ALIVE;
        setFinalCount(alive);
        setWon(didWin);
        setPhase("ended");
        if (didWin) {
          fireConfetti();
        }
      }
    }, TICK_MS);

    return () => clearInterval(intervalRef.current);
  }, [phase]);

  // ── Cleanup on unmount ─────────────────────────────────

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // ── Game control handler ───────────────────────────────

  const stopGame = useCallback(() => {
    clearInterval(intervalRef.current);
    setPhase("idle");
  }, []);

  const handleStart = useCallback(() => {
    if (phase === "idle") {
      // Enter setup mode
      resolveColors();
      gridRef.current = makeGrid();
      genRef.current = 0;
      setGen(0);
      setAliveCount(0);
      setWon(false);
      setActiveStamp(null);
      setPhase("setup");
      // Render the empty grid on next frame
      requestAnimationFrame(() => {
        render();
      });
    } else if (phase === "setup") {
      // Start simulation
      setPhase("running");
    } else if (phase === "ended") {
      // Reset: go back to setup
      resolveColors();
      gridRef.current = makeGrid();
      genRef.current = 0;
      setGen(0);
      setAliveCount(0);
      setWon(false);
      setActiveStamp(null);
      setPhase("setup");
      requestAnimationFrame(() => {
        render();
      });
    }
  }, [phase, resolveColors, render]);

  // ── Map internal phase to GameCard state ───────────────

  let cardState: "idle" | "playing" | "ended";
  if (phase === "idle") cardState = "idle";
  else if (phase === "setup") cardState = "idle"; // Keep button enabled during setup
  else if (phase === "running") cardState = "playing";
  else cardState = "ended";

  // ── Description text ───────────────────────────────────

  let description: string;
  if (phase === "idle") {
    description = "Place cells and sustain 50+ alive at generation 100";
  } else if (phase === "setup") {
    description = "Click to place cells, then start the simulation";
  } else if (phase === "running") {
    description = `Generation ${gen} \u2014 ${aliveCount} cells alive`;
  } else if (won) {
    description = `${finalCount} cells alive at gen 100! Life finds a way!`;
  } else {
    description = `Only ${finalCount} cells survived. Try more chaotic patterns!`;
  }

  // ── Button labels ──────────────────────────────────────

  let startLabel: string;
  let playingLabel: string;
  let retryLabel: string;

  if (phase === "idle") {
    startLabel = "Set up";
  } else if (phase === "setup") {
    startLabel = "Simulate";
  } else {
    startLabel = "Set up";
  }
  playingLabel = "Simulating...";
  retryLabel = "Reset";

  // ── Timer display ──────────────────────────────────────

  const timerDisplay = phase === "running" ? `Gen ${gen}` : undefined;

  // ── Render ─────────────────────────────────────────────

  return (
    <GameCard
      icon={
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="none"
        >
          <circle cx="6" cy="6" r="2" />
          <circle cx="12" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="12" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      }
      title="Game of Life"
      description={description}
      state={cardState}
      won={won}
      showContent={phase !== "idle"}
      timer={timerDisplay}
      onStart={handleStart}
      onStop={stopGame}
      gameId="game-of-life"
      startLabel={startLabel}
      playingLabel={playingLabel}
      retryLabel={retryLabel}
    >
      {phase !== "idle" && (
        <div className={styles.container}>
          {phase === "setup" && (
            <>
              <div className={styles.stamps}>
                {STAMPS.map((stamp, i) => (
                  <button
                    key={stamp.name}
                    className={`${styles.stampBtn} ${
                      activeStamp === i ? styles.stampBtnActive : ""
                    }`}
                    onClick={() => setActiveStamp(activeStamp === i ? null : i)}
                  >
                    {stamp.name}
                  </button>
                ))}
              </div>
              <p className={styles.hint}>
                {activeStamp !== null
                  ? `Click grid to place ${STAMPS[activeStamp].name}`
                  : "Click grid to toggle cells, or select a stamp above"}
              </p>
            </>
          )}

          <div
            className={`${styles.canvasWrap} ${
              phase === "running" ? styles.canvasWrapRunning : ""
            }`}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            />
          </div>

          {(phase === "running" || phase === "ended") && (
            <div className={styles.stats}>
              <span>Gen: {gen}</span>
              <span>Alive: {aliveCount}</span>
            </div>
          )}

          {phase === "setup" && aliveCount > 0 && (
            <div className={styles.stats}>
              <span>{aliveCount} cells placed</span>
            </div>
          )}
        </div>
      )}
    </GameCard>
  );
}
