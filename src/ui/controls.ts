import type { WalkParams } from "../simulation/types";

export interface UICallbacks {
  onParamsChange: (params: WalkParams) => void;
  onSpeedChange: (speed: number) => void;
  onPlay: () => void;
  onReset: () => void;
  onExport: () => void;
  onHeatmapToggle: (enabled: boolean) => void;
  onHeatmapOpacityChange: (opacity: number) => void;
  onTrailFadeToggle: (enabled: boolean) => void;
  onTrailLengthChange: (length: number) => void;
}

function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Element #${id} not found`);
  return e as T;
}

export function initControls(callbacks: UICallbacks) {
  const seedSlider = el<HTMLInputElement>("seed-slider");
  const stepsSlider = el<HTMLInputElement>("steps-slider");
  const stepLengthSlider = el<HTMLInputElement>("steplength-slider");
  const speedSlider = el<HTMLInputElement>("speed-slider");

  const seedValue = el<HTMLSpanElement>("seed-value");
  const stepsValue = el<HTMLSpanElement>("steps-value");
  const stepLengthValue = el<HTMLSpanElement>("steplength-value");
  const speedValue = el<HTMLSpanElement>("speed-value");

  const playBtn = el<HTMLButtonElement>("play-btn");
  const resetBtn = el<HTMLButtonElement>("reset-btn");
  const exportBtn = el<HTMLButtonElement>("export-btn");

  // Trail Fade controls
  const trailFadeToggle = el<HTMLInputElement>("trailfade-toggle");
  const trailLengthSlider = el<HTMLInputElement>("traillength-slider");
  const trailLengthValue = el<HTMLSpanElement>("traillength-value");

  // Heatmap controls
  const heatmapToggle = el<HTMLInputElement>("heatmap-toggle");
  const heatmapOpacitySlider = el<HTMLInputElement>("heatmap-opacity-slider");
  const heatmapOpacityValue = el<HTMLSpanElement>("heatmap-opacity-value");

  function getParams(): WalkParams {
    return {
      seed: Number(seedSlider.value),
      steps: Number(stepsSlider.value),
      stepLength: Number(stepLengthSlider.value),
      walkType: "isotropic",
    };
  }

  function onSliderInput() {
    seedValue.textContent = seedSlider.value;
    stepsValue.textContent = stepsSlider.value;
    stepLengthValue.textContent = stepLengthSlider.value;
    callbacks.onParamsChange(getParams());
  }

  seedSlider.addEventListener("input", onSliderInput);
  stepsSlider.addEventListener("input", onSliderInput);
  stepLengthSlider.addEventListener("input", onSliderInput);

  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedSlider.value;
    callbacks.onSpeedChange(Number(speedSlider.value));
  });

  // Trail Fade events
  trailFadeToggle.addEventListener("change", () => {
    callbacks.onTrailFadeToggle(trailFadeToggle.checked);
  });

  trailLengthSlider.addEventListener("input", () => {
    trailLengthValue.textContent = trailLengthSlider.value;
    callbacks.onTrailLengthChange(Number(trailLengthSlider.value));
  });

  // Heatmap events
  heatmapToggle.addEventListener("change", () => {
    callbacks.onHeatmapToggle(heatmapToggle.checked);
  });

  heatmapOpacitySlider.addEventListener("input", () => {
    heatmapOpacityValue.textContent = heatmapOpacitySlider.value;
    callbacks.onHeatmapOpacityChange(Number(heatmapOpacitySlider.value));
  });

  playBtn.addEventListener("click", () => callbacks.onPlay());
  resetBtn.addEventListener("click", () => callbacks.onReset());
  exportBtn.addEventListener("click", () => callbacks.onExport());

  // Drawer toggle (mobile)
  const controls = el<HTMLElement>("controls");
  const drawerHandle = el<HTMLElement>("drawer-handle");

  drawerHandle.addEventListener("click", () => {
    controls.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!controls.contains(e.target as Node) && controls.classList.contains("open")) {
      controls.classList.remove("open");
    }
  });

  return {
    getParams,
    getSpeed: () => Number(speedSlider.value),
    getTrailFadeEnabled: () => trailFadeToggle.checked,
    getTrailLength: () => Number(trailLengthSlider.value),
    getHeatmapEnabled: () => heatmapToggle.checked,
    getHeatmapOpacity: () => Number(heatmapOpacitySlider.value),
    setExportEnabled(enabled: boolean) {
      exportBtn.disabled = !enabled;
      const textSpan = exportBtn.querySelector(".btn-text");
      if (textSpan) {
        textSpan.textContent = enabled ? "Export GIF" : "Exporting…";
      }
    },
    setPlayLabel(label: string) {
      const textSpan = playBtn.querySelector(".btn-text");
      if (textSpan) {
        textSpan.textContent = label;
      }
    },
    setParams(params: Partial<WalkParams>) {
      if (params.seed !== undefined) {
        seedSlider.value = String(params.seed);
        seedValue.textContent = String(params.seed);
      }
      if (params.steps !== undefined) {
        stepsSlider.value = String(params.steps);
        stepsValue.textContent = String(params.steps);
      }
      if (params.stepLength !== undefined) {
        stepLengthSlider.value = String(params.stepLength);
        stepLengthValue.textContent = String(params.stepLength);
      }
    },
  };
}

export type UIControls = ReturnType<typeof initControls>;
