import { mulberry32 } from "./prng";
import type { Point, WalkParams, WalkState } from "./types";

/**
 * Generate a complete random walk based on the walk type.
 */
export function generateWalk(params: WalkParams): WalkState {
  switch (params.walkType) {
    case "lattice":
      return generateLatticeWalk(params);
    case "levy":
      return generateLevyWalk(params);
    case "self-avoiding":
      return generateSelfAvoidingWalk(params);
    case "isotropic":
    default:
      return generateIsotropicWalk(params);
  }
}

/**
 * Isotropic random walk: each step picks a random angle [0, 2π)
 * and moves `stepLength` in that direction.
 */
function generateIsotropicWalk(params: WalkParams): WalkState {
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

/**
 * Lattice walk: 4-direction (right/up/left/down) grid walk.
 */
function generateLatticeWalk(params: WalkParams): WalkState {
  const { seed, steps, stepLength } = params;
  const rng = mulberry32(seed);
  const points: Point[] = [{ x: 0, y: 0 }];
  const dirs = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];

  for (let i = 0; i < steps; i++) {
    const dir = dirs[Math.floor(rng() * 4)];
    const prev = points[i];
    points.push({
      x: prev.x + dir.x * stepLength,
      y: prev.y + dir.y * stepLength,
    });
  }

  return { params, points };
}

/**
 * Levy flight: uniform random direction with power-law distributed step lengths.
 * Uses Pareto inverse CDF: len = stepLength * u^(-1/alpha).
 */
function generateLevyWalk(params: WalkParams): WalkState {
  const { seed, steps, stepLength } = params;
  const alpha = params.levyAlpha ?? 1.5;
  const rng = mulberry32(seed);
  const points: Point[] = [{ x: 0, y: 0 }];

  for (let i = 0; i < steps; i++) {
    const angle = rng() * Math.PI * 2;
    const u = Math.max(rng(), 0.01);
    const len = stepLength * Math.pow(u, -1 / alpha);
    const prev = points[i];
    points.push({
      x: prev.x + Math.cos(angle) * len,
      y: prev.y + Math.sin(angle) * len,
    });
  }

  return { params, points };
}

/**
 * Self-avoiding walk: lattice walk that never revisits a cell.
 * Terminates early if no unvisited neighbor is available.
 */
function generateSelfAvoidingWalk(params: WalkParams): WalkState {
  const { seed, steps, stepLength } = params;
  const rng = mulberry32(seed);
  const points: Point[] = [{ x: 0, y: 0 }];
  const visited = new Set<string>();
  visited.add("0,0");

  const dirs = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];

  for (let i = 0; i < steps; i++) {
    const prev = points[points.length - 1];
    const candidates = dirs.filter((d) => {
      const nx = prev.x + d.x * stepLength;
      const ny = prev.y + d.y * stepLength;
      return !visited.has(`${nx},${ny}`);
    });

    if (candidates.length === 0) break;

    const dir = candidates[Math.floor(rng() * candidates.length)];
    const next = {
      x: prev.x + dir.x * stepLength,
      y: prev.y + dir.y * stepLength,
    };
    visited.add(`${next.x},${next.y}`);
    points.push(next);
  }

  const actualSteps = points.length - 1;
  const finalParams = actualSteps !== steps ? { ...params, steps: actualSteps } : params;
  return { params: finalParams, points };
}
