import sys
from pathlib import Path

from chunker import chunk_segments
from parsers import DocumentParseError, parse_document

path = Path(sys.argv[1])

try:
    segments = parse_document(path)
except DocumentParseError as e:
    raise SystemExit(f"Parse error: {e}")

chunks = chunk_segments(segments, "testdoc", path.name)
print(f"{len(segments)} segment(s) -> {len(chunks)} chunk(s)")

sizes = [len(c.text) for c in chunks]
if sizes:
    print(f"chunk size: min={min(sizes)} max={max(sizes)} avg={sum(sizes) // len(sizes)}")

for c in chunks[:6]:
    print(f"- #{c.chunk_index} page={c.page} section={c.section!r} | {len(c.text)} chars | {c.text[:50]!r}")