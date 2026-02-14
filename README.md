# 2D Random Walk Visualization

Browser-based 2D random walk simulator built with TypeScript, Canvas, and Vite.

Features seedable PRNG for reproducible walks, real-time animation with playback controls, heatmap overlay, trail fade effect, statistics panel, keyboard shortcuts, shareable URL parameters, GIF export, and responsive mobile layout.

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

## Usage

### Controls

| Control | Description |
|---------|-------------|
| **Seed** | Random seed for reproducible walks |
| **Steps** | Number of steps (10 - 5,000) |
| **Step Length** | Distance per step (1 - 20) |
| **Draw Speed** | Steps rendered per frame |
| **Trail Fade** | Fade older segments for visual clarity |
| **Heatmap** | Overlay showing path density |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `R` | Reset |
| `E` | Export GIF |

### URL Sharing

Walk parameters are synced to the URL. Copy the URL to share a specific configuration:

```
https://example.com/?seed=123&steps=2000&stepLength=8
```

Default values (`seed=42`, `steps=500`, `stepLength=5`) are omitted from the URL.

## Development

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm test             # Run tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint
npm run format       # Prettier
```

## Architecture

```
src/
├── main.ts              # Entry: wires UI -> simulation -> renderer
├── simulation/
│   ├── types.ts         # Point, WalkParams, WalkState, WalkStats, etc.
│   ├── prng.ts          # mulberry32 seedable PRNG
│   ├── walk.ts          # generateWalk() -- pre-computes full Point[]
│   ├── heatmap.ts       # HeatmapGrid, DDA rasterization
│   └── stats.ts         # StatsAccumulator (incremental computation)
├── rendering/
│   ├── color.ts         # Step color (blue->red), heatmap color ramp
│   ├── camera.ts        # Viewport centering + scale
│   ├── renderer.ts      # WalkRenderer (stateless: walk + step -> draw)
│   └── heatmapRenderer.ts
└── ui/
    ├── controls.ts      # Slider/button/checkbox DOM bindings + drawer
    ├── keyboard.ts      # Keyboard shortcut handler
    ├── statsPanel.ts    # Real-time statistics DOM updates
    ├── urlParams.ts     # URL <-> WalkParams read/write
    └── export.ts        # GIF capture via modern-gif
```

**Data flow:** User controls / URL params -> `generateWalk()` -> `WalkState` (full `Point[]`) -> `WalkRenderer.drawUpToStep()`. The renderer is stateless, enabling independent frame rendering for GIF export.

## Tech Stack

- **TypeScript** + **Vite** -- build tooling
- **Canvas 2D** -- rendering
- **modern-gif** -- GIF export
- **Vitest** -- testing
- **ESLint** + **Prettier** -- code quality

## License

MIT
