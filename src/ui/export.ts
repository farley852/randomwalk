import { encode } from "modern-gif";
import workerUrl from "modern-gif/worker?url";
import type { WalkState, RenderOptions } from "../simulation/types";
import { computeHeatmapGrid, computeMultiWalkHeatmapGrid } from "../simulation/heatmap";
import type { WalkRenderer } from "../rendering/renderer";

/**
 * Export the full walk animation as a GIF.
 * Re-renders every Nth frame to keep file size reasonable.
 * Supports single walk or multiple walks.
 */
export async function exportGif(
  walks: WalkState[],
  renderer: WalkRenderer,
  canvasSize: number,
  options?: RenderOptions,
): Promise<void> {
  const primaryWalk = walks[0];
  const totalSteps = primaryWalk.params.steps;
  // Aim for ~100 frames max to keep GIF size manageable
  const frameSkip = Math.max(1, Math.floor(totalSteps / 100));
  const delay = 50; // ms per frame
  const cellSize = (options?.grid.cellSize ?? primaryWalk.params.stepLength) * 2;

  const useAllWalksHeatmap = options?.heatmap.allWalks && walks.length > 1;

  function computeHeatmapForStep(step: number) {
    if (!options?.heatmap.enabled) return undefined;
    return useAllWalksHeatmap
      ? computeMultiWalkHeatmapGrid(walks, cellSize, step)
      : computeHeatmapGrid(primaryWalk, cellSize, step);
  }

  const frames: { data: ImageData; delay: number }[] = [];

  for (let step = 0; step <= totalSteps; step += frameSkip) {
    const heatmapGrid = computeHeatmapForStep(step);
    if (walks.length === 1) {
      renderer.drawUpToStep(primaryWalk, step, options, heatmapGrid);
    } else {
      renderer.drawMultipleUpToStep(walks, step, options, heatmapGrid);
    }
    frames.push({ data: renderer.getImageData(), delay });
  }

  // Always include the final frame
  if (totalSteps % frameSkip !== 0) {
    const heatmapGrid = computeHeatmapForStep(totalSteps);
    if (walks.length === 1) {
      renderer.drawUpToStep(primaryWalk, totalSteps, options, heatmapGrid);
    } else {
      renderer.drawMultipleUpToStep(walks, totalSteps, options, heatmapGrid);
    }
    frames.push({ data: renderer.getImageData(), delay: delay * 4 });
  } else {
    // Extend last frame duration
    frames[frames.length - 1].delay = delay * 4;
  }

  const output = await encode({
    workerUrl,
    width: canvasSize,
    height: canvasSize,
    frames: frames.map((f) => ({
      data: f.data.data.buffer,
      delay: f.delay,
    })),
  });

  const blob = new Blob([output], { type: "image/gif" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `randomwalk-seed${primaryWalk.params.seed}.gif`;
  a.click();
  URL.revokeObjectURL(url);
}
