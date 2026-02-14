import type { MSDPoint, HistogramBin, WalkType } from "../simulation/types";

// Theme constants
const BG = "#0f0f23";
const AXIS_COLOR = "#555";
const LABEL_COLOR = "#aaa";
const GRID_COLOR = "rgba(255,255,255,0.06)";
const DATA_COLOR = "#4a9eff";
const THEORY_COLOR = "rgba(255,170,50,0.6)";
const FIT_COLOR = "rgba(100,255,150,0.5)";

// Margins (in CSS pixels — will be scaled by DPR)
const MARGIN = { top: 14, right: 14, bottom: 34, left: 54 };

export interface HistogramOptions {
  xlabel: string;
  ylabel: string;
  color?: string;
  logScale?: boolean;
}

export interface TheoryLine {
  alpha: number;
  label: string;
}

/**
 * Compute logarithmic tick positions (powers of 10) within [min, max].
 */
export function computeLogTicks(min: number, max: number): number[] {
  if (min <= 0 || max <= 0 || min >= max) return [];
  const lo = Math.floor(Math.log10(min));
  const hi = Math.ceil(Math.log10(max));
  const ticks: number[] = [];
  for (let exp = lo; exp <= hi; exp++) {
    const val = Math.pow(10, exp);
    if (val >= min * 0.999 && val <= max * 1.001) {
      ticks.push(val);
    }
  }
  return ticks;
}

/**
 * Compute linear tick positions within [min, max] with at most maxTicks ticks.
 */
export function computeLinearTicks(min: number, max: number, maxTicks: number = 6): number[] {
  if (min >= max) return [min];
  const range = max - min;
  const rawStep = range / maxTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let step: number;
  if (residual <= 1.5) step = magnitude;
  else if (residual <= 3.5) step = 2 * magnitude;
  else if (residual <= 7.5) step = 5 * magnitude;
  else step = 10 * magnitude;

  const ticks: number[] = [];
  let t = Math.ceil(min / step) * step;
  while (t <= max + step * 0.001) {
    ticks.push(t);
    t += step;
  }
  return ticks;
}

