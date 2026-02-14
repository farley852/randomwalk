import { mulberry32 } from "./prng";
import type { Point, WalkParams, WalkState } from "./types";

/**
 * Generate a complete random walk.
 * Each step picks a random angle [0, 2π) and moves `stepLength` in that direction.
 * The walk starts at the origin (0, 0).
 */
export function generateWalk(params: WalkParams): WalkState {
  const { seed, steps, stepLength } = params;
  const rng = mulberry32(seed);
  const points: Point[] = [{ x: 0, y: 0 }];

  for (let i = 0; i < steps; i++) {
    const angle = rng() * Math.PI * 2;
    const prev = points[i];
    points.push({
      x: prev.x + Math.cos(angle) * stepLength,
      y: prev.y + Math.sin(angle) * stepLength,
    });
  }

  return { params, points };
}
