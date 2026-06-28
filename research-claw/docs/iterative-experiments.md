# 迭代实验 (Iterative Experiments)

指标驱动的自主实验循环。受 Karpathy 的 [autoresearch](https://github.com/karpathy/nanochat) 启发:
给定一份可编辑代码 + 一条运行命令 + 一个标量指标,agent 自动地

```
改代码 → 跑 → 抽取指标 → 和最好成绩比 → keep(git 推进) / revert(git reset) → 记 results.tsv → 重复
```

直到达到轮数 / patience 预算。

## 快速开始

1. 在一个项目的 **core 目录**(`workspace/{项目}/{项目}/`)里准备三样东西:
   - 一个**可编辑文件**(agent 会改它,例如 `solution.py`)
   - 一个**只读评测脚本**(运行后打印指标行,例如 `experiment.py`)
   - 一份 `experiment.yaml`(实验声明)
2. 确保 core 是干净的 git 仓库(项目创建时自动 init)。把上述文件 `git commit` 进去做基线。
3. 运行:

```bash
.venv/bin/python cli/main.py iterate -p <项目名>
```

可选参数:`--config <文件>`(默认 `experiment.yaml`)、`--rounds N`(覆盖 max_rounds)、`-v`(调试日志)。

## experiment.yaml 字段

```yaml
goal: "用一句话描述优化目标(会注入给提案 LLM)"
metric: accuracy            # 被优化的标量名(也是 results.tsv 的列名)
direction: maximize         # maximize | minimize
metric_regex: '^accuracy:\s*([0-9.]+)'   # 从运行输出里捕获指标的正则(捕获组1)
run_command: "python experiment.py"      # 每轮执行的命令
editable_files: [solution.py]    # agent 可以修改的文件
readonly_files: [experiment.py]  # agent 可读作上下文、但不可改的文件
max_rounds: 10              # 最多迭代轮数(不含 round 0 基线)
timeout_seconds: 600        # 单轮命令超时(预留;当前 bash 工具上限 300s)
patience: 4                 # 连续 N 轮无改进则提前停止(0 = 不提前停)
```

## 工作机制

- **Round 0(基线)**:不改代码,直接跑一次 `run_command`,记录初始指标作为对比基准。
- **每一轮**:
  1. **提案**:把 `goal` + 历史(results)+ 当前可编辑文件内容 + 只读上下文喂给 LLM,
     要求它返回严格 JSON——一个聚焦的 find/replace 改动 + 一句假设。
  2. **应用**:对可编辑文件做唯一匹配的 find/replace(全有或全无)。
  3. **提交**:`git commit` 这次尝试。
  4. **运行 + 打分**:执行 `run_command`,用 `metric_regex` 从输出抽取指标(取最后一次匹配)。
  5. **比较**:按 `direction` 判断是否优于当前最佳。
  6. **keep / revert**:改善则保留并推进 best commit;否则 `git reset --hard` 回退到本轮起点。
  7. **记录**:向 `results.tsv` 追加一行(round / commit / 指标 / 状态 / 描述)。
- 结束时工作树停在**最佳 commit**;`results.tsv` 写在项目根(git 之外),不会被 reset 回滚。

## 复用的底层能力

- **真实执行**:用 session 锚定的 `BashTool`,自动注入 `OPENAI_API_KEY`/`OPENAI_BASE_URL`
  和**项目级 venv**(`workspace/{项目}/.venv`)到 PATH——所以实验脚本能直接 `import openai`、
  `import matplotlib` 并认证,无需手动 export。详见 [[workspace-structure]]。
- **keep/revert**:项目 core 的 git 仓库。
- **提案**:`provider.chat` 单次结构化调用(不走重型 agent loop)。

## 示例:Prompt 优化(纯 API,无需 GPU)

`workspace/PromptOpt/PromptOpt/` 下:
- `solution.py` 定义 `SYSTEM_PROMPT`(可编辑)
- `experiment.py` 用该 prompt 在固定的小情感分类集上调 API,打印 `accuracy: X`(只读)
- `experiment.yaml` 指定 `metric: accuracy / direction: maximize`

实测:基线 prompt "Classify the sentiment." 准确率 ~0.3–0.4;agent 第 1 轮提出
"加入明确的分类规则(讽刺/否定/中性边界)" 即达到 1.0,后续轮次无法超越遂全部 revert,
最终保留第 1 轮的满分 prompt。

## 代码位置

- 循环控制器与配置:`agent/scheduler/iterate.py`
  (`IterativeExperimentRunner`、`ExperimentConfig`、`ExperimentProposer`)
- CLI 入口:`cli/main.py` 的 `iterate` 命令

## 后续可扩展

- 接入 GUI(`research_run_api.py` 当前的 ml/judge 阶段是 mock,可替换为真实迭代循环)
- 多文件改动、受控搜索空间、并行多分支竞赛
- 时间预算驱动(autoresearch 的固定 5 分钟训练预算)
