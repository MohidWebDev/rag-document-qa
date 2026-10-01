import sys
from pathlib import Path

from parsers import DocumentParseError, parse_document

path = Path(sys.argv[1])

try:
    segments = parse_document(path)
except DocumentParseError as e:
    raise SystemExit(f"Parse error: {e}")

print(f"{len(segments)} segment(s)")
for s in segments[:8]:
    print("-", f"page={s.page}", f"section={s.section!r}", "|", len(s.text), "chars |", repr(s.text[:60]))