"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./not-found.module.css";

const COLS = 25;
const ROWS = 10;

const COLORS = ["var(--accent)"];

// prettier-ignore
const DIGIT_4 = [
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,1,1,1,1],
  [0,0,0,0,1],
  [0,0,0,0,1],
  [0,0,0,0,1],
  [0,0,0,0,1],
];

// prettier-ignore
const DIGIT_0 = [
  [1,1,1,1,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,1,1,1,1],
];

// prettier-ignore
const TETROMINOS: [number, number][][] = [
  [[0,0],[1,0],[2,0],[3,0]],       // I
  [[0,0],[1,0],[0,1],[1,1]],       // O
  [[0,0],[1,0],[2,0],[1,1]],       // T
  [[1,0],[2,0],[0,1],[1,1]],       // S
  [[0,0],[1,0],[1,1],[2,1]],       // Z
  [[0,0],[0,1],[0,2],[1,2]],       // L
  [[1,0],[1,1],[1,2],[0,2]],       // J
];

interface Piece {
  id: number;
  shape: [number, number][]; // [col, row] relative to piece origin
  gridCol: number;
  gridRow: number;
  color: string;
}

function generatePieces(
  bitmap: number[][],
  offsetCol: number,
  offsetRow: number,
  startId: number,
  colorIdx: { value: number }
): Piece[] {
  const visited = new Set<string>();
  const pieces: Piece[] = [];
  const rows = bitmap.length;
  const cols = bitmap[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${c},${r}`;
      if (bitmap[r][c] === 0 || visited.has(key)) continue;

      // BFS to collect up to 4 connected cells
      const queue: [number, number][] = [[c, r]];
      const cells: [number, number][] = [];
      visited.add(key);

      while (queue.length > 0 && cells.length < 4) {
        const [qc, qr] = queue.shift()!;
        cells.push([qc, qr]);

        for (const [dc, dr] of [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ] as [number, number][]) {
          const nc = qc + dc;
          const nr = qr + dr;
          const nk = `${nc},${nr}`;
          if (
            nc >= 0 &&
            nc < cols &&
            nr >= 0 &&
            nr < rows &&
            bitmap[nr][nc] === 1 &&
            !visited.has(nk) &&
            cells.length + queue.length < 4
          ) {
            visited.add(nk);
            queue.push([nc, nr]);
          }
        }
      }

      // Normalize shape relative to bounding box
      const minC = Math.min(...cells.map(([cc]) => cc));
      const minR = Math.min(...cells.map(([, rr]) => rr));
      const shape = cells.map(
        ([cc, rr]) => [cc - minC, rr - minR] as [number, number]
      );

      pieces.push({
        id: startId + pieces.length,
        shape,
        gridCol: offsetCol + minC,
        gridRow: offsetRow + minR,
        color: COLORS[colorIdx.value % COLORS.length],
      });
      colorIdx.value++;
    }
  }

  return pieces;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  // Using ref to avoid re-running effect
  const ref = useRef(matches);
  ref.current = matches;

  // One-time listener setup
  useState(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  });

  return matches;
}

export default function NotFound() {
  const isMobile = useMediaQuery("(max-width: 480px)");
  const cellSize = isMobile ? 20 : 28;

  const initialPieces = useMemo(() => {
    const colorIdx = { value: 0 };
    const rowOffset = 1; // center 8-row digits in 10-row grid
    return [
      ...generatePieces(DIGIT_4, 3, rowOffset, 0, colorIdx),
      ...generatePieces(DIGIT_0, 10, rowOffset, 100, colorIdx),
      ...generatePieces(DIGIT_4, 17, rowOffset, 200, colorIdx),
    ];
  }, []);

  const [pieces, setPieces] = useState<Piece[]>(initialPieces);
  const [dragging, setDragging] = useState<{
    id: number;
    offsetX: number;
    offsetY: number;
    pixelX: number;
    pixelY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const recycleRef = useRef<HTMLButtonElement>(null);
  const nextIdRef = useRef(300);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, piece: Piece) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const pieceX = piece.gridCol * cellSize;
      const pieceY = piece.gridRow * cellSize;
      const offsetX = e.clientX - rect.left - pieceX;
      const offsetY = e.clientY - rect.top - pieceY;

      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setDragging({
        id: piece.id,
        offsetX,
        offsetY,
        pixelX: pieceX,
        pixelY: pieceY,
      });
    },
    [cellSize]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const pixelX = e.clientX - rect.left - dragging.offsetX;
      const pixelY = e.clientY - rect.top - dragging.offsetY;

      setDragging((prev) => (prev ? { ...prev, pixelX, pixelY } : null));
    },
    [dragging]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;

      // Check if dropped on recycle bin
      const recycleEl = recycleRef.current;
      if (recycleEl) {
        const recycleRect = recycleEl.getBoundingClientRect();
        if (
          e.clientX >= recycleRect.left &&
          e.clientX <= recycleRect.right &&
          e.clientY >= recycleRect.top &&
          e.clientY <= recycleRect.bottom
        ) {
          setPieces((prev) => prev.filter((p) => p.id !== dragging.id));
          setDragging(null);
          return;
        }
      }

      const piece = pieces.find((p) => p.id === dragging.id);
      if (!piece) {
        setDragging(null);
        return;
      }

      // Find bounding box of shape to clamp properly
      const maxShapeCol = Math.max(...piece.shape.map(([c]) => c));
      const maxShapeRow = Math.max(...piece.shape.map(([, r]) => r));

      let snappedCol = Math.round(dragging.pixelX / cellSize);
      let snappedRow = Math.round(dragging.pixelY / cellSize);

      // Clamp within grid bounds
      snappedCol = Math.max(0, Math.min(COLS - 1 - maxShapeCol, snappedCol));
      snappedRow = Math.max(0, Math.min(ROWS - 1 - maxShapeRow, snappedRow));

      // Build set of occupied cells (excluding the dragged piece)
      const occupied = new Set<string>();
      for (const other of pieces) {
        if (other.id === dragging.id) continue;
        for (const [sc, sr] of other.shape) {
          occupied.add(`${other.gridCol + sc},${other.gridRow + sr}`);
        }
      }

      // Check if target position overlaps
      const wouldOverlap = piece.shape.some(([sc, sr]) =>
        occupied.has(`${snappedCol + sc},${snappedRow + sr}`)
      );

      if (!wouldOverlap) {
        setPieces((prev) =>
          prev.map((p) =>
            p.id === dragging.id
              ? { ...p, gridCol: snappedCol, gridRow: snappedRow }
              : p
          )
        );
      }
      setDragging(null);
    },
    [dragging, pieces, cellSize]
  );

  const spawnPiece = useCallback(() => {
    const shape = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
    const maxC = Math.max(...shape.map(([c]) => c));
    const maxR = Math.max(...shape.map(([, r]) => r));

    // Build occupied set
    const occupied = new Set<string>();
    for (const p of pieces) {
      for (const [sc, sr] of p.shape) {
        occupied.add(`${p.gridCol + sc},${p.gridRow + sr}`);
      }
    }

    // Try random positions to find a free spot
    for (let attempt = 0; attempt < 200; attempt++) {
      const col = Math.floor(Math.random() * (COLS - maxC));
      const row = Math.floor(Math.random() * (ROWS - maxR));
      const fits = shape.every(
        ([sc, sr]) => !occupied.has(`${col + sc},${row + sr}`)
      );
      if (fits) {
        const id = nextIdRef.current++;
        setPieces((prev) => [
          ...prev,
          {
            id,
            shape: shape.map(([c, r]) => [c, r] as [number, number]),
            gridCol: col,
            gridRow: row,
            color: COLORS[0],
          },
        ]);
        return;
      }
    }
  }, [pieces]);

  const gridWidth = COLS * cellSize;
  const gridHeight = ROWS * cellSize;

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.playground}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          ref={containerRef}
          className={styles.gridContainer}
          style={{ width: gridWidth, height: gridHeight }}
        >
          {/* Grid lines */}
          <div
            className={styles.gridLines}
            style={{
              gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${ROWS}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: COLS * ROWS }, (_, i) => (
              <div key={i} className={styles.gridCell} />
            ))}
          </div>

          {/* Pieces */}
          {pieces.map((piece) => {
            const isDragging = dragging?.id === piece.id;
            const x = isDragging ? dragging.pixelX : piece.gridCol * cellSize;
            const y = isDragging ? dragging.pixelY : piece.gridRow * cellSize;

            const maxC = Math.max(...piece.shape.map(([c]) => c)) + 1;
            const maxR = Math.max(...piece.shape.map(([, r]) => r)) + 1;

            return (
              <div
                key={piece.id}
                className={`${styles.piece} ${isDragging ? styles.pieceDragging : ""}`}
                style={{
                  left: x,
                  top: y,
                  width: maxC * cellSize,
                  height: maxR * cellSize,
                }}
                onPointerDown={(e) => onPointerDown(e, piece)}
              >
                {/* Connectors between adjacent blocks */}
                {piece.shape.flatMap(([c, r]) => {
                  const connectors = [];
                  const cellSet = new Set(piece.shape.map(([sc, sr]) => `${sc},${sr}`));
                  const brickSize = cellSize * 0.65;
                  const offset = (cellSize - brickSize) / 2;
                  const connectorThickness = 2;

                  // Right neighbor
                  if (cellSet.has(`${c + 1},${r}`)) {
                    connectors.push(
                      <div
                        key={`conn-${c}-${r}-r`}
                        className={styles.connector}
                        style={{
                          left: c * cellSize + offset + brickSize,
                          top: r * cellSize + offset + (brickSize - connectorThickness) / 2,
                          width: cellSize - brickSize,
                          height: connectorThickness,
                          backgroundColor: piece.color,
                        }}
                      />
                    );
                  }
                  // Bottom neighbor
                  if (cellSet.has(`${c},${r + 1}`)) {
                    connectors.push(
                      <div
                        key={`conn-${c}-${r}-b`}
                        className={styles.connector}
                        style={{
                          left: c * cellSize + offset + (brickSize - connectorThickness) / 2,
                          top: r * cellSize + offset + brickSize,
                          width: connectorThickness,
                          height: cellSize - brickSize,
                          backgroundColor: piece.color,
                        }}
                      />
                    );
                  }
                  return connectors;
                })}
                {/* Blocks */}
                {piece.shape.map(([c, r]) => {
                  const brickSize = cellSize * 0.65;
                  const offset = (cellSize - brickSize) / 2;
                  return (
                    <div
                      key={`${c}-${r}`}
                      className={styles.block}
                      style={{
                        left: c * cellSize + offset,
                        top: r * cellSize + offset,
                        width: brickSize,
                        height: brickSize,
                        backgroundColor: piece.color,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className={styles.sidebar}>
          <button
            ref={recycleRef}
            className={styles.sidebarBox}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span className={styles.sidebarLabel}>recycle bin</span>
          </button>

          <button
            className={styles.sidebarBox}
            onClick={() => setPieces([])}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className={styles.sidebarLabel}>clear</span>
          </button>

          <button
            className={styles.sidebarBox}
            onClick={spawnPiece}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className={styles.sidebarLabel}>brick box</span>
          </button>
        </div>
      </div>

      <div className={styles.message}>
        <p className={styles.title}>Page not found</p>
        <Link href="/" className={styles.link}>
          go back home <span className={styles.arrow}>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
