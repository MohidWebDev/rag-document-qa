from langchain_core.embeddings import Embeddings


class FakeEmbeddings(Embeddings):
    """Deterministic stand-in for Gemini: a text's vector is its letter counts."""

    def _vec(self, text: str) -> list[float]:
        t = text.lower()
        return [t.count(ch) + 0.01 for ch in "abcdefghijklmnopqrstuvwxyz"]

    def embed_documents(self, texts):
        return [self._vec(t) for t in texts]

    def embed_query(self, text):
        return self._vec(text)