---
title: refactor: migrate NarraLang to yarn workspace packages
type: refactor
status: active
date: 2026-04-06
---

# refactor: migrate NarraLang to yarn workspace packages

## Overview

将当前单包 `narralang` 仓库迁移为基于 Yarn Workspace 的多包仓库，明确拆分为 `core`、`runtime`、`share`、`nlc` 四类职责边界。迁移后的目标不是单纯调整目录，而是让语言核心、浏览器运行时、Node.js 编译器和共享协议类型拥有各自独立的依赖、构建产物与发布面。

## Problem Frame

当前仓库已经在源码层面初步分出 `src/core` 与 `src/runtime`，但发布、构建和测试仍然是单包模式：

- 根 `package.json` 同时承担主包、`./runtime` 子路径导出、构建脚本和未来 CLI 的占位职责。
- `src/index.ts` 仅导出 `core`，而 `src/runtime/index.runtime.ts` 当前为空，说明 runtime API 还没有被正式收敛为稳定包入口。
- `project/esbuild.js`、`tsconfig.json`、`jest.config.js`、路径别名和声明生成都假定整个仓库是一个包。
- `narraleaf-react` 同时出现在 `peerDependencies` 和 `devDependencies`，这对单包开发可行，但不适合未来将 `core` 与 `runtime` 分别发布。
- README 和 `docs/zh/0. 基本.md` 已经明确了两条产品方向：一条是“解析 DSL”，一条是“生成静态 TypeScript”，但这两条方向在仓库结构上还没有独立成可维护的实现边界。

因此，这次迁移的核心问题不是“如何用 workspace”，而是“如何让包边界和产品边界一致”。

## Requirements Trace

- R1. `core` 必须是纯语言核心，只负责从文本生成 token / AST，不依赖 `narraleaf-react`、Node.js CLI 或浏览器环境。
- R2. `runtime` 必须是单独的 JS 包，用于把 NarraLang AST 转为 NarraLeaf 可执行的运行时节点树，并运行在带 `narraleaf-react` 的应用环境中。
- R3. `nlc` 必须是独立的 Node.js 包，负责把 `.nls` 脚本编译为静态 TypeScript 脚本。
- R4. `nlc` 可以与其他包共处同一仓库，但其依赖不能污染 `core` 与 `runtime` 的安装面。
- R5. 仓库需要引入一个 `@narraleaf/share` 类共享包，用来承载跨包稳定共享的类型、常量和轻量工具。
- R6. 迁移方案需要基于现有代码事实，而不是从零假设一个新系统。

## Scope Boundaries

- 本计划只描述迁移方案、包边界和实施顺序，不直接改动源码。
- 本计划不重新设计 NarraLang 语法本身。
- 本计划不承诺一次性完成 runtime 和 nlc 的全部功能，只定义适合逐步演进的结构。
- 本计划不强行保留当前 `narralang/runtime` 子路径兼容；是否保留兼容层会单独作为发布决策处理。

## Context & Research

### Relevant Code and Patterns

- 当前主入口是 `src/index.ts`，仅导出 `src/core/index.core.ts`。
- 当前 runtime 子入口是 `src/runtime/index.runtime.ts`，内容为空，说明 runtime 还未形成正式公共 API。
- 纯语言核心主要集中在 `src/core/lexer/**`、`src/core/parser/**`、`src/core/index.core.ts`。
- runtime 与 NarraLeaf 引擎耦合主要集中在 `src/runtime/bridge/**`，尤其是 `src/runtime/bridge/context/ContextActions.ts`、`src/runtime/bridge/context/evaluator/SceneEvaluator.ts`。
- `project/esbuild.js` 当前打包 `src/index.ts` 和 `src/runtime/index.runtime.ts`，且使用根级 alias `@`、`@core`、`@runtime`。
- `tsconfig.json` 与 `jest.config.js` 都围绕单包 `src/**` 组织。
- 解析器测试已经有较完整的基础，主要在 `test/parser/**` 与 `test/lexer/**`。

### Institutional Learnings

- 仓库中未发现 `docs/solutions/`、`plans/`、`brainstorms/` 等历史结论库。
- `docs/zh/0. 基本.md` 已经明确 NarraLang 的语言定位是“DSL 转静态 TypeScript”，这意味着 `nlc` 不是附属工具，而应被视为产品主线之一。
- README 中 `NLC`、`NarraLint`、`Integration` 仍为 `In progress`，说明当前公开叙事与实现进度之间存在明显空档。

### External References

- 这次规划优先基于本仓库现状，不额外引入外部设计约束。

## Key Technical Decisions

- 决策 1：将仓库改为根包 `private: true` 的 workspace 宿主，真正可发布的内容下沉到 `packages/*`。
  理由：这样可以把 workspace 根上的工具依赖和发布包的运行时依赖分离，满足“nlc 不污染主仓库依赖”的要求。

