import type { Point } from "../simulation/types";
import { computeViewTransform, type ViewTransform } from "./camera";

export interface CameraState {
  mode: "auto" | "manual";
  centerX: number;
  centerY: number;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;

export class CameraController {
  private state: CameraState;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.state = {
      mode: "auto",
      centerX: 0,
      centerY: 0,
      zoom: 1,
      canvasWidth,
      canvasHeight,
    };
  }

  getViewTransform(allPoints: Point[]): ViewTransform {
    if (this.state.mode === "auto") {
      return computeViewTransform(allPoints, this.state.canvasWidth, this.state.canvasHeight);
    }

    // Manual mode: compute transform from center + zoom
    const autoVt = computeViewTransform(allPoints, this.state.canvasWidth, this.state.canvasHeight);
    const scale = autoVt.scale * this.state.zoom;
    const offsetX = this.state.canvasWidth / 2 - this.state.centerX * scale;
    const offsetY = this.state.canvasHeight / 2 - this.state.centerY * scale;
    return { offsetX, offsetY, scale };
  }

  handleWheel(deltaY: number, canvasX: number, canvasY: number, currentVt: ViewTransform): void {
    // Switch to manual mode on first interaction
    if (this.state.mode === "auto") {
      this.state.mode = "manual";
      this.state.centerX = (this.state.canvasWidth / 2 - currentVt.offsetX) / currentVt.scale;
      this.state.centerY = (this.state.canvasHeight / 2 - currentVt.offsetY) / currentVt.scale;
      this.state.zoom = 1;
    }

    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.state.zoom * zoomFactor));

    // Zoom toward cursor position in world space
    const worldX = (canvasX - currentVt.offsetX) / currentVt.scale;
    const worldY = (canvasY - currentVt.offsetY) / currentVt.scale;

    // Adjust center so cursor stays fixed
    const ratio = newZoom / this.state.zoom;
    this.state.centerX = worldX - (worldX - this.state.centerX) / ratio;
    this.state.centerY = worldY - (worldY - this.state.centerY) / ratio;
    this.state.zoom = newZoom;
  }

  handlePan(dx: number, dy: number, currentVt: ViewTransform): void {
    if (this.state.mode === "auto") {
      this.state.mode = "manual";
      this.state.centerX = (this.state.canvasWidth / 2 - currentVt.offsetX) / currentVt.scale;
      this.state.centerY = (this.state.canvasHeight / 2 - currentVt.offsetY) / currentVt.scale;
      this.state.zoom = 1;
    }

    // dx, dy are in canvas pixels — convert to world space
    this.state.centerX -= dx / currentVt.scale;
    this.state.centerY -= dy / currentVt.scale;
  }

  resetToAutoFit(): void {
    this.state.mode = "auto";
    this.state.zoom = 1;
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.state.canvasWidth = canvasWidth;
    this.state.canvasHeight = canvasHeight;
  }

  isManual(): boolean {
    return this.state.mode === "manual";
  }
}
