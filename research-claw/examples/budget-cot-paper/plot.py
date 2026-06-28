"""Read results.tsv and render the main figure: accuracy vs token budget,
one line per prompting strategy. The crossover (vanilla CoT below direct at
low budgets, above at high budgets; better_cot dominating at low budgets) is
the paper's headline result.

Outputs figures/budget_accuracy.pdf
"""

import csv
import os
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

LABELS = {
    "direct": "Direct (no reasoning)",
    "cot": "Vanilla CoT",
    "better_cot": "Budget-aware CoT (ours)",
}
COLORS = {"direct": "#888888", "cot": "#d1495b", "better_cot": "#2e86de"}
MARKERS = {"direct": "s", "cot": "o", "better_cot": "^"}


def main():
    data = defaultdict(dict)
    with open("results.tsv", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            data[row["strategy"]][int(row["budget"])] = float(row["accuracy"])

    os.makedirs("figures", exist_ok=True)
    plt.figure(figsize=(6, 4))
    for strat in ["direct", "cot", "better_cot"]:
        if strat not in data:
            continue
        budgets = sorted(data[strat])
        accs = [data[strat][b] for b in budgets]
        plt.plot(budgets, accs, marker=MARKERS[strat], color=COLORS[strat],
                 linewidth=2, markersize=7, label=LABELS.get(strat, strat))

    plt.xlabel("Output token budget (max_tokens)")
    plt.ylabel("Exact-match accuracy")
    plt.title("Reasoning accuracy vs. output budget")
    plt.legend(loc="lower right", frameon=True)
    plt.grid(True, alpha=0.3)
    plt.ylim(0, 1)
    plt.tight_layout()
    plt.savefig("figures/budget_accuracy.pdf")
    print("Wrote figures/budget_accuracy.pdf")


if __name__ == "__main__":
    main()
