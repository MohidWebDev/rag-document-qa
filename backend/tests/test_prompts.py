from prompts import NO_ANSWER, SYSTEM_PROMPT, build_messages, build_sources
from retriever import RetrievedChunk


def chunk(n, filename="a.pdf", page=None, section=None, text="some text"):
    return RetrievedChunk(
        chunk_id=f"d-{n}",
        doc_id="d",
        filename=filename,
        text=text,
        page=page,
        section=section,
        distance=0.3,
        similarity=0.7,
    )


def test_context_blocks_are_numbered_with_labels():
    messages = build_messages("What is X?", [chunk(0, page=3), chunk(1, "b.md", section="Setup")])
    user = messages[1][1]
    assert "[1] (a.pdf, page 3)" in user
    assert "[2] (b.md, section: Setup)" in user


def test_roles_and_question():
    messages = build_messages("  What is X?  ", [chunk(0)])
    assert messages[0][0] == "system"
    assert messages[1][0] == "human"
    assert messages[1][1].endswith("Question: What is X?")


def test_system_prompt_contains_the_fallback_sentence():
    assert NO_ANSWER in SYSTEM_PROMPT


def test_carriage_returns_are_removed():
    messages = build_messages("q", [chunk(0, text="line one\r\nline two")])
    assert "\r" not in messages[1][1]


def test_sources_match_numbering_and_snippets_are_short():
    sources = build_sources([chunk(0, text="word " * 100), chunk(1, page=2)])
    assert [s["number"] for s in sources] == [1, 2]
    assert len(sources[0]["snippet"]) <= 200
    assert sources[1]["page"] == 2