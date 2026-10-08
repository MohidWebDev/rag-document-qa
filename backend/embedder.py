import os
import config

from dotenv import load_dotenv
from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from retry_policy import gemini_retry


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


@gemini_retry
def _embed_batch(texts: list[str]) -> list[list[float]]:
    return get_embeddings().embed_documents(texts, task_type="RETRIEVAL_DOCUMENT")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed document chunks in batches, keeping the original order."""
    vectors: list[list[float]] = []
    for i in range(0, len(texts), config.EMBED_BATCH_SIZE):
        vectors.extend(_embed_batch(texts[i:i + config.EMBED_BATCH_SIZE]))
    return vectors


@gemini_retry
def embed_question(text: str) -> list[float]:
    """Embed a user's question for searching."""
    return get_embeddings().embed_query(text, task_type="RETRIEVAL_QUERY")


class GeminiEmbeddings(Embeddings):
    """Lets LangChain (and Chroma) use our batching + retry functions."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return embed_texts(texts)

    def embed_query(self, text: str) -> list[float]:
        return embed_question(text)