export interface Point {
  x: number;
  y: number;
}

export interface WalkParams {
  seed: number;
  steps: number;
  stepLength: number;
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
  heatmap: { enabled: boolean; opacity: number };
  trailFade: { enabled: boolean; trailLength: number };
}
