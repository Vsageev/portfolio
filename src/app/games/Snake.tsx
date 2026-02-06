"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./Snake.module.css";

// ── Constants ────────────────────────────────────────────

const GRID_SIZE = 20;
const BASE_SPEED = 150;
const BOOST_SPEED = 120;
const WIN_SCORE = 20;
const GOLDEN_CHANCE = 0.15;
const SPEED_CHANCE = 0.10;
const GOLDEN_TIMEOUT = 5000;
const SPEED_BOOST_DURATION = 3000;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type FoodType = "regular" | "golden" | "speed";

interface Point {
  x: number;
  y: number;
}

interface Food {
  pos: Point;
  type: FoodType;
}

// ── Helpers ──────────────────────────────────────────────

function opposites(a: Direction, b: Direction): boolean {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

function directionDelta(dir: Direction): Point {
  switch (dir) {
    case "UP": return { x: 0, y: -1 };
    case "DOWN": return { x: 0, y: 1 };
    case "LEFT": return { x: -1, y: 0 };
    case "RIGHT": return { x: 1, y: 0 };
  }
}

function randomEmptyCell(snake: Point[], food: Food | null): Point {
  const occupied = new Set<string>();
  for (const s of snake) occupied.add(`${s.x},${s.y}`);
  if (food) occupied.add(`${food.pos.x},${food.pos.y}`);

  const candidates: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) return { x: 0, y: 0 };
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickFoodType(): FoodType {
  const roll = Math.random();
  if (roll < SPEED_CHANCE) return "speed";
  if (roll < SPEED_CHANCE + GOLDEN_CHANCE) return "golden";
  return "regular";
}

function segmentColor(index: number, total: number, speedBoosted: boolean): string {
  // Head is accent blue, tail fades to muted gray
  const headR = 0, headG = 112, headB = 243; // --accent #0070f3
  const tailR = 128, tailG = 128, tailB = 128; // approximate --text-muted

  if (speedBoosted) {
    // Cyan trail: head is bright cyan, tail fades
    const sHeadR = 0, sHeadG = 210, sHeadB = 255;
    const t = total <= 1 ? 0 : index / (total - 1);
    const r = Math.round(sHeadR + (tailR - sHeadR) * t);
    const g = Math.round(sHeadG + (tailG - sHeadG) * t);
    const b = Math.round(sHeadB + (tailB - sHeadB) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const t = total <= 1 ? 0 : index / (total - 1);
  const r = Math.round(headR + (tailR - headR) * t);
  const g = Math.round(headG + (tailG - headG) * t);
  const b = Math.round(headB + (tailB - headB) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// ── Component ────────────────────────────────────────────

export default function Snake() {
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  // Game state stored in refs for the interval callback
  const snakeRef = useRef<Point[]>([]);
  const dirRef = useRef<Direction>("RIGHT");
  const nextDirRef = useRef<Direction>("RIGHT");
  const foodRef = useRef<Food | null>(null);
  const scoreRef = useRef(0);
  const speedBoostedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const goldenTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const speedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const boardRef = useRef<HTMLDivElement>(null);
  const gameOverRef = useRef(false);

  // For rendering: we copy game state into React state each tick
  const [snakeState, setSnakeState] = useState<Point[]>([]);
  const [foodState, setFoodState] = useState<Food | null>(null);
  const [speedBoosted, setSpeedBoosted] = useState(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    if (goldenTimeoutRef.current !== undefined) {
      clearTimeout(goldenTimeoutRef.current);
      goldenTimeoutRef.current = undefined;
    }
    if (speedTimeoutRef.current !== undefined) {
      clearTimeout(speedTimeoutRef.current);
      speedTimeoutRef.current = undefined;
    }
  }, []);

  const spawnFood = useCallback(() => {
    if (goldenTimeoutRef.current !== undefined) {
      clearTimeout(goldenTimeoutRef.current);
      goldenTimeoutRef.current = undefined;
    }

    const type = pickFoodType();
    const pos = randomEmptyCell(snakeRef.current, null);
    const newFood: Food = { pos, type };
    foodRef.current = newFood;
    setFoodState(newFood);

    // Golden food disappears after 5 seconds
    if (type === "golden") {
      goldenTimeoutRef.current = setTimeout(() => {
        // Only replace if still the same golden food
        if (
          foodRef.current &&
          foodRef.current.type === "golden" &&
          foodRef.current.pos.x === pos.x &&
          foodRef.current.pos.y === pos.y
        ) {
          // Spawn a new regular food instead
          const newPos = randomEmptyCell(snakeRef.current, null);
          const replacement: Food = { pos: newPos, type: "regular" };
          foodRef.current = replacement;
          setFoodState(replacement);
        }
        goldenTimeoutRef.current = undefined;
      }, GOLDEN_TIMEOUT);
    }
  }, []);

  const restartInterval = useCallback((speed: number) => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (gameOverRef.current) return;

      const snake = snakeRef.current;
      const dir = nextDirRef.current;
      dirRef.current = dir;

      const delta = directionDelta(dir);
      const head = snake[0];
      const newHead: Point = {
        x: head.x + delta.x,
        y: head.y + delta.y,
      };

      // Wall collision
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE
      ) {
        gameOverRef.current = true;
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        setScore(scoreRef.current);
        setWon(false);
        setState("ended");
        fireExplosion();
        return;
      }

      // Self collision (check against all segments except the tail which will move)
      for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
          gameOverRef.current = true;
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
          setScore(scoreRef.current);
          setWon(false);
          setState("ended");
          fireExplosion();
          return;
        }
      }

      const newSnake = [newHead, ...snake];
      let ate = false;

      // Check food collision
      const food = foodRef.current;
      if (food && newHead.x === food.pos.x && newHead.y === food.pos.y) {
        ate = true;
        let points = 1;
        if (food.type === "golden") points = 3;
        if (food.type === "speed") points = 1;

        scoreRef.current += points;
        setScore(scoreRef.current);

        // Speed boost
        if (food.type === "speed") {
          speedBoostedRef.current = true;
          setSpeedBoosted(true);

          // Restart interval at boosted speed
          if (speedTimeoutRef.current !== undefined) {
            clearTimeout(speedTimeoutRef.current);
          }

          // We need to re-create the interval at faster speed
          // The current interval will be cleared and re-created
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;

          speedTimeoutRef.current = setTimeout(() => {
            speedBoostedRef.current = false;
            setSpeedBoosted(false);
            speedTimeoutRef.current = undefined;
            // Restore to base speed only if game is still running
            if (!gameOverRef.current) {
              restartInterval(BASE_SPEED);
            }
          }, SPEED_BOOST_DURATION);

          // Set the boosted interval (will be called after this tick)
          // Use setTimeout to avoid clearing ourselves
          setTimeout(() => {
            if (!gameOverRef.current) {
              restartInterval(BOOST_SPEED);
            }
          }, 0);
        }

        // Check win
        if (scoreRef.current >= WIN_SCORE) {
          gameOverRef.current = true;
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
          snakeRef.current = newSnake;
          setSnakeState([...newSnake]);
          setWon(true);
          setState("ended");
          fireConfetti();
          return;
        }

        // Spawn new food
        foodRef.current = null;
        setFoodState(null);
        // Delay food spawn so the snake position is updated first
        snakeRef.current = newSnake;
        setSnakeState([...newSnake]);
        spawnFood();
        return;
      }

      if (!ate) {
        newSnake.pop(); // Remove tail
      }

      snakeRef.current = newSnake;
      setSnakeState([...newSnake]);
    }, speed);
  }, [spawnFood]);

  const stopGame = useCallback(() => {
    cleanup();
    gameOverRef.current = true;
    setState("idle");
  }, [cleanup]);

  const startGame = useCallback(() => {
    cleanup();
    gameOverRef.current = false;

    // Initialize snake in center
    const startSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    snakeRef.current = startSnake;
    dirRef.current = "RIGHT";
    nextDirRef.current = "RIGHT";
    scoreRef.current = 0;
    speedBoostedRef.current = false;
    foodRef.current = null;

    setSnakeState([...startSnake]);
    setScore(0);
    setWon(false);
    setSpeedBoosted(false);
    setFoodState(null);
    setState("playing");

    // Spawn first food
    spawnFood();

    // Start game loop
    restartInterval(BASE_SPEED);

    // Focus the board for keyboard events
    setTimeout(() => {
      boardRef.current?.focus();
    }, 0);
  }, [cleanup, spawnFood, restartInterval]);

  // Keyboard controls
  useEffect(() => {
    if (state !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let newDir: Direction | null = null;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newDir = "UP";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newDir = "DOWN";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newDir = "LEFT";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newDir = "RIGHT";
          break;
      }

      if (newDir) {
        e.preventDefault();
        // Prevent reversing direction
        if (!opposites(dirRef.current, newDir)) {
          nextDirRef.current = newDir;
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

  // Build occupied map for rendering
  const snakeSet = new Map<string, number>();
  for (let i = 0; i < snakeState.length; i++) {
    snakeSet.set(`${snakeState[i].x},${snakeState[i].y}`, i);
  }

  // Description text
  let descText: string;
  if (state === "ended") {
    descText = won
      ? `Score: ${score}! Challenge complete!`
      : `Score: ${score}. So close!`;
  } else {
    descText = "Reach a score of 20 \u2014 arrow keys or WASD";
  }

  // Render the grid
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = `${x},${y}`;
      const segmentIndex = snakeSet.get(key);
      const isSnake = segmentIndex !== undefined;
      const isFood =
        foodState && foodState.pos.x === x && foodState.pos.y === y;

      cells.push(
        <div key={key} className={styles.cell}>
          {isSnake && (
            <div
              className={`${styles.snakeSegment} ${
                segmentIndex === 0 ? styles.snakeHead : ""
              } ${speedBoosted ? styles.snakeSpeedBoost : ""}`}
              style={{
                background: segmentColor(
                  segmentIndex,
                  snakeState.length,
                  speedBoosted
                ),
              }}
            />
          )}
          {isFood && (
            <div
              className={`${styles.food} ${
                foodState.type === "golden"
                  ? styles.foodGolden
                  : foodState.type === "speed"
                  ? styles.foodSpeed
                  : styles.foodRegular
              }`}
            />
          )}
        </div>
      );
    }
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
          <polyline points="4 18 8 10 12 16 16 6 20 14" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      }
      title="Snake"
      description={descText}
      state={state}
      won={won}
      timer={state === "playing" ? `Score: ${score}` : undefined}
      onStart={startGame}
      onStop={stopGame}
      gameId="snake"
    >
      {state !== "idle" && (
        <div className={styles.gameArea}>
          <div
            ref={boardRef}
            className={styles.board}
            tabIndex={0}
          >
            {cells}
          </div>
        </div>
      )}
    </GameCard>
  );
}
