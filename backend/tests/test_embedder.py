import pytest
from tenacity import wait_none

import embedder


class FakeEmbeddings:
    def __init__(self, fail_with=None, fail_times=0):
        self.attempts = 0
        self.batches = []
        self.fail_with = fail_with
        self.fail_times = fail_times

    def embed_documents(self, texts, task_type=None):
        self.attempts += 1
        if self.fail_times > 0:
            self.fail_times -= 1
            raise self.fail_with
        self.batches.append(list(texts))
        return [[float(len(t))] for t in texts]

    def embed_query(self, text, task_type=None):
        return [float(len(text))]


@pytest.fixture()
def no_waiting(monkeypatch):
    monkeypatch.setattr(embedder._embed_batch.retry, "wait", wait_none())


def test_batches_keep_order(monkeypatch):
    fake = FakeEmbeddings()
    monkeypatch.setattr(embedder, "get_embeddings", lambda: fake)
    monkeypatch.setattr(embedder.config, "EMBED_BATCH_SIZE", 2)

    vectors = embedder.embed_texts(["a", "bb", "ccc", "dddd", "eeeee"])

    assert [len(b) for b in fake.batches] == [2, 2, 1]
    assert vectors == [[1.0], [2.0], [3.0], [4.0], [5.0]]


def test_temporary_errors_are_retried(monkeypatch, no_waiting):
    fake = FakeEmbeddings(fail_with=RuntimeError("503 UNAVAILABLE"), fail_times=2)
    monkeypatch.setattr(embedder, "get_embeddings", lambda: fake)

    assert embedder.embed_texts(["hello"]) == [[5.0]]
    assert fake.attempts == 3


def test_other_errors_are_not_retried(monkeypatch, no_waiting):
    fake = FakeEmbeddings(fail_with=ValueError("API key not valid"), fail_times=5)
    monkeypatch.setattr(embedder, "get_embeddings", lambda: fake)

    with pytest.raises(ValueError):
        embedder.embed_texts(["hello"])
    assert fake.attempts == 1