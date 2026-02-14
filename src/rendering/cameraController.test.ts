import { describe, it, expect } from "vitest";
import { CameraController } from "./cameraController";

describe("CameraController", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it("starts in auto mode", () => {
    const cam = new CameraController(800, 800);
    expect(cam.isManual()).toBe(false);
  });

  it("auto mode returns computeViewTransform result", () => {
    const cam = new CameraController(800, 800);
    const vt = cam.getViewTransform(points);
    expect(vt.scale).toBeGreaterThan(0);
    expect(vt.offsetX).toBeDefined();
    expect(vt.offsetY).toBeDefined();
  });

  it("switches to manual on wheel", () => {
    const cam = new CameraController(800, 800);
    const vt = cam.getViewTransform(points);
    cam.handleWheel(-100, 400, 400, vt);
    expect(cam.isManual()).toBe(true);
  });

  it("switches to manual on pan", () => {
    const cam = new CameraController(800, 800);
    const vt = cam.getViewTransform(points);
    cam.handlePan(50, 50, vt);
    expect(cam.isManual()).toBe(true);
  });

  it("resetToAutoFit returns to auto", () => {
    const cam = new CameraController(800, 800);
    const vt = cam.getViewTransform(points);
    cam.handleWheel(-100, 400, 400, vt);
    expect(cam.isManual()).toBe(true);
    cam.resetToAutoFit();
    expect(cam.isManual()).toBe(false);
  });

  it("zoom changes scale in manual mode", () => {
    const cam = new CameraController(800, 800);
    const vt1 = cam.getViewTransform(points);
    cam.handleWheel(-100, 400, 400, vt1); // zoom in
    const vt2 = cam.getViewTransform(points);
    expect(vt2.scale).toBeGreaterThan(vt1.scale);
  });
});
