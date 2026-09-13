from dotenv import load_dotenv
load_dotenv()

"""RAG pipeline – document parsing, chunking, embedding, and vector storage."""

import uuid
from datetime import datetime, timezone

import pymupdf
from google import genai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams, Filter, FieldCondition, MatchValue

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
COLLECTION_NAME = "documents_v2"
EMBEDDING_MODEL = "gemini-embedding-2"
VECTOR_SIZE = 3072  # gemini-embedding-2 output dimension
CHUNK_SIZE = 600   # target characters per chunk
CHUNK_OVERLAP = 100

# ---------------------------------------------------------------------------
# Singleton clients (initialised once on import)
# ---------------------------------------------------------------------------
qdrant = QdrantClient(path="./qdrant_data", prefer_grpc=True)
gemini = genai.Client()

# Ensure the collection exists
_existing = [c.name for c in qdrant.get_collections().collections]
if COLLECTION_NAME not in _existing:
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
    )

# In-memory document registry (lightweight; survives per-process only)
_document_registry: list[dict] = []


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_bytes: bytes) -> list[dict]:
    """Return a list of ``{page: int, text: str}`` dicts from a PDF."""
    doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    pages = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        if text.strip():
            pages.append({"page": page_num + 1, "text": text})
    doc.close()
    return pages


def extract_text_from_txt(file_bytes: bytes) -> list[dict]:
    """Treat the entire TXT file as a single 'page'."""
    text = file_bytes.decode("utf-8", errors="replace")
    return [{"page": 1, "text": text}] if text.strip() else []


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split *text* into overlapping chunks of roughly *chunk_size* characters."""
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start += chunk_size - overlap
    return chunks


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of text chunks via Gemini."""
    result = gemini.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
    )
    return [e.values for e in result.embeddings]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def process_document(filename: str, file_bytes: bytes) -> dict:
    """Parse, chunk, embed, and upsert a document into Qdrant.

    Returns metadata dict with document_id, filename, page_count, chunk_count.
    """
    # 1. Extract pages -------------------------------------------------------
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        pages = extract_text_from_pdf(file_bytes)
    elif ext == "txt":
        pages = extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")

    if not pages:
        raise ValueError("No text could be extracted from the file.")

    # 2. Chunk all pages -----------------------------------------------------
    document_id = uuid.uuid4().hex
    chunk_records: list[dict] = []

    for page_info in pages:
        page_chunks = chunk_text(page_info["text"])
        for idx, chunk in enumerate(page_chunks):
            chunk_records.append({
                "document_id": document_id,
                "filename": filename,
                "page": page_info["page"],
                "chunk_id": f"{document_id}_{page_info['page']}_{idx}",
                "text": chunk,
            })

    # 3. Embed all chunks ----------------------------------------------------
    texts = [c["text"] for c in chunk_records]
    embeddings = embed_texts(texts)

    # 4. Upsert into Qdrant -------------------------------------------------
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=emb,
            payload={
                "document_id": cr["document_id"],
                "filename": cr["filename"],
                "page": cr["page"],
                "chunk_id": cr["chunk_id"],
                "text": cr["text"],
            },
        )
        for cr, emb in zip(chunk_records, embeddings)
    ]
    qdrant.upsert(collection_name=COLLECTION_NAME, points=points)

    # 5. Register document ---------------------------------------------------
    doc_meta = {
        "document_id": document_id,
        "filename": filename,
        "page_count": len(pages),
        "chunk_count": len(chunk_records),
        "status": "indexed",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    _document_registry.append(doc_meta)
    return doc_meta


def list_documents() -> list[dict]:
    """Return all unique documents stored in the vector database."""
    try:
        records, _ = qdrant.scroll(
            collection_name=COLLECTION_NAME,
            limit=10000,
            with_payload=True,
            with_vectors=False
        )
    except Exception:
        return []
        
    docs = {}
    for record in records:
        payload = record.payload or {}
        doc_id = payload.get("document_id")
        if not doc_id:
            continue
            
        if doc_id not in docs:
            docs[doc_id] = {
                "document_id": doc_id,
                "filename": payload.get("filename", "Unknown"),
                "pages": set(),
                "chunk_count": 0,
                "status": "indexed"
            }
            
        docs[doc_id]["chunk_count"] += 1
        if "page" in payload:
            docs[doc_id]["pages"].add(payload["page"])
            
    result = []
    for doc in docs.values():
        doc["page_count"] = len(doc["pages"])
        del doc["pages"]
        result.append(doc)
        
    return result


def retrieve_context(query_text: str, top_k: int = 5, filename_filter: str | None = None) -> list[dict]:
    """Embed the query and perform a vector search to find relevant context."""
    # 1. Embed query
    result = gemini.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=[query_text],
    )
    query_vector = result.embeddings[0].values

    # 2. Build filter
    query_filter = None
    if filename_filter:
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="filename",
                    match=MatchValue(value=filename_filter)
                )
            ]
        )

    # 3. Search Qdrant
    search_result = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=query_filter,
        limit=top_k,
    ).points

    # 4. Filter by score and sort
    threshold = 0.45
    filtered_points = [hit for hit in search_result if hit.score >= threshold]
    filtered_points.sort(key=lambda x: x.score, reverse=True)

    # 5. Extract and return payloads
    return [hit.payload for hit in filtered_points]


def delete_document(document_id: str) -> bool:
    """Delete a document and all its chunks from Qdrant by document_id."""
    try:
        qdrant.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
        )
        return True
    except Exception:
        return False



