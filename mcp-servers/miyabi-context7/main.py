"""
Miyabi Context7 - Self-Hosted MCP Server
FastAPI + Qdrant + Local Embeddings
No external API costs!
"""

import os
import hashlib
from typing import List, Dict, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

# Configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "miyabi_docs"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # Fast, 384 dimensions
EMBEDDING_DIM = 384

# Initialize
app = FastAPI(
    title="Miyabi Context7",
    description="Self-hosted documentation retrieval MCP server",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Lazy loading for embeddings model
_model = None
_qdrant = None

def get_model():
    global _model
    if _model is None:
        print("Loading embedding model...")
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model

def get_qdrant():
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(url=QDRANT_URL)
        # Ensure collection exists
        try:
            _qdrant.get_collection(COLLECTION_NAME)
        except:
            _qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=EMBEDDING_DIM,
                    distance=Distance.COSINE
                )
            )
    return _qdrant

# Request/Response Models
class ResolveLibraryIdRequest(BaseModel):
    libraryName: str

class GetLibraryDocsRequest(BaseModel):
    context7CompatibleLibraryID: str
    topic: Optional[str] = None
    tokens: int = 5000

class IndexDocsRequest(BaseModel):
    library_id: str
    content: str
    title: Optional[str] = None

class Library(BaseModel):
    id: str
    name: str
    chunks: int

class ResolveLibraryIdResponse(BaseModel):
    query: str
    libraries: List[Library]

class GetLibraryDocsResponse(BaseModel):
    library_id: str
    topic: Optional[str]
    content: str
    chunks_returned: int
    approximate_tokens: int
    sources: List[str]

