import pytest
from langchain_core.embeddings import Embeddings

from chunker import Chunk
from retriever import retrieve
from vectorstore import add_chunks, create_store


class FakeEmbeddings(Embeddings):
    def _vec(self, text: str) -> list[float]:
        t = text.lower()
        return [t.count(ch) + 0.01 for ch in "abcdefghijklmnopqrstuvwxyz"]

    def embed_documents(self, texts):
        return [self._vec(t) for t in texts]

    def embed_query(self, text):
        return self._vec(text)


def make_chunk(doc_id, index, text, page=None, section=None):
    return Chunk(
        chunk_id=f"{doc_id}-{index}",
        doc_id=doc_id,
        filename=f"{doc_id}.txt",
        chunk_index=index,
        text=text,
        page=page,
        section=section,
    )


@pytest.fixture()
def store(tmp_path):
    return create_store(tmp_path / "chroma", FakeEmbeddings())


def test_closest_chunk_first_with_metadata(store):
    add_chunks(
        [make_chunk("d1", 0, "aaaa aaa", page=2), make_chunk("d1", 1, "bbbb bbb", page=3)],
        store=store,
    )
    results = retrieve("aaa", k=2, max_distance=2.0, store=store)
    assert results[0].text == "aaaa aaa"
    assert results[0].page == 2
    assert results[0].chunk_id == "d1-0"
    assert results[0].distance <= results[1].distance


def test_cutoff_removes_distant_chunks(store):
    add_chunks([make_chunk("d1", 0, "aaaa aaa"), make_chunk("d1", 1, "zzzz zzz")], store=store)
    results = retrieve("aaa", k=5, max_distance=0.2, store=store)
    assert [r.text for r in results] == ["aaaa aaa"]


def test_filter_by_document(store):
    add_chunks([make_chunk("d1", 0, "aaa aaa"), make_chunk("d2", 0, "aaa aaaa")], store=store)
    results = retrieve("aaa", k=5, doc_id="d2", max_distance=2.0, store=store)
    assert results
    assert all(r.doc_id == "d2" for r in results)


def test_empty_question_returns_nothing(store):
    assert retrieve("   ", store=store) == []