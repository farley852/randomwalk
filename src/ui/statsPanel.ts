import type { WalkStats } from "../simulation/types";

const FIELDS = ["steps", "origin-dist", "max-dist", "path-length"] as const;

export function initStatsPanel(): {
  update: (stats: WalkStats) => void;
  clear: () => void;
} {
  const panel = document.getElementById("stats-panel");
  if (!panel) throw new Error("#stats-panel not found");

  const els = Object.fromEntries(
    FIELDS.map((f) => [f, panel.querySelector(`[data-stat="${f}"]`) as HTMLElement]),
  );

  return {
    update(stats: WalkStats) {
      els["steps"].textContent = `${stats.currentStep} / ${stats.totalSteps}`;
      els["origin-dist"].textContent = stats.distanceFromOrigin.toFixed(1);
      els["max-dist"].textContent = stats.maxDistance.toFixed(1);
      els["path-length"].textContent = stats.totalPathLength.toFixed(1);
    },
    clear() {
      for (const el of Object.values(els)) {
        el.textContent = "—";
      }
    },
  };
}
