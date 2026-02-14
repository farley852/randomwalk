# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**2D Random Walk Visualization** — browser-based tool built with TypeScript + Canvas + Vite. Features seedable PRNG for reproducible walks, real-time animation, heatmap overlay, trail fade effect, and GIF export.

**Repository:** https://github.com/farley852/randomwalk.git

## Build & Dev Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Type-check + production build
npm run preview    # Preview production build
npx tsc --noEmit   # Type-check only
npm test           # Run tests (Vitest)
npm run test:watch # Run tests in watch mode
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

## Multi-Agent Workflow

Claude Code はオーケストレーター（Team Lead）として、以下のエージェントを統括する。
**複数タスクが独立している場合は、積極的に並列で Task を起動すること。**

### Agent 一覧

| Agent | Type | 役割 | 使用場面 |
|-------|------|------|---------|
| **Claude Code** (self) | orchestrator | 設計・計画・統合・最終判断 | 常に |
| **codex-worker** | `subagent_type: "codex-worker"` | 実装・リファクタリング・ボイラープレート | 50行超の実装、10+ファイル変更 |
| **test-writer** | `subagent_type: "test-writer"` | テスト設計・テストコード作成 | 新規テスト作成、TDD Red phase |
| **code-reviewer** | `subagent_type: "code-reviewer"` | コード品質・セキュリティレビュー | 実装完了後の検証 |

### 分業ルール

**MUST delegate（委任すべき）:**
- 50行超の新規実装 → `codex-worker`
- 10+ファイルの一括リファクタリング → `codex-worker`
- 新規テストファイル作成 → `test-writer`
- 実装完了後のレビュー → `code-reviewer`

**Keep in orchestrator（自分でやる）:**
- アーキテクチャ設計・計画
- 20行未満の小規模変更
- ユーザーとの対話が必要な判断
- 最終的な統合・コンフリクト解決
- コミット・プッシュ操作

### 標準ワークフロー（新機能の場合）

```
Phase 1: Planning（Claude Code のみ）
  ├── 要件確認 → 設計 → タスク分解

Phase 2: Implementation（並列処理）
  ├── test-writer  → テスト作成（TDD Red phase）
  ├── codex-worker → 機能実装（Green phase）
  └── （独立モジュールは複数の codex-worker を並列起動）

Phase 3: Integration（Claude Code のみ）
  ├── Codex 出力の取り込み・検証
  ├── テスト実行 → 修正（Refactor phase）
  └── code-reviewer → 品質レビュー

Phase 4: Finalize（Claude Code のみ）
  └── コミット・報告
```

### Codex への委任時の注意

- **Model:** `model: "gpt-5.3-codex"` を必ず指定
- **Approval policy:** `approval-policy: "never"` を必ず指定（省略するとタイムアウト）
- Codex は Claude Code のコンテキストを共有しない → プロンプトに必要な情報を全て含める
- プロンプトは `[ROLE] [CONTEXT] [TASK] [CONSTRAINTS]` 構造で記述
