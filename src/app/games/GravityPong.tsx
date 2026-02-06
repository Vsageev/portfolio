"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameCard from "./GameCard";
import { fireConfetti, fireExplosion } from "./confetti";
import styles from "./GravityPong.module.css";

// ── Constants ────────────────────────────────────────────

const CANVAS_W = 600;
const CANVAS_H = 400;
const PADDLE_W = 12;
const PADDLE_H = 70;
const PADDLE_OFFSET = 20;
const BALL_R = 6;
const BALL_SPEED_INIT = 4;
const BALL_SPEED_INCREMENT = 0.15;
const BALL_MAX_SPEED = 10;
const TRAIL_LENGTH = 15;
const WIN_SCORE = 7;
const GRAVITY_WELL_DURATION = 5000; // ms
const GRAVITY_WELL_MAX = 2;
const GRAVITY_STRENGTH = 800;
const AI_BASE_SPEED = 3.2;
const AI_SPEED_PER_SCORE = 0.25;

// ── Types ────────────────────────────────────────────────

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

interface GravityWell {
  x: number;
  y: number;
  createdAt: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

// ── Helpers ──────────────────────────────────────────────

function resetBall(ball: Ball, direction: number) {
  ball.x = CANVAS_W / 2;
  ball.y = CANVAS_H / 2;
  ball.speed = BALL_SPEED_INIT;
  const angle = (Math.random() - 0.5) * (Math.PI / 3); // -30..+30 deg
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = Math.sin(angle) * ball.speed;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Component ────────────────────────────────────────────

export default function GravityPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  // Game state stored in refs to avoid re-renders during play
  const ballRef = useRef<Ball>({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    vx: 0,
    vy: 0,
    speed: BALL_SPEED_INIT,
  });
  const playerYRef = useRef(CANVAS_H / 2);
  const aiYRef = useRef(CANVAS_H / 2);
  const playerScoreRef = useRef(0);
  const aiScoreRef = useRef(0);
  const gravityWellsRef = useRef<GravityWell[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const mouseYRef = useRef(CANVAS_H / 2);
  const playingRef = useRef(false);
  const bgColorRef = useRef("#111");
  const textColorRef = useRef("#fff");
  const borderColorRef = useRef("#333");

  // React state for UI outside canvas
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [won, setWon] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  // ── Read CSS variables once ──────────────────────────────

  useEffect(() => {
    const s = getComputedStyle(document.documentElement);
    bgColorRef.current = s.getPropertyValue("--bg-card").trim() || "#111";
    textColorRef.current =
      s.getPropertyValue("--text-primary").trim() || "#fff";
    borderColorRef.current = s.getPropertyValue("--border").trim() || "#333";
  }, []);

  // ── Canvas mouse tracking ────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_H / rect.height;
    mouseYRef.current = clamp(
      (e.clientY - rect.top) * scaleY,
      PADDLE_H / 2,
      CANVAS_H - PADDLE_H / 2
    );
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!playingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const wells = gravityWellsRef.current;
    // Remove expired wells first
    const now = performance.now();
    gravityWellsRef.current = wells.filter(
      (w) => now - w.createdAt < GRAVITY_WELL_DURATION
    );

    if (gravityWellsRef.current.length >= GRAVITY_WELL_MAX) {
      // Remove oldest
      gravityWellsRef.current.shift();
    }
    gravityWellsRef.current.push({ x: cx, y: cy, createdAt: now });
  }, []);

  // ── Game loop ────────────────────────────────────────────

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ball = ballRef.current;
    const now = performance.now();

    // ─ Update player paddle ─────────────────────────────
    playerYRef.current = mouseYRef.current;

    // ─ Update AI paddle ─────────────────────────────────
    const aiSpeed =
      AI_BASE_SPEED + aiScoreRef.current * AI_SPEED_PER_SCORE;
    const aiTarget = ball.y;
    const aiDiff = aiTarget - aiYRef.current;
    if (Math.abs(aiDiff) > 2) {
      aiYRef.current += Math.sign(aiDiff) * Math.min(aiSpeed, Math.abs(aiDiff));
    }
    aiYRef.current = clamp(
      aiYRef.current,
      PADDLE_H / 2,
      CANVAS_H - PADDLE_H / 2
    );

    // ─ Apply gravity wells to ball ──────────────────────
    gravityWellsRef.current = gravityWellsRef.current.filter(
      (w) => now - w.createdAt < GRAVITY_WELL_DURATION
    );

    for (const well of gravityWellsRef.current) {
      const dx = well.x - ball.x;
      const dy = well.y - ball.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      if (dist < 5) continue; // avoid singularity
      const force = GRAVITY_STRENGTH / distSq;
      ball.vx += (dx / dist) * force;
      ball.vy += (dy / dist) * force;
    }

