"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "./GameCard";
import { fireConfetti } from "./confetti";
import styles from "./PixelArtPainter.module.css";

// ── Constants ────────────────────────────────────────────

const GRID_SIZE = 16;
const TIME_LIMIT = 90;
const WIN_THRESHOLD = 80;

type Tool = "brush" | "eraser" | "fill";

// Color indices: 0 = transparent (empty), 1-8 = palette colors
const PALETTE: string[] = [
  "#000000", // 0 - black
  "#ffffff", // 1 - white
  "#e5484d", // 2 - red
  "#0070f3", // 3 - blue
  "#00c853", // 4 - green
  "#f5a623", // 5 - yellow
  "#ff6b00", // 6 - orange
  "#8b5cf6", // 7 - purple
];

// Empty cell represented as "" (transparent)
const EMPTY = "";

// ── Reference Patterns ───────────────────────────────────
// Each pattern is a 16x16 grid. Values are palette indices (0-7)
// or -1 for empty/transparent.

function makeGrid(rows: string[]): number[][] {
  return rows.map((row) =>
    row.split("").map((ch) => {
      const n = parseInt(ch, 16);
      return isNaN(n) || ch === "." ? -1 : n;
    })
  );
}

// Heart pattern (red)
const HEART = makeGrid([
  "................",
  "................",
  "..222....222....",
  ".2222...22222...",
  ".22222.222222...",
  ".2222222222222..",
  "..22222222222...",
  "..22222222222...",
  "...222222222....",
  "....2222222.....",
  ".....22222......",
  "......222.......",
  ".......2........",
  "................",
  "................",
  "................",
]);

// Smiley face (yellow)
const SMILEY = makeGrid([
  "................",
  "....555555......",
  "...55555555.....",
  "..5555555555....",
  "..5505555055....",
  "..5500555005....",
  "..5555555555....",
  "..5555555555....",
  "..5525555255....",
  "..5552555255....",
  "..5555222555....",
  "...55555555.....",
  "....555555......",
  "................",
  "................",
  "................",
]);

// Arrow pointing right (blue)
const ARROW = makeGrid([
  "................",
  "................",
  "........3.......",
  ".......33.......",
  "......333.......",
  ".....3333.......",
  "..33333333......",
  ".333333333......",
  ".333333333......",
  "..33333333......",
  ".....3333.......",
  "......333.......",
  ".......33.......",
  "........3.......",
  "................",
  "................",
]);

// Star (yellow/orange)
const STAR = makeGrid([
  "................",
  ".......5........",
  ".......5........",
  "......555.......",
  "......555.......",
  "..6655555556....",
  "...666555666....",
  "....5555555.....",
  "....5555555.....",
  "...555555555....",
  "...55.555.55....",
  "..55...5...55...",
  "..5.........5...",
  "................",
  "................",
  "................",
]);

// House (multi-color)
const HOUSE = makeGrid([
  "................",
  "................",
  ".......2........",
  "......222.......",
  ".....22222......",
  "....2222222.....",
  "...222222222....",
  "..22222222222...",
  "..66666666666...",
  "..66666066666...",
  "..61166000666...",
  "..61166000666...",
  "..61166000666...",
  "..66666666666...",
  "................",
  "................",
]);

const PATTERNS = [HEART, SMILEY, ARROW, STAR, HOUSE];

// ── Helpers ──────────────────────────────────────────────

function createEmptyGrid(): string[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => EMPTY)
  );
}

function patternToColorGrid(pattern: number[][]): string[][] {
  return pattern.map((row) =>
    row.map((idx) => (idx >= 0 && idx < PALETTE.length ? PALETTE[idx] : EMPTY))
  );
}

function calculateSimilarity(
  canvas: string[][],
  reference: string[][]
): number {
  let matching = 0;
  let total = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const refColor = reference[r][c];
      const canvasColor = canvas[r][c];
      // Only count cells that are part of the pattern
      if (refColor !== EMPTY) {
        total++;
        if (canvasColor === refColor) {
          matching++;
        }
      } else {
        // Penalize painting where there should be empty
        if (canvasColor !== EMPTY) {
          total++;
          // no match increment — penalty by expanding total
        }
      }
    }
  }
  if (total === 0) return 100;
  return Math.round((matching / total) * 100);
}

