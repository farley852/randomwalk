import type { WalkParams } from "../simulation/types";

const DEFAULTS: WalkParams = { seed: 42, steps: 500, stepLength: 5, walkType: "isotropic" };

const RANGES = {
  seed: { min: 1, max: 9999 },
  steps: { min: 10, max: 5000 },
  stepLength: { min: 1, max: 20 },
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function readParamsFromURL(): Partial<WalkParams> {
  const sp = new URLSearchParams(window.location.search);
  const result: Partial<WalkParams> = {};

  const seed = sp.get("seed");
  if (seed !== null) {
    const n = Number(seed);
    if (Number.isFinite(n)) {
      result.seed = clamp(Math.round(n), RANGES.seed.min, RANGES.seed.max);
    }
  }

  const steps = sp.get("steps");
  if (steps !== null) {
    const n = Number(steps);
    if (Number.isFinite(n)) {
      result.steps = clamp(Math.round(n), RANGES.steps.min, RANGES.steps.max);
    }
  }

  const stepLength = sp.get("stepLength");
  if (stepLength !== null) {
    const n = Number(stepLength);
    if (Number.isFinite(n)) {
      result.stepLength = clamp(Math.round(n), RANGES.stepLength.min, RANGES.stepLength.max);
    }
  }

  return result;
}

export function writeParamsToURL(params: WalkParams): void {
  const sp = new URLSearchParams();

  if (params.seed !== DEFAULTS.seed) sp.set("seed", String(params.seed));
  if (params.steps !== DEFAULTS.steps) sp.set("steps", String(params.steps));
  if (params.stepLength !== DEFAULTS.stepLength) sp.set("stepLength", String(params.stepLength));

  const qs = sp.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  history.replaceState(null, "", url);
}
