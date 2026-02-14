import type { Point, WalkState } from "./types";

export interface HeatmapGrid {
  grid: Uint16Array;
  maxCount: number;
  originX: number;
  originY: number;
  cellSize: number;
  cols: number;
  rows: number;
}

/**
 * DDA-based segment rasterization: walk through each cell the segment crosses
 * and increment the visit count.
 */
function rasterizeSegment(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  originX: number,
  originY: number,
  cellSize: number,
  cols: number,
  rows: number,
  grid: Uint16Array,
): void {
  // Convert to grid coordinates
  const gx0 = (x0 - originX) / cellSize;
  const gy0 = (y0 - originY) / cellSize;
  const gx1 = (x1 - originX) / cellSize;
  const gy1 = (y1 - originY) / cellSize;

  const dx = Math.abs(gx1 - gx0);
  const dy = Math.abs(gy1 - gy0);
  let cx = Math.floor(gx0);
  let cy = Math.floor(gy0);
  const endCx = Math.floor(gx1);
  const endCy = Math.floor(gy1);
  const sx = gx1 > gx0 ? 1 : -1;
  const sy = gy1 > gy0 ? 1 : -1;

  // DDA traversal
  if (dx === 0 && dy === 0) {
    // Segment within single cell
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      grid[cy * cols + cx]++;
    }
    return;
  }

  // tMaxX/tMaxY: parameter t at which we cross the next grid boundary
  let tMaxX =
    dx === 0 ? Infinity : ((cx + (sx > 0 ? 1 : 0) - gx0) / (gx1 - gx0)) * (sx > 0 ? 1 : 1);
  let tMaxY =
    dy === 0 ? Infinity : ((cy + (sy > 0 ? 1 : 0) - gy0) / (gy1 - gy0)) * (sy > 0 ? 1 : 1);

  // Recalculate properly
  if (dx !== 0) {
    tMaxX =
      sx > 0 ? (Math.floor(gx0) + 1 - gx0) / (gx1 - gx0) : (gx0 - Math.floor(gx0)) / (gx0 - gx1);
  } else {
    tMaxX = Infinity;
  }
  if (dy !== 0) {
    tMaxY =
      sy > 0 ? (Math.floor(gy0) + 1 - gy0) / (gy1 - gy0) : (gy0 - Math.floor(gy0)) / (gy0 - gy1);
  } else {
    tMaxY = Infinity;
  }

  const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / (gx1 - gx0));
  const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / (gy1 - gy0));

  // Safety limit to prevent infinite loops
  const maxSteps = cols + rows + 2;
  for (let step = 0; step < maxSteps; step++) {
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      grid[cy * cols + cx]++;
    }

    if (cx === endCx && cy === endCy) break;

    if (tMaxX < tMaxY) {
      cx += sx;
      tMaxX += tDeltaX;
    } else {
      cy += sy;
      tMaxY += tDeltaY;
    }
  }
}

function computeBoundsFromPoints(
  points: Point[],
  cellSize: number,
): { originX: number; originY: number; cols: number; rows: number } {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Add a small margin
  const margin = cellSize;
  minX -= margin;
  minY -= margin;
  maxX += margin;
  maxY += margin;

  const cols = Math.ceil((maxX - minX) / cellSize);
  const rows = Math.ceil((maxY - minY) / cellSize);

  return { originX: minX, originY: minY, cols: Math.max(1, cols), rows: Math.max(1, rows) };
}

function computeBoundsAndGrid(
  walk: WalkState,
  cellSize: number,
): { originX: number; originY: number; cols: number; rows: number } {
  return computeBoundsFromPoints(walk.points, cellSize);
}

function findMaxCount(grid: Uint16Array): number {
  let max = 0;
  for (let j = 0; j < grid.length; j++) {
    if (grid[j] > max) max = grid[j];
  }
  return max;
}

function rasterizeWalkSegments(
  points: Point[],
  fromStep: number,
  toStep: number,
  originX: number,
  originY: number,
  cellSize: number,
  cols: number,
  rows: number,
  grid: Uint16Array,
): void {
  const end = Math.min(toStep, points.length - 1);
  for (let i = fromStep; i < end; i++) {
    rasterizeSegment(
      points[i].x, points[i].y,
      points[i + 1].x, points[i + 1].y,
      originX, originY, cellSize, cols, rows, grid,
    );
  }
}

/**
 * Compute heatmap from scratch up to a given step.
 * Used for GIF export and initial computation.
 */
export function computeHeatmapGrid(
  walk: WalkState,
  cellSize: number,
  upToStep: number,
): HeatmapGrid {
  const { originX, originY, cols, rows } = computeBoundsAndGrid(walk, cellSize);
  const grid = new Uint16Array(cols * rows);

  rasterizeWalkSegments(walk.points, 0, upToStep, originX, originY, cellSize, cols, rows, grid);
  const maxCount = findMaxCount(grid);

  return { grid, maxCount, originX, originY, cellSize, cols, rows };
}

/**
 * Incrementally extend an existing heatmap grid by adding new segments.
 * Returns a new HeatmapGrid (reuses the same grid buffer if dimensions match).
 */
export function extendHeatmapGrid(
  prev: HeatmapGrid,
  walk: WalkState,
  fromStep: number,
  toStep: number,
  cellSize: number,
): HeatmapGrid {
  const { grid, cols, rows, originX, originY } = prev;

  rasterizeWalkSegments(walk.points, fromStep, toStep, originX, originY, cellSize, cols, rows, grid);
  const maxCount = findMaxCount(grid);

  return { grid, maxCount, originX, originY, cellSize, cols, rows };
}

/**
 * Compute heatmap from multiple walks, aggregating all segments into one grid.
 * Grid bounds are computed from all walks' points for stability.
 */
export function computeMultiWalkHeatmapGrid(
  walks: WalkState[],
  cellSize: number,
  upToStep: number,
): HeatmapGrid {
  const allPoints: Point[] = walks.flatMap((w) => w.points);
  const { originX, originY, cols, rows } = computeBoundsFromPoints(allPoints, cellSize);
  const grid = new Uint16Array(cols * rows);

  for (const walk of walks) {
    rasterizeWalkSegments(walk.points, 0, upToStep, originX, originY, cellSize, cols, rows, grid);
  }

  const maxCount = findMaxCount(grid);
  return { grid, maxCount, originX, originY, cellSize, cols, rows };
}