    // ─ Move ball ────────────────────────────────────────
    ball.x += ball.vx;
    ball.y += ball.vy;

    // ─ Wall bounce (top/bottom) ─────────────────────────
    if (ball.y - BALL_R < 0) {
      ball.y = BALL_R;
      ball.vy = Math.abs(ball.vy);
    }
    if (ball.y + BALL_R > CANVAS_H) {
      ball.y = CANVAS_H - BALL_R;
      ball.vy = -Math.abs(ball.vy);
    }

    // ─ Paddle collision (player - left) ─────────────────
    const pTop = playerYRef.current - PADDLE_H / 2;
    const pBot = playerYRef.current + PADDLE_H / 2;
    const pRight = PADDLE_OFFSET + PADDLE_W;

    if (
      ball.vx < 0 &&
      ball.x - BALL_R <= pRight &&
      ball.x - BALL_R >= PADDLE_OFFSET - 4 &&
      ball.y >= pTop &&
      ball.y <= pBot
    ) {
      ball.x = pRight + BALL_R;
      const hitPos = (ball.y - playerYRef.current) / (PADDLE_H / 2); // -1..1
      const angle = hitPos * (Math.PI / 4); // max 45 deg
      ball.speed = Math.min(ball.speed + BALL_SPEED_INCREMENT, BALL_MAX_SPEED);
      ball.vx = Math.cos(angle) * ball.speed;
      ball.vy = Math.sin(angle) * ball.speed;
    }

    // ─ Paddle collision (AI - right) ────────────────────
    const aTop = aiYRef.current - PADDLE_H / 2;
    const aBot = aiYRef.current + PADDLE_H / 2;
    const aLeft = CANVAS_W - PADDLE_OFFSET - PADDLE_W;

    if (
      ball.vx > 0 &&
      ball.x + BALL_R >= aLeft &&
      ball.x + BALL_R <= CANVAS_W - PADDLE_OFFSET + 4 &&
      ball.y >= aTop &&
      ball.y <= aBot
    ) {
      ball.x = aLeft - BALL_R;
      const hitPos = (ball.y - aiYRef.current) / (PADDLE_H / 2);
      const angle = hitPos * (Math.PI / 4);
      ball.speed = Math.min(ball.speed + BALL_SPEED_INCREMENT, BALL_MAX_SPEED);
      ball.vx = -Math.cos(angle) * ball.speed;
      ball.vy = Math.sin(angle) * ball.speed;
    }

    // ─ Score detection ──────────────────────────────────
    let scored = false;
    if (ball.x - BALL_R < 0) {
      // AI scores
      aiScoreRef.current += 1;
      setAiScore(aiScoreRef.current);
      scored = true;
      if (aiScoreRef.current >= WIN_SCORE) {
        playingRef.current = false;
        setWon(false);
        setState("ended");
        setPlayerScore(playerScoreRef.current);
        setAiScore(aiScoreRef.current);
        fireExplosion();
        return;
      }
      resetBall(ball, 1); // serve toward AI
    } else if (ball.x + BALL_R > CANVAS_W) {
      // Player scores
      playerScoreRef.current += 1;
      setPlayerScore(playerScoreRef.current);
      scored = true;
      if (playerScoreRef.current >= WIN_SCORE) {
        playingRef.current = false;
        setWon(true);
        setState("ended");
        setPlayerScore(playerScoreRef.current);
        setAiScore(aiScoreRef.current);
        fireConfetti();
        return;
      }
      resetBall(ball, -1); // serve toward player
    }

    // ─ Trail ────────────────────────────────────────────
    if (scored) {
      trailRef.current = [];
    } else {
      trailRef.current.push({ x: ball.x, y: ball.y });
      if (trailRef.current.length > TRAIL_LENGTH) {
        trailRef.current.shift();
      }
    }

    // ── RENDER ──────────────────────────────────────────

