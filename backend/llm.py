import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

import config
from retry_policy import gemini_retry

load_dotenv()


class _Reply:
    def __init__(self, content: str):
        self.content = content


class GeminiChat:
    """Thin wrapper over the Google SDK with automatic function calling switched off."""

    def __init__(self, client, model: str, thinking_level: str):
        self._client = client
        self._model = model
        self._thinking_level = thinking_level

    def invoke(self, messages: list[tuple[str, str]]) -> _Reply:
        system = "\n\n".join(text for role, text in messages if role == "system")
        user = "\n\n".join(text for role, text in messages if role == "human")

        # No temperature on purpose: Gemini 3 models work best at their default
        gen_config = types.GenerateContentConfig(
            system_instruction=system or None,
            thinking_config=types.ThinkingConfig(thinking_level=self._thinking_level),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )
        response = self._client.models.generate_content(
            model=self._model,
            contents=user,
            config=gen_config,
        )
        return _Reply(response.text or "")


_llm: GeminiChat | None = None


def get_llm() -> GeminiChat:
    """Create the client on first use, so importing this file needs no API key."""
    global _llm
    if _llm is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not found. Check backend/.env")
        _llm = GeminiChat(
            client=genai.Client(api_key=api_key),
            model=config.CHAT_MODEL,
            thinking_level=config.CHAT_THINKING_LEVEL,
        )
    return _llm


def _as_text(message) -> str:
    """Reply text, whether the content is a plain string or a list of content blocks."""
    content = message.content
    if isinstance(content, str):
        return content
    parts = []
    for block in content:
        if isinstance(block, str):
            parts.append(block)
        elif isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text", ""))
    return "".join(parts)


@gemini_retry
def generate_answer(messages: list[tuple[str, str]]) -> str:
    response = get_llm().invoke(messages)
    return _as_text(response).strip()