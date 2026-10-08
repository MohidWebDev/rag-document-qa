import pytest
import main
from fastapi.testclient import TestClient
from retriever import RetrievedChunk
from prompts import NO_ANSWER


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # Save uploads into a temp folder, and never touch the real vector store
    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    stored, deleted = [], []
    monkeypatch.setattr(main, "add_chunks", lambda chunks: stored.extend(chunks))
    monkeypatch.setattr(main, "delete_chunks", lambda ids: deleted.extend(ids))

    test_client = TestClient(main.app)
    test_client.stored = stored
    test_client.deleted = deleted
    return test_client


def upload(client, name, content):
    return client.post("/upload", files={"file": (name, content, "application/octet-stream")})


def test_upload_txt_ok(client):
    r = upload(client, "notes.txt", b"Hello world. This is a test.")
    assert r.status_code == 200
    body = r.json()
    assert body["filename"] == "notes.txt"
    assert body["segment_count"] == 1


def test_upload_markdown_splits_on_headings(client):
    md = b"# Title\nintro\n\n## Setup\nsteps\n\n```\n# not a heading\n```\n"
    r = upload(client, "readme.md", md)
    assert r.status_code == 200
    assert r.json()["segment_count"] == 2


def test_segments_roundtrip(client):
    doc_id = upload(client, "a.txt", b"some text here").json()["doc_id"]
    r = client.get(f"/documents/{doc_id}/segments")
    assert r.status_code == 200
    assert r.json()[0]["text"] == "some text here"


def test_empty_file_rejected(client):
    assert upload(client, "empty.txt", b"").status_code == 400


def test_whitespace_only_file_rejected(client):
    assert upload(client, "blank.txt", b"   \n  ").status_code == 422


def test_unsupported_extension_rejected(client):
    assert upload(client, "image.png", b"data").status_code == 400


def test_fake_pdf_rejected(client):
    assert upload(client, "fake.pdf", b"this is not a pdf").status_code == 400


def test_unknown_document_returns_404(client):
    assert client.get("/documents/abc/segments").status_code == 404
    assert client.get(f"/documents/{'0' * 32}/segments").status_code == 404


def test_upload_indexes_chunks(client):
    r = upload(client, "notes.txt", b"Hello world. This is a test.")
    assert r.status_code == 200
    assert len(client.stored) > 0
    assert r.json()["chunk_count"] == len(client.stored)


def test_failed_indexing_returns_502_and_cleans_up(client, tmp_path, monkeypatch):
    def broken(chunks):
        raise RuntimeError("embedding service down")

    monkeypatch.setattr(main, "add_chunks", broken)

    r = upload(client, "notes.txt", b"Hello world. This is a test.")
    assert r.status_code == 502
    assert list(tmp_path.iterdir()) == []  # nothing left behind


def test_list_is_empty_at_start(client):
    assert client.get("/documents").json() == []


def test_list_documents(client):
    upload(client, "a.txt", b"first document")
    upload(client, "b.txt", b"second document")
    r = client.get("/documents")
    assert r.status_code == 200
    assert sorted(d["filename"] for d in r.json()) == ["a.txt", "b.txt"]


def test_delete_document_removes_everything(client, tmp_path):
    body = upload(client, "a.txt", b"some text here").json()
    doc_id = body["doc_id"]

    r = client.delete(f"/documents/{doc_id}")

    assert r.status_code == 200
    assert len(client.deleted) == body["chunk_count"]
    assert client.deleted[0] == f"{doc_id}-0"
    assert list(tmp_path.iterdir()) == []
    assert client.get("/documents").json() == []


def test_delete_unknown_document_returns_404(client):
    assert client.delete("/documents/abc").status_code == 404
    assert client.delete(f"/documents/{'0' * 32}").status_code == 404


def test_failed_vector_delete_keeps_files(client, tmp_path, monkeypatch):
    doc_id = upload(client, "a.txt", b"some text here").json()["doc_id"]

    def broken(ids):
        raise RuntimeError("vector store down")

    monkeypatch.setattr(main, "delete_chunks", broken)

    assert client.delete(f"/documents/{doc_id}").status_code == 500
    assert (tmp_path / f"{doc_id}.json").exists()


def test_duplicate_upload_is_rejected(client):
    first = upload(client, "a.txt", b"same content")
    assert first.status_code == 200
    chunks_after_first = len(client.stored)

    second = upload(client, "copy-of-a.txt", b"same content")

    assert second.status_code == 409
    assert second.json()["detail"]["doc_id"] == first.json()["doc_id"]
    assert len(client.stored) == chunks_after_first  # nothing was indexed again
    assert len(client.get("/documents").json()) == 1


