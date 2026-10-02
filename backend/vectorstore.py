import os
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings

import config
from chunker import Chunk
from embedder import GeminiEmbeddings

_store: Chroma | None = None


def create_store(persist_dir: Path, embeddings: Embeddings) -> Chroma:
    os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")
    return Chroma(
        collection_name=config.COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(persist_dir),
        collection_configuration={"hnsw": {"space": "cosine"}},
    )


def get_store() -> Chroma:
    """One shared store for the whole app, created on first use."""
    global _store
    if _store is None:
        _store = create_store(config.CHROMA_DIR, GeminiEmbeddings())
    return _store


def _metadata(chunk: Chunk) -> dict:
    # Chroma doesn't accept None values, so optional fields are left out
    meta = {
        "doc_id": chunk.doc_id,
        "filename": chunk.filename,
        "chunk_index": chunk.chunk_index,
        "embed_model": config.EMBED_MODEL,
    }
    if chunk.page is not None:
        meta["page"] = chunk.page
    if chunk.section is not None:
        meta["section"] = chunk.section
    return meta


def add_chunks(chunks: list[Chunk], store: Chroma | None = None) -> None:
    if not chunks:
        return
    store = store or get_store()
    store.add_texts(
        texts=[c.text for c in chunks],
        metadatas=[_metadata(c) for c in chunks],
        ids=[c.chunk_id for c in chunks],
    )


def search(
    question: str,
    k: int = 5,
    doc_id: str | None = None,
    store: Chroma | None = None,
) -> list[dict]:
    store = store or get_store()
    flt = {"doc_id": doc_id} if doc_id else None
    results = store.similarity_search_with_score(question, k=k, filter=flt)
    return [
        {"text": doc.page_content, "metadata": doc.metadata, "distance": float(score)}
        for doc, score in results
    ]


def count(store: Chroma | None = None) -> int:
    store = store or get_store()
    return len(store.get()["ids"])