# Helper functions
def chunk_document(content: str, chunk_size: int = 500, overlap: int = 50) -> List[Dict]:
    """Split document into chunks"""
    chunks = []
    lines = content.split('\n')
    current_chunk = []
    current_size = 0
    
    for line in lines:
        line_size = len(line)
        if current_size + line_size > chunk_size and current_chunk:
            chunk_text = '\n'.join(current_chunk)
            chunks.append({
                'text': chunk_text,
                'char_count': len(chunk_text)
            })
            # Overlap
            overlap_lines = current_chunk[-2:] if len(current_chunk) > 2 else current_chunk[-1:]
            current_chunk = overlap_lines
            current_size = sum(len(l) for l in current_chunk)
        
        current_chunk.append(line)
        current_size += line_size
    
    if current_chunk:
        chunk_text = '\n'.join(current_chunk)
        chunks.append({
            'text': chunk_text,
            'char_count': len(chunk_text)
        })
    
    return chunks

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using local model"""
    model = get_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()

# API Endpoints

@app.get("/")
async def root():
    return {"status": "ok", "service": "miyabi-context7"}

@app.get("/health")
async def health():
    qdrant = get_qdrant()
    collection = qdrant.get_collection(COLLECTION_NAME)
    return {
        "status": "healthy",
        "qdrant": "connected",
        "collection": COLLECTION_NAME,
        "points": collection.points_count
    }

@app.post("/resolve-library-id", response_model=ResolveLibraryIdResponse)
async def resolve_library_id(request: ResolveLibraryIdRequest):
    """Resolve library name to ID (Context7-compatible)"""
    qdrant = get_qdrant()
    
    # Search by library_id field
    results = qdrant.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter={
            "should": [
                {"key": "library_id", "match": {"text": request.libraryName.lower()}}
            ]
        },
        limit=100,
        with_payload=True
    )
    
    # Aggregate by library_id
    library_counts = {}
    library_titles = {}
    
    for point in results[0]:
        lib_id = point.payload.get("library_id", "")
        library_counts[lib_id] = library_counts.get(lib_id, 0) + 1
        if lib_id not in library_titles:
            library_titles[lib_id] = point.payload.get("title", lib_id)
    
    # If no exact match, do semantic search
    if not library_counts:
        query_embedding = generate_embedding(request.libraryName)
        search_results = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=20
        )
        
        for result in search_results:
            lib_id = result.payload.get("library_id", "")
            library_counts[lib_id] = library_counts.get(lib_id, 0) + 1
            if lib_id not in library_titles:
                library_titles[lib_id] = result.payload.get("title", lib_id)
    
    libraries = [
        Library(id=lib_id, name=library_titles.get(lib_id, lib_id), chunks=count)
        for lib_id, count in sorted(library_counts.items(), key=lambda x: -x[1])[:10]
    ]
    
    return ResolveLibraryIdResponse(
        query=request.libraryName,
        libraries=libraries
    )

@app.post("/get-library-docs", response_model=GetLibraryDocsResponse)
async def get_library_docs(request: GetLibraryDocsRequest):
    """Get documentation for a library (Context7-compatible)"""
    qdrant = get_qdrant()
    
    if request.topic:
        # Semantic search with topic
        query_embedding = generate_embedding(request.topic)
        results = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            query_filter={
                "must": [
                    {"key": "library_id", "match": {"value": request.context7CompatibleLibraryID}}
                ]
            },
            limit=50
        )
        chunks = [r.payload for r in results]
    else:
        # Get all chunks for library
        results = qdrant.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter={
                "must": [
                    {"key": "library_id", "match": {"value": request.context7CompatibleLibraryID}}
                ]
            },
            limit=100,
            with_payload=True
        )
        chunks = [p.payload for p in results[0]]
        # Sort by chunk_index
        chunks.sort(key=lambda x: x.get("chunk_index", 0))
    
    # Collect up to token limit
    char_limit = request.tokens * 4
    collected_text = []
    total_chars = 0
    sources = set()
    
    for chunk in chunks:
        text = chunk.get("text", "")
        if total_chars + len(text) > char_limit:
            break
        collected_text.append(text)
        total_chars += len(text)
        sources.add(chunk.get("source", ""))
    
    return GetLibraryDocsResponse(
        library_id=request.context7CompatibleLibraryID,
        topic=request.topic,
        content='\n\n---\n\n'.join(collected_text),
        chunks_returned=len(collected_text),
        approximate_tokens=total_chars // 4,
        sources=list(sources)
    )

@app.post("/index-docs")
async def index_docs(request: IndexDocsRequest):
    """Index a document into the vector store"""
    qdrant = get_qdrant()
    
    # Chunk document
    chunks = chunk_document(request.content)
    
    # Generate embeddings and store
    points = []
    for i, chunk in enumerate(chunks):
        doc_id = hashlib.md5(f"{request.library_id}:{i}".encode()).hexdigest()
        embedding = generate_embedding(chunk['text'])
        
        points.append(PointStruct(
            id=doc_id,
            vector=embedding,
            payload={
                "library_id": request.library_id,
                "title": request.title or request.library_id,
                "text": chunk['text'],
                "chunk_index": i,
                "source": request.library_id
            }
        ))
    
    # Upsert to Qdrant
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )
    
    return {
        "status": "success",
        "library_id": request.library_id,
        "chunks_indexed": len(points)
    }

@app.post("/index-file")
async def index_file(
    library_id: str,
    file: UploadFile = File(...)
):
    """Index a file (txt/md) into the vector store"""
    content = await file.read()
    content = content.decode('utf-8')
    
    # Extract title from filename or first heading
    title = file.filename.replace('.txt', '').replace('.md', '')
    lines = content.split('\n')
    for line in lines[:10]:
        if line.startswith('# '):
            title = line[2:].strip()
            break
    
    request = IndexDocsRequest(
        library_id=library_id,
        content=content,
        title=title
    )
    return await index_docs(request)

# MCP-compatible endpoints
@app.get("/mcp/tools/list")
async def mcp_tools_list():
    """MCP tools/list endpoint"""
    return {
        "tools": [
            {
                "name": "resolve_library_id",
                "description": "Resolve library name to Miyabi Context7 library ID",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "libraryName": {
                            "type": "string",
                            "description": "Library name to search for"
                        }
                    },
                    "required": ["libraryName"]
                }
            },
            {
                "name": "get_library_docs",
                "description": "Get documentation for a library using semantic search",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "context7CompatibleLibraryID": {
                            "type": "string",
                            "description": "Library ID from resolve_library_id"
                        },
                        "topic": {
                            "type": "string",
                            "description": "Optional topic to focus on"
                        },
                        "tokens": {
                            "type": "integer",
                            "default": 5000,
                            "description": "Max tokens to return"
                        }
                    },
                    "required": ["context7CompatibleLibraryID"]
                }
            }
        ]
    }

@app.post("/mcp/tools/call")
async def mcp_tools_call(request: Dict[str, Any]):
    """MCP tools/call endpoint"""
    name = request.get("name")
    arguments = request.get("arguments", {})
    
    if name == "resolve_library_id":
        result = await resolve_library_id(ResolveLibraryIdRequest(**arguments))
    elif name == "get_library_docs":
        result = await get_library_docs(GetLibraryDocsRequest(**arguments))
    else:
        raise HTTPException(status_code=404, detail=f"Tool not found: {name}")
    
    return {"content": [{"type": "text", "text": result.model_dump_json()}]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
