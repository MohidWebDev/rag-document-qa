import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # Save uploads into a temp folder so tests never touch your real data/
    monkeypatch.setattr(main, "UPLOAD_DIR", tmp_path)
    return TestClient(main.app)


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