import type { WalkState, WalkStats } from "./types";

export class StatsAccumulator {
  private lastStep = 0;
  private maxDistance = 0;
  private totalPathLength = 0;

  reset(): void {
    this.lastStep = 0;
    this.maxDistance = 0;
    this.totalPathLength = 0;
  }

  compute(walk: WalkState, currentStep: number): WalkStats {
    const { points } = walk;

    // If step went backwards (e.g. reset), recompute from scratch
    if (currentStep < this.lastStep) {
      this.reset();
    }

    // Incremental update from lastStep to currentStep
    for (let i = this.lastStep; i < currentStep; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      this.totalPathLength += Math.sqrt(dx * dx + dy * dy);

      const dist = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
      if (dist > this.maxDistance) {
        this.maxDistance = dist;
      }
    }

    this.lastStep = currentStep;

    const current = points[Math.min(currentStep, points.length - 1)];
    const distanceFromOrigin = Math.sqrt(current.x * current.x + current.y * current.y);

    return {
      currentStep,
      totalSteps: walk.params.steps,
      distanceFromOrigin,
      maxDistance: this.maxDistance,
      totalPathLength: this.totalPathLength,
    };
  }
}
