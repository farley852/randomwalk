import { describe, it, expect } from "vitest";
import { mulberry32 } from "./prng";

describe("mulberry32", () => {
  it("produces reproducible sequences from the same seed", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);

    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());

    expect(seq1).not.toEqual(seq2);
  });

  it("has reasonable distribution (no extreme clustering)", () => {
    const rng = mulberry32(999);
    const n = 1000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += rng();
    }
    const mean = sum / n;
    // Mean should be roughly 0.5 for a uniform distribution
    expect(mean).toBeGreaterThan(0.4);
    expect(mean).toBeLessThan(0.6);
  });
});
