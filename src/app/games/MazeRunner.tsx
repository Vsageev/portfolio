"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./MazeRunner.module.css";

// ── Constants ────────────────────────────────────────────

const GRID = 15;
const CELL_SIZE = 22;
const CANVAS_SIZE = GRID * CELL_SIZE;
const TIME_LIMIT = 30;
const FOG_RADIUS = 4;
const TRAIL_LENGTH = 30;

// ── Types ────────────────────────────────────────────────

interface Cell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

interface Point {
  x: number;
  y: number;
}

// ── Maze generation (recursive backtracking) ─────────────

function generateMaze(): Cell[][] {
  // Initialize all walls
  const grid: Cell[][] = [];
  for (let y = 0; y < GRID; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID; x++) {
      grid[y][x] = { top: true, right: true, bottom: true, left: true };
    }
  }

  const visited: boolean[][] = [];
  for (let y = 0; y < GRID; y++) {
    visited[y] = [];
    for (let x = 0; x < GRID; x++) {
      visited[y][x] = false;
    }
  }

  // Directions: [dx, dy, wall-to-remove-from-current, wall-to-remove-from-neighbor]
  const dirs: [number, number, keyof Cell, keyof Cell][] = [
    [0, -1, "top", "bottom"],
    [1, 0, "right", "left"],
    [0, 1, "bottom", "top"],
    [-1, 0, "left", "right"],
  ];

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Iterative DFS to avoid stack overflow
  const stack: Point[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const shuffled = shuffle(dirs);
    let found = false;

    for (const [dx, dy, wallCur, wallNeigh] of shuffled) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID && !visited[ny][nx]) {
        visited[ny][nx] = true;
        grid[current.y][current.x][wallCur] = false;
        grid[ny][nx][wallNeigh] = false;
        stack.push({ x: nx, y: ny });
        found = true;
        break;
      }
    }

    if (!found) {
      stack.pop();
    }
  }

  return grid;
}

// ── Helpers ──────────────────────────────────────────────

function canMove(maze: Cell[][], from: Point, dir: "up" | "down" | "left" | "right"): boolean {
  const cell = maze[from.y][from.x];
  switch (dir) {
    case "up": return !cell.top;
    case "down": return !cell.bottom;
    case "left": return !cell.left;
    case "right": return !cell.right;
  }
}

function cellDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Component ────────────────────────────────────────────

