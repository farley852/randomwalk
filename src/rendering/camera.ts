import type { Point } from "../simulation/types";

export interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

/**
 * Compute a transform that centers the walk's bounding box in the canvas
 * with some padding.
 */
export function computeViewTransform(
  points: Point[],
  canvasWidth: number,
  canvasHeight: number,
  padding = 40
): ViewTransform {
  if (points.length === 0) {
    return { offsetX: canvasWidth / 2, offsetY: canvasHeight / 2, scale: 1 };
  }

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

  const walkW = maxX - minX || 1;
  const walkH = maxY - minY || 1;
  const availW = canvasWidth - padding * 2;
  const availH = canvasHeight - padding * 2;
  const scale = Math.min(availW / walkW, availH / walkH);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const offsetX = canvasWidth / 2 - cx * scale;
  const offsetY = canvasHeight / 2 - cy * scale;

  return { offsetX, offsetY, scale };
}
