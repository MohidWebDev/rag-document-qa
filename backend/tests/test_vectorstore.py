import pytest
from fakes import FakeEmbeddings
from chunker import Chunk
from vectorstore import add_chunks, count, create_store, search


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


def test_add_and_search(store):
    add_chunks(
        [
            make_chunk("d1", 0, "aaaa aaa", page=2),
            make_chunk("d1", 1, "bbbb bbb", page=3),
            make_chunk("d1", 2, "cccc ccc", page=4),
        ],
        store=store,
    )
    results = search("aaa", k=1, store=store)
    assert results[0]["text"] == "aaaa aaa"
    assert results[0]["metadata"]["filename"] == "d1.txt"
    assert results[0]["metadata"]["page"] == 2


def test_missing_page_and_section_are_skipped(store):
    add_chunks([make_chunk("d1", 0, "hello there")], store=store)
    meta = search("hello", k=1, store=store)[0]["metadata"]
    assert "page" not in meta
    assert "section" not in meta


def test_filter_by_document(store):
    add_chunks(
        [make_chunk("d1", 0, "aaa aaa"), make_chunk("d2", 0, "aaa aaaa")],
        store=store,
    )
    results = search("aaa", k=5, doc_id="d2", store=store)
    assert results
    assert all(r["metadata"]["doc_id"] == "d2" for r in results)


def test_data_survives_a_new_store_instance(tmp_path):
    path = tmp_path / "chroma"
    first = create_store(path, FakeEmbeddings())
    add_chunks([make_chunk("d1", i, f"text {i}") for i in range(3)], store=first)

    second = create_store(path, FakeEmbeddings())
    assert count(second) == 3