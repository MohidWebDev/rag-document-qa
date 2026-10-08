# Chunk size and top-k experiment

Documents: sample_markdown_file.md, Document Layout & Print Test.pdf

6 scored questions. hit@k = the expected text appears in the top k chunks. Gap = closest off-topic distance minus worst answerable distance (bigger is better).

| chunk size | overlap | chunks | hit@1 | hit@3 | hit@5 | worst answerable | closest off-topic | gap |
|---|---|---|---|---|---|---|---|---|
| 300 | 37 | 23 | 4/6 | 6/6 | 6/6 | 0.326 | 0.394 | +0.067 |
| 500 | 62 | 14 | 6/6 | 6/6 | 6/6 | 0.320 | 0.463 | +0.143 |
| 800 | 100 | 12 | 6/6 | 6/6 | 6/6 | 0.353 | 0.463 | +0.110 |
| 1200 | 150 | 11 | 6/6 | 6/6 | 6/6 | 0.364 | 0.463 | +0.099 |
