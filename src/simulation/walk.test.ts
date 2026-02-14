import { describe, it, expect } from "vitest";
import { generateWalk } from "./walk";

describe("generateWalk", () => {
  const baseParams = { seed: 42, steps: 100, stepLength: 1, walkType: "isotropic" as const };

  it("produces steps+1 points (origin + N steps)", () => {
    const { points } = generateWalk(baseParams);
    expect(points).toHaveLength(101);
  });

  it("starts at the origin", () => {
    const { points } = generateWalk(baseParams);
    expect(points[0]).toEqual({ x: 0, y: 0 });
  });

  it("each step has the correct distance", () => {
    const stepLength = 5;
    const { points } = generateWalk({ seed: 1, steps: 50, stepLength, walkType: "isotropic" });

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeCloseTo(stepLength, 10);
    }
  });

  it("is reproducible with the same seed", () => {
    const walk1 = generateWalk(baseParams);
    const walk2 = generateWalk(baseParams);
    expect(walk1.points).toEqual(walk2.points);
  });

  it("handles 0 steps", () => {
    const { points } = generateWalk({ seed: 1, steps: 0, stepLength: 1, walkType: "isotropic" });
    expect(points).toHaveLength(1);
    expect(points[0]).toEqual({ x: 0, y: 0 });
  });
});

describe("generateWalk — lattice", () => {
  const baseParams = { seed: 42, steps: 100, stepLength: 5, walkType: "lattice" as const };

  it("produces steps+1 points", () => {
    const { points } = generateWalk(baseParams);
    expect(points).toHaveLength(101);
  });

  it("each step is axis-aligned with correct distance", () => {
    const { points } = generateWalk(baseParams);
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      // One component should be 0, other should be ±stepLength
      const isAxisAligned =
        (dx === 0 && Math.abs(dy) === baseParams.stepLength) ||
        (dy === 0 && Math.abs(dx) === baseParams.stepLength);
      expect(isAxisAligned).toBe(true);
    }
  });

  it("is reproducible with the same seed", () => {
    const walk1 = generateWalk(baseParams);
    const walk2 = generateWalk(baseParams);
    expect(walk1.points).toEqual(walk2.points);
  });
});

describe("generateWalk — levy", () => {
  const baseParams = { seed: 42, steps: 200, stepLength: 1, walkType: "levy" as const };

  it("produces steps+1 points", () => {
    const { points } = generateWalk(baseParams);
    expect(points).toHaveLength(201);
  });

  it("step lengths are >= stepLength", () => {
    const { points } = generateWalk(baseParams);
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeGreaterThanOrEqual(baseParams.stepLength - 1e-10);
    }
  });

  it("step lengths have variation (max/min > 2)", () => {
    const { points } = generateWalk(baseParams);
    let minDist = Infinity;
    let maxDist = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      minDist = Math.min(minDist, dist);
      maxDist = Math.max(maxDist, dist);
    }
    expect(maxDist / minDist).toBeGreaterThan(2);
  });

  it("is reproducible with the same seed", () => {
    const walk1 = generateWalk(baseParams);
    const walk2 = generateWalk(baseParams);
    expect(walk1.points).toEqual(walk2.points);
  });
});

describe("generateWalk — self-avoiding", () => {
  const baseParams = { seed: 42, steps: 100, stepLength: 5, walkType: "self-avoiding" as const };

  it("all points are unique (no revisits)", () => {
    const { points } = generateWalk(baseParams);
    const keys = points.map((p) => `${p.x},${p.y}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(points.length);
  });

  it("params.steps matches actual steps on early termination", () => {
    const walk = generateWalk(baseParams);
    expect(walk.params.steps).toBe(walk.points.length - 1);
  });

  it("is reproducible with the same seed", () => {
    const walk1 = generateWalk(baseParams);
    const walk2 = generateWalk(baseParams);
    expect(walk1.points).toEqual(walk2.points);
  });
});
