import json
import sys
import tempfile
import unicodedata
from pathlib import Path

# Make `import config` work when run from the backend folder
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config  # noqa: E402
from chunker import chunk_segments  # noqa: E402
from embedder import GeminiEmbeddings  # noqa: E402
from parsers import parse_document  # noqa: E402
from vectorstore import add_chunks, create_store, search  # noqa: E402

CHUNK_SIZES = [300, 500, 800, 1200]
K_VALUES = [1, 3, 5]


def norm(text: str) -> str:
    """Lowercase, expand ligatures (fi), and collapse whitespace."""
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def load_documents():
    docs = []
    for meta_path in sorted(config.UPLOAD_DIR.glob("*.json")):
        if meta_path.name.endswith(".segments.json"):
            continue
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        file_path = config.UPLOAD_DIR / f"{meta['doc_id']}{meta['extension']}"
        docs.append((meta, parse_document(file_path)))
    return docs


def first_hit_rank(hits, expect):
    wanted = [norm(e) for e in expect]
    for rank, hit in enumerate(hits, start=1):
        text = norm(hit["text"])
        if any(w in text for w in wanted):
            return rank
    return None


questions = json.loads(
    (Path(__file__).parent / "questions.json").read_text(encoding="utf-8")
)
docs = load_documents()
if not docs:
    raise SystemExit("No uploaded documents found in data/uploads. Upload some first.")

scored = [q for q in questions if q["label"] == "answer" and q.get("expect")]
if not scored:
    raise SystemExit("No 'answer' questions with an 'expect' field in questions.json.")

print(f"Documents: {[m['filename'] for m, _ in docs]}")
print(f"Scored questions: {len(scored)}\n")

rows = []
for size in CHUNK_SIZES:
    overlap = size // 8
    print(f"Chunk size {size} ...", flush=True)
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        store = create_store(Path(tmp), GeminiEmbeddings())

        total_chunks = 0
        for meta, segments in docs:
            chunks = chunk_segments(
                segments, meta["doc_id"], meta["filename"], size=size, overlap=overlap
            )
            add_chunks(chunks, store=store)
            total_chunks += len(chunks)

        hits_by_question = {
            item["q"]: search(item["q"], k=max(K_VALUES), store=store)
            for item in questions
        }

    ranks = [first_hit_rank(hits_by_question[q["q"]], q["expect"]) for q in scored]
    hit_counts = {
        k: sum(1 for r in ranks if r is not None and r <= k) for k in K_VALUES
    }

    def best_distance(item):
        return hits_by_question[item["q"]][0]["distance"]

    worst_answerable = max(best_distance(i) for i in questions if i["label"] == "answer")
    closest_offtopic = min(best_distance(i) for i in questions if i["label"] == "offtopic")

    rows.append(
        {
            "size": size,
            "overlap": overlap,
            "chunks": total_chunks,
            "hits": hit_counts,
            "worst": worst_answerable,
            "offtopic": closest_offtopic,
            "gap": closest_offtopic - worst_answerable,
        }
    )

n = len(scored)
lines = [
    "| chunk size | overlap | chunks | "
    + " | ".join(f"hit@{k}" for k in K_VALUES)
    + " | worst answerable | closest off-topic | gap |",
    "|---|---|---|" + "---|" * len(K_VALUES) + "---|---|---|",
]
for r in rows:
    hit_cells = " | ".join(f"{r['hits'][k]}/{n}" for k in K_VALUES)
    lines.append(
        f"| {r['size']} | {r['overlap']} | {r['chunks']} | {hit_cells} | "
        f"{r['worst']:.3f} | {r['offtopic']:.3f} | {r['gap']:+.3f} |"
    )

table = "\n".join(lines)
print("\n" + table)

(Path(__file__).parent / "results.md").write_text(
    "# Chunk size and top-k experiment\n\n"
    f"Documents: {', '.join(m['filename'] for m, _ in docs)}\n\n"
    f"{n} scored questions. hit@k = the expected text appears in the top k chunks. "
    "Gap = closest off-topic distance minus worst answerable distance (bigger is better).\n\n"
    + table
    + "\n",
    encoding="utf-8",
)
print("\nSaved to evaluation/results.md")