from pathlib import Path

# Paths (everything lives under backend/data, which is git-ignored)
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"

# Upload rules
ALLOWED_EXTENSIONS = {".pdf", ".md", ".txt"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# Create folders if they don't exist yet
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Chunking
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
MIN_SEGMENT_CHARS = 80  # shorter Markdown segments (like lone headings) get merged into the next one

# Embeddings
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIMENSIONS = 768
EMBED_BATCH_SIZE = 50