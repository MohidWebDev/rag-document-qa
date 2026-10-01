from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import CHUNK_OVERLAP, CHUNK_SIZE, MIN_SEGMENT_CHARS
from parsers import Segment


@dataclass
class Chunk:
    chunk_id: str          # e.g. "<doc_id>-3"
    doc_id: str
    filename: str
    chunk_index: int
    text: str
    page: int | None
    section: str | None


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text with LangChain's recursive splitter (paragraphs, then lines, then words)."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=size, chunk_overlap=overlap)
    return splitter.split_text(text)


def _merge_tiny_segments(segments: list[Segment]) -> list[Segment]:
    """Fold very short Markdown segments (e.g. a heading with no body) into the next one."""
    merged: list[Segment] = []
    carry = ""
    for i, seg in enumerate(segments):
        text = f"{carry}\n\n{seg.text}" if carry else seg.text
        is_last = i == len(segments) - 1
        if len(seg.text) < MIN_SEGMENT_CHARS and seg.page is None and not is_last:
            carry = text
            continue
        carry = ""
        merged.append(Segment(text=text, page=seg.page, section=seg.section))
    return merged


def chunk_segments(
    segments: list[Segment],
    doc_id: str,
    filename: str,
    size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[Chunk]:
    chunks: list[Chunk] = []
    index = 0
    for seg in _merge_tiny_segments(segments):
        for text in chunk_text(seg.text, size, overlap):
            chunks.append(
                Chunk(
                    chunk_id=f"{doc_id}-{index}",
                    doc_id=doc_id,
                    filename=filename,
                    chunk_index=index,
                    text=text,
                    page=seg.page,
                    section=seg.section,
                )
            )
            index += 1
    return chunks