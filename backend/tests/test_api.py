import pytest
from fastapi.testclient import TestClient

import main


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