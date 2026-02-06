'use client';

import { useEffect, useRef } from 'react';
import styles from './PointCloudLogo.module.css';

const PARTICLE_COUNT = 800;
const REPULSION_RADIUS = 60;
const REPULSION_FORCE = 3000;
const RETURN_SPEED = 0.04;
const DAMPING = 0.88;
const MAX_SPEED = 12;
const MIN_CLAMP = 20;
const MAX_FORCE = 6;
const DOT_SIZE_MIN = 1.0;
const DOT_SIZE_MAX = 1.8;
const DOT_ALPHA_MIN = 0.03;
const DOT_ALPHA_MAX = 0.25;
const STRIDE = 8; // x, y, homeX, homeY, vx, vy, size, alpha

/**
 * A function that generates target positions for particles.
 * Should return a Float64Array of [x, y] pairs (length = count * 2).
 */
export type TargetGenerator = (w: number, h: number, count: number) => Float64Array;

/** 2D stratified sampling within a stroke band — useful for building geometries. */
export function fillStroke(
  pts: number[],
  startX: number, startY: number,
  alongX: number, alongY: number,
  perpX: number, perpY: number,
  length: number, width: number,
  count: number
) {
  const aspect = length / width;
  const rows = Math.max(1, Math.round(Math.sqrt(count * aspect)));
  const cols = Math.max(1, Math.round(count / rows));
  const cellL = length / rows;
  const cellW = width / cols;
  let placed = 0;
  for (let r = 0; r < rows && placed < count; r++) {
    for (let c = 0; c < cols && placed < count; c++) {
      const t = (r + Math.random()) * cellL;
      const s = (c + Math.random()) * cellW - width / 2;
      pts.push(
        startX + alongX * t + perpX * s,
        startY + alongY * t + perpY * s
      );
      placed++;
    }
  }
}

/** Built-in Next.js "N" logo generator. */
export const nextjsTargets: TargetGenerator = (w, h, count) => {
  const pts: number[] = [];
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.44;
  const sw = R * 0.12;

  const nPadX = R * 0.32;
  const nL = cx - nPadX;
  const nR = cx + nPadX;
  const nT = cy - R * 0.55;
  const nB = cy + R * 0.55;
  const nH = nB - nT;

  // Circle ring — golden-angle with area-correct radial
  const circleSw = R * 0.06;
  const innerR = R - circleSw;
  const outerR = R + circleSw;
  const phi = (1 + Math.sqrt(5)) / 2;
  const circleN = Math.floor(count * 0.4);
  for (let i = 0; i < circleN; i++) {
    const a = (2 * Math.PI * i) / phi;
    const t = (i + 0.5) / circleN;
    const nr = Math.sqrt(innerR * innerR + t * (outerR * outerR - innerR * innerR));
    pts.push(cx + Math.cos(a) * nr, cy + Math.sin(a) * nr);
  }

  // Left vertical bar
  const leftN = Math.floor(count * 0.15);
  fillStroke(pts, nL, nT, 0, 1, 1, 0, nH, sw, leftN);

  // Diagonal
  const diagDx = nR - nL;
  const diagDy = nB - nT;
  const diagLen = Math.sqrt(diagDx * diagDx + diagDy * diagDy);
  const dAlongX = diagDx / diagLen;
  const dAlongY = diagDy / diagLen;
  const dPerpX = -dAlongY;
  const dPerpY = dAlongX;

  const ox = nL - cx;
  const oy = nT - cy;
  const A = diagDx * diagDx + diagDy * diagDy;
  const B = 2 * (ox * diagDx + oy * diagDy);
  const C = ox * ox + oy * oy - R * R;
  const tEnd = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  const fullDiagLen = tEnd * diagLen;

  const diagN = Math.floor(count * 0.3);
  fillStroke(pts, nL, nT, dAlongX, dAlongY, dPerpX, dPerpY, fullDiagLen, sw, diagN);

  // Right vertical bar
  const rightN = Math.floor(count * 0.15);
  fillStroke(pts, nR, nT, 0, 1, 1, 0, nH, sw, rightN);

  return new Float64Array(pts.slice(0, count * 2));
};