export default function MazeRunner() {
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [descText, setDescText] = useState("Escape the maze in under 30 seconds");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mazeRef = useRef<Cell[][]>([]);
  const playerRef = useRef<Point>({ x: 0, y: 0 });
  const trailRef = useRef<Point[]>([]);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const gameOverRef = useRef(false);
  const elapsedRef = useRef(0);

  // Read CSS variables from the document for canvas rendering
  const colorsRef = useRef({
    bg: "#000000",
    bgElevated: "#0a0a0a",
    border: "rgba(255,255,255,0.08)",
    textMuted: "#555555",
    accent: "#0070f3",
    success: "#00c853",
  });

  const readColors = useCallback(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    colorsRef.current = {
      bg: cs.getPropertyValue("--bg").trim() || "#000000",
      bgElevated: cs.getPropertyValue("--bg-elevated").trim() || "#0a0a0a",
      border: cs.getPropertyValue("--border").trim() || "rgba(255,255,255,0.08)",
      textMuted: cs.getPropertyValue("--text-muted").trim() || "#555555",
      accent: cs.getPropertyValue("--accent").trim() || "#0070f3",
      success: cs.getPropertyValue("--success").trim() || "#00c853",
    };
  }, []);

  const cleanup = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  // ── Rendering ────────────────────────────────────────────

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maze = mazeRef.current;
    const player = playerRef.current;
    const trail = trailRef.current;
    const colors = colorsRef.current;
    const elapsed = (time - startTimeRef.current) / 1000;
    const pulsePhase = Math.sin(time * 0.004) * 0.5 + 0.5;

    // Clear
    ctx.fillStyle = colors.bgElevated;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw cell backgrounds (dimmed by fog)
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const dist = cellDistance(player, { x, y });
        let visibility: number;

        if (dist <= FOG_RADIUS - 1) {
          visibility = 1;
        } else if (dist <= FOG_RADIUS + 1) {
          // Smooth gradient at the edge
          visibility = 1 - (dist - (FOG_RADIUS - 1)) / 2;
        } else {
          visibility = 0.1;
        }

        // Draw walls for this cell
        const cx = x * CELL_SIZE;
        const cy = y * CELL_SIZE;
        const cell = maze[y]?.[x];
        if (!cell) continue;

        ctx.strokeStyle = visibility > 0.3
          ? `rgba(255,255,255,${0.25 * visibility})`
          : `rgba(255,255,255,${0.08 * visibility})`;
        ctx.lineWidth = 1.5;

        if (cell.top) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + CELL_SIZE, cy);
          ctx.stroke();
        }
        if (cell.right) {
          ctx.beginPath();
          ctx.moveTo(cx + CELL_SIZE, cy);
          ctx.lineTo(cx + CELL_SIZE, cy + CELL_SIZE);
          ctx.stroke();
        }
        if (cell.bottom) {
          ctx.beginPath();
          ctx.moveTo(cx, cy + CELL_SIZE);
          ctx.lineTo(cx + CELL_SIZE, cy + CELL_SIZE);
          ctx.stroke();
        }
        if (cell.left) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + CELL_SIZE);
          ctx.stroke();
        }
      }
    }

    // Draw fog overlay using a radial cutout
    // First draw a dark overlay
    ctx.save();
    ctx.fillStyle = colors.bg;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Cut out a radial gradient around the player
    const playerCx = player.x * CELL_SIZE + CELL_SIZE / 2;
    const playerCy = player.y * CELL_SIZE + CELL_SIZE / 2;
    const fogPixelRadius = (FOG_RADIUS + 1) * CELL_SIZE;

    ctx.globalCompositeOperation = "destination-out";
    const fogGrad = ctx.createRadialGradient(
      playerCx, playerCy, 0,
      playerCx, playerCy, fogPixelRadius
    );
    fogGrad.addColorStop(0, "rgba(0,0,0,1)");
    fogGrad.addColorStop(0.6, "rgba(0,0,0,0.95)");
    fogGrad.addColorStop(0.85, "rgba(0,0,0,0.4)");
    fogGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();

    // Draw exit (pulsing green square) -- draw before trail so trail doesn't occlude it
    const exitX = (GRID - 1) * CELL_SIZE;
    const exitY = (GRID - 1) * CELL_SIZE;
    const exitDist = cellDistance(player, { x: GRID - 1, y: GRID - 1 });
    if (exitDist <= FOG_RADIUS + 1) {
      const exitVisibility = exitDist <= FOG_RADIUS - 1
        ? 1
        : Math.max(0.1, 1 - (exitDist - (FOG_RADIUS - 1)) / 2);
      const pulseSize = 4 + pulsePhase * 4;
      const baseSize = CELL_SIZE - 8;

      ctx.save();
      ctx.globalAlpha = exitVisibility;

      // Glow
      ctx.shadowColor = colors.success;
      ctx.shadowBlur = 8 + pulsePhase * 8;
      ctx.fillStyle = colors.success;
      ctx.fillRect(
        exitX + (CELL_SIZE - baseSize - pulseSize) / 2,
        exitY + (CELL_SIZE - baseSize - pulseSize) / 2,
        baseSize + pulseSize,
        baseSize + pulseSize
      );
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw breadcrumb trail
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const trailDist = cellDistance(player, t);
      if (trailDist > FOG_RADIUS + 1) continue;

      const trailVisibility = trailDist <= FOG_RADIUS - 1
        ? 1
        : Math.max(0.1, 1 - (trailDist - (FOG_RADIUS - 1)) / 2);

      const age = (trail.length - i) / trail.length; // 1 = oldest, near 0 = newest
      const opacity = (1 - age) * 0.6 * trailVisibility;

      ctx.beginPath();
      ctx.arc(
        t.x * CELL_SIZE + CELL_SIZE / 2,
        t.y * CELL_SIZE + CELL_SIZE / 2,
        3,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw player (glowing dot)
    ctx.save();
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 12;
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(playerCx, playerCy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(playerCx, playerCy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Update elapsed time display
    elapsedRef.current = elapsed;
    setElapsed(Math.floor(elapsed * 10) / 10);

    // Check timeout
    if (elapsed >= TIME_LIMIT && !gameOverRef.current) {
      gameOverRef.current = true;
      setWon(false);
      setDescText("Time's up at 30s. The maze wins this round.");
      setState("ended");
      fireExplosion();
      return;
    }

    if (!gameOverRef.current) {
      frameRef.current = requestAnimationFrame(render);
    }
  }, []);

  // ── Start game ───────────────────────────────────────────

  const stopGame = useCallback(() => {
    cleanup();
    setState("idle");
  }, [cleanup]);

  const startGame = useCallback(() => {
    cleanup();
    readColors();

    // Generate a new maze
    const maze = generateMaze();
    mazeRef.current = maze;

    // Reset player
    playerRef.current = { x: 0, y: 0 };
    trailRef.current = [];
    gameOverRef.current = false;
    startTimeRef.current = performance.now();
    elapsedRef.current = 0;

    setElapsed(0);
    setWon(false);
    setDescText("Escape the maze in under 30 seconds");
    setState("playing");

    // Start rendering
    frameRef.current = requestAnimationFrame(render);
  }, [cleanup, readColors, render]);

  // ── Keyboard controls ────────────────────────────────────

  useEffect(() => {
    if (state !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;

      let dir: "up" | "down" | "left" | "right" | null = null;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          dir = "up";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          dir = "down";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          dir = "left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dir = "right";
          break;
      }

      if (dir) {
        e.preventDefault();

        const maze = mazeRef.current;
        const player = playerRef.current;

        if (canMove(maze, player, dir)) {
          // Add current position to trail before moving
          trailRef.current.push({ ...player });
          if (trailRef.current.length > TRAIL_LENGTH) {
            trailRef.current.shift();
          }

          // Move player
          switch (dir) {
            case "up": player.y -= 1; break;
            case "down": player.y += 1; break;
            case "left": player.x -= 1; break;
            case "right": player.x += 1; break;
          }

          // Check win
          if (player.x === GRID - 1 && player.y === GRID - 1) {
            gameOverRef.current = true;
            const finalTime = Math.floor(elapsedRef.current * 10) / 10;

            if (elapsedRef.current < TIME_LIMIT) {
              setWon(true);
              setDescText(`Escaped in ${finalTime}s! Pathfinder!`);
              setState("ended");
              fireConfetti();
            } else {
              setWon(false);
              setDescText("Time's up at 30s. The maze wins this round.");
              setState("ended");
              fireExplosion();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Timer display
  const timerDisplay = state === "playing"
    ? `${Math.floor(elapsed * 10) / 10}s`
    : undefined;

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
          {/* Maze-like icon: perpendicular lines suggesting a maze */}
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h8" />
          <path d="M13 3v8" />
          <path d="M21 15h-8" />
          <path d="M11 21v-8" />
          <path d="M7 9v6" />
          <path d="M17 9v6" />
        </svg>
      }
      title="Maze Runner"
      description={descText}
      state={state}
      won={won}
      timer={timerDisplay}
      onStart={startGame}
      onStop={stopGame}
      gameId="maze-runner"
    >
      {state !== "idle" && (
        <div className={styles.gameArea}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
          />
          <p className={styles.controls}>Arrow keys or WASD to move</p>
        </div>
      )}
    </GameCard>
  );
}
