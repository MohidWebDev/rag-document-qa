from functools import partial

import pytest
from fastapi.testclient import TestClient

import main
from fakes import FakeEmbeddings
from prompts import NO_ANSWER
from retriever import retrieve
from vectorstore import add_chunks, count, create_store, delete_chunks, search


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


@pytest.fixture()
def ask_client(app_client, monkeypatch):
    """Real retrieval over a real (temporary) Chroma; only the Gemini answer is faked."""
    calls = {"llm": 0}

    def fake_llm(messages):
        calls["llm"] += 1
        return "Found it [1]."

    monkeypatch.setattr(main, "retrieve", partial(retrieve, store=app_client.store))
    monkeypatch.setattr(main, "generate_answer", fake_llm)
    app_client.llm_calls = calls
    return app_client


def test_ask_finds_the_right_document(ask_client):
    a = upload(ask_client, "a.txt", b"aaaa aaa aaaa").json()
    upload(ask_client, "b.txt", b"bbbb bbb bbbb")

    body = ask_client.post("/ask", json={"question": "aaa"}).json()

    assert body["answered"] is True
    assert [s["filename"] for s in body["sources"]] == ["a.txt"]
    assert body["sources"][0]["doc_id"] == a["doc_id"]
    assert ask_client.llm_calls["llm"] == 1


def test_ask_off_topic_never_reaches_the_model(ask_client):
    upload(ask_client, "a.txt", b"aaaa aaa aaaa")
    upload(ask_client, "b.txt", b"bbbb bbb bbbb")

    body = ask_client.post("/ask", json={"question": "zzzz zzz"}).json()

    assert body == {"answer": NO_ANSWER, "answered": False, "sources": []}
    assert ask_client.llm_calls["llm"] == 0


def test_ask_respects_the_document_filter(ask_client):
    upload(ask_client, "a.txt", b"aaaa aaa aaaa")
    b = upload(ask_client, "b.txt", b"bbbb bbb bbbb").json()

    # The matching text lives in a.txt, but we only allow b.txt
    body = ask_client.post("/ask", json={"question": "aaa", "doc_id": b["doc_id"]}).json()

    assert body["answered"] is False
    assert ask_client.llm_calls["llm"] == 0