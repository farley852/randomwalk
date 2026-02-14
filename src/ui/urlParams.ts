import type { WalkParams, WalkType } from "../simulation/types";

const DEFAULTS: WalkParams = { seed: 42, steps: 500, stepLength: 5, walkType: "isotropic" };

const RANGES = {
  seed: { min: 1, max: 9999 },
  steps: { min: 10, max: 50000 },
  stepLength: { min: 1, max: 20 },
  levyAlpha: { min: 1.0, max: 3.0 },
} as const;

const VALID_WALK_TYPES: WalkType[] = ["isotropic", "lattice", "levy", "self-avoiding"];

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

  const walkType = sp.get("walkType");
  if (walkType !== null && VALID_WALK_TYPES.includes(walkType as WalkType)) {
    result.walkType = walkType as WalkType;
  }

  const levyAlpha = sp.get("levyAlpha");
  if (levyAlpha !== null) {
    const n = Number(levyAlpha);
    if (Number.isFinite(n)) {
      result.levyAlpha = clamp(
        Math.round(n * 10) / 10,
        RANGES.levyAlpha.min,
        RANGES.levyAlpha.max,
      );
    }
  }

  return result;
}

export function readWalkCountFromURL(): number | undefined {
  const sp = new URLSearchParams(window.location.search);
  const val = sp.get("walkCount");
  if (val !== null) {
    const n = Number(val);
    if (Number.isFinite(n)) {
      return clamp(Math.round(n), 1, 10);
    }
  }
  return undefined;
}

export function writeParamsToURL(params: WalkParams, walkCount = 1): void {
  const sp = new URLSearchParams();

  if (params.seed !== DEFAULTS.seed) sp.set("seed", String(params.seed));
  if (params.steps !== DEFAULTS.steps) sp.set("steps", String(params.steps));
  if (params.stepLength !== DEFAULTS.stepLength) sp.set("stepLength", String(params.stepLength));
  if (params.walkType !== DEFAULTS.walkType) sp.set("walkType", params.walkType);
  if (params.levyAlpha !== undefined && params.levyAlpha !== 1.5)
    sp.set("levyAlpha", String(params.levyAlpha));
  if (walkCount > 1) sp.set("walkCount", String(walkCount));

  const qs = sp.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  history.replaceState(null, "", url);
}
