import type { CameraController } from "../rendering/cameraController";
import type { ViewTransform } from "../rendering/camera";

export function initCanvasInteraction(
  canvas: HTMLCanvasElement,
  camera: CameraController,
  getViewTransform: () => ViewTransform,
  requestRedraw: () => void,
): void {
  // Zoom via wheel
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const dpr = canvas.width / rect.width;
      const canvasX = (e.clientX - rect.left) * dpr;
      const canvasY = (e.clientY - rect.top) * dpr;
      camera.handleWheel(e.deltaY, canvasX, canvasY, getViewTransform());
      requestRedraw();
    },
    { passive: false },
  );

  // Pan via pointer drag
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const dx = (e.clientX - lastX) * dpr;
    const dy = (e.clientY - lastY) * dpr;
    lastX = e.clientX;
    lastY = e.clientY;
    camera.handlePan(dx, dy, getViewTransform());
    requestRedraw();
  });

  canvas.addEventListener("pointerup", () => {
    dragging = false;
  });

  canvas.addEventListener("pointercancel", () => {
    dragging = false;
  });

  // Double-click to reset
  canvas.addEventListener("dblclick", () => {
    camera.resetToAutoFit();
    requestRedraw();
  });
}
