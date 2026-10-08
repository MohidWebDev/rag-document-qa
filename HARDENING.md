# Hardening checklist

Known limitations to fix after the core project works end to end.

## Uploads and validation

- [ ] Uploads are read fully into memory before the size check
- [ ] File type is checked by extension and first bytes only
- [ ] UTF-16 text files are rejected
- [ ] Parsing runs inside the async upload route and blocks the event loop
- [ ] Unexpected parse errors show only a generic message to the user

## Parsing

- [ ] Scanned PDFs have no OCR
- [ ] Multi-column layouts and tables can come out jumbled; repeating headers and footers end up in every page
- [ ] PDF `page` is the page position, not the printed page label
- [ ] PDF text contains stray `\r` characters and ligatures (for example "ﬁ"); normalize the text
- [ ] Markdown sections use only the nearest heading, not the full heading path

## Chunking

- [ ] Chunk size counts characters, not tokens
- [ ] Overlap does not cross page or section boundaries
- [ ] Default separators do not split on sentence ends
- [ ] Tables and code blocks can be cut in the middle

## Embeddings

- [ ] Changing the model or the 768 dimensions means re-embedding everything
- [ ] Free-tier rate limits can slow large uploads
- [ ] Indexing happens inside the upload request; use background jobs with a status
- [ ] Question embeddings are not cached

## Vector store and deployment

- [ ] Chroma local mode supports a single process only: run one worker
- [ ] All documents share one collection (no per-user isolation)
- [ ] The cosine setting is fixed for the collection
- [ ] `count()` loads every record
- [ ] Deployment needs a persistent disk for `data/`
- [ ] Python 3.11 is required (Chroma crashes on Python 3.13 on Windows): document in the README and any Dockerfile

## API and security

- [ ] No authentication: anyone can read or delete any document
- [ ] Parsed-segments JSON files duplicate text that is also in Chroma
- [ ] Listing and the duplicate check read every metadata file
- [ ] Delete is not atomic across Chroma and the files
- [ ] Duplicate check has no locking; only byte-identical files are caught; older documents have no hash

## Project hygiene

- [ ] Remove helper scripts (`try_parsers.py`, `try_embedder.py`, `try_store.py`, `test_gemini.py`)
- [ ] Split test-only packages (`pytest`, `httpx2`) into a separate requirements file
- [ ] Add an automated PDF test with a small sample PDF
- [ ] Write the README (architecture, setup, evaluation results)

Under Chunking: - [ ] Very short chunks (for example page footers) can rank highly for vague questions; merge or filter them
Under Vector store and deployment: - [ ] The retrieval cutoff (0.42) was tuned on 2 documents and 3 questions; re-tune with a larger evaluation set
Under API and security: - [ ] The /search debug endpoint is open to anyone; remove or protect it
Under Project hygiene: - [ ] FakeEmbeddings is copy-pasted in several test files; move it to a shared conftest.py
