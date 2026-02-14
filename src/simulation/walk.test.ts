import { describe, it, expect } from "vitest";
import { generateWalk } from "./walk";

describe("generateWalk", () => {
  const baseParams = { seed: 42, steps: 100, stepLength: 1 };

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
    const { points } = generateWalk({ seed: 1, steps: 50, stepLength });

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
    const { points } = generateWalk({ seed: 1, steps: 0, stepLength: 1 });
    expect(points).toHaveLength(1);
    expect(points[0]).toEqual({ x: 0, y: 0 });
  });
});
