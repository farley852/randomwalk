import { generateWalk } from "./simulation/walk";
import type { WalkState, PlaybackState, RenderOptions } from "./simulation/types";
import { computeHeatmapGrid, extendHeatmapGrid, type HeatmapGrid } from "./simulation/heatmap";
import { WalkRenderer } from "./rendering/renderer";
import { initControls } from "./ui/controls";
import { exportGif } from "./ui/export";
import { readParamsFromURL, writeParamsToURL } from "./ui/urlParams";
import { initKeyboard } from "./ui/keyboard";
import "./style.css";

const CANVAS_SIZE = 640;

const canvas = document.getElementById("walk-canvas") as HTMLCanvasElement;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const renderer = new WalkRenderer(canvas);
renderer.clear();

const statusEl = document.getElementById("status-indicator")!;

const defaultParams = { seed: 42, steps: 500, stepLength: 5 };
const initialParams = { ...defaultParams, ...readParamsFromURL() };
let walk: WalkState = generateWalk(initialParams);
const playback: PlaybackState = { currentStep: 0, playing: false, drawSpeed: 5 };
let animFrameId = 0;

const renderOptions: RenderOptions = {
  heatmap: { enabled: false, opacity: 0.5 },
  trailFade: { enabled: false, trailLength: 100 },
};

let heatmapGrid: HeatmapGrid | null = null;
let heatmapLastStep = 0;

function getCellSize(): number {
  return walk.params.stepLength * 2;
}

function resetHeatmapCache(): void {
  heatmapGrid = null;
  heatmapLastStep = 0;
}

function redrawCurrent(): void {
  if (playback.currentStep > 0) {
    updateHeatmapForStep(playback.currentStep);
    renderer.drawUpToStep(walk, playback.currentStep, renderOptions, heatmapGrid ?? undefined);
  } else {
    renderer.clear();
  }
}

function updateHeatmapForStep(step: number): void {
  if (!renderOptions.heatmap.enabled) return;

  if (!heatmapGrid || step < heatmapLastStep) {
    // Compute from scratch
    heatmapGrid = computeHeatmapGrid(walk, getCellSize(), step);
    heatmapLastStep = step;
  } else if (step > heatmapLastStep) {
    // Incremental update
    heatmapGrid = extendHeatmapGrid(heatmapGrid, walk, heatmapLastStep, step, getCellSize());
    heatmapLastStep = step;
  }
}

let exporting = false;

function handlePlay() {
  if (playback.playing) {
    stopAnimation();
    ui.setPlayLabel("Play");
    return;
  }
  // If finished, restart
  if (playback.currentStep >= walk.params.steps) {
    playback.currentStep = 0;
    resetHeatmapCache();
  }
  playback.playing = true;
  ui.setPlayLabel("Pause");
  statusEl.textContent = "";
  runAnimation();
}

function handleReset() {
  stopAnimation();
  playback.currentStep = 0;
  resetHeatmapCache();
  renderer.clear();
  statusEl.textContent = "";
  ui.setPlayLabel("Play");
}

async function handleExport() {
  exporting = true;
  ui.setExportEnabled(false);
  statusEl.textContent = "Exporting GIF…";
  try {
    await exportGif(walk, renderer, CANVAS_SIZE, renderOptions);
    statusEl.textContent = "GIF saved!";
  } catch (e) {
    console.error("GIF export failed:", e);
    statusEl.textContent = "Export failed";
  } finally {
    exporting = false;
    ui.setExportEnabled(true);
  }
}

const ui = initControls({
  onParamsChange(params) {
    stopAnimation();
    walk = generateWalk(params);
    playback.currentStep = 0;
    resetHeatmapCache();
    renderer.clear();
    statusEl.textContent = "";
    ui.setPlayLabel("Play");
    writeParamsToURL(params);
  },

  onSpeedChange(speed) {
    playback.drawSpeed = speed;
  },

  onPlay: handlePlay,
  onReset: handleReset,
  onExport: handleExport,

  onHeatmapToggle(enabled) {
    renderOptions.heatmap.enabled = enabled;
    resetHeatmapCache();
    redrawCurrent();
  },

  onHeatmapOpacityChange(opacity) {
    renderOptions.heatmap.opacity = opacity;
    redrawCurrent();
  },

  onTrailFadeToggle(enabled) {
    renderOptions.trailFade.enabled = enabled;
    redrawCurrent();
  },

  onTrailLengthChange(length) {
    renderOptions.trailFade.trailLength = length;
    redrawCurrent();
  },
});

function stopAnimation() {
  playback.playing = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = 0;
  }
}

function runAnimation() {
  if (!playback.playing) return;

  const stepsThisFrame = playback.drawSpeed;
  playback.currentStep = Math.min(playback.currentStep + stepsThisFrame, walk.params.steps);

  updateHeatmapForStep(playback.currentStep);
  renderer.drawUpToStep(walk, playback.currentStep, renderOptions, heatmapGrid ?? undefined);
  statusEl.textContent = `${playback.currentStep} / ${walk.params.steps}`;

  if (playback.currentStep >= walk.params.steps) {
    playback.playing = false;
    statusEl.textContent = `Done — ${walk.params.steps} steps`;
    ui.setPlayLabel("Play");
    return;
  }

  animFrameId = requestAnimationFrame(runAnimation);
}

// Handle canvas resize
function handleResize() {
  const container = document.getElementById("canvas-container")!;
  const rect = container.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height, 800);
  if (size > 0 && size !== canvas.width) {
    renderer.resize(size, size);
    redrawCurrent();
  }
}

window.addEventListener("resize", handleResize);

// Sync sliders with URL-restored params
ui.setParams(initialParams);

// Keyboard shortcuts
initKeyboard({
  onTogglePlay: handlePlay,
  onReset: handleReset,
  onExport: handleExport,
  isExporting: () => exporting,
});
