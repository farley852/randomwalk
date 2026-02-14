# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**2D Random Walk Visualization** — browser-based tool built with TypeScript + Canvas + Vite. Features seedable PRNG for reproducible walks, real-time animation, and GIF export.

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
│   ├── types.ts         # Point, WalkParams, WalkState, PlaybackState
│   ├── prng.ts          # mulberry32 seedable PRNG
│   └── walk.ts          # generateWalk() — pre-computes full Point[]
├── rendering/
│   ├── color.ts         # HSL gradient (blue→red)
│   ├── camera.ts        # Viewport centering + scale
│   └── renderer.ts      # WalkRenderer (stateless: walk + step → draw)
└── ui/
    ├── controls.ts      # Slider/button DOM bindings
    └── export.ts        # GIF capture via modern-gif
```

**Data flow:** User controls → `generateWalk()` → `WalkState` (full `Point[]`) → `WalkRenderer.drawUpToStep()`. The renderer is stateless — receives walk + step index, enabling independent frame rendering for GIF export.

## Key Design Decisions

- Walk is pre-computed as `Point[]` — no incremental state
- Renderer takes `(walk, stepIndex)` — pure rendering, no side effects
- Camera computed from ALL points so viewport is stable during animation
- GIF export re-renders frames independently (skips frames to cap at ~100)

## 言語

- ユーザーへの応答は**日本語**で行う（コード内のコメント・変数名は英語）

## MCP Integration

- `mcp__codex__codex` — start a new Codex session (single-turn)
- `mcp__codex__codex-reply` — continue an existing Codex session with `threadId`
