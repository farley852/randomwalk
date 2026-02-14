# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code + Codex MCP orchestration** configuration repository. It defines how Claude Code delegates bulk implementation tasks to OpenAI Codex via the Model Context Protocol (MCP). There is no application code — only configuration files that establish a two-agent workflow.

**Repository:** https://github.com/farley852/randomwalk.git

## Architecture

```
Claude Code (Orchestrator)
  │  Design, testing, architecture, security review, debugging
  │
  ├── .claude/agents/codex-worker.md      → Agent definition for Codex worker
  ├── .claude/skills/codex-worker-skill/  → Delegation criteria (when to use Codex)
  ├── .claude/settings.json               → MCP tool permissions
  ├── .claude/settings.local.json         → Local permissions (web, git, gh CLI)
  │
  └──► Codex MCP Server (Implementation Engine)
       Large refactoring, boilerplate, migrations, multi-file changes
       Configured in .mcp.json → runs `codex mcp-server`
```

**Key principle:** Codex and Claude Code do NOT share context. Always provide explicit, self-contained prompts when delegating.

## Delegation Rules

**Delegate to Codex** when: 10+ file refactors, boilerplate generation, framework migrations, 50+ line multi-file implementations, or 150K+ token context tasks.

**Keep in Claude Code** when: test design/TDD, architecture decisions, security review, small changes (<20 lines), or interactive debugging.

## MCP Integration

- `mcp__codex__codex` — start a new Codex session (single-turn)
- `mcp__codex__codex-reply` — continue an existing Codex session with `threadId` (multi-turn)
- Default Codex settings: `approval-policy: "never"`, `sandbox: "workspace-write"`

## Allowed External Access

Web fetches are permitted for: `developers.openai.com`, `github.com`, `deepwiki.com`, `zenn.dev`. Git and GitHub CLI operations are pre-authorized in local settings.