function floodFill(
  grid: string[][],
  startRow: number,
  startCol: number,
  newColor: string
): string[][] {
  const newGrid = grid.map((row) => [...row]);
  const targetColor = newGrid[startRow][startCol];
  if (targetColor === newColor) return newGrid;

  const stack: [number, number][] = [[startRow, startCol]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
    if (newGrid[r][c] !== targetColor) continue;

    visited.add(key);
    newGrid[r][c] = newColor;

    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }

  return newGrid;
}

// ── Component ────────────────────────────────────────────

export default function PixelArtPainter() {
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [won, setWon] = useState(false);
  const [similarity, setSimilarity] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const [canvas, setCanvas] = useState<string[][]>(() => createEmptyGrid());
  const [reference, setReference] = useState<string[][]>(() =>
    patternToColorGrid(PATTERNS[0])
  );

  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [tool, setTool] = useState<Tool>("brush");

  const isPaintingRef = useRef(false);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const canvasRef = useRef<string[][]>(canvas);
  const referenceRef = useRef<string[][]>(reference);
  const stateRef = useRef(state);

  // Keep refs in sync
  canvasRef.current = canvas;
  referenceRef.current = reference;
  stateRef.current = state;

  // ── Timer tick ─────────────────────────────────────────

  useEffect(() => {
    if (state !== "playing") return;

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);

      if (secs >= TIME_LIMIT) {
        clearInterval(timerRef.current);
        const finalSim = calculateSimilarity(
          canvasRef.current,
          referenceRef.current
        );
        setSimilarity(finalSim);
        setWon(finalSim >= WIN_THRESHOLD);
        setState("ended");
        if (finalSim >= WIN_THRESHOLD) {
          fireConfetti();
        }
      }
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [state]);

  // ── Prevent text selection during drag ─────────────────

  useEffect(() => {
    const handleMouseUp = () => {
      isPaintingRef.current = false;
    };

    const handleSelectStart = (e: Event) => {
      if (isPaintingRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  // ── Apply paint to a single cell ───────────────────────

  const applyPaint = useCallback(
    (row: number, col: number, currentCanvas: string[][]): string[][] | null => {
      if (stateRef.current !== "playing") return null;

      let newCanvas: string[][] | null = null;

      if (tool === "brush") {
        if (currentCanvas[row][col] !== selectedColor) {
          newCanvas = currentCanvas.map((r) => [...r]);
          newCanvas[row][col] = selectedColor;
        }
      } else if (tool === "eraser") {
        if (currentCanvas[row][col] !== EMPTY) {
          newCanvas = currentCanvas.map((r) => [...r]);
          newCanvas[row][col] = EMPTY;
        }
      } else if (tool === "fill") {
        newCanvas = floodFill(currentCanvas, row, col, selectedColor);
      }

      return newCanvas;
    },
    [tool, selectedColor]
  );

  const updateCanvasAndCheck = useCallback(
    (newCanvas: string[][]) => {
      setCanvas(newCanvas);
      canvasRef.current = newCanvas;

      const sim = calculateSimilarity(newCanvas, referenceRef.current);
      setSimilarity(sim);

      if (sim >= WIN_THRESHOLD && stateRef.current === "playing") {
        clearInterval(timerRef.current);
        setWon(true);
        setState("ended");
        fireConfetti();
      }
    },
    []
  );

  // ── Cell mouse handlers ────────────────────────────────

  const handleCellMouseDown = useCallback(
    (row: number, col: number) => {
      if (state !== "playing") return;
      isPaintingRef.current = true;

      const newCanvas = applyPaint(row, col, canvasRef.current);
      if (newCanvas) {
        updateCanvasAndCheck(newCanvas);
      }
    },
    [state, applyPaint, updateCanvasAndCheck]
  );

  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isPaintingRef.current || state !== "playing") return;
      // Fill tool only works on click, not drag
      if (tool === "fill") return;

      const newCanvas = applyPaint(row, col, canvasRef.current);
      if (newCanvas) {
        updateCanvasAndCheck(newCanvas);
      }
    },
    [state, tool, applyPaint, updateCanvasAndCheck]
  );

  // ── Start / restart ────────────────────────────────────

  const stopGame = useCallback(() => {
    clearInterval(timerRef.current);
    setState("idle");
  }, []);

  const startGame = useCallback(() => {
    clearInterval(timerRef.current);

    const patternIndex = Math.floor(Math.random() * PATTERNS.length);
    const ref = patternToColorGrid(PATTERNS[patternIndex]);

    setReference(ref);
    referenceRef.current = ref;
    setCanvas(createEmptyGrid());
    canvasRef.current = createEmptyGrid();
    setSimilarity(0);
    setElapsed(0);
    setWon(false);
    setTool("brush");
    setSelectedColor(PALETTE[0]);
    isPaintingRef.current = false;
    startTimeRef.current = Date.now();
    setState("playing");
  }, []);

  // ── Description text ───────────────────────────────────

  let description: string;
  if (state === "idle") {
    description = "Recreate the pixel art \u2014 reach 80% match";
  } else if (state === "playing") {
    description = `Similarity: ${similarity}%`;
  } else if (state === "ended" && won) {
    description = `${similarity}% match! Pixel perfect!`;
  } else {
    description = `${similarity}% match. Almost there!`;
  }

  // ── Timer display ──────────────────────────────────────

  const remaining = Math.max(0, TIME_LIMIT - elapsed);
  const timerDisplay =
    state === "playing" ? `${remaining}s` : undefined;

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
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      }
      title="Pixel Art Painter"
      description={description}
      state={state}
      won={won}
      timer={timerDisplay}
      onStart={startGame}
      onStop={stopGame}
      gameId="pixel-art"
      startLabel="Paint"
      playingLabel="Painting..."
      retryLabel="New pattern"
    >
      {state !== "idle" && (
        <div className={styles.gameArea}>
          <div className={styles.gridSection}>
            {/* Pixel grid */}
            <div
              className={styles.grid}
              onMouseLeave={() => {
                isPaintingRef.current = false;
              }}
            >
              {canvas.map((row, r) =>
                row.map((color, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={styles.pixel}
                    style={
                      color !== EMPTY
                        ? { backgroundColor: color }
                        : undefined
                    }
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCellMouseDown(r, c);
                    }}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                  />
                ))
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            {/* Reference preview */}
            <div className={styles.referenceSection}>
              <span className={styles.sidebarLabel}>Reference</span>
              <div className={styles.referenceGrid}>
                {reference.map((row, r) =>
                  row.map((color, c) => (
                    <div
                      key={`ref-${r}-${c}`}
                      className={styles.refPixel}
                      style={
                        color !== EMPTY
                          ? { backgroundColor: color }
                          : undefined
                      }
                    />
                  ))
                )}
              </div>
            </div>

            {/* Similarity meter */}
            <div className={styles.similaritySection}>
              <span className={styles.sidebarLabel}>Match</span>
              <div className={styles.meterTrack}>
                <div
                  className={styles.meterFill}
                  style={{
                    width: `${similarity}%`,
                    backgroundColor:
                      similarity >= WIN_THRESHOLD
                        ? "var(--success)"
                        : similarity >= 50
                        ? "var(--warning)"
                        : "var(--accent)",
                  }}
                />
              </div>
              <span className={styles.similarityValue}>{similarity}%</span>
            </div>

            {/* Tools */}
            <div className={styles.toolsSection}>
              <span className={styles.sidebarLabel}>Tools</span>
              <div className={styles.tools}>
                <button
                  className={`${styles.toolBtn} ${
                    tool === "brush" ? styles.toolBtnActive : ""
                  }`}
                  onClick={() => setTool("brush")}
                  title="Brush"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  </svg>
                </button>
                <button
                  className={`${styles.toolBtn} ${
                    tool === "eraser" ? styles.toolBtnActive : ""
                  }`}
                  onClick={() => setTool("eraser")}
                  title="Eraser"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 20H7L3 16l9-9 8 8-4 4z" />
                    <path d="M6.5 13.5l5-5" />
                  </svg>
                </button>
                <button
                  className={`${styles.toolBtn} ${
                    tool === "fill" ? styles.toolBtnActive : ""
                  }`}
                  onClick={() => setTool("fill")}
                  title="Fill bucket"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 2.5l19 19" />
                    <path d="M12 2v6.5L7 14l5 8 5-8-5-5.5V2" />
                    <path d="M19 19c1.5 0 3-1.5 3-3s-3-5-3-5-3 3-3 5 1.5 3 3 3z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Color palette */}
            <div className={styles.paletteSection}>
              <span className={styles.sidebarLabel}>Colors</span>
              <div className={styles.palette}>
                {PALETTE.map((color, i) => (
                  <button
                    key={i}
                    className={`${styles.swatch} ${
                      selectedColor === color && tool !== "eraser"
                        ? styles.swatchActive
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      if (tool === "eraser") setTool("brush");
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </GameCard>
  );
}
