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