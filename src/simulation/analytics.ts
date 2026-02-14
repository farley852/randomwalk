import type { WalkState, MSDPoint, HistogramBin, AnalyticsData } from "./types";

const MAX_MSD_SAMPLES = 200;
const HIST_BINS = 30;
const MIN_STEPS_FOR_EXPONENT = 10;

/**
 * Generate logarithmically spaced sample indices from 1..maxT.
 */
function logSpacedIndices(maxT: number, count: number): number[] {
  if (maxT <= 0) return [];
  if (maxT <= count) {
    return Array.from({ length: maxT }, (_, i) => i + 1);
  }
  const indices = new Set<number>();
  for (let i = 0; i < count; i++) {
    const t = Math.round(Math.exp((i / (count - 1)) * Math.log(maxT)));
    indices.add(Math.max(1, Math.min(t, maxT)));
  }
  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Compute MSD curve: for each time t, average r²(t) over all walks.
 * r²(t) = x(t)² + y(t)², since all walks start at origin.
 */
function computeMSD(walks: WalkState[], currentStep: number): MSDPoint[] {
  const maxT = currentStep;
  if (maxT <= 0) return [];

  const sampleTs = logSpacedIndices(maxT, MAX_MSD_SAMPLES);
  return sampleTs.map((t) => {
    let sumR2 = 0;
    let count = 0;
    for (const walk of walks) {
      if (t < walk.points.length) {
        const p = walk.points[t];
        sumR2 += p.x * p.x + p.y * p.y;
        count++;
      }
    }
    return { t, msd: count > 0 ? sumR2 / count : 0 };
  });
}

/**
 * Compute diffusion exponent α via linear regression of log(MSD) vs log(t).
 * MSD ∝ t^α  →  log(MSD) = α·log(t) + const
 */
function computeDiffusionExponent(msdCurve: MSDPoint[]): number | null {
  // Filter positive values for log
  const valid = msdCurve.filter((p) => p.t > 0 && p.msd > 0);
  if (valid.length < MIN_STEPS_FOR_EXPONENT) return null;

  let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0;
  const n = valid.length;

  for (const p of valid) {
    const x = Math.log(p.t);
    const y = Math.log(p.msd);
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return null;

  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Build a linear-binned histogram from data values.
 */
function buildHistogram(values: number[], binCount: number): HistogramBin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ lo: min, hi: min + 1, count: values.length }];
  }
  const binWidth = (max - min) / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    lo: min + i * binWidth,
    hi: min + (i + 1) * binWidth,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
    bins[idx].count++;
  }
  return bins;
}

/**
 * Build a log-binned histogram for heavy-tailed data (e.g. Levy step lengths).
 */
function buildLogHistogram(values: number[], binCount: number): HistogramBin[] {
  const positive = values.filter((v) => v > 0);
  if (positive.length === 0) return [];
  const logMin = Math.log(Math.min(...positive));
  const logMax = Math.log(Math.max(...positive));
  if (logMin === logMax) {
    return [{ lo: positive[0], hi: positive[0] + 1, count: positive.length }];
  }
  const logBinWidth = (logMax - logMin) / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    lo: Math.exp(logMin + i * logBinWidth),
    hi: Math.exp(logMin + (i + 1) * logBinWidth),
    count: 0,
  }));
  for (const v of positive) {
    const idx = Math.min(
      Math.floor((Math.log(v) - logMin) / logBinWidth),
      binCount - 1,
    );
    bins[idx].count++;
  }
  return bins;
}

/**
 * Accumulator for analytics data. Supports incremental step-length computation.
 */
export class AnalyticsAccumulator {
  private lastStep = 0;
  private stepLengths: number[] = [];

  reset(): void {
    this.lastStep = 0;
    this.stepLengths = [];
  }

  compute(walks: WalkState[], currentStep: number): AnalyticsData {
    if (currentStep <= 0) {
      return this.emptyResult(walks);
    }

    const walkType = walks[0].params.walkType;
    const isLevy = walkType === "levy";

    // If step went backwards, recompute from scratch
    if (currentStep < this.lastStep) {
      this.stepLengths = [];
      this.lastStep = 0;
    }

    // Incremental step length accumulation (from primary walk)
    const primary = walks[0];
    const maxIdx = Math.min(currentStep, primary.points.length - 1);
    for (let i = this.lastStep; i < maxIdx; i++) {
      const p0 = primary.points[i];
      const p1 = primary.points[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      this.stepLengths.push(Math.sqrt(dx * dx + dy * dy));
    }
    this.lastStep = maxIdx;

    // MSD
    const msdCurve = computeMSD(walks, currentStep);

    // Diffusion exponent
    const diffusionExponent = computeDiffusionExponent(msdCurve);

    // Step length histogram
    const stepLengthHist = isLevy
      ? buildLogHistogram(this.stepLengths, HIST_BINS)
      : buildHistogram(this.stepLengths, HIST_BINS);

    // End distance histogram (meaningful for multi-walk)
    const endDistances = walks.map((w) => {
      const idx = Math.min(currentStep, w.points.length - 1);
      const p = w.points[idx];
      return Math.sqrt(p.x * p.x + p.y * p.y);
    });
    const endDistanceHist = buildHistogram(endDistances, HIST_BINS);

    return {
      msdCurve,
      diffusionExponent,
      stepLengthHist,
      endDistanceHist,
      walkType,
      walkCount: walks.length,
      levyAlpha: isLevy ? (walks[0].params.levyAlpha ?? 1.5) : undefined,
    };
  }

  private emptyResult(walks: WalkState[]): AnalyticsData {
    const walkType = walks[0].params.walkType;
    return {
      msdCurve: [],
      diffusionExponent: null,
      stepLengthHist: [],
      endDistanceHist: [],
      walkType,
      walkCount: walks.length,
      levyAlpha: walkType === "levy" ? (walks[0].params.levyAlpha ?? 1.5) : undefined,
    };
  }
}

// Export helpers for testing
export { computeMSD, computeDiffusionExponent, buildHistogram, buildLogHistogram, logSpacedIndices };
