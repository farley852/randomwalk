/**
 * Return an HSL color string that goes from blue (start) to red (end).
 * Hue transitions: 240 (blue) → 360 (red) across all steps.
 */
export function stepColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  const hue = 240 + t * 120; // 240 (blue) → 360 (red)
  return `hsl(${hue}, 80%, 55%)`;
}

/**
 * Map a normalized intensity (0–1, after log scale) to a blue→yellow→red gradient.
 * Returns [r, g, b, a] in 0–255 range.
 */
export function heatmapColor(intensity: number): [number, number, number, number] {
  // Clamp
  const t = Math.max(0, Math.min(1, intensity));
  let r: number, g: number, b: number;

  if (t < 0.5) {
    // Blue (0,0,255) → Yellow (255,255,0)
    const s = t * 2; // 0..1
    r = Math.round(s * 255);
    g = Math.round(s * 255);
    b = Math.round((1 - s) * 255);
  } else {
    // Yellow (255,255,0) → Red (255,0,0)
    const s = (t - 0.5) * 2; // 0..1
    r = 255;
    g = Math.round((1 - s) * 255);
    b = 0;
  }

  return [r, g, b, 255];
}