function generateParticles(w: number, h: number, scatter: boolean, generate: TargetGenerator): Float64Array {
  const targets = generate(w, h, PARTICLE_COUNT);
  const p = new Float64Array(PARTICLE_COUNT * STRIDE);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const si = i * STRIDE;
    const homeX = targets[i * 2];
    const homeY = targets[i * 2 + 1];

    p[si + 2] = homeX;
    p[si + 3] = homeY;

    if (scatter) {
      p[si] = homeX + (Math.random() - 0.5) * 600;
      p[si + 1] = homeY + (Math.random() - 0.5) * 600;
    } else {
      p[si] = homeX;
      p[si + 1] = homeY;
    }

    p[si + 6] = DOT_SIZE_MIN + Math.random() * (DOT_SIZE_MAX - DOT_SIZE_MIN);
    p[si + 7] = DOT_ALPHA_MIN + Math.random() * (DOT_ALPHA_MAX - DOT_ALPHA_MIN);
  }

  return p;
}

interface PointCloudLogoProps {
  /** A function that generates [x,y] target positions for particles. Defaults to the Next.js logo. */
  targets?: TargetGenerator;
}

export default function PointCloudLogo({ targets = nextjsTargets }: PointCloudLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Float64Array>(new Float64Array(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    let w = 0;
    let h = 0;

    if (reducedMotion) {
      canvas.style.cursor = 'default';
    }

    function setup() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = generateParticles(w, h, !reducedMotion, targets);
    }

    function tick() {
      const p = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const rSq = REPULSION_RADIUS * REPULSION_RADIUS;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const si = i * STRIDE;
        let x = p[si];
        let y = p[si + 1];
        const homeX = p[si + 2];
        const homeY = p[si + 3];
        let vx = p[si + 4];
        let vy = p[si + 5];
        const size = p[si + 6];
        const alpha = p[si + 7];

        if (!reducedMotion) {
          const dx = x - mx;
          const dy = y - my;
          const dSq = dx * dx + dy * dy;
          if (dSq < rSq && dSq > 0) {
            const dist = Math.sqrt(dSq);
            const clamped = Math.max(dist, MIN_CLAMP);
            const force = Math.min(REPULSION_FORCE / (clamped * clamped), MAX_FORCE);
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
          }

          vx += (homeX - x) * RETURN_SPEED;
          vy += (homeY - y) * RETURN_SPEED;

          vx *= DAMPING;
          vy *= DAMPING;
          const speed = Math.sqrt(vx * vx + vy * vy);
          if (speed > MAX_SPEED) {
            const scale = MAX_SPEED / speed;
            vx *= scale;
            vy *= scale;
          }

          x += vx;
          y += vy;

          p[si] = x;
          p[si + 1] = y;
          p[si + 4] = vx;
          p[si + 5] = vy;
        }

        ctx.fillStyle = `rgba(30,30,30,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }

    function onTouch(e: TouchEvent) {
      if (e.touches.length) {
        const rect = canvas!.getBoundingClientRect();
        mouseRef.current.x = e.touches[0].clientX - rect.left;
        mouseRef.current.y = e.touches[0].clientY - rect.top;
      }
    }

    function onLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }

    setup();
    if (reducedMotion) tick();
    else rafRef.current = requestAnimationFrame(tick);

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onTouch, { passive: true });
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('touchend', onLeave);

    const resObs = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      setup();
      if (reducedMotion) tick();
      else rafRef.current = requestAnimationFrame(tick);
    });
    resObs.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('touchend', onLeave);
      resObs.disconnect();
    };
  }, [targets]);

  return (
    <div className={styles.wrapper} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
