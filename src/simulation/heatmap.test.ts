import { describe, it, expect } from "vitest";
import { computeHeatmapGrid, extendHeatmapGrid } from "./heatmap";
import type { WalkState } from "./types";

function makeWalk(points: { x: number; y: number }[]): WalkState {
  return {
    params: { seed: 0, steps: points.length - 1, stepLength: 1, walkType: "isotropic" },
    points,
  };
}

describe("computeHeatmapGrid", () => {
  it("returns grid with positive dimensions", () => {
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    const hm = computeHeatmapGrid(walk, 1, 2);
    expect(hm.cols).toBeGreaterThan(0);
    expect(hm.rows).toBeGreaterThan(0);
    expect(hm.grid.length).toBe(hm.cols * hm.rows);
  });

  it("has non-zero maxCount for walks with segments", () => {
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
    ]);
    const hm = computeHeatmapGrid(walk, 1, 2);
    expect(hm.maxCount).toBeGreaterThan(0);
  });

  it("records visits along segment path (DDA rasterization)", () => {
    // Horizontal segment from (0,0) to (3,0)
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    ]);
    const hm = computeHeatmapGrid(walk, 1, 1);
    // At least some cells should have been visited
    const totalVisits = hm.grid.reduce((a, b) => a + b, 0);
    expect(totalVisits).toBeGreaterThan(0);
  });

  it("handles single point (0 steps)", () => {
    const walk = makeWalk([{ x: 0, y: 0 }]);
    const hm = computeHeatmapGrid(walk, 1, 0);
    expect(hm.cols).toBeGreaterThan(0);
    expect(hm.rows).toBeGreaterThan(0);
    expect(hm.maxCount).toBe(0);
  });
});

describe("extendHeatmapGrid", () => {
  it("produces the same result as full recompute", () => {
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
      { x: 3, y: 1 },
      { x: 4, y: 0 },
    ]);

    // Full compute up to step 4
    const full = computeHeatmapGrid(walk, 1, 4);

    // Incremental: compute up to step 2, then extend to step 4
    const partial = computeHeatmapGrid(walk, 1, 2);
    const extended = extendHeatmapGrid(partial, walk, 2, 4, 1);

    expect(Array.from(extended.grid)).toEqual(Array.from(full.grid));
    expect(extended.maxCount).toBe(full.maxCount);
  });
});
