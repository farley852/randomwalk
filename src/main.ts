import { generateWalk } from "./simulation/walk";
import type { WalkState, PlaybackState, RenderOptions } from "./simulation/types";
import { computeHeatmapGrid, computeMultiWalkHeatmapGrid, extendHeatmapGrid, type HeatmapGrid } from "./simulation/heatmap";
import { WalkRenderer } from "./rendering/renderer";
import { CameraController } from "./rendering/cameraController";
import type { ViewTransform } from "./rendering/camera";
import { initControls } from "./ui/controls";
import { exportGif } from "./ui/export";
import { readParamsFromURL, readWalkCountFromURL, writeParamsToURL } from "./ui/urlParams";
import { initKeyboard } from "./ui/keyboard";
import { initCanvasInteraction } from "./ui/canvasInteraction";
import { StatsAccumulator } from "./simulation/stats";
import { initStatsPanel } from "./ui/statsPanel";
import "./style.css";

const CSS_SIZE = 640;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const CANVAS_SIZE = Math.round(CSS_SIZE * DPR);

const canvas = document.getElementById("walk-canvas") as HTMLCanvasElement;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const renderer = new WalkRenderer(canvas);
renderer.clear();

const camera = new CameraController(CANVAS_SIZE, CANVAS_SIZE);

const statusEl = document.getElementById("status-indicator")!;

const defaultParams = { seed: 42, steps: 500, stepLength: 5, walkType: "isotropic" as const };
const initialParams = { ...defaultParams, ...readParamsFromURL() };
let walkCount = readWalkCountFromURL() ?? 1;

function generateWalks(params: typeof initialParams, count: number): WalkState[] {
  return Array.from({ length: count }, (_, i) =>
    generateWalk({ ...params, seed: params.seed + i }),
  );
}

let walks: WalkState[] = generateWalks(initialParams, walkCount);
const playback: PlaybackState = { currentStep: 0, playing: false, drawSpeed: 5 };
let animFrameId = 0;

const renderOptions: RenderOptions = {
  heatmap: { enabled: false, opacity: 0.5, allWalks: false },
  trailFade: { enabled: false, trailLength: 100 },
  grid: { enabled: false, showAxes: true, cellSize: 5 },
};

let heatmapGrid: HeatmapGrid | null = null;
let heatmapLastStep = 0;

const statsAccumulator = new StatsAccumulator();
const statsPanel = initStatsPanel();

function getCellSize(): number {
  return renderOptions.grid.cellSize * 2;
}

function resetHeatmapCache(): void {
  heatmapGrid = null;
  heatmapLastStep = 0;
}

function getMaxSteps(): number {
  return Math.max(...walks.map((w) => w.params.steps));
}

function getAllPoints() {
  return walks.flatMap((w) => w.points);
}

function getCurrentViewTransform(): ViewTransform {
  return camera.getViewTransform(getAllPoints());
}

function drawFrame(step: number): void {
  const vt = getCurrentViewTransform();
  if (walks.length === 1) {
    renderer.drawUpToStep(walks[0], step, renderOptions, heatmapGrid ?? undefined, vt);
  } else {
    renderer.drawMultipleUpToStep(walks, step, renderOptions, heatmapGrid ?? undefined, vt);
  }
}

function redrawCurrent(): void {
  if (playback.currentStep > 0) {
    updateHeatmapForStep(playback.currentStep);
    drawFrame(playback.currentStep);
  } else {
    renderer.clear();
  }
}

function updateHeatmapForStep(step: number): void {
  if (!renderOptions.heatmap.enabled) return;

  if (renderOptions.heatmap.allWalks && walks.length > 1) {
    // All-walks mode: always recompute from scratch (no incremental for multi-walk)
    if (!heatmapGrid || step !== heatmapLastStep) {
      heatmapGrid = computeMultiWalkHeatmapGrid(walks, getCellSize(), step);
      heatmapLastStep = step;
    }
  } else {
    const primaryWalk = walks[0];
    if (!heatmapGrid || step < heatmapLastStep) {
      heatmapGrid = computeHeatmapGrid(primaryWalk, getCellSize(), step);
      heatmapLastStep = step;
    } else if (step > heatmapLastStep) {
      heatmapGrid = extendHeatmapGrid(heatmapGrid, primaryWalk, heatmapLastStep, step, getCellSize());
      heatmapLastStep = step;
    }
  }
}

