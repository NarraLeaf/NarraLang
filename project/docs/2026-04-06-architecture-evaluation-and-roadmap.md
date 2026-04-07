# NarraLang 架构评估与发展路线

## 目的

这份文档不是迁移执行计划，而是对 NarraLang 当前状态的一次“重新上手速查”。它回答三个问题：

1. 你的完整需求是否合理，以及应该如何落到仓库结构上。
2. 当前仓库实际上已经走到了哪一步。
3. 接下来应该按什么架构方向继续推进，才能避免未来重复返工。

## 需求评估

### 结论

你的整体需求是合理的，而且与现有代码事实基本一致。更准确地说，仓库现在已经具备“向多包演进”的前置条件，只是还没有把这些边界转化成正式包。

### 分项评估

#### 1. 让 NarraLang 成为 Node.js 分包仓库

这是正确方向，不只是工程升级，而是产品结构升级。

原因：

- 语言核心、运行时桥接和静态编译器本来就是三种不同环境。
- 现在继续把它们塞在一个包里，只会让依赖、发布与测试越来越难拆。
- 你已经在源码层面做了第一步分层：`src/core` 和 `src/runtime`。

#### 2. `core` 只做语法解析与 AST

这个要求非常清晰，而且当前代码已经很接近这个目标。

证据：

- `src/core/lexer/**`、`src/core/parser/**` 没有直接依赖 `narraleaf-react`。
- `src/index.ts` 当前只导出 `core`，说明公开入口事实上也是“先把 parser 做好”。
- parser 测试覆盖相对完整，是目前仓库最成熟的部分。

评估：

- 这是最适合最先稳定下来的一层。
- `core` 应该成为整个生态的基础包，而不是附庸于 runtime。

#### 3. `runtime` 作为浏览器环境下的运行时桥接包

方向正确，但实现仍处于较早期。

证据：

- `src/runtime/bridge/context/ContextActions.ts` 已经开始和 `narraleaf-react` 服务体系对接。
- `src/runtime/bridge/context/evaluator/SceneEvaluator.ts` 已经在尝试把 AST 语句转为 action 链。
- 但是 `src/runtime/index.runtime.ts` 目前为空，说明 runtime 还没有正式对外 API。

评估：

- runtime 现在更像“原型中的桥接层”，而不是稳定包。
- 这不影响拆包，反而说明应该尽早把它从 `core` 隔离出去，允许它独立演进。

#### 4. `nlc` 作为 Node.js 编译器包

这是合理且必要的主线，不应该继续停留在 README 占位。

证据：

- `docs/zh/0. 基本.md` 已明确写出 NarraLang 的基本原理是“DSL 转 TypeScript”。
- README 的 `NLC` 章节仍然是 `In progress`，说明概念已确定、实现尚未落地。
- 当前仓库还没有 CLI 入口和独立 compiler 目录，因此它最适合以新 workspace 包的方式启动。

评估：

- `nlc` 不是可有可无的附加包，而是 NarraLang 产品定义的一部分。
- 这条线应该和 `runtime` 平行，而不是依赖 runtime。

#### 5. 引入 `@narraleaf/share`

可以做，但必须克制。

适合进入 `share` 的内容：

- 跨包稳定常量，如颜色常量。
- DSL 与输出层共享的轻量协议类型。
- 小型无环境依赖工具。

不适合进入 `share` 的内容：

- AST 构建逻辑。
- parser 内部细节。
- runtime 上下文对象。
- 任何“只是因为别处也能 import”就被搬过去的代码。

评估：

- `share` 应该是“协议层”，不是“公共杂物层”。

## 当前仓库现状

### 仓库级状态

- 当前仍是单包 `narralang` 仓库，根 `package.json` 同时承担构建、发布和未来 CLI 占位。
- `exports` 暴露了 `"."` 和 `"./runtime"`，但 runtime 实际源码入口为空。
- 构建方式是 `project/esbuild.js` + `tsc --emitDeclarationOnly` + `tsc-alias`。
- 测试主要围绕 parser/lexer，使用 `jest`，并辅以少量 `tsx` 脚本。

## 代码成熟度判断

### 最成熟：语言核心

主要体现在：

- `src/core/lexer/**`
- `src/core/parser/**`
- `test/parser/**`
- `test/lexer/**`

判断：

- 语言核心已经形成明确的内部结构。
- parser AST 和错误模型已经足够支撑继续向 compiler 与 runtime 供给。
- 这是最适合作为第一个独立包稳定下来的模块。

### 正在成形：runtime 桥接

主要体现在：

- `src/runtime/bridge/context/ContextActions.ts`
- `src/runtime/bridge/context/evaluator/SceneEvaluator.ts`
- `src/runtime/bridge/context/services/**`

判断：

- 运行时上下文、变量作用域、场景作用域等概念已经开始出现。
- 当前 `SceneEvaluator` 只覆盖了很有限的节点构造能力，说明 runtime 仍处于从 AST 到执行模型的早期实现阶段。
- 最近有未提交修改集中在 runtime 相关文件，也说明你当前的开发重心正在这里。

### 尚未落地：NLC

主要体现在：

- README 有 `NLC` 标题，但无实现说明。
- 仓库没有独立 `compiler`、`cli` 或 `nlc` 目录。
- `package.json` 中虽然有 `bin` 指向 `dist/cli.cjs`，但当前构建脚本没有产出这个文件。

判断：

- `nlc` 现在仍是“产品已命名、工程未开始”的阶段。
- 这也意味着它非常适合在 workspace 重构后，以新包身份干净启动。

### 文档现状：语言设计比工程设计成熟

