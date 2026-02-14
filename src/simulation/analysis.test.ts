import { describe, it, expect } from "vitest";
import { AnalysisAccumulator, buildHistogram, buildLogHistogram } from "./analysis";
import { generateWalk } from "./walk";
import type { WalkState, WalkParams } from "./types";

function makeWalk(points: { x: number; y: number }[], walkType: WalkParams["walkType"] = "isotropic"): WalkState {
  return {
    params: { seed: 1, steps: points.length - 1, stepLength: 1, walkType },
    points,
  };
}

/** Straight walk along x-axis: (0,0) → (1,0) → (2,0) → ... */
function makeStraightWalk(n: number): WalkState {
  const points = Array.from({ length: n + 1 }, (_, i) => ({ x: i, y: 0 }));
  return makeWalk(points);
}

describe("AnalysisAccumulator", () => {
  // Test 1: Straight walk MSD = t²
  it("computes MSD = t² for a straight walk", () => {
    const acc = new AnalysisAccumulator();
    const walk = makeStraightWalk(100);
    const data = acc.compute([walk], 100);

    for (const p of data.msdCurve) {
      expect(p.msd).toBeCloseTo(p.t * p.t, 5);
    }
  });

  // Test 2: Multi-walk MSD averaging
  it("averages MSD correctly over multiple walks", () => {
    const acc = new AnalysisAccumulator();
    // Walk 1: goes right → r²(t) = t²
    const walk1 = makeWalk([
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
    ]);
    // Walk 2: goes up → r²(t) = t²
    const walk2 = makeWalk([
      { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
    ]);
    const data = acc.compute([walk1, walk2], 3);

    // Both walks have r²(t) = t², so average = t²
    for (const p of data.msdCurve) {
      expect(p.msd).toBeCloseTo(p.t * p.t, 5);
    }
  });

  // Test 3: Isotropic step length histogram peaks around stepLength
  it("produces step length histogram peaked near stepLength for isotropic walk", () => {
    const acc = new AnalysisAccumulator();
    const walk = generateWalk({ seed: 42, steps: 1000, stepLength: 5, walkType: "isotropic" });
    const data = acc.compute([walk], 1000);

    // All steps should be very close to stepLength=5 for isotropic
    expect(data.stepLengthHist.length).toBeGreaterThan(0);
    const totalCount = data.stepLengthHist.reduce((s, b) => s + b.count, 0);
    expect(totalCount).toBe(1000);
    // The histogram range should be very narrow around stepLength=5
    const firstBin = data.stepLengthHist[0];
    const lastBin = data.stepLengthHist[data.stepLengthHist.length - 1];
    const range = lastBin.hi - firstBin.lo;
    expect(range).toBeLessThan(0.01); // fp error only
    expect(firstBin.lo).toBeCloseTo(5, 1);
  });

  // Test 4: Levy step length histogram has heavy tail
  it("produces step length histogram with heavy tail for Levy walk", () => {
    const acc = new AnalysisAccumulator();
    const walk = generateWalk({ seed: 42, steps: 5000, stepLength: 1, walkType: "levy", levyAlpha: 1.5 });
    const data = acc.compute([walk], 5000);

    expect(data.stepLengthHist.length).toBeGreaterThan(0);
    // Check that there are multiple non-zero bins (spread out)
    const nonZeroBins = data.stepLengthHist.filter((b) => b.count > 0);
    expect(nonZeroBins.length).toBeGreaterThan(3);
  });

  // Test 5: Isotropic long walk diffusion exponent ≈ 1.0
  it("estimates diffusion exponent ≈ 1.0 for isotropic walk", () => {
    const acc = new AnalysisAccumulator();
    // Average over multiple walks for better convergence
    const walks = Array.from({ length: 20 }, (_, i) =>
      generateWalk({ seed: 100 + i, steps: 10000, stepLength: 1, walkType: "isotropic" }),
    );
    const data = acc.compute(walks, 10000);

    expect(data.diffusionExponent).not.toBeNull();
    expect(data.diffusionExponent!).toBeCloseTo(1.0, 0);
  });

  // Test 6: diffusionExponent is null when < 10 steps
  it("returns null diffusion exponent for fewer than 10 steps", () => {
    const acc = new AnalysisAccumulator();
    const walk = makeStraightWalk(5);
    const data = acc.compute([walk], 5);

    expect(data.diffusionExponent).toBeNull();
  });

  // Test 7: End distance histogram total count = walkCount
  it("produces end distance histogram with count equal to walkCount", () => {
    const acc = new AnalysisAccumulator();
    const walks = Array.from({ length: 5 }, (_, i) =>
      generateWalk({ seed: i + 1, steps: 100, stepLength: 1, walkType: "isotropic" }),
    );
    const data = acc.compute(walks, 100);

    const totalCount = data.endDistanceHist.reduce((s, b) => s + b.count, 0);
    expect(totalCount).toBe(5);
    expect(data.walkCount).toBe(5);
  });

  // Test 8: Incremental computation matches full-scratch computation
  it("produces same result for incremental vs full computation", () => {
    const walk = generateWalk({ seed: 42, steps: 200, stepLength: 5, walkType: "isotropic" });

    // Incremental: compute at 100, then at 200
    const accInc = new AnalysisAccumulator();
    accInc.compute([walk], 100);
    const incResult = accInc.compute([walk], 200);

    // Full: compute directly at 200
    const accFull = new AnalysisAccumulator();
    const fullResult = accFull.compute([walk], 200);

    // MSD should be identical
    expect(incResult.msdCurve.length).toBe(fullResult.msdCurve.length);
    for (let i = 0; i < incResult.msdCurve.length; i++) {
      expect(incResult.msdCurve[i].msd).toBeCloseTo(fullResult.msdCurve[i].msd, 10);
    }

    // Step lengths should be the same
    expect(incResult.stepLengthHist.length).toBe(fullResult.stepLengthHist.length);
    for (let i = 0; i < incResult.stepLengthHist.length; i++) {
      expect(incResult.stepLengthHist[i].count).toBe(fullResult.stepLengthHist[i].count);
    }
  });

  // Test 9: Backwards step resets correctly
  it("resets correctly when step goes backwards", () => {
    const walk = generateWalk({ seed: 42, steps: 200, stepLength: 5, walkType: "isotropic" });

    const acc = new AnalysisAccumulator();
    acc.compute([walk], 100);
    const result = acc.compute([walk], 50);

    // MSD should only go up to step 50
    for (const p of result.msdCurve) {
      expect(p.t).toBeLessThanOrEqual(50);
    }

    // Step length count should be 50 (not 100)
    const totalStepCount = result.stepLengthHist.reduce((s, b) => s + b.count, 0);
    expect(totalStepCount).toBe(50);
  });

  // Test 10: reset() clears all state
  it("clears all state on reset()", () => {
    const acc = new AnalysisAccumulator();
    const walk = generateWalk({ seed: 42, steps: 100, stepLength: 5, walkType: "isotropic" });
    acc.compute([walk], 100);

    acc.reset();

    const walk2 = makeWalk([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    const data = acc.compute([walk2], 1);

    const totalStepCount = data.stepLengthHist.reduce((s, b) => s + b.count, 0);
    expect(totalStepCount).toBe(1);
  });
});

describe("buildHistogram", () => {
  it("handles empty input", () => {
    expect(buildHistogram([], 10)).toEqual([]);
  });

  it("handles single value", () => {
    const bins = buildHistogram([5], 10);
    expect(bins.length).toBe(1);
    expect(bins[0].count).toBe(1);
  });
});

describe("buildLogHistogram", () => {
  it("handles empty input", () => {
    expect(buildLogHistogram([], 10)).toEqual([]);
  });

  it("places values in correct bins", () => {
    const values = [1, 10, 100, 1000];
    const bins = buildLogHistogram(values, 4);
    expect(bins.length).toBe(4);
    const totalCount = bins.reduce((s, b) => s + b.count, 0);
    expect(totalCount).toBe(4);
  });
});
