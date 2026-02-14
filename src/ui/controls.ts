import type { WalkParams, WalkType } from "../simulation/types";

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
  onGridToggle: (enabled: boolean) => void;
  onAxesToggle: (enabled: boolean) => void;
  onWalkCountChange: (count: number) => void;
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
  const walkTypeSelect = el<HTMLSelectElement>("walktype-select");
  const levyAlphaSlider = el<HTMLInputElement>("levyalpha-slider");

  const walkCountSlider = el<HTMLInputElement>("walkcount-slider");

  const seedValue = el<HTMLSpanElement>("seed-value");
  const stepsValue = el<HTMLSpanElement>("steps-value");
  const stepLengthValue = el<HTMLSpanElement>("steplength-value");
  const speedValue = el<HTMLSpanElement>("speed-value");
  const levyAlphaValue = el<HTMLSpanElement>("levyalpha-value");
  const walkCountValue = el<HTMLSpanElement>("walkcount-value");

  const levyOnlyGroup = document.querySelector(".levy-only") as HTMLElement;

  const playBtn = el<HTMLButtonElement>("play-btn");
  const resetBtn = el<HTMLButtonElement>("reset-btn");
  const exportBtn = el<HTMLButtonElement>("export-btn");

  // Trail Fade controls
  const trailFadeToggle = el<HTMLInputElement>("trailfade-toggle");
  const trailLengthSlider = el<HTMLInputElement>("traillength-slider");
  const trailLengthValue = el<HTMLSpanElement>("traillength-value");

  // Grid controls
  const gridToggle = el<HTMLInputElement>("grid-toggle");
  const axesToggle = el<HTMLInputElement>("axes-toggle");

  // Heatmap controls
  const heatmapToggle = el<HTMLInputElement>("heatmap-toggle");
  const heatmapOpacitySlider = el<HTMLInputElement>("heatmap-opacity-slider");
  const heatmapOpacityValue = el<HTMLSpanElement>("heatmap-opacity-value");

  function updateLevyVisibility() {
    if (levyOnlyGroup) {
      levyOnlyGroup.classList.toggle("visible", walkTypeSelect.value === "levy");
    }
  }

  function getParams(): WalkParams {
    const walkType = walkTypeSelect.value as WalkType;
    const params: WalkParams = {
      seed: Number(seedSlider.value),
      steps: Number(stepsSlider.value),
      stepLength: Number(stepLengthSlider.value),
      walkType,
    };
    if (walkType === "levy") {
      params.levyAlpha = Number(levyAlphaSlider.value);
    }
    return params;
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

  walkTypeSelect.addEventListener("change", () => {
    updateLevyVisibility();
    callbacks.onParamsChange(getParams());
  });

  levyAlphaSlider.addEventListener("input", () => {
    levyAlphaValue.textContent = levyAlphaSlider.value;
    callbacks.onParamsChange(getParams());
  });

  walkCountSlider.addEventListener("input", () => {
    walkCountValue.textContent = walkCountSlider.value;
    callbacks.onWalkCountChange(Number(walkCountSlider.value));
  });

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

  // Grid events
  gridToggle.addEventListener("change", () => {
    callbacks.onGridToggle(gridToggle.checked);
  });

  axesToggle.addEventListener("change", () => {
    callbacks.onAxesToggle(axesToggle.checked);
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

  // Initialize levy visibility
  updateLevyVisibility();

  return {
    getParams,
    getSpeed: () => Number(speedSlider.value),
    getTrailFadeEnabled: () => trailFadeToggle.checked,
    getTrailLength: () => Number(trailLengthSlider.value),
    getWalkCount: () => Number(walkCountSlider.value),
    setWalkCount(count: number) {
      walkCountSlider.value = String(count);
      walkCountValue.textContent = String(count);
    },
    getGridEnabled: () => gridToggle.checked,
    getAxesEnabled: () => axesToggle.checked,
    setGridEnabled(enabled: boolean) {
      gridToggle.checked = enabled;
    },
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
      if (params.walkType !== undefined) {
        walkTypeSelect.value = params.walkType;
        updateLevyVisibility();
      }
      if (params.levyAlpha !== undefined) {
        levyAlphaSlider.value = String(params.levyAlpha);
        levyAlphaValue.textContent = String(params.levyAlpha);
      }
    },
  };
}

export type UIControls = ReturnType<typeof initControls>;
