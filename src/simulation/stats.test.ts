import { describe, it, expect } from "vitest";
import { StatsAccumulator } from "./stats";
import type { WalkState } from "./types";

function makeWalk(points: { x: number; y: number }[]): WalkState {
  return {
    params: { seed: 1, steps: points.length - 1, stepLength: 1, walkType: "isotropic" },
    points,
  };
}

describe("StatsAccumulator", () => {
  it("returns zero stats at step 0", () => {
    const acc = new StatsAccumulator();
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    const stats = acc.compute(walk, 0);
    expect(stats.currentStep).toBe(0);
    expect(stats.totalSteps).toBe(1);
    expect(stats.distanceFromOrigin).toBe(0);
    expect(stats.maxDistance).toBe(0);
    expect(stats.totalPathLength).toBe(0);
  });

  it("computes stats after one step", () => {
    const acc = new StatsAccumulator();
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]);
    const stats = acc.compute(walk, 1);
    expect(stats.currentStep).toBe(1);
    expect(stats.distanceFromOrigin).toBe(5);
    expect(stats.maxDistance).toBe(5);
    expect(stats.totalPathLength).toBe(5);
  });

  it("incrementally accumulates stats", () => {
    const acc = new StatsAccumulator();
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);

    acc.compute(walk, 1);
    const stats = acc.compute(walk, 3);

    expect(stats.currentStep).toBe(3);
    expect(stats.totalPathLength).toBeCloseTo(3, 10);
    expect(stats.distanceFromOrigin).toBeCloseTo(1, 10);
    expect(stats.maxDistance).toBeCloseTo(Math.sqrt(2), 10);
  });

  it("resets when step goes backwards", () => {
    const acc = new StatsAccumulator();
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);

    acc.compute(walk, 3);
    const stats = acc.compute(walk, 1);

    expect(stats.currentStep).toBe(1);
    expect(stats.totalPathLength).toBeCloseTo(1, 10);
    expect(stats.maxDistance).toBeCloseTo(1, 10);
  });

  it("handles reset() explicitly", () => {
    const acc = new StatsAccumulator();
    const walk = makeWalk([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ]);

    acc.compute(walk, 1);
    acc.reset();
    const stats = acc.compute(walk, 1);

    expect(stats.totalPathLength).toBeCloseTo(5, 10);
    expect(stats.maxDistance).toBeCloseTo(5, 10);
  });
});