- 决策 2：采用四个一等包边界：`packages/core`、`packages/runtime`、`packages/share`、`packages/nlc`。
  理由：这四个边界与用户需求、现有源码分层和未来演进方向一致，不需要引入额外抽象。

- 决策 3：`packages/core` 只保留 lexer、parser、AST、错误类型与纯算法工具，不允许依赖 `narraleaf-react` 或 Node.js 专用运行时。
  理由：`core` 的价值在于可复用和可测试，越纯越适合供 runtime、compiler、lint 工具共同消费。

- 决策 4：`packages/runtime` 直接依赖 `packages/core`，并把 `narraleaf-react` 保持为 `peerDependencies`。
  理由：runtime 需要消费 AST，也必须对接外部引擎，但不能把引擎依赖带进 `core`。

- 决策 5：`packages/nlc` 直接依赖 `packages/core` 和必要的 Node.js 工具链依赖，必要时再依赖 `packages/share`。
  理由：compiler 是 Node.js 环境专属实现，必须与浏览器 runtime 的依赖图彻底分开。

- 决策 6：`packages/share` 只承载跨包稳定协议类型、常量和零或极轻依赖工具，不能沦为任意公共代码堆放区。
  理由：过大的 share 会重新制造耦合，破坏拆包价值。

- 决策 7：发布兼容性采用“两阶段策略”评估。
  第一阶段先完成内部边界拆分和工作区稳定；第二阶段再决定是否提供兼容包或旧导入路径映射。

## Open Questions

### Resolved During Planning

- 是否值得拆分为 workspace：值得，而且已经进入“结构必须跟上产品边界”的阶段。
- `share` 是否需要存在：需要，但必须保持极小，只容纳真正的跨包契约。
- `runtime` 是否应该继续是子路径导出：短期可以作为兼容选项评估，但长期更适合作为独立包。

### Deferred to Implementation

- 最终 npm scope 是否使用 `@narraleaf/*` 还是保留 `narralang` 兼容 facade。
- `nlc` 的 CLI 命令名、输入输出协议和 watch 模式细节。
- runtime 最终暴露的是“节点树构建器”“解释执行器”还是更高层的集成 API。
- 是否保留单独的聚合包用于低迁移成本升级。

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```mermaid
graph TD
  APP[Browser App + narraleaf-react] --> RUNTIME[@narraleaf/runtime]
  RUNTIME --> CORE[@narraleaf/core]
  RUNTIME --> SHARE[@narraleaf/share]
  NLC[@narraleaf/nlc] --> CORE
  NLC --> SHARE
  EDITOR[Future tooling / lint / editor] --> CORE
  EDITOR --> SHARE
```

## Implementation Units

- [ ] **Unit 1: 建立 workspace 根结构**

**Goal:** 把仓库从“可发布单包”改为“托管多个包的 workspace 根”。

**Requirements:** R3, R4, R6

**Dependencies:** None

**Files:**
- Modify: `package.json`
- Modify: `.yarnrc.yml`
- Modify: `tsconfig.json`
- Create: `tsconfig.base.json`
- Modify: `eslint.config.mjs`
- Modify: `jest.config.js`
- Create: `packages/`

**Approach:**
- 将根 `package.json` 改为 `private: true`，加入 `workspaces`。
- 把 TypeScript、esbuild、Jest、ESLint 这类开发工具提升为 workspace 根工具链，而不是业务包运行时依赖。
- 把路径别名和基础编译选项挪到根 `tsconfig.base.json`，各子包各自继承并覆盖自己的 `rootDir`、`outDir`、`references`。
- 明确 lockfile 策略并停止忽略 Yarn lockfile。

**Patterns to follow:**
- `project/esbuild.js`
- `tsconfig.json`
- `jest.config.js`
- `eslint.config.mjs`

**Test scenarios:**
- Test expectation: none -- 该单元以仓库结构和工具链脚手架为主，验证方式以构建和工作区解析为准。

**Verification:**
- workspace 根可以识别所有子包。
- 根工具链不再假定全部源码位于单一 `src/`。

- [ ] **Unit 2: 提取 `core` 纯语言包**

**Goal:** 让语言解析核心成为独立、可单测、可复用的发布包。

**Requirements:** R1, R6

**Dependencies:** Unit 1

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Move or copy: `src/core/**`
- Move or copy: `test/parser/**`
- Move or copy: `test/lexer/**`

**Approach:**
- 将 `src/core/lexer/**`、`src/core/parser/**` 和相关纯工具一起迁入 `packages/core/src/`。
- 将当前 `src/core/index.core.ts` 收敛为 `packages/core/src/index.ts` 的导出面。
- 清理所有依赖根别名才能成立的路径，改为包内相对路径或包名导入。
- 保持 AST、ParserError、LexerError 等已有 API 稳定，优先做“等价迁移”而不是语义改造。

