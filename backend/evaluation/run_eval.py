import json
import sys
import time
from pathlib import Path

import httpx

# Make `import config` work when run from the backend folder
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config  # noqa: E402

BASE = "http://127.0.0.1:8000"
CUTOFF = config.RETRIEVAL_MAX_DISTANCE
use_llm = "--ask" in sys.argv

questions = json.loads(
    (Path(__file__).parent / "questions.json").read_text(encoding="utf-8")
)

rows = []
with httpx.Client(timeout=90) as client:
    for item in questions:
        # max_distance=2 disables the cutoff, so we see the raw best distance
        r = client.get(
            f"{BASE}/search",
            params={"q": item["q"], "k": 1, "max_distance": 2},
        )
        r.raise_for_status()
        hits = r.json()
        row = {
            "label": item["label"],
            "q": item["q"],
            "best": hits[0]["distance"] if hits else float("inf"),
        }
        if use_llm:
            a = client.post(f"{BASE}/ask", json={"question": item["q"]})
            a.raise_for_status()
            body = a.json()
            row["answered"] = body["answered"]
            row["answer"] = body["answer"]
            time.sleep(1)  # be gentle with rate limits
        rows.append(row)


def retrieval_ok(label: str, passed: bool) -> bool:
    if label == "answer":
        return passed
    if label == "offtopic":
        return not passed
    return True  # near-misses are the model's job to refuse


print(f"Cutoff in use: {CUTOFF}\n")
header = f"{'label':<9} {'best':>6}  {'cutoff':<6} {'check':<5}"
if use_llm:
    header += f" {'model':<5}"
print(header + " question")

for row in rows:
    passed = row["best"] <= CUTOFF
    line = (
        f"{row['label']:<9} {row['best']:>6.3f}  "
        f"{'pass' if passed else 'drop':<6} "
        f"{'ok' if retrieval_ok(row['label'], passed) else 'BAD':<5}"
    )
    model_bad = False
    if use_llm:
        expected = row["label"] == "answer"
        model_bad = row["answered"] != expected
        line += f" {'BAD' if model_bad else 'ok':<5}"
    print(line, row["q"])
    if model_bad:
        print("          model said:", " ".join(row["answer"].split())[:200])


def best_distances(label: str) -> list[float]:
    return [r["best"] for r in rows if r["label"] == label]


worst_answerable = max(best_distances("answer"))
closest_offtopic = min(best_distances("offtopic"))
print(f"\nWorst answerable question:  {worst_answerable:.3f}")
print(f"Closest off-topic question: {closest_offtopic:.3f}")
if worst_answerable < closest_offtopic:
    midpoint = (worst_answerable + closest_offtopic) / 2
    print(f"Clean gap. A cutoff between them works, for example {midpoint:.3f}")
else:
    print("Overlap: no single cutoff separates them. The prompt has to do more of the work.")