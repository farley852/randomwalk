export interface Point {
  x: number;
  y: number;
}

export type WalkType = 'isotropic' | 'lattice' | 'levy' | 'self-avoiding';

export interface WalkParams {
  seed: number;
  steps: number;
  stepLength: number;
  walkType: WalkType;
  levyAlpha?: number;
}

export interface WalkState {
  params: WalkParams;
  points: Point[];
}

export interface PlaybackState {
  currentStep: number;
  playing: boolean;
  drawSpeed: number; // steps per frame
}

export interface RenderOptions {
  heatmap: { enabled: boolean; opacity: number; allWalks: boolean };
  trailFade: { enabled: boolean; trailLength: number };
  grid: { enabled: boolean; showAxes: boolean; cellSize: number };
}

export interface WalkStats {
  currentStep: number;
  totalSteps: number;
  distanceFromOrigin: number;
  maxDistance: number;
  totalPathLength: number;
}

export interface MSDPoint {
  t: number;
  msd: number;
}

export interface HistogramBin {
  lo: number;
  hi: number;
  count: number;
}

export interface AnalyticsData {
  msdCurve: MSDPoint[];
  diffusionExponent: number | null;
  stepLengthHist: HistogramBin[];
  endDistanceHist: HistogramBin[];
  walkType: WalkType;
  walkCount: number;
  levyAlpha?: number;
}