**Patterns to follow:**
- `src/core/index.core.ts`
- `src/core/parser/Parser.ts`
- `test/parser/scene-declaration.test.ts`

**Test scenarios:**
- Happy path: 从现有 `.nls` 样例输入生成与迁移前一致的 AST 结构。
- Happy path: `parse()` 仍返回 `nodes`、`sourceText` 与增强错误能力。
- Edge case: 注释过滤、字符串、数组、对象、tuple、控制流等现有测试样例继续通过。
- Error path: 非法语法输入仍抛出与当前行为一致的解析错误。
- Integration: workspace 内其他包能通过包名依赖 `core` 完成类型解析和构建。

**Verification:**
- `core` 在不安装 `narraleaf-react` 的情况下也能独立构建、测试和发布。

- [ ] **Unit 3: 建立极小的 `share` 契约包**

**Goal:** 抽离真正跨包共享的协议类型、常量和轻量工具。

**Requirements:** R5, R6

**Dependencies:** Unit 1

**Files:**
- Create: `packages/share/package.json`
- Create: `packages/share/tsconfig.json`
- Create: `packages/share/src/index.ts`
- Move or copy: `src/core/utils/constant.ts`
- Move or copy: `src/core/utils/type.ts`
- Move or copy: `src/core/utils/narraleaf-react.ts`
- Move or copy: `src/runtime/utils/data.ts`

**Approach:**
- 只迁移那些既不属于 parser 算法、也不属于 runtime 引擎集成，但未来可能被 runtime、compiler、lint 共同消费的内容。
- 对 `src/core/utils/narraleaf-react.ts` 做语义重命名，避免文件名误导为引擎耦合。
- 明确 `share` 中不允许出现 AST 构建逻辑、解析逻辑或 runtime 上下文逻辑。

**Patterns to follow:**
- `src/core/utils/constant.ts`
- `src/core/utils/type.ts`
- `src/runtime/utils/data.ts`

**Test scenarios:**
- Happy path: `share` 导出的常量与类型可同时被 `runtime`、`nlc`、未来工具包导入。
- Edge case: `share` 不依赖浏览器 API、Node.js API 或 `narraleaf-react`。
- Integration: `core` 可选择不依赖 `share`，避免形成反向耦合。

**Verification:**
- `share` 可以独立构建，且不会把不必要依赖带入消费者。

- [ ] **Unit 4: 提取 `runtime` 浏览器集成包**

**Goal:** 让 runtime 拥有明确的公共入口、引擎 peer 依赖和独立构建边界。

**Requirements:** R2, R4, R6

**Dependencies:** Unit 2, Unit 3

**Files:**
- Create: `packages/runtime/package.json`
- Create: `packages/runtime/tsconfig.json`
- Create: `packages/runtime/src/index.ts`
- Move or copy: `src/runtime/**`
- Create: `packages/runtime/test/**`

**Approach:**
- 将 `src/runtime/bridge/**`、上下文服务和 evaluator 迁入 runtime 包。
- 把当前空的 `src/runtime/index.runtime.ts` 替换为清晰的 runtime API 入口，显式决定对外暴露哪些构造器、服务工厂或桥接函数。
- 把 `narraleaf-react` 固定为 peer，并在构建中标记为 external，避免打包进入 runtime 产物。
- 清理对 `narraleaf-react/dist/...` 这类深层内部路径的依赖，改为公开 API 或自有适配层。

**Patterns to follow:**
- `src/runtime/bridge/context/ContextActions.ts`
- `src/runtime/bridge/context/evaluator/SceneEvaluator.ts`
- `src/runtime/bridge/Bridge.ts`

**Test scenarios:**
- Happy path: runtime 包能消费 `core` 的 AST 并输出符合预期的 NarraLeaf 动作节点或桥接动作。
- Happy path: 变量声明、场景初始化等当前已实现行为在迁移后保持一致。
- Edge case: 缺失场景、缺失命名空间、空上下文时错误行为明确且稳定。
- Error path: 不支持的 AST 节点在 runtime 层抛出清晰错误，而不是静默失败。
- Integration: 安装 runtime 但未安装 `narraleaf-react` 时，包安装层面能正确暴露 peer 依赖需求。

**Verification:**
- runtime 可独立构建并声明其浏览器/引擎集成边界。

- [ ] **Unit 5: 新建 `nlc` Node.js 编译器包**

**Goal:** 落地 README 中长期存在但尚未实现的 NLC 方向。

**Requirements:** R3, R4, R6

**Dependencies:** Unit 2, Unit 3

