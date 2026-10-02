import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from config import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    UPLOAD_DIR,
)
from parsers import DocumentParseError, parse_document
from chunker import chunk_segments
from vectorstore import add_chunks, delete_chunks

load_dotenv()
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Document QA API")


@app.get("/")
def root():
    return {"message": "RAG Document QA API is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_key_loaded": bool(os.getenv("GEMINI_API_KEY")),
    }


def check_content(ext: str, content: bytes) -> str | None:
    """Return an error message if the bytes don't match the claimed file type."""
    if len(content) == 0:
        return "File is empty."
    if ext == ".pdf" and b"%PDF-" not in content[:1024]:
        return "File has a .pdf extension but is not a valid PDF."
    if ext in {".txt", ".md"} and b"\x00" in content[:8192]:
        return "File does not look like a text file."
    return None


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    original_name = Path(file.filename or "").name  # drops any folder parts
    ext = Path(original_name).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB} MB.",
        )

    problem = check_content(ext, content)
    if problem:
        raise HTTPException(status_code=400, detail=problem)

    doc_id = uuid.uuid4().hex
    saved_path = UPLOAD_DIR / f"{doc_id}{ext}"
    saved_path.write_bytes(content)

    # Try to read it now; if we can't, don't keep the file around
    try:
        segments = parse_document(saved_path)
    except DocumentParseError as e:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        logger.exception("Unexpected error while parsing %s", original_name)
        saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail="Could not read this file. It may be corrupted.",
        )

    if not segments:
        saved_path.unlink(missing_ok=True)
        detail = (
            "No extractable text found. Scanned or image-only PDFs are not supported yet."
            if ext == ".pdf"
            else "The file contains no text."
        )
        raise HTTPException(status_code=422, detail=detail)

    # Chunk, embed and store. This is slow, so it runs off the main event loop.
    chunks = chunk_segments(segments, doc_id, original_name)
    try:
        await run_in_threadpool(add_chunks, chunks)
    except Exception:
        logger.exception("Indexing failed for %s", original_name)
        try:
            await run_in_threadpool(delete_chunks, [c.chunk_id for c in chunks])
        except Exception:
            logger.exception("Cleanup of partial chunks failed for %s", doc_id)
        saved_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=502,
            detail="Could not index this document right now. Please try again in a moment.",
        )

    segment_records = [
        {
            "doc_id": doc_id,
            "filename": original_name,
            "segment_index": i,
            "page": seg.page,
            "section": seg.section,
            "text": seg.text,
        }
        for i, seg in enumerate(segments)
    ]
    (UPLOAD_DIR / f"{doc_id}.segments.json").write_text(
        json.dumps(segment_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    meta = {
        "doc_id": doc_id,
        "filename": original_name,
        "extension": ext,
        "size_bytes": len(content),
        "segment_count": len(segments),
        "chunk_count": len(chunks),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    (UPLOAD_DIR / f"{doc_id}.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )

    preview = [
        {"page": r["page"], "section": r["section"], "text": r["text"][:200]}
        for r in segment_records[:3]
    ]
    return {**meta, "preview": preview}


@app.get("/documents/{doc_id}/segments")
def get_segments(doc_id: str):
    # IDs are 32 hex characters; anything else can't be one of ours
    if not re.fullmatch(r"[0-9a-f]{32}", doc_id):
        raise HTTPException(status_code=404, detail="Document not found.")

    path = UPLOAD_DIR / f"{doc_id}.segments.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Document not found.")

    return json.loads(path.read_text(encoding="utf-8"))