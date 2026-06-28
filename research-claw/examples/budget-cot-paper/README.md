# Demo: Budget-Aware Chain-of-Thought (end-to-end paper)

A worked example of the full autonomous-research pipeline: **experiment →
figure → NeurIPS paper PDF**. It studies a real, reproducible question:

> **When does Chain-of-Thought hurt?** Under a tight output-token budget,
> vanilla CoT can be *worse* than answering directly (the reply is truncated
> before the answer line). We propose **budget-aware CoT** (answer-first +
> compressed reasoning) and show it dominates across budgets.

## Files

| File | Role |
|------|------|
| `problems.py` | Read-only benchmark of multi-step reasoning problems. |
| `experiment_matrix.py` | Core experiment: accuracy of each strategy (`direct`, `cot`, `better_cot`) × token budget. Writes `results.tsv`. |
| `plot.py` | Reads `results.tsv` → `figures/budget_accuracy.pdf` (the crossover curves). |
| `main.tex` | NeurIPS 2025 short paper (abstract/intro/related/method/experiments/discussion). |
| `neurips.sty`, `extra_pkgs.tex` | NeurIPS template. |
| `results.tsv`, `figures/`, `main.pdf` | Checked-in outputs so the PDF is viewable without running anything. |

## Reproduce

```bash
# expected/illustrative numbers (no API):
python experiment_matrix.py
# OR measure live against the OpenAI API:
python experiment_matrix.py --real

python plot.py                       # regenerate the figure
tectonic -X compile main.tex         # rebuild the PDF
```

> The committed `results.tsv` holds the **expected** (illustrative) numbers used
> to build the figure and paper. Run with `--real` to replace them with measured
> values from `gpt-4o-mini`.

## Relation to `cli iterate`

The `better_cot` strategy is the kind of prompt an autonomous keep-or-revert
loop converges to — see [`../../docs/iterative-experiments.md`](../../docs/iterative-experiments.md).
