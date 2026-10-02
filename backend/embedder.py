import os

from dotenv import load_dotenv
from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

import config

load_dotenv()

_embeddings: GoogleGenerativeAIEmbeddings | None = None


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """Create the client on first use, so importing this file needs no API key."""
    global _embeddings
    if _embeddings is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not found. Check backend/.env")
        _embeddings = GoogleGenerativeAIEmbeddings(
            model=config.EMBED_MODEL,
            google_api_key=api_key,
            output_dimensionality=config.EMBED_DIMENSIONS,
        )
    return _embeddings


def _is_retryable(exc: BaseException) -> bool:
    """Retry rate limits and temporary server problems, never bad keys or bad input."""
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if code in (429, 500, 502, 503, 504):
        return True
    text = str(exc)
    return any(s in text for s in ("429", "503", "UNAVAILABLE", "RESOURCE_EXHAUSTED"))


_retry = retry(
    retry=retry_if_exception(_is_retryable),
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    reraise=True,
)


@_retry
def _embed_batch(texts: list[str]) -> list[list[float]]:
    return get_embeddings().embed_documents(texts, task_type="RETRIEVAL_DOCUMENT")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed document chunks in batches, keeping the original order."""
    vectors: list[list[float]] = []
    for i in range(0, len(texts), config.EMBED_BATCH_SIZE):
        vectors.extend(_embed_batch(texts[i:i + config.EMBED_BATCH_SIZE]))
    return vectors


@_retry
def embed_question(text: str) -> list[float]:
    """Embed a user's question for searching."""
    return get_embeddings().embed_query(text, task_type="RETRIEVAL_QUERY")


class GeminiEmbeddings(Embeddings):
    """Lets LangChain (and Chroma) use our batching + retry functions."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return embed_texts(texts)

    def embed_query(self, text: str) -> list[float]:
        return embed_question(text)