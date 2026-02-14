import { describe, it, expect } from "vitest";
import { computeViewTransform } from "./camera";

describe("computeViewTransform", () => {
  it("returns centered identity for empty points", () => {
    const vt = computeViewTransform([], 800, 600);
    expect(vt.offsetX).toBe(400);
    expect(vt.offsetY).toBe(300);
    expect(vt.scale).toBe(1);
  });

  it("centers the walk in the canvas", () => {
    // Symmetric walk around origin
    const points = [
      { x: -10, y: -10 },
      { x: 10, y: 10 },
    ];
    const vt = computeViewTransform(points, 800, 600);

    // Center of walk is (0, 0), so world origin maps to canvas center
    const canvasCenterX = 0 * vt.scale + vt.offsetX;
    const canvasCenterY = 0 * vt.scale + vt.offsetY;
    expect(canvasCenterX).toBeCloseTo(400);
    expect(canvasCenterY).toBeCloseTo(300);
  });

  it("respects padding", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const padding = 50;
    const vt = computeViewTransform(points, 800, 600, padding);

    // Walk width = 100, available width = 800 - 2*50 = 700
    // Walk height = 0 → treated as 1, available height = 600 - 2*50 = 500
    // scale = min(700/100, 500/1) = 7
    expect(vt.scale).toBe(7);
  });

  it("preserves aspect ratio (uses smaller scale)", () => {
    // Wide walk in a tall canvas
    const points = [
      { x: 0, y: 0 },
      { x: 200, y: 10 },
    ];
    const vt = computeViewTransform(points, 400, 800, 0);
    // walkW=200, walkH=10, availW=400, availH=800
    // scaleX=400/200=2, scaleY=800/10=80 → picks min=2
    expect(vt.scale).toBe(2);
  });

  it("handles single point", () => {
    const points = [{ x: 5, y: 5 }];
    const vt = computeViewTransform(points, 800, 600, 40);
    // walkW=0→1, walkH=0→1, scale = min(720, 520) = 520
    expect(vt.scale).toBe(520);
    // Center should map to canvas center
    const cx = 5 * vt.scale + vt.offsetX;
    const cy = 5 * vt.scale + vt.offsetY;
    expect(cx).toBeCloseTo(400);
    expect(cy).toBeCloseTo(300);
  });
});
