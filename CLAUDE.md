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

## Codex 委任バックログ

Codex MCP が使えない環境（モバイル等）で作業する場合、以下のルールに従う。

### いつ記録するか

Claude 単体で作業を完了した後、**Codex に任せたほうが確実・効率的だった**と判断したタスクがあれば `CODEX_BACKLOG.md` に追記する。典型例:

- テスト実行・結果確認（`vitest run` など）
- ビルド検証（`npm run build`）
- Lint / Format の一括適用と修正
- 大規模リファクタリングの実行＆動作確認
- シェルコマンドを伴う検証作業全般

### 記録フォーマット

```markdown
## YYYY-MM-DD セッション概要（1行）

- [ ] タスク内容（具体的なコマンドやファイルを明記）
- [ ] タスク内容
```

### デスクトップセッションでの消化

Codex MCP が利用可能なセッションで `CODEX_BACKLOG.md` を確認し、未消化タスクがあれば Codex に委任して実行する。完了したタスクは `- [x]` に更新する。
