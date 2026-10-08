from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential


def is_retryable(exc: BaseException) -> bool:
    """Retry rate limits and temporary server problems, never bad keys or bad input."""
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if code in (429, 500, 502, 503, 504):
        return True
    text = str(exc)
    return any(s in text for s in ("429", "503", "UNAVAILABLE", "RESOURCE_EXHAUSTED"))


gemini_retry = retry(
    retry=retry_if_exception(is_retryable),
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    reraise=True,
)