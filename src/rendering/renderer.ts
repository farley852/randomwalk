import type { Point, WalkState, RenderOptions } from "../simulation/types";
import type { HeatmapGrid } from "../simulation/heatmap";
import { computeViewTransform, type ViewTransform } from "./camera";
import { stepColor, multiWalkStepColor } from "./color";
import { drawHeatmap } from "./heatmapRenderer";
import { drawGrid } from "./gridRenderer";

export class WalkRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
  }

  clear(): void {
    this.ctx.fillStyle = "#0f0f23";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw the walk up to `upToStep` (inclusive).
   * The view transform is computed from ALL points so the camera is stable.
   */
  drawUpToStep(
    walk: WalkState,
    upToStep: number,
    options?: RenderOptions,
    heatmapGrid?: HeatmapGrid,
    viewTransform?: ViewTransform,
  ): void {
    this.clear();
    const vt = viewTransform ?? computeViewTransform(walk.points, this.width, this.height);

    // Layer 2: Heatmap overlay
    if (options?.heatmap.enabled && heatmapGrid) {
      drawHeatmap(this.ctx, heatmapGrid, vt, options.heatmap.opacity);
    }

    // Layer 2.5: Grid overlay
    if (options?.grid.enabled) {
      drawGrid(this.ctx, this.width, this.height, vt, {
        enabled: true,
        cellSize: walk.params.stepLength,
        showAxes: options.grid.showAxes,
      });
    }

    // Layer 3: Walk segments
    this.drawSegments(walk, upToStep, vt, options);

    // Layer 4: Start/end markers
    this.drawStartEnd(walk, upToStep, vt);
  }

  /**
   * Draw multiple walks up to `upToStep` (inclusive).
   * Camera is computed from all points across all walks.
   */
  drawMultipleUpToStep(
    walks: WalkState[],
    upToStep: number,
    options?: RenderOptions,
    heatmapGrid?: HeatmapGrid,
    viewTransform?: ViewTransform,
  ): void {
    if (walks.length === 1) {
      this.drawUpToStep(walks[0], upToStep, options, heatmapGrid, viewTransform);
      return;
    }

    this.clear();
    const allPoints: Point[] = walks.flatMap((w) => w.points);
    const vt = viewTransform ?? computeViewTransform(allPoints, this.width, this.height);

    // Layer 2: Heatmap overlay
    if (options?.heatmap.enabled && heatmapGrid) {
      drawHeatmap(this.ctx, heatmapGrid, vt, options.heatmap.opacity);
    }

    // Layer 2.5: Grid overlay
    if (options?.grid.enabled) {
      drawGrid(this.ctx, this.width, this.height, vt, {
        enabled: true,
        cellSize: walks[0].params.stepLength,
        showAxes: options.grid.showAxes,
      });
    }

    // Layer 3: Walk segments (each walk with its own color)
    for (let wi = 0; wi < walks.length; wi++) {
      this.drawSegmentsMulti(walks[wi], wi, upToStep, vt, options);
    }

    // Layer 4: Start/end markers for each walk
    for (const walk of walks) {
      this.drawStartEnd(walk, upToStep, vt);
    }
  }

  private drawSegments(
    walk: WalkState,
    upToStep: number,
    vt: ViewTransform,
    options?: RenderOptions,
  ): void {
    const { points } = walk;
    const total = points.length;
    const ctx = this.ctx;

    ctx.lineWidth = Math.max(1.5, vt.scale * 0.4);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const trailEnabled = options?.trailFade.enabled ?? false;
    const trailLength = options?.trailFade.trailLength ?? total;

    // Optimization: only loop over visible segments
    const start = trailEnabled ? Math.max(0, upToStep - trailLength) : 0;
    const end = Math.min(upToStep, total - 1);

    const savedAlpha = ctx.globalAlpha;

    for (let i = start; i < end; i++) {
      if (trailEnabled && trailLength < total) {
        // Age: 0 = oldest visible, trailLength-1 = newest
        const age = i - (upToStep - trailLength);
        ctx.globalAlpha = Math.max(0, (age + 1) / trailLength);
      }

      const p0 = points[i];
      const p1 = points[i + 1];
      ctx.strokeStyle = stepColor(i, total);
      ctx.beginPath();
      ctx.moveTo(p0.x * vt.scale + vt.offsetX, p0.y * vt.scale + vt.offsetY);
      ctx.lineTo(p1.x * vt.scale + vt.offsetX, p1.y * vt.scale + vt.offsetY);
      ctx.stroke();
    }

    ctx.globalAlpha = savedAlpha;
  }

  private drawSegmentsMulti(
    walk: WalkState,
    walkIndex: number,
    upToStep: number,
    vt: ViewTransform,
    options?: RenderOptions,
  ): void {
    const { points } = walk;
    const total = points.length;
    const ctx = this.ctx;

    ctx.lineWidth = Math.max(1.5, vt.scale * 0.4);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const trailEnabled = options?.trailFade.enabled ?? false;
    const trailLength = options?.trailFade.trailLength ?? total;

    const effectiveStep = Math.min(upToStep, walk.params.steps);
    const start = trailEnabled ? Math.max(0, effectiveStep - trailLength) : 0;
    const end = Math.min(effectiveStep, total - 1);

    const savedAlpha = ctx.globalAlpha;

    for (let i = start; i < end; i++) {
      if (trailEnabled && trailLength < total) {
        const age = i - (effectiveStep - trailLength);
        ctx.globalAlpha = Math.max(0, (age + 1) / trailLength);
      }

      const p0 = points[i];
      const p1 = points[i + 1];
      ctx.strokeStyle = multiWalkStepColor(walkIndex, i, total);
      ctx.beginPath();
      ctx.moveTo(p0.x * vt.scale + vt.offsetX, p0.y * vt.scale + vt.offsetY);
      ctx.lineTo(p1.x * vt.scale + vt.offsetX, p1.y * vt.scale + vt.offsetY);
      ctx.stroke();
    }

    ctx.globalAlpha = savedAlpha;
  }

  private drawStartEnd(walk: WalkState, upToStep: number, vt: ViewTransform): void {
    const { points } = walk;
    const ctx = this.ctx;
    const r = Math.max(3, vt.scale * 0.8);

    // Start dot (green)
    const start = points[0];
    ctx.fillStyle = "#50fa7b";
    ctx.beginPath();
    ctx.arc(start.x * vt.scale + vt.offsetX, start.y * vt.scale + vt.offsetY, r, 0, Math.PI * 2);
    ctx.fill();

    // Current/end dot (white)
    const endIdx = Math.min(upToStep, points.length - 1);
    if (endIdx > 0) {
      const end = points[endIdx];
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(end.x * vt.scale + vt.offsetX, end.y * vt.scale + vt.offsetY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }
}
