---
title: Package matrix
type: reference
status: active
date: 2026-04-06
---

# Package matrix

| Package | npm name | Role | Publishes |
|--------|----------|------|-----------|
| Language core | `@narralang/core` | Lexer, parser, AST, parse API | Yes (when released) |
| Runtime bridge | `@narralang/runtime` | NarraLeaf / `narraleaf-react` integration | Yes |
| Compiler | `@narralang/nlc` | Node CLI + API: `.nls` → TypeScript (phase-1 AST emit) | Yes |
| Shared contracts | `@narralang/share` | Cross-package types, constants, tiny helpers | **Private** workspace-only |

Dependency edges: `runtime` → `core`, `share`. `nlc` → `core`. `core` → `share`.