**Files:**
- Create: `packages/nlc/package.json`
- Create: `packages/nlc/tsconfig.json`
- Create: `packages/nlc/src/index.ts`
- Create: `packages/nlc/src/cli.ts`
- Create: `packages/nlc/test/**`

**Approach:**
- 让 `nlc` 以 Node.js 为唯一执行环境，负责读取 `.nls`、调用 `core` 生成 AST、再转为静态 TypeScript 输出。
- 将 CLI、文件系统访问、路径解析、输出目录控制等逻辑全部收拢到 `nlc` 包。
- 明确区分两类输出：编译 API 与 CLI 行为；前者供其他工具调用，后者供用户直接执行。

**Patterns to follow:**
- `docs/zh/0. 基本.md`
- `README.md`
- `src/core/parser/Parser.ts`

**Test scenarios:**
- Happy path: 输入一个合法 `.nls` 文件可以产出静态 TypeScript 文本。
- Happy path: 编译 API 与 CLI 对同一输入产生一致结果。
- Edge case: 输出目录不存在、扩展名不合法、源文件为空时给出稳定错误。
- Error path: 语法错误输入应返回可定位的编译错误，不生成半成品输出。
- Integration: `nlc` 的依赖安装不会引入 `narraleaf-react` 等浏览器运行时依赖。

**Verification:**
- `nlc` 既可以作为命令行工具运行，也可以作为 Node.js 库被调用。

- [ ] **Unit 6: 设计发布兼容层与仓库治理**

**Goal:** 在多包落地后，补齐发布、兼容性和治理规则。

**Requirements:** R4, R6

**Dependencies:** Unit 2, Unit 4, Unit 5

**Files:**
- Modify: `README.md`
- Create: `project/docs/package-matrix.md`
- Create: `project/docs/release-strategy.md`
- Optional create: `packages/narralang/package.json`

**Approach:**
- 评估是否保留一个聚合包，用于兼容历史导入方式或提供“全家桶”体验。
- 为每个包定义独立的 `exports`、`types`、`files` 和发布说明。
- 明确根 README、包级 README、版本策略和 lockfile 提交规则。

**Patterns to follow:**
- `package.json`
- `README.md`

**Test scenarios:**
- Happy path: 每个包都有清晰、可安装、可解析的入口。
- Integration: workspace 内版本提升和本地联调不依赖手工路径覆盖。
- Integration: 发布清单不会意外包含源码、测试或错误构建产物。

**Verification:**
- 仓库从“内部能跑”提升为“可以稳定发布和协作开发”。

## System-Wide Impact

- **Interaction graph:** `runtime` 将成为 `core` 的直接消费者，`nlc` 将成为 `core` 的另一条主线消费者，`share` 为轻量协议层。
- **Error propagation:** 解析错误应止于 `core` 与 `nlc` 的公开错误模型，runtime 只处理执行期和桥接期错误。
- **State lifecycle risks:** 如果 `share` 过度扩张，未来会重新制造跨包循环依赖。
- **API surface parity:** 需要分别定义 parser API、runtime API 和 compiler API，不能再依赖一个根包承担全部语义。
- **Integration coverage:** 需要补齐跨包构建、类型引用、peer 依赖安装和 CLI 行为验证。
- **Unchanged invariants:** `core` 的基本 parse 能力和 AST 主体语义不应因 workspace 迁移而被重写。

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `share` 变成杂物包 | 在迁移时先定义允许进入 `share` 的准入标准，只放稳定契约 |
| `runtime` 继续依赖 `narraleaf-react` 内部深层路径 | 在拆包阶段建立适配层或替换为公开 API |
| workspace 迁移导致测试与 alias 大面积失效 | 先做根工具链基线，再迁移包，避免同时改路径和逻辑 |
| `nlc` 需求过早膨胀 | 先落地“文本 -> AST -> TypeScript 文本”的最小编译链 |
| 发布兼容性处理过晚 | 在最后单元明确兼容策略，而不是默认所有旧入口永久保留 |

## Documentation / Operational Notes

- 迁移完成后，README 需要从“单包介绍”改为“包矩阵 + 使用方式”。
- `docs/zh` 现有内容主要是语言设计文档，适合作为 `core` 与 `nlc` 的产品背景，不适合作为 runtime 集成文档的替代。
- 建议后续把架构文档、迁移计划和发布策略都统一收敛到 `project/docs/`。

## Sources & References

- `README.md`
- `package.json`
- `project/esbuild.js`
- `tsconfig.json`
- `jest.config.js`
- `eslint.config.mjs`
- `src/index.ts`
- `src/core/index.core.ts`
- `src/runtime/index.runtime.ts`
- `src/runtime/bridge/context/ContextActions.ts`
- `src/runtime/bridge/context/evaluator/SceneEvaluator.ts`
- `docs/zh/0. 基本.md`