def test_same_name_different_content_is_allowed(client):
    assert upload(client, "a.txt", b"version one").status_code == 200
    assert upload(client, "a.txt", b"version two").status_code == 200


def test_can_reupload_after_delete(client):
    doc_id = upload(client, "a.txt", b"same content").json()["doc_id"]
    client.delete(f"/documents/{doc_id}")
    assert upload(client, "a.txt", b"same content").status_code == 200


def test_search_endpoint(client, monkeypatch):
    doc_id = upload(client, "a.txt", b"some text here").json()["doc_id"]

    def fake_retrieve(q, k, doc, max_distance):
        return [
            RetrievedChunk(
                chunk_id=f"{doc_id}-0", doc_id=doc_id, filename="a.txt",
                text="some text here", page=None, section=None,
                distance=0.2, similarity=0.8,
            )
        ]

    monkeypatch.setattr(main, "retrieve", fake_retrieve)
    r = client.get("/search", params={"q": "text", "doc_id": doc_id})
    assert r.status_code == 200
    assert r.json()[0]["filename"] == "a.txt"


def test_search_rejects_empty_question(client):
    assert client.get("/search", params={"q": ""}).status_code == 422


def test_search_unknown_document_returns_404(client):
    r = client.get("/search", params={"q": "x", "doc_id": "0" * 32})
    assert r.status_code == 404


def test_search_failure_returns_502(client, monkeypatch):
    def broken(q, k, doc, max_distance):
        raise RuntimeError("embedding service down")

    monkeypatch.setattr(main, "retrieve", broken)
    assert client.get("/search", params={"q": "text"}).status_code == 502


def rc(n, filename="a.txt", page=None, section=None):
    return RetrievedChunk(
        chunk_id=f"d-{n}", doc_id="d", filename=filename, text=f"text {n}",
        page=page, section=section, distance=0.3, similarity=0.7,
    )


def patch_ask(monkeypatch, chunks, answer="Answer."):
    calls = {"retrieve": [], "llm": 0}

    def fake_retrieve(q, k, doc, max_distance=None):
        calls["retrieve"].append({"q": q, "doc": doc})
        return chunks

    def fake_llm(messages):
        calls["llm"] += 1
        if isinstance(answer, Exception):
            raise answer
        return answer

    monkeypatch.setattr(main, "retrieve", fake_retrieve)
    monkeypatch.setattr(main, "generate_answer", fake_llm)
    return calls


def test_ask_returns_answer_with_only_cited_sources(client, monkeypatch):
    patch_ask(monkeypatch, [rc(0, "a.pdf", page=1), rc(1, "b.md", section="Setup")], "It is X [2].")
    r = client.post("/ask", json={"question": "What is X?"})
    body = r.json()
    assert r.status_code == 200
    assert body["answered"] is True
    assert [s["number"] for s in body["sources"]] == [2]
    assert body["sources"][0]["filename"] == "b.md"


def test_ask_without_citations_returns_all_sources(client, monkeypatch):
    patch_ask(monkeypatch, [rc(0), rc(1)], "An answer with no citations.")
    body = client.post("/ask", json={"question": "What is X?"}).json()
    assert [s["number"] for s in body["sources"]] == [1, 2]


def test_ask_with_no_relevant_chunks_skips_the_model(client, monkeypatch):
    calls = patch_ask(monkeypatch, [])
    body = client.post("/ask", json={"question": "What is X?"}).json()
    assert body == {"answer": NO_ANSWER, "answered": False, "sources": []}
    assert calls["llm"] == 0


def test_ask_when_model_says_not_found(client, monkeypatch):
    patch_ask(monkeypatch, [rc(0)], NO_ANSWER)
    body = client.post("/ask", json={"question": "What is X?"}).json()
    assert body["answered"] is False
    assert body["sources"] == []


def test_ask_rejects_blank_question(client):
    assert client.post("/ask", json={"question": "   "}).status_code == 422


def test_ask_unknown_document_returns_404(client):
    r = client.post("/ask", json={"question": "What is X?", "doc_id": "0" * 32})
    assert r.status_code == 404


def test_ask_model_failure_returns_502(client, monkeypatch):
    patch_ask(monkeypatch, [rc(0)], RuntimeError("model down"))
    assert client.post("/ask", json={"question": "What is X?"}).status_code == 502


def test_ask_passes_the_document_filter(client, monkeypatch):
    doc_id = upload(client, "a.txt", b"some text here").json()["doc_id"]
    calls = patch_ask(monkeypatch, [rc(0)])
    client.post("/ask", json={"question": "What is X?", "doc_id": doc_id})
    assert calls["retrieve"][0]["doc"] == doc_id