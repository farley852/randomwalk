import type { ViewTransform } from "./camera";

export interface GridOptions {
  enabled: boolean;
  cellSize: number;
  showAxes: boolean;
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vt: ViewTransform,
  options: GridOptions,
): void {
  if (!options.enabled) return;

  const { offsetX, offsetY, scale } = vt;
  let cellPx = options.cellSize * scale;

  // Adaptive spacing: double cell size until cells are at least 20px
  let cellSize = options.cellSize;
  while (cellPx < 20) {
    cellSize *= 2;
    cellPx *= 2;
  }

  // Calculate visible world range
  const worldLeft = -offsetX / scale;
  const worldRight = (width - offsetX) / scale;
  const worldTop = -offsetY / scale;
  const worldBottom = (height - offsetY) / scale;

  // Grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Vertical lines
  const startX = Math.floor(worldLeft / cellSize) * cellSize;
  for (let wx = startX; wx <= worldRight; wx += cellSize) {
    if (options.showAxes && wx === 0) continue; // Draw axis separately
    const sx = wx * scale + offsetX;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }

  // Horizontal lines
  const startY = Math.floor(worldTop / cellSize) * cellSize;
  for (let wy = startY; wy <= worldBottom; wy += cellSize) {
    if (options.showAxes && wy === 0) continue;
    const sy = wy * scale + offsetY;
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }

  ctx.stroke();

  // Coordinate axes
  if (options.showAxes) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    // Y-axis (x=0)
    const axisX = offsetX;
    if (axisX >= 0 && axisX <= width) {
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, height);
    }

    // X-axis (y=0)
    const axisY = offsetY;
    if (axisY >= 0 && axisY <= height) {
      ctx.moveTo(0, axisY);
      ctx.lineTo(width, axisY);
    }

    ctx.stroke();
  }
}
