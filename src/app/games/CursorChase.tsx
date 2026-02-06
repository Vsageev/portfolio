"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./CursorChase.module.css";

const CATCH_RADIUS = 24;
const SPAWN_INTERVAL = 4000;
const WIN_TIME = 60;

const SPEED_NORMAL = 1.8;
const SPEED_FAST = 4.5;
const SPEED_WIGGLER = 2.2;
const WIGGLE_AMP = 150;
const WIGGLE_FREQ = 0.04;
const DASHER_TRACK_SPEED = 1.0;
const DASHER_CHARGE_TIME = 90;
const DASHER_DASH_SPEED = 18;
const DASHER_DASH_DIST = 280;
const DASHER_COOLDOWN = 60;

const UNLOCK_FAST = 8;
const UNLOCK_WIGGLER = 16;
const UNLOCK_DASHER = 24;

type EnemyType = "normal" | "fast" | "wiggler" | "dasher";

interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
  el: HTMLDivElement;
  age: number;
  dasherPhase: "tracking" | "charging" | "dashing" | "cooldown";
  dasherTimer: number;
  dashDirX: number;
  dashDirY: number;
  dashDistLeft: number;
}

function randomEdgePosition(): { x: number; y: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const side = Math.floor(Math.random() * 4);
  switch (side) {
    case 0: return { x: Math.random() * w, y: 0 };
    case 1: return { x: w, y: Math.random() * h };
    case 2: return { x: Math.random() * w, y: h };
    default: return { x: 0, y: Math.random() * h };
  }
}

function pickEnemyType(elapsed: number): EnemyType {
  const pool: EnemyType[] = ["normal"];
  if (elapsed >= UNLOCK_FAST) pool.push("fast");
  if (elapsed >= UNLOCK_WIGGLER) pool.push("wiggler");
  if (elapsed >= UNLOCK_DASHER) pool.push("dasher");
  return pool[Math.floor(Math.random() * pool.length)];
}

function styleClassForType(type: EnemyType): string {
  switch (type) {
    case "fast": return styles.enemyFast;
    case "wiggler": return styles.enemyWiggler;
    case "dasher": return styles.enemyDasher;
    default: return styles.enemy;
  }
}

function spawnEnemy(container: HTMLDivElement, type: EnemyType): Enemy {
  const { x, y } = randomEdgePosition();
  const el = document.createElement("div");
  el.className = styleClassForType(type);
  el.style.transform = `translate(${x}px, ${y}px)`;
  container.appendChild(el);
  return {
    x, y, type, el,
    age: 0,
    dasherPhase: "tracking",
    dasherTimer: 0,
    dashDirX: 0,
    dashDirY: 0,
    dashDistLeft: 0,
  };
}

