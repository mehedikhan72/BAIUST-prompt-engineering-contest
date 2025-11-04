import numpy as np
from functools import lru_cache
from langchain_openai import OpenAIEmbeddings
from numpy.linalg import norm
from collections import deque

MAX_CACHE_SIZE = 200  # per level
SIMILARITY_THRESHOLD = 0.95

embedding_model = OpenAIEmbeddings()
semantic_cache = {level: deque(maxlen=MAX_CACHE_SIZE) for level in ["ONE", "TWO", "THREE", "FOUR", "FIVE"]}

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two numpy vectors."""
    return np.dot(vec1, vec2) / (norm(vec1) * norm(vec2))

@lru_cache(maxsize=500)
def get_cached_embedding(prompt: str):
    """Cached embedding generation — avoids recomputing for same prompt text."""
    return np.array(embedding_model.embed_query(prompt))

async def get_cached_response(prompt: str, level: str, threshold: float = SIMILARITY_THRESHOLD):
    """
    Check if a prompt is semantically similar to a cached one for this level.
    Returns the cached response if a close enough match is found.
    """
    if level not in semantic_cache:
        return None

    query_vec = get_cached_embedding(prompt)

    for emb, _, cached_response in semantic_cache[level]:
        sim = cosine_similarity(query_vec, emb)
        if sim >= threshold:
            print(f"Cache hit (similarity={sim:.3f}) for level {level}")
            return cached_response

    return None

async def cache_response(prompt: str, response: str, level: str):
    """
    Add a new embedding-response pair to the cache for this level.
    Automatically evicts the oldest entries when max size is reached.
    """
    emb = get_cached_embedding(prompt)
    semantic_cache[level].append((emb, prompt, response))
    print(f"Cached new response for level {level} (total cached: {len(semantic_cache[level])})")
