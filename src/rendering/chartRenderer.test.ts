import { describe, it, expect } from "vitest";
import { computeLogTicks, computeLinearTicks } from "./chartRenderer";

describe("computeLogTicks", () => {
  it("returns powers of 10 within range", () => {
    const ticks = computeLogTicks(1, 10000);
    expect(ticks).toEqual([1, 10, 100, 1000, 10000]);
  });

  it("returns empty for invalid range", () => {
    expect(computeLogTicks(0, 100)).toEqual([]);
    expect(computeLogTicks(100, 10)).toEqual([]);
    expect(computeLogTicks(-1, 100)).toEqual([]);
  });

  it("handles fractional ranges", () => {
    const ticks = computeLogTicks(0.5, 50);
    expect(ticks).toEqual([1, 10]);
  });
});

describe("computeLinearTicks", () => {
  it("produces reasonable tick spacing", () => {
    const ticks = computeLinearTicks(0, 100, 6);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.length).toBeLessThanOrEqual(12);
    // Ticks should be evenly spaced
    for (let i = 1; i < ticks.length; i++) {
      const diff = ticks[i] - ticks[i - 1];
      expect(diff).toBeCloseTo(ticks[1] - ticks[0], 10);
    }
  });

  it("handles small ranges", () => {
    const ticks = computeLinearTicks(0, 0.5, 5);
    expect(ticks.length).toBeGreaterThan(0);
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(0.5 + 0.1);
    }
  });

  it("returns single tick for min===max", () => {
    const ticks = computeLinearTicks(5, 5, 6);
    expect(ticks).toEqual([5]);
  });
});
