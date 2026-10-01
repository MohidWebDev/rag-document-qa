from embedder import embed_question, embed_texts

docs = [
    "RAG combines document retrieval with text generation.",
    "Bananas are rich in potassium and grow in tropical climates.",
]
vectors = embed_texts(docs)
question = embed_question("What is RAG?")

print("document vectors:", len(vectors), "| dimension:", len(vectors[0]))
print("question dimension:", len(question))


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / ((sum(x * x for x in a) ** 0.5) * (sum(y * y for y in b) ** 0.5))


print("similarity to RAG sentence:   ", round(cosine(question, vectors[0]), 3))
print("similarity to banana sentence:", round(cosine(question, vectors[1]), 3))