let exporting = false;

function handlePlay() {
  if (playback.playing) {
    stopAnimation();
    ui.setPlayLabel("Play");
    return;
  }
  const maxSteps = getMaxSteps();
  if (playback.currentStep >= maxSteps) {
    playback.currentStep = 0;
    resetHeatmapCache();
    statsAccumulator.reset();
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
  statsAccumulator.reset();
  renderer.clear();
  statusEl.textContent = "";
  ui.setPlayLabel("Play");
  statsPanel.clear();
}

async function handleExport() {
  exporting = true;
  ui.setExportEnabled(false);
  statusEl.textContent = "Exporting GIF…";
  try {
    // Export always uses auto-fit camera (ignores zoom/pan state)
    await exportGif(walks, renderer, CANVAS_SIZE, renderOptions);
    statusEl.textContent = "GIF saved!";
    // Redraw with current camera state after export
    redrawCurrent();
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
    walks = generateWalks(params, walkCount);
    playback.currentStep = 0;
    resetHeatmapCache();
    statsAccumulator.reset();
    camera.resetToAutoFit();
    renderer.clear();
    statusEl.textContent = "";
    ui.setPlayLabel("Play");
    statsPanel.clear();
    writeParamsToURL(params, walkCount);

    // Sync grid cell size with step length
    renderOptions.grid.cellSize = params.stepLength;
    ui.setGridCellSize(params.stepLength);

    // Auto-enable grid for lattice walk
    if (params.walkType === "lattice" && !renderOptions.grid.enabled) {
      renderOptions.grid.enabled = true;
      ui.setGridEnabled(true);
    }
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

  onHeatmapAllWalksToggle(enabled) {
    renderOptions.heatmap.allWalks = enabled;
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

  onGridToggle(enabled) {
    renderOptions.grid.enabled = enabled;
    redrawCurrent();
  },

  onAxesToggle(enabled) {
    renderOptions.grid.showAxes = enabled;
    redrawCurrent();
  },

  onGridCellSizeChange(size) {
    renderOptions.grid.cellSize = size;
    resetHeatmapCache();
    redrawCurrent();
  },

  onWalkCountChange(count) {
    stopAnimation();
    walkCount = count;
    const params = ui.getParams();
    walks = generateWalks(params, walkCount);
    playback.currentStep = 0;
    resetHeatmapCache();
    statsAccumulator.reset();
    camera.resetToAutoFit();
    renderer.clear();
    statusEl.textContent = "";
    ui.setPlayLabel("Play");
    statsPanel.clear();
    writeParamsToURL(params, walkCount);
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

  const maxSteps = getMaxSteps();
  const stepsThisFrame = playback.drawSpeed;
  playback.currentStep = Math.min(playback.currentStep + stepsThisFrame, maxSteps);

  updateHeatmapForStep(playback.currentStep);
  drawFrame(playback.currentStep);
  statsPanel.update(statsAccumulator.compute(walks[0], Math.min(playback.currentStep, walks[0].params.steps)));

  if (playback.currentStep >= maxSteps) {
    playback.playing = false;
    statusEl.textContent = "Done";
    ui.setPlayLabel("Play");
    return;
  }

  animFrameId = requestAnimationFrame(runAnimation);
}

// Canvas interaction (zoom/pan)
initCanvasInteraction(canvas, camera, getCurrentViewTransform, redrawCurrent);

// Handle canvas resize with DPR support
function handleResize() {
  const container = document.getElementById("canvas-container")!;
  const rect = container.getBoundingClientRect();
  const cssSize = Math.min(rect.width, rect.height, 800);
  if (cssSize <= 0) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bufferSize = Math.round(cssSize * dpr);

  if (bufferSize !== canvas.width) {
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;
    renderer.resize(bufferSize, bufferSize);
    camera.resize(bufferSize, bufferSize);
    redrawCurrent();
  }
}

window.addEventListener("resize", handleResize);

// Sync sliders with URL-restored params
ui.setParams(initialParams);
if (walkCount > 1) {
  ui.setWalkCount(walkCount);
}

// Keyboard shortcuts
initKeyboard({
  onTogglePlay: handlePlay,
  onReset: handleReset,
  onExport: handleExport,
  isExporting: () => exporting,
});