    const bg = bgColorRef.current;
    const fg = textColorRef.current;

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Center dashed line
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = borderColorRef.current;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2, 0);
    ctx.lineTo(CANVAS_W / 2, CANVAS_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Score display on canvas
    ctx.font = "bold 48px var(--font-mono), monospace";
    ctx.fillStyle = borderColorRef.current;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      String(playerScoreRef.current),
      CANVAS_W / 2 - 50,
      16
    );
    ctx.fillText(String(aiScoreRef.current), CANVAS_W / 2 + 50, 16);

    // ─ Gravity wells ────────────────────────────────────
    for (const well of gravityWellsRef.current) {
      const age = now - well.createdAt;
      const life = 1 - age / GRAVITY_WELL_DURATION; // 1..0
      const pulse = 0.8 + 0.2 * Math.sin(age * 0.008);

      // Outer ring
      ctx.beginPath();
      ctx.arc(well.x, well.y, 28 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 112, 243, ${life * 0.7})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner glow
      const grad = ctx.createRadialGradient(
        well.x,
        well.y,
        0,
        well.x,
        well.y,
        22 * pulse
      );
      grad.addColorStop(0, `rgba(0, 112, 243, ${life * 0.35})`);
      grad.addColorStop(1, `rgba(0, 112, 243, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(well.x, well.y, 22 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.beginPath();
      ctx.arc(well.x, well.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 112, 243, ${life * 0.9})`;
      ctx.fill();
    }

    // ─ Ball trail ───────────────────────────────────────
    const trail = trailRef.current;
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = ((i + 1) / trail.length) * 0.4;
      const radius = BALL_R * ((i + 1) / trail.length) * 0.8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // ─ Ball with glow ───────────────────────────────────
    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ─ Player paddle (left) ─────────────────────────────
    ctx.fillStyle = fg;
    drawRoundedRect(
      ctx,
      PADDLE_OFFSET,
      playerYRef.current - PADDLE_H / 2,
      PADDLE_W,
      PADDLE_H,
      4
    );
    ctx.fill();

    // ─ AI paddle (right) ────────────────────────────────
    ctx.fillStyle = fg;
    drawRoundedRect(
      ctx,
      CANVAS_W - PADDLE_OFFSET - PADDLE_W,
      aiYRef.current - PADDLE_H / 2,
      PADDLE_W,
      PADDLE_H,
      4
    );
    ctx.fill();

    // ─ Continue loop ────────────────────────────────────
    if (playingRef.current) {
      frameRef.current = requestAnimationFrame(gameLoop);
    }
  }, []);

  // ── Draw idle/ended state ─────────────────────────────

  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bg = bgColorRef.current;
    const fg = textColorRef.current;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Center dashed line
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = borderColorRef.current;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2, 0);
    ctx.lineTo(CANVAS_W / 2, CANVAS_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles centered
    ctx.fillStyle = fg;
    drawRoundedRect(
      ctx,
      PADDLE_OFFSET,
      CANVAS_H / 2 - PADDLE_H / 2,
      PADDLE_W,
      PADDLE_H,
      4
    );
    ctx.fill();
    drawRoundedRect(
      ctx,
      CANVAS_W - PADDLE_OFFSET - PADDLE_W,
      CANVAS_H / 2 - PADDLE_H / 2,
      PADDLE_W,
      PADDLE_H,
      4
    );
    ctx.fill();

    // Ball in center
    ctx.beginPath();
    ctx.arc(CANVAS_W / 2, CANVAS_H / 2, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = fg;
    ctx.fill();
  }, []);

  // ── Start game ────────────────────────────────────────

  const stopGame = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    playingRef.current = false;
    setState("idle");
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    playingRef.current = false;

    // Reset all refs
    playerScoreRef.current = 0;
    aiScoreRef.current = 0;
    playerYRef.current = CANVAS_H / 2;
    aiYRef.current = CANVAS_H / 2;
    gravityWellsRef.current = [];
    trailRef.current = [];

    const ball = ballRef.current;
    resetBall(ball, Math.random() < 0.5 ? 1 : -1);

    setPlayerScore(0);
    setAiScore(0);
    setWon(false);
    setState("playing");
    playingRef.current = true;

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Draw static canvas when idle/ended ────────────────

  useEffect(() => {
    if (state !== "playing") {
      drawStatic();
    }
  }, [state, drawStatic]);

  // ── Cleanup on unmount ────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current);
      playingRef.current = false;
    };
  }, []);

  // ── Description ───────────────────────────────────────

  let description: string;
  if (state === "idle") {
    description = "Score 7 to win \u2014 click to place gravity wells";
  } else if (state === "ended" && won) {
    description = `You win ${playerScore}-${aiScore}! Gravity master!`;
  } else if (state === "ended") {
    description = `AI wins ${aiScore}-${playerScore}. Try using gravity wells!`;
  } else {
    description = "Score 7 to win \u2014 click to place gravity wells";
  }

  // ── Timer display ─────────────────────────────────────

  const timerDisplay =
    state === "playing"
      ? `You ${playerScore} - ${aiScore} AI`
      : undefined;

  // ── Render ────────────────────────────────────────────

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
          <circle cx="12" cy="12" r="4" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="6" />
        </svg>
      }
      title="Gravity Pong"
      description={description}
      state={state}
      won={won}
      timer={timerDisplay}
      onStart={startGame}
      onStop={stopGame}
      gameId="gravity-pong"
      startLabel="Start"
      retryLabel="Try again"
    >
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
        />
      </div>
    </GameCard>
  );
}