现有内容分布很明确：

- README：项目定位、示例、工具入口占位。
- `docs/zh/0. 基本.md`：语言目标、静态生成方向、概念模型。
- `docs/zh/1. 概念/**`、`docs/zh/2. 数据交互/**`：语言语义和语法设计。

判断：

- 你已经拥有一套还不错的语言设计叙事。
- 但目前缺少架构文档、发布策略、包边界文档和实施路线文档。

## 现有内容如何映射到未来架构

| 现有内容 | 未来归属 | 说明 |
|------|------|------|
| README 中的语言介绍与示例 | 根级项目介绍 | 继续保留，但需要补充“包矩阵” |
| `docs/zh/0. 基本.md` 中“DSL 转 TypeScript”定位 | `core` + `nlc` 的产品依据 | 这是 compiler 方向最重要的现有设计依据 |
| `src/core/**` | `packages/core` | 纯语言核心 |
| `src/runtime/**` | `packages/runtime` | NarraLeaf 集成运行时 |
| `src/core/utils/constant.ts` 等轻量共享内容 | `packages/share` | 只放稳定共享契约 |
| 未来 CLI / 文件系统编译逻辑 | `packages/nlc` | Node.js 专属 |

## 推荐目标架构

### 包矩阵

| 包名 | 责任 | 运行环境 | 允许依赖 | 不允许依赖 |
|------|------|------|------|------|
| `@narraleaf/core` | lexer、parser、AST、错误模型 | 通用 JS/TS | 纯工具依赖 | `narraleaf-react`、Node.js CLI |
| `@narraleaf/runtime` | AST 到 NarraLeaf 节点/动作桥接 | 浏览器应用 / 引擎环境 | `@narraleaf/core`、`@narraleaf/share`、`narraleaf-react` peer | Node.js 编译器依赖 |
| `@narraleaf/share` | 共享常量、协议类型、轻量工具 | 通用 JS/TS | 极少量或零依赖 | parser 内部逻辑、runtime 上下文 |
| `@narraleaf/nlc` | `.nls` 到静态 TypeScript 的编译器与 CLI | Node.js | `@narraleaf/core`、`@narraleaf/share` | 浏览器运行时依赖 |

### 依赖方向

```mermaid
graph LR
  SHARE[@narraleaf/share]
  CORE[@narraleaf/core]
  RUNTIME[@narraleaf/runtime]
  NLC[@narraleaf/nlc]

  RUNTIME --> CORE
  RUNTIME --> SHARE
  NLC --> CORE
  NLC --> SHARE
```

建议补充说明：

- 如果 `core` 能完全不依赖 `share`，会更理想。
- `runtime` 与 `nlc` 都应该依赖 `core`，但互不依赖。

## 发展方向

### 第一阶段：稳定核心边界

目标：

- 确认 `core` 的公共 API。
- 把 AST、错误、parse 返回结构固定下来。
- 保持 parser 测试在重构期间始终可回归验证。

为什么先做这一步：

- `core` 是 runtime 和 nlc 的共同地基。
- 如果先写 compiler 或 runtime，再回头改 parser API，会造成双倍返工。

### 第二阶段：把 runtime 从“原型”提升为“包”

目标：

- 明确 runtime 公共入口。
- 把 AST -> NarraLeaf action/node 的转换责任收敛到少数公开模块。
- 清理对 `narraleaf-react` 内部深层路径的直接依赖。

成功标志：

- runtime 有稳定导出面。
- runtime 安装和构建不再依赖根包的单包假设。

### 第三阶段：落地最小可用的 NLC

目标：

- 先实现最小编译链：`.nls` -> AST -> TypeScript 文本。
- 再补 CLI 参数、输出路径、批量编译、watch 等能力。

成功标志：

- 仓库第一次真正兑现“静态生成 TypeScript”这条产品承诺。

### 第四阶段：补齐生态层

目标：

- 决定是否保留兼容聚合包。
- 更新 README 与包级使用文档。
- 未来再引入 `NarraLint`、编辑器工具或更多分析工具。

## 当前最值得注意的风险

- `share` 过早扩大，导致看似拆包、实则耦合仍然存在。
- `runtime` 继续通过深层 import 绑定 `narraleaf-react` 内部结构，未来升级会很脆。
- `nlc` 如果直接从 runtime 复用执行逻辑，会污染 Node.js 编译边界。
- workspace 改造如果同时改构建、导出、目录和语义，调试成本会指数上升。

## 建议的近期里程碑

1. 先把 workspace 根结构和包边界建立出来，即使内部代码暂时还是平移。
2. 让 `core` 独立构建和独立测试先通过。
3. 让 `runtime` 拥有第一个真正可导入的公开入口。
4. 为 `nlc` 建立最小 CLI 和编译 API。
5. 最后处理兼容包、发布策略和 README 重写。

## 快速结论

如果只用一句话概括当前状态：

NarraLang 的语言核心已经进入“可以沉淀为独立基础包”的阶段，runtime 正处于桥接原型期，而 nlc 仍停留在产品定义阶段；最合适的下一步不是继续在根包里堆功能，而是先完成 workspace 化和正式包边界建设。

## 参考依据

- `README.md`
- `docs/zh/0. 基本.md`
- `package.json`
- `project/esbuild.js`
- `tsconfig.json`
- `jest.config.js`
- `src/index.ts`
- `src/core/index.core.ts`
- `src/core/parser/Parser.ts`
- `src/runtime/index.runtime.ts`
- `src/runtime/bridge/context/ContextActions.ts`
- `src/runtime/bridge/context/evaluator/SceneEvaluator.ts`
