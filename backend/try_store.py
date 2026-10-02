import shutil
import sys
import uuid
from pathlib import Path

import config
from chunker import chunk_segments
from parsers import parse_document
from vectorstore import add_chunks, count, search

cmd = sys.argv[1]

if cmd == "add":
    path = Path(sys.argv[2])
    chunks = chunk_segments(parse_document(path), uuid.uuid4().hex, path.name)
    add_chunks(chunks)
    print(f"Stored {len(chunks)} chunk(s). Total in store: {count()}")
elif cmd == "ask":
    for r in search(sys.argv[2], k=3):
        m = r["metadata"]
        print(f"distance={r['distance']:.3f} | {m.get('filename')} | page={m.get('page')} | section={m.get('section')}")
        print("   ", " ".join(r["text"].split())[:150])
elif cmd == "count":
    print(count())
elif cmd == "reset":
    shutil.rmtree(config.CHROMA_DIR, ignore_errors=True)
    print("Vector store deleted.")