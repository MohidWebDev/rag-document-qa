import re
from dataclasses import dataclass
from pathlib import Path
from pypdf import PdfReader
from pypdf.errors import PdfReadError


@dataclass
class Segment:
    """A piece of a document, with where it came from."""
    text: str
    page: int | None = None      # used for PDFs
    section: str | None = None   # used for Markdown headings


def read_text(path: Path) -> str:
    """Read a text file, tolerating the common Windows encodings."""
    raw = path.read_bytes()
    try:
        return raw.decode("utf-8-sig")  # handles UTF-8 with or without BOM
    except UnicodeDecodeError:
        return raw.decode("cp1252", errors="replace")


def parse_txt(path: Path) -> list[Segment]:
    text = read_text(path).strip()
    if not text:
        return []
    return [Segment(text=text)]


HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")


def parse_markdown(path: Path) -> list[Segment]:
    """Split a Markdown file into one segment per heading section."""
    segments: list[Segment] = []
    current_section: str | None = None
    buffer: list[str] = []
    in_code_fence = False

    def flush():
        text = "\n".join(buffer).strip()
        if text:
            segments.append(Segment(text=text, section=current_section))
        buffer.clear()

    for line in read_text(path).splitlines():
        # Lines starting with ``` toggle a code block; "#" inside one isn't a heading
        if line.strip().startswith("```"):
            in_code_fence = not in_code_fence

        match = None if in_code_fence else HEADING_RE.match(line)
        if match:
            flush()
            current_section = match.group(2)

        buffer.append(line)

    flush()
    return segments


class DocumentParseError(Exception):
    """Raised when a file can't be parsed into text."""


def parse_pdf(path: Path) -> list[Segment]:
    """One segment per page, keeping the page number for citations."""
    try:
        reader = PdfReader(path)

        if reader.is_encrypted and not reader.decrypt(""):
            raise DocumentParseError("PDF is password-protected.")

        segments: list[Segment] = []
        for page_number, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                segments.append(Segment(text=text, page=page_number))
        return segments

    except PdfReadError as e:
        raise DocumentParseError(f"Could not read PDF: {e}") from e


def parse_document(path: Path) -> list[Segment]:
    """Pick the right parser based on the file extension."""
    ext = path.suffix.lower()
    if ext == ".pdf":
        return parse_pdf(path)
    if ext == ".md":
        return parse_markdown(path)
    if ext == ".txt":
        return parse_txt(path)
    raise DocumentParseError(f"Unsupported file type: {ext}")