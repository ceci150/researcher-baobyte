# Workspace 目录结构说明

> 解释 `workspace/{项目}/` 下的目录结构，澄清"为什么看起来有重复"。
> 以 `SamplingStudy` 项目为例。

## 四层结构总览

```
workspace/                              ← 所有项目的根
└── SamplingStudy/                      ← 【第1层】项目根 (project.root)
    ├── .venv/                          ← 项目独立 venv (uv 创建, 装 openai/matplotlib/numpy)
    ├── .project_memory/                ← 项目长期记忆 (跨 session 持久化)
    │
    ├── SamplingStudy/                  ← 【第2层】"core" — 真正的论文仓库 (project.core, 带 .git)
    │   ├── .git/  .gitignore
    │   ├── main.tex / main.pdf         ← 最终论文 (FINALIZE 后才出现在这一层根目录)
    │   ├── code/  figures/             ← 最终代码与图 (合并后)
    │   └── _task_workers/              ← worker 产物的"验收存档"副本 (见 说明②)
    │
    └── 0628_01/                        ← 【第3层】一个 session (MMDD_NN, 一次对话/任务)
        ├── .bot/                       ← 该 session 的历史 / 记忆 / task_state.json
        └── _task_workers/              ← 【第4层】各 worker 的隔离沙箱 (overlay)
            ├── t1_r1/ ... t6_r1/       ← 每个任务一个独立工作目录 (rN = 第 N 轮重试)
```

四层含义：

| 层 | 路径 | 作用 |
|----|------|------|
| 1. 项目根 | `workspace/SamplingStudy/` | 项目的"家"：装 venv、记忆、所有 session、core |
| 2. core | `workspace/SamplingStudy/SamplingStudy/` | 干净的论文仓库（git 管理、同步 Overleaf 的那份交付物） |
| 3. session | `workspace/SamplingStudy/0628_01/` | 一次对话/任务的工作区与历史 |
| 4. overlay | `…/0628_01/_task_workers/t1_r1/` | 单个 worker 的隔离沙箱 |

---

## 疑惑①：为什么有两个同名的 `SamplingStudy/SamplingStudy/`？

**故意的两层命名，不是 bug。**

- **外层 `SamplingStudy/`** = 项目的"家"，装着该项目的所有东西（venv、记忆、各次 session、以及 core）。
- **内层 `SamplingStudy/SamplingStudy/`** = `core`，**只装论文本身**（`.tex`、`.git`、最终 `main.pdf`）。这是会同步到 Overleaf、会被 git 版本管理的那一份"干净交付物"。

类比：外层是"工作室"（草稿、工具、历史都在），内层 core 是"正式出版的稿子"。系统把"工作区杂物"和"最终论文仓库"分开，所以套了同名两层。

---

## 疑惑②：为什么 `_task_workers` 出现两次（session 一份、core 一份）？

同一个 `t2_r1` 在两处出现，是 worker 隔离 + 验收存档机制：

- **`0628_01/_task_workers/t{N}_r1/`**（session 下，第 4 层）
  = 每个任务 worker 的**隔离沙箱 (overlay)**。worker 在这里干活，写入不污染 core。
  `r1` 表示第 1 轮；若 reviewer 判 FAIL 重试，会出现 `r2`、`r3`。

- **`SamplingStudy/_task_workers/t{N}_r1/`**（core 下）
  = worker 干完、reviewer **PASS 后**，产物被 merge 到 core 的副本，供下游任务作为依赖读取。

> 一份是"工作现场"，一份是"验收通过后的存档" —— 这就是看起来重复的来源。

---

## 疑惑③：为什么 worker 目录里还嵌套 `t1/ t2/ t3/`？

例如 `t5_r1/` 里有 `t1/ t2/ t3/ t4/` —— 这是**依赖注入**。

t5 依赖前面的任务，系统把 t1~t4 的产物**只读拷贝**进 t5 的沙箱，让 t5 能读到上游结果。
（这些依赖目录被设为只读 `0o444/0o555`，所以手动 `rm` 时会报 `Permission denied`，需要先 `chmod -R u+rwX` 再删。）

---

## 任务执行流程与产物落点

`/task` 五阶段：UNDERSTAND → PROPOSE → PLAN(DAG) → EXECUTE(并行 worker) → FINALIZE。

- **执行中**：worker 在 `0628_01/_task_workers/t{N}_r1/` 沙箱里写 `code/`、`figures/` 等。
- **单任务 PASS 后**：产物 merge 到 `core/_task_workers/t{N}_r1/`，供下游依赖。
- **FINALIZE (task_commit) 后**：最终成果才合并到 **core 根目录**（内层 `SamplingStudy/SamplingStudy/` 下的 `main.pdf`、`code/`、`figures/`）。

> ⚠️ 看最终交付物，要看 **内层 core 根目录**。执行过程中 core 根目录"看起来还没东西"是正常的——要等 FINALIZE。

---

## 其他目录速查

| 目录 | 含义 |
|------|------|
| `.venv/` | 项目独立虚拟环境（uv 创建，懒加载，所有 worker 共享，不进 overlay） |
| `.project_memory/` | 项目长期记忆（跨 session：entries / knowledge / profiles） |
| `0628_01/.bot/` | 该 session 的对话历史、事件、trajectory、`task_state.json` |
| `*_task_workers/t{N}_r{M}/.bot/` | 单个 worker 的 trajectory 日志（调试 worker 行为时看这里） |
| `_task_workers/t{N}_r{M}/{t...}/` | 注入的上游依赖产物（只读） |
