import type { AnalyticsData } from "../simulation/types";
import { ChartRenderer, type TheoryLine } from "../rendering/chartRenderer";

export interface AnalyticsPanel {
  update(data: AnalyticsData): void;
  clear(): void;
  isVisible(): boolean;
}

type TabId = "msd" | "step-dist" | "end-dist";

export function initAnalyticsPanel(): AnalyticsPanel {
  const panel = document.getElementById("analytics-panel")!;
  const toggleBtn = document.getElementById("analytics-toggle")!;
  const tabs = panel.querySelectorAll<HTMLButtonElement>(".analytics-tab");
  const canvases: Record<TabId, HTMLCanvasElement> = {
    msd: document.getElementById("chart-msd") as HTMLCanvasElement,
    "step-dist": document.getElementById("chart-step-dist") as HTMLCanvasElement,
    "end-dist": document.getElementById("chart-end-dist") as HTMLCanvasElement,
  };
  const exponentEl = document.getElementById("diffusion-exponent-value")!;

  let activeTab: TabId = "msd";
  let collapsed = true;

  // Initialize canvas sizes
  const renderers: Record<TabId, ChartRenderer> = {} as Record<TabId, ChartRenderer>;
  for (const [id, canvas] of Object.entries(canvases) as [TabId, HTMLCanvasElement][]) {
    initCanvasSize(canvas);
    renderers[id] = new ChartRenderer(canvas);
  }

  function initCanvasSize(canvas: HTMLCanvasElement): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 640;
    const h = rect.height || 200;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  // Toggle collapse/expand
  toggleBtn.addEventListener("click", () => {
    collapsed = !collapsed;
    panel.classList.toggle("collapsed", collapsed);
    if (!collapsed) {
      // Re-init canvas sizes after layout and redraw with last data
      requestAnimationFrame(() => {
        for (const [id, canvas] of Object.entries(canvases) as [TabId, HTMLCanvasElement][]) {
          initCanvasSize(canvas);
          renderers[id] = new ChartRenderer(canvas);
        }
        if (lastData) renderActiveTab(lastData);
      });
    }
  });

  // Tab switching
  tabs.forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      const tabId = tabBtn.dataset.tab as TabId;
      if (tabId === activeTab) return;

      tabs.forEach((t) => t.classList.remove("active"));
      tabBtn.classList.add("active");

      canvases[activeTab].style.display = "none";
      canvases[tabId].style.display = "block";
      activeTab = tabId;
      if (lastData) renderActiveTab(lastData);
    });
  });

  // Resize observer
  const observer = new ResizeObserver(() => {
    if (collapsed) return;
    for (const [id, canvas] of Object.entries(canvases) as [TabId, HTMLCanvasElement][]) {
      initCanvasSize(canvas);
      renderers[id] = new ChartRenderer(canvas);
    }
  });
  observer.observe(panel);

  let lastData: AnalyticsData | null = null;

  function getTheoryLine(data: AnalyticsData): TheoryLine | undefined {
    switch (data.walkType) {
      case "isotropic":
      case "lattice":
        return { alpha: 1.0, label: "\u03B1=1 (theory)" };
      case "levy": {
        const la = data.levyAlpha ?? 1.5;
        const alpha = 2 / la;
        return { alpha, label: `\u03B1=${alpha.toFixed(2)} (theory)` };
      }
      default:
        return undefined;
    }
  }

  function renderActiveTab(data: AnalyticsData): void {
    switch (activeTab) {
      case "msd":
        renderers.msd.drawMSDPlot(
          data.msdCurve,
          data.diffusionExponent,
          data.walkType,
          getTheoryLine(data),
        );
        break;
      case "step-dist":
        renderers["step-dist"].drawHistogram(data.stepLengthHist, {
          xlabel: "Step Length",
          ylabel: "Count",
          logScale: data.walkType === "levy",
        });
        break;
      case "end-dist":
        renderers["end-dist"].drawHistogram(data.endDistanceHist, {
          xlabel: "End Distance",
          ylabel: "Count",
          color: "#e06c75",
        });
        break;
    }
  }

  return {
    update(data: AnalyticsData): void {
      lastData = data;

      // Update diffusion exponent display
      exponentEl.textContent =
        data.diffusionExponent !== null ? data.diffusionExponent.toFixed(3) : "\u2014";

      if (collapsed) return;
      renderActiveTab(data);
    },

    clear(): void {
      lastData = null;
      exponentEl.textContent = "\u2014";
      for (const r of Object.values(renderers)) {
        r.clear();
      }
    },

    isVisible(): boolean {
      return !collapsed;
    },
  };
}
