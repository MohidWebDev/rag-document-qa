from dataclasses import dataclass

import config
from vectorstore import search


@dataclass
class RetrievedChunk:
    chunk_id: str
    doc_id: str
    filename: str
    text: str
    page: int | None
    section: str | None
    distance: float    # cosine distance: lower = more similar
    similarity: float  # 1 - distance, easier to read in a UI


def retrieve(
    question: str,
    k: int | None = None,
    doc_id: str | None = None,
    max_distance: float | None = None,
    store=None,
) -> list[RetrievedChunk]:
    """Find the chunks most relevant to a question, dropping anything too distant."""
    question = question.strip()
    if not question:
        return []

    k = k or config.RETRIEVAL_K
    if max_distance is None:
        max_distance = config.RETRIEVAL_MAX_DISTANCE

    results: list[RetrievedChunk] = []
    for hit in search(question, k=k, doc_id=doc_id, store=store):
        if hit["distance"] > max_distance:
            continue
        meta = hit["metadata"]
        results.append(
            RetrievedChunk(
                chunk_id=f"{meta['doc_id']}-{meta['chunk_index']}",
                doc_id=meta["doc_id"],
                filename=meta["filename"],
                text=hit["text"],
                page=meta.get("page"),
                section=meta.get("section"),
                distance=round(hit["distance"], 4),
                similarity=round(1 - hit["distance"], 4),
            )
        )
    return results