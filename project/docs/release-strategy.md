---
title: Release strategy (workspace)
type: reference
status: draft
date: 2026-04-06
---

# Release strategy

- **Lockfile:** Commit `yarn.lock`. Use **Corepack** + root `packageManager` field so Yarn 4 is pinned for all contributors.
- **Private package:** `@narralang/share` stays `private: true` and is not published; consumers only install `core`, `runtime`, and/or `nlc`.
- **Versioning:** Independent versions per package are allowed; align semver bumps when changing shared AST contracts used by `runtime` / `nlc`.
- **Build:** Run `yarn build` at the repo root (topological workspace builds). Each package emits its own `dist/` and declarations.
- **No aggregation facade:** There is no single `narralang` meta-package re-exporting everything; importers depend on the packages they need.
