# Codex Worker Skill — Delegation Criteria

## When to Delegate to Codex

Delegate to the codex-worker agent when the task meets ANY of these conditions:

- **Large-scale refactoring**: 10+ files need consistent changes
- **Boilerplate generation**: Repetitive code across multiple files
- **Framework migration**: Moving between frameworks or major versions
- **Multi-file implementation**: 50+ lines across multiple files
- **Long context tasks**: Context exceeds 150K+ tokens

## When NOT to Delegate

Keep the task in Claude Code when:

- **Test design / TDD**: Test strategy and design require orchestrator-level thinking
- **Architecture design**: System design decisions need holistic understanding
- **Security review**: Security-sensitive code needs careful review
- **Small changes**: Less than 20 lines of simple modifications
- **Interactive debugging**: Tasks requiring back-and-forth investigation

## Usage

### Single-Turn (simple implementation)

```
mcp__codex__codex(
  prompt: "Create utility module...",
  approval-policy: "never",
  sandbox: "workspace-write"
)
```

### Multi-Turn (complex implementation)

1. Start with `mcp__codex__codex` for the initial task
2. Use `mcp__codex__codex-reply` with the threadId to continue the conversation
3. Iterate until the implementation is complete

## Division of Labor

| Role | Responsibility |
|------|---------------|
| Claude Code | Design, test, review, orchestration |
| Codex MCP | Implementation, refactoring, boilerplate |
