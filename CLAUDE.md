# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**2D Random Walk Visualization** — browser-based tool built with TypeScript + Canvas + Vite. Features seedable PRNG for reproducible walks, real-time animation, heatmap overlay, trail fade effect, and GIF export.

**Repository:** https://github.com/farley852/randomwalk.git

## Build & Dev Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Type-check + production build
npm run preview   # Preview production build
npx tsc --noEmit  # Type-check only
```

## Architecture

```
src/
├── main.ts              # Entry: wires UI → simulation → renderer
├── simulation/
│   ├── types.ts         # Point, WalkParams, WalkState, PlaybackState, RenderOptions
│   ├── prng.ts          # mulberry32 seedable PRNG
│   ├── walk.ts          # generateWalk() — pre-computes full Point[]
│   └── heatmap.ts       # HeatmapGrid, DDA rasterization, compute/extend
├── rendering/
│   ├── color.ts         # stepColor (blue→red), heatmapColor (blue→yellow→red)
│   ├── camera.ts        # Viewport centering + scale
│   ├── renderer.ts      # WalkRenderer (stateless: walk + step + options → draw)
│   └── heatmapRenderer.ts  # drawHeatmap (grid→ImageData→OffscreenCanvas→drawImage)
└── ui/
    ├── controls.ts      # Slider/button/checkbox DOM bindings
    └── export.ts        # GIF capture via modern-gif
```

**Data flow:** User controls → `generateWalk()` → `WalkState` (full `Point[]`) → `WalkRenderer.drawUpToStep()`. The renderer is stateless — receives walk + step index + render options, enabling independent frame rendering for GIF export.

**Rendering pipeline (layer order):**
1. Clear (background #0f0f23)
2. Heatmap overlay (if enabled)
3. Walk segments (with optional trail fade)
4. Start marker (green) + current position marker (white)

## Key Design Decisions

- Walk is pre-computed as `Point[]` — no incremental state
- Renderer takes `(walk, stepIndex, options?, heatmapGrid?)` — pure rendering, no side effects
- Camera computed from ALL points so viewport is stable during animation
- Heatmap grid dimensions use ALL points bounding box for stable incremental updates
- GIF export re-renders frames independently (skips frames to cap at ~100)
- Trail fade uses `globalAlpha` with loop start optimization `O(trailLength)`
- Heatmap uses `OffscreenCanvas` + `drawImage` scaling for performance

## 言語

- ユーザーへの応答は**日本語**で行う（コード内のコメント・変数名は英語）

## MCP Integration

- `mcp__codex__codex` — start a new Codex session (single-turn)
- `mcp__codex__codex-reply` — continue an existing Codex session with `threadId`
- **Model:** `gpt-5.3-codex` を明示的に指定する（`model` パラメータ）
- **Approval policy:** `approval-policy: "never"` を必ず指定する（Claude Code が elicitation 未対応のため、省略するとタイムアウトする）
