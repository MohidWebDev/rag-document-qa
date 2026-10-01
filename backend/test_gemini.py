import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

load_dotenv()

EMBED_MODEL = "gemini-embedding-001"
CHAT_MODEL = "gemini-3.8-flash"

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise SystemExit("GEMINI_API_KEY not found. Check backend/.env")

client = genai.Client(api_key=api_key)

# We don't use tool/function calling, so switch AFC off explicitly
GENERATION_CONFIG = types.GenerateContentConfig(
    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
)

# 1) Embedding call
emb = client.models.embed_content(
    model=EMBED_MODEL,
    contents="What is retrieval-augmented generation?",
)
print(f"Embedding OK: vector length = {len(emb.embeddings[0].values)}")

# 2) LLM call, with retries for temporary overloads
for attempt in range(1, 6):
    try:
        resp = client.models.generate_content(
            model=CHAT_MODEL,
            contents="In one sentence, what is a vector database?",
            config=GENERATION_CONFIG,
        )
        print("LLM OK:", resp.text)
        break
    except errors.ServerError as e:
        wait = 2 ** attempt
        print(f"Attempt {attempt} failed ({e.code}). Retrying in {wait}s...")
        time.sleep(wait)
else:
    print("Model still unavailable after 5 attempts. Try again later.")