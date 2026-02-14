import type { HeatmapGrid } from "../simulation/heatmap";
import type { ViewTransform } from "./camera";
import { heatmapColor } from "./color";

/**
 * Draw heatmap overlay onto the canvas.
 * Creates a small ImageData at grid resolution, then scales it up via an
 * offscreen canvas for performance.
 */
export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  grid: HeatmapGrid,
  vt: ViewTransform,
  opacity: number,
): void {
  if (grid.maxCount === 0) return;

  const { cols, rows } = grid;
  const logMax = Math.log1p(grid.maxCount);

  // Build a small ImageData at grid resolution
  const imageData = new ImageData(cols, rows);
  const data = imageData.data;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const count = grid.grid[y * cols + x];
      if (count === 0) continue;

      const intensity = Math.log1p(count) / logMax;
      const [r, g, b] = heatmapColor(intensity);
      const idx = (y * cols + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.round(opacity * 255);
    }
  }

  // Draw to offscreen canvas at grid resolution, then scale to main canvas
  const offscreen = new OffscreenCanvas(cols, rows);
  const offCtx = offscreen.getContext("2d")!;
  offCtx.putImageData(imageData, 0, 0);

  // Map grid coordinates to canvas coordinates
  const canvasX = grid.originX * vt.scale + vt.offsetX;
  const canvasY = grid.originY * vt.scale + vt.offsetY;
  const canvasW = cols * grid.cellSize * vt.scale;
  const canvasH = rows * grid.cellSize * vt.scale;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, canvasX, canvasY, canvasW, canvasH);
}
