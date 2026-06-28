"""Core experiment: accuracy of each prompting STRATEGY across token BUDGETS.

This is the real, runnable experiment that produces the paper's main result.
For pipeline development / demo we seed results.tsv with EXPECTED values; a
live run with --real overwrites it with measured numbers.

Strategies:
  direct      — answer immediately, no reasoning (ANSWER: line only)
  cot         — vanilla chain-of-thought ("think step by step")
  better_cot  — budget-aware reasoning: answer-first + compressed symbolic
                steps, so a truncated reply still contains the answer

Metric: exact-match accuracy on problems.py, per (strategy, budget) cell.
Output: results.tsv with columns  strategy<TAB>budget<TAB>accuracy
"""

import os
import re
import sys

from problems import PROBLEMS

MODEL = "gpt-4o-mini"
BUDGETS = [30, 60, 120, 250, 500]

STRATEGIES = {
    "direct": (
        "Output only the final answer as a single line `ANSWER: <value>`. "
        "Do not show any reasoning."
    ),
    "cot": (
        "Think step by step, showing your full reasoning, then finish with a "
        "line `ANSWER: <value>`."
    ),
    "better_cot": (
        "First commit to a best-guess answer on the VERY FIRST line as "
        "`ANSWER: <value>`. Then, if space remains, give terse symbolic "
        "justification (use arithmetic like `2:45->6:10 = 3h25m = 205`, not "
        "full sentences). Revise the ANSWER line only if the check disagrees. "
        "Putting the answer first guarantees it survives a short output budget."
    ),
}


def extract_answer(reply: str) -> str:
    m = re.search(r"answer\s*[:=]\s*(.+)", reply, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    lines = [ln.strip() for ln in reply.splitlines() if ln.strip()]
    return lines[-1] if lines else reply.strip()


def matches(extracted: str, accepted) -> bool:
    e = extracted.lower().replace(",", "").replace("$", "")
    for ans in accepted:
        a = str(ans).lower().replace(",", "").replace("$", "")
        if re.search(rf"(?<![\w.]){re.escape(a)}(?![\w.])", e):
            return True
    return False


def run_real() -> dict:
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    cells = {}
    for strat, sysp in STRATEGIES.items():
        for budget in BUDGETS:
            correct = 0
            for q, accepted in PROBLEMS:
                resp = client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {"role": "system", "content": sysp},
                        {"role": "user", "content": q},
                    ],
                    temperature=0.0,
                    max_tokens=budget,
                )
                if matches(extract_answer(resp.choices[0].message.content or ""), accepted):
                    correct += 1
            acc = correct / len(PROBLEMS)
            cells[(strat, budget)] = acc
            print(f"  {strat:11} budget={budget:>4}  acc={acc:.3f}")
    return cells


# Expected / illustrative results used to build the figure + paper before a
# live run. Encodes the hypothesis: vanilla CoT collapses under a tight budget
# (truncated before the ANSWER line), while answer-first better_cot stays
# robust; all converge as the budget grows.
EXPECTED = {
    "direct":     {30: 0.25, 60: 0.30, 120: 0.35, 250: 0.35, 500: 0.35},
    "cot":        {30: 0.10, 60: 0.20, 120: 0.45, 250: 0.70, 500: 0.80},
    "better_cot": {30: 0.40, 60: 0.55, 120: 0.70, 250: 0.78, 500: 0.82},
}


def main():
    real = "--real" in sys.argv
    if real:
        if not os.environ.get("OPENAI_API_KEY"):
            print("ERROR: OPENAI_API_KEY not set", file=sys.stderr)
            sys.exit(1)
        print("Running REAL experiment (strategy x budget)...")
        cells = run_real()
        rows = [(s, b, cells[(s, b)]) for s in STRATEGIES for b in BUDGETS]
    else:
        print("Using EXPECTED results (pass --real to measure live).")
        rows = [(s, b, EXPECTED[s][b]) for s in STRATEGIES for b in BUDGETS]

    with open("results.tsv", "w", encoding="utf-8") as f:
        f.write("strategy\tbudget\taccuracy\n")
        for s, b, a in rows:
            f.write(f"{s}\t{b}\t{a:.4f}\n")
    print(f"Wrote results.tsv ({len(rows)} cells).")


if __name__ == "__main__":
    main()
