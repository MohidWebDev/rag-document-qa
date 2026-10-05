from functools import partial

import pytest
from fastapi.testclient import TestClient
from langchain_core.embeddings import Embeddings

import main
from vectorstore import add_chunks, count, create_store, delete_chunks, search


class FakeEmbeddings(Embeddings):
    def _vec(self, text: str) -> list[float]:
        t = text.lower()
        return [t.count(ch) + 0.01 for ch in "abcdefghijklmnopqrstuvwxyz"]

    def embed_documents(self, texts):
        return [self._vec(t) for t in texts]

    def embed_query(self, text):
        return self._vec(text)


@pytest.fixture()
def app_client(tmp_path, monkeypatch):
    uploads = tmp_path / "uploads"
    uploads.mkdir()
    monkeypatch.setattr(main, "UPLOAD_DIR", uploads)

    store = create_store(tmp_path / "chroma", FakeEmbeddings())
    monkeypatch.setattr(main, "add_chunks", partial(add_chunks, store=store))
    monkeypatch.setattr(main, "delete_chunks", partial(delete_chunks, store=store))

    client = TestClient(main.app)
    client.store = store
    return client


def upload(client, name, content):
    return client.post("/upload", files={"file": (name, content, "application/octet-stream")})


def test_upload_search_delete_lifecycle(app_client):
    store = app_client.store
    a = upload(app_client, "a.txt", b"aaaa aaa aaaa").json()
    b = upload(app_client, "b.txt", b"bbbb bbb bbbb").json()
    assert count(store) == a["chunk_count"] + b["chunk_count"]

    top = search("aaa", k=1, store=store)[0]
    assert top["metadata"]["filename"] == "a.txt"

    assert app_client.delete(f"/documents/{a['doc_id']}").status_code == 200
    assert count(store) == b["chunk_count"]

    remaining = search("aaa", k=5, store=store)
    assert all(r["metadata"]["filename"] == "b.txt" for r in remaining)