export default function CursorChase() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const enemiesRef = useRef<Enemy[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef<number>(0);
  const [timerText, setTimerText] = useState("0s");
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [survived, setSurvived] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    clearInterval(spawnTimerRef.current);
    for (const enemy of enemiesRef.current) {
      enemy.el.remove();
    }
    enemiesRef.current = [];
  }, []);

  const endGame = useCallback(() => {
    const time = Math.floor((performance.now() - startTimeRef.current) / 1000);
    const count = enemiesRef.current.length;
    cleanup();
    setSurvived(time);
    setDotCount(count);
    setState("ended");
    if (time >= WIN_TIME) {
      fireConfetti();
    } else {
      fireExplosion(mouseRef.current.x, mouseRef.current.y);
    }
  }, [cleanup]);

  const stopGame = useCallback(() => {
    cleanup();
    setState("idle");
  }, [cleanup]);

  const startGame = useCallback(() => {
    cleanup();
    const container = containerRef.current;
    if (!container) return;

    enemiesRef.current.push(spawnEnemy(container, "normal"));
    startTimeRef.current = performance.now();

    spawnTimerRef.current = setInterval(() => {
      if (!containerRef.current) return;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const type = pickEnemyType(elapsed);
      enemiesRef.current.push(spawnEnemy(containerRef.current, type));
    }, SPAWN_INTERVAL);

    setState("playing");
  }, [cleanup]);

  useEffect(() => {
    if (state !== "playing") return;

    const loop = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      if (elapsed >= WIN_TIME) {
        endGame();
        return;
      }

      for (const e of enemiesRef.current) {
        e.age++;
        const dx = mx - e.x;
        const dy = my - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CATCH_RADIUS) {
          endGame();
          return;
        }

        if (dist < 0.5) continue;
        const nx = dx / dist;
        const ny = dy / dist;

        switch (e.type) {
          case "normal": {
            e.x += nx * SPEED_NORMAL;
            e.y += ny * SPEED_NORMAL;
            break;
          }
          case "fast": {
            e.x += nx * SPEED_FAST;
            e.y += ny * SPEED_FAST;
            break;
          }
          case "wiggler": {
            e.x += nx * SPEED_WIGGLER;
            e.y += ny * SPEED_WIGGLER;
            const perpX = -ny;
            const perpY = nx;
            const offset = Math.cos(e.age * WIGGLE_FREQ) * WIGGLE_AMP * WIGGLE_FREQ;
            e.x += perpX * offset;
            e.y += perpY * offset;
            break;
          }
          case "dasher": {
            switch (e.dasherPhase) {
              case "tracking": {
                e.x += nx * DASHER_TRACK_SPEED;
                e.y += ny * DASHER_TRACK_SPEED;
                e.dasherTimer++;
                if (e.dasherTimer >= DASHER_COOLDOWN && dist < 400) {
                  e.dasherPhase = "charging";
                  e.dasherTimer = 0;
                  e.el.classList.add(styles.enemyDasherCharging);
                }
                break;
              }
              case "charging": {
                e.dasherTimer++;
                if (e.dasherTimer >= DASHER_CHARGE_TIME) {
                  const cdx = mx - e.x;
                  const cdy = my - e.y;
                  const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                  e.dashDirX = cdist > 0 ? cdx / cdist : 0;
                  e.dashDirY = cdist > 0 ? cdy / cdist : 0;
                  e.dashDistLeft = DASHER_DASH_DIST;
                  e.dasherPhase = "dashing";
                  e.dasherTimer = 0;
                  e.el.classList.remove(styles.enemyDasherCharging);
                  e.el.classList.add(styles.enemyDasherDashing);
                }
                break;
              }
              case "dashing": {
                const step = Math.min(DASHER_DASH_SPEED, e.dashDistLeft);
                e.x += e.dashDirX * step;
                e.y += e.dashDirY * step;
                e.dashDistLeft -= step;
                if (e.dashDistLeft <= 0) {
                  e.dasherPhase = "cooldown";
                  e.dasherTimer = 0;
                  e.el.classList.remove(styles.enemyDasherDashing);
                }
                break;
              }
              case "cooldown": {
                e.x += nx * DASHER_TRACK_SPEED * 0.5;
                e.y += ny * DASHER_TRACK_SPEED * 0.5;
                e.dasherTimer++;
                if (e.dasherTimer >= DASHER_COOLDOWN) {
                  e.dasherPhase = "tracking";
                  e.dasherTimer = 0;
                }
                break;
              }
            }
            break;
          }
        }

        e.el.style.transform = `translate(${e.x}px, ${e.y}px)`;
      }

      setTimerText(`${Math.floor(elapsed)}s`);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [state, cleanup, endGame]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cleanup();
    };
  }, [handleMouseMove, cleanup]);

  const won = survived >= WIN_TIME;

  let descText: string;
  if (state === "ended") {
    descText = won
      ? `You survived ${survived}s with ${dotCount} dots. Challenge complete!`
      : `Caught after ${survived}s with ${dotCount} dot${dotCount !== 1 ? "s" : ""} on screen.`;
  } else {
    descText = "Can you survive 60 seconds?";
  }

  return (
    <GameCard
      icon={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      }
      title="Cursor Chase"
      description={descText}
      state={state}
      won={won}
      timer={state === "playing" ? timerText : undefined}
      onStart={startGame}
      onStop={stopGame}
      gameId="cursor-chase"
      noScroll
    >
      <div ref={containerRef} />
    </GameCard>
  );
}