export class ChartRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  // Plot area
  private px = 0;
  private py = 0;
  private pw = 0;
  private ph = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.computePlotArea();
  }

  private computePlotArea(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.px = MARGIN.left * dpr;
    this.py = MARGIN.top * dpr;
    this.pw = this.width - (MARGIN.left + MARGIN.right) * dpr;
    this.ph = this.height - (MARGIN.top + MARGIN.bottom) * dpr;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.computePlotArea();
  }

  clear(): void {
    this.ctx.fillStyle = BG;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // --- Coordinate mappings ---
  private mapLogX(value: number, domain: [number, number]): number {
    const [lo, hi] = domain;
    const t = (Math.log(value) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return this.px + t * this.pw;
  }

  private mapLogY(value: number, range: [number, number]): number {
    const [lo, hi] = range;
    const t = (Math.log(value) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    return this.py + this.ph - t * this.ph;
  }

  private mapLinX(value: number, domain: [number, number]): number {
    const [lo, hi] = domain;
    const t = (value - lo) / (hi - lo);
    return this.px + t * this.pw;
  }

  private mapLinY(value: number, range: [number, number]): number {
    const [lo, hi] = range;
    const t = (value - lo) / (hi - lo);
    return this.py + this.ph - t * this.ph;
  }

  // --- Drawing helpers ---
  private drawAxesAndGrid(
    xTicks: number[],
    yTicks: number[],
    xDomain: [number, number],
    yRange: [number, number],
    logX: boolean,
    logY: boolean,
    xlabel?: string,
    ylabel?: string,
  ): void {
    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mapX = logX ? (v: number) => this.mapLogX(v, xDomain) : (v: number) => this.mapLinX(v, xDomain);
    const mapY = logY ? (v: number) => this.mapLogY(v, yRange) : (v: number) => this.mapLinY(v, yRange);

    // Grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (const tx of xTicks) {
      const x = mapX(tx);
      ctx.beginPath();
      ctx.moveTo(x, this.py);
      ctx.lineTo(x, this.py + this.ph);
      ctx.stroke();
    }
    for (const ty of yTicks) {
      const y = mapY(ty);
      ctx.beginPath();
      ctx.moveTo(this.px, y);
      ctx.lineTo(this.px + this.pw, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.lineTo(this.px, this.py + this.ph);
    ctx.lineTo(this.px + this.pw, this.py + this.ph);
    ctx.stroke();

    // Tick labels
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `${10 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const tx of xTicks) {
      const x = mapX(tx);
      const label = logX ? formatPow10(tx) : formatNum(tx);
      ctx.fillText(label, x, this.py + this.ph + 4 * dpr);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const ty of yTicks) {
      const y = mapY(ty);
      const label = logY ? formatPow10(ty) : formatNum(ty);
      ctx.fillText(label, this.px - 4 * dpr, y);
    }

    // Axis labels
    if (xlabel) {
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(xlabel, this.px + this.pw / 2, this.py + this.ph + 18 * dpr);
    }
    if (ylabel) {
      ctx.save();
      ctx.translate(12 * dpr, this.py + this.ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(ylabel, 0, 0);
      ctx.restore();
    }
  }

  drawMSDPlot(
    msdCurve: MSDPoint[],
    diffusionExponent: number | null,
    _walkType: WalkType,
    theoryLine?: TheoryLine,
  ): void {
    this.clear();
    if (msdCurve.length === 0) return;

    const positive = msdCurve.filter((p) => p.t > 0 && p.msd > 0);
    if (positive.length === 0) return;

    const ts = positive.map((p) => p.t);
    const msds = positive.map((p) => p.msd);
    const xMin = Math.min(...ts);
    const xMax = Math.max(...ts);
    const yMin = Math.min(...msds);
    const yMax = Math.max(...msds);

    if (xMin === xMax || yMin === yMax) return;

    const xDomain: [number, number] = [xMin * 0.8, xMax * 1.2];
    const yRange: [number, number] = [yMin * 0.5, yMax * 2.0];

    const xTicks = computeLogTicks(xDomain[0], xDomain[1]);
    const yTicks = computeLogTicks(yRange[0], yRange[1]);

    this.drawAxesAndGrid(xTicks, yTicks, xDomain, yRange, true, true, "t", "MSD");

    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Theory line (dashed)
    if (theoryLine) {
      this.drawSlopeLine(theoryLine.alpha, positive, xDomain, yRange, THEORY_COLOR, theoryLine.label);
    }

    // Fit line (dashed)
    if (diffusionExponent !== null) {
      this.drawSlopeLine(diffusionExponent, positive, xDomain, yRange, FIT_COLOR, `α=${diffusionExponent.toFixed(2)}`);
    }

    // Data line
    ctx.strokeStyle = DATA_COLOR;
    ctx.lineWidth = 2 * dpr;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < positive.length; i++) {
      const x = this.mapLogX(positive[i].t, xDomain);
      const y = this.mapLogY(positive[i].msd, yRange);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  private drawSlopeLine(
    alpha: number,
    data: MSDPoint[],
    xDomain: [number, number],
    yRange: [number, number],
    color: string,
    label: string,
  ): void {
    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Fit through the geometric mean of the data
    const n = data.length;
    let logTSum = 0, logMSDSum = 0;
    for (const p of data) {
      logTSum += Math.log(p.t);
      logMSDSum += Math.log(p.msd);
    }
    const logTMean = logTSum / n;
    const logMSDMean = logMSDSum / n;
    // Intercept: logMSD = alpha * logT + c
    const c = logMSDMean - alpha * logTMean;

    const t0 = xDomain[0];
    const t1 = xDomain[1];
    const msd0 = Math.exp(alpha * Math.log(t0) + c);
    const msd1 = Math.exp(alpha * Math.log(t1) + c);

    // Clip to yRange
    const y0Clipped = Math.max(yRange[0], Math.min(yRange[1], msd0));
    const y1Clipped = Math.max(yRange[0], Math.min(yRange[1], msd1));

    ctx.save();
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(this.mapLogX(t0, xDomain), this.mapLogY(y0Clipped, yRange));
    ctx.lineTo(this.mapLogX(t1, xDomain), this.mapLogY(y1Clipped, yRange));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Label
    ctx.fillStyle = color;
    ctx.font = `${10 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const labelX = this.mapLogX(t1, xDomain) - 4 * dpr;
    const labelY = this.mapLogY(y1Clipped, yRange) - 4 * dpr;
    ctx.fillText(label, Math.max(this.px, labelX - ctx.measureText(label).width), Math.max(this.py, labelY));
  }

  drawHistogram(bins: HistogramBin[], options: HistogramOptions): void {
    this.clear();
    if (bins.length === 0) return;

    const maxCount = Math.max(...bins.map((b) => b.count));
    if (maxCount === 0) return;

    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const xMin = bins[0].lo;
    const xMax = bins[bins.length - 1].hi;
    const useLogX = options.logScale ?? false;

    const xDomain: [number, number] = useLogX
      ? [Math.max(xMin, 1e-10), xMax]
      : [xMin, xMax];
    const yRange: [number, number] = [0, maxCount * 1.1];

    const xTicks = useLogX
      ? computeLogTicks(xDomain[0], xDomain[1])
      : computeLinearTicks(xDomain[0], xDomain[1]);
    const yTicks = computeLinearTicks(0, maxCount * 1.1);

    this.drawAxesAndGrid(xTicks, yTicks, xDomain, yRange, useLogX, false, options.xlabel, options.ylabel);

    const barColor = options.color ?? DATA_COLOR;
    ctx.fillStyle = barColor;
    ctx.globalAlpha = 0.7;

    const gap = 1 * dpr;

    for (const bin of bins) {
      if (bin.count === 0) continue;
      const mapX = useLogX
        ? (v: number) => this.mapLogX(v, xDomain)
        : (v: number) => this.mapLinX(v, xDomain);

      const x0 = mapX(Math.max(bin.lo, xDomain[0]));
      const x1 = mapX(Math.min(bin.hi, xDomain[1]));
      const y0 = this.mapLinY(bin.count, yRange);
      const y1 = this.mapLinY(0, yRange);

      const barW = Math.max(1, x1 - x0 - gap);
      ctx.fillRect(x0 + gap / 2, y0, barW, y1 - y0);
    }

    ctx.globalAlpha = 1.0;
  }
}

function formatPow10(val: number): string {
  const exp = Math.log10(val);
  if (Number.isInteger(Math.round(exp * 100) / 100)) {
    const e = Math.round(exp);
    if (e === 0) return "1";
    if (e === 1) return "10";
    return `10^${e}`;
  }
  return val.toPrecision(2);
}

function formatNum(val: number): string {
  if (Math.abs(val) >= 1000) return val.toExponential(0);
  if (Math.abs(val) < 0.01 && val !== 0) return val.toExponential(1);
  const s = val.toPrecision(3);
  return parseFloat(s).toString();
}
