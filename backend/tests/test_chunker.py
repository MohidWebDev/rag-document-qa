from chunker import chunk_segments, chunk_text
from parsers import Segment


def test_empty_text_gives_no_chunks():
    assert chunk_text("") == []


def test_short_text_is_one_chunk():
    assert chunk_text("Hello world.", size=800, overlap=100) == ["Hello world."]


def test_long_text_respects_size():
    text = ("This is a sentence about retrieval. " * 100).strip()
    chunks = chunk_text(text, size=300, overlap=50)
    assert len(chunks) > 1
    assert all(len(c) <= 300 for c in chunks)


def test_chunks_overlap():
    text = " ".join(f"word{i}" for i in range(500))
    chunks = chunk_text(text, size=200, overlap=40)
    start_of_second = " ".join(chunks[1].split()[:2])
    assert start_of_second in chunks[0]


def test_no_text_lost_without_overlap():
    text = " ".join(f"w{i}" for i in range(300))
    chunks = chunk_text(text, size=150, overlap=0)
    assert " ".join(chunks).split() == text.split()


def test_metadata_is_kept():
    segs = [
        Segment(text="Page one text. " * 80, page=1),
        Segment(text="Page two text.", page=2),
    ]
    chunks = chunk_segments(segs, "doc1", "a.pdf")
    assert chunks[0].page == 1
    assert chunks[-1].page == 2
    assert chunks[0].chunk_id == "doc1-0"
    assert [c.chunk_index for c in chunks] == list(range(len(chunks)))


def test_heading_only_segment_merges_into_next():
    segs = [
        Segment(text="## Intro", section="Intro"),
        Segment(text="## Details\n" + "Body text. " * 20, section="Details"),
    ]
    chunks = chunk_segments(segs, "d", "readme.md")
    assert chunks[0].text.startswith("## Intro")
    assert chunks[0].section == "Details"