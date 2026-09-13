from dotenv import load_dotenv
load_dotenv()

"""Agentic AI Assistant – Backend API."""

import os

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from rag import process_document, list_documents, retrieve_context, delete_document
from agent import app_graph

app = FastAPI(
    title="Agentic AI Assistant",
    description="Backend API for the Agentic AI Assistant",
    version="0.1.0",
)

# Allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the LLM for title generation
title_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    """Incoming chat message."""
    message: str
    filename_filter: str | None = None


class TitleRequest(BaseModel):
    """Request to generate a chat title."""
    message: str


class ChatResponse(BaseModel):
    """Outgoing chat response."""
    response: str
    sources: list[dict] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Return service health status."""
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Retrieval-Augmented Generation using LangGraph."""
    
    # Initialize the graph state with the user's message
    initial_state = {
        "messages": [HumanMessage(content=request.message)],
        "sources": []
    }
    
    # Invoke the LangGraph app
    try:
        result = app_graph.invoke(initial_state)
    except Exception as e:
        error_msg = str(e)
        if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
            return ChatResponse(
                response="API rate limit exceeded. You are using the free tier of the Google Gemini API which is limited to 15 requests per minute. Please wait a minute and try again.",
                sources=[]
            )
        return ChatResponse(
            response=f"An error occurred during generation: {error_msg}",
            sources=[]
        )
    
    # Extract response and sources
    final_message_content = result["messages"][-1].content
    if isinstance(final_message_content, list):
        texts = []
        for block in final_message_content:
            if isinstance(block, str):
                texts.append(block)
            elif isinstance(block, dict) and "text" in block:
                texts.append(block["text"])
        final_message = "".join(texts)
    else:
        final_message = str(final_message_content)
        
    sources = result["sources"]
    
    return ChatResponse(
        response=final_message,
        sources=sources
    )


@app.post("/api/chat/title")
async def generate_title(request: TitleRequest):
    """Generate a concise title for the chat session."""
    system_prompt = "Summarize the user's initial query into a concise 3 to 5 word title. Return ONLY the plain text title with no quotes, markdown, or punctuation."
    
    try:
        response = title_llm.invoke(f"{system_prompt}\n\nQuery: {request.message}")
        title = response.content.strip().strip('"').strip("'")
        return {"title": title}
    except Exception:
        return {"title": "New Chat"}


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Receive a PDF or TXT file, process it through the RAG pipeline."""
    contents = await file.read()
    try:
        meta = process_document(filename=file.filename, file_bytes=contents)
    except ValueError as exc:
        return {"error": str(exc)}
    return meta


@app.get("/api/documents")
async def get_documents():
    """Return all indexed documents."""
    return list_documents()


@app.delete("/api/documents/{document_id}")
async def delete_document_endpoint(document_id: str):
    """Delete an indexed document by ID."""
    success = delete_document(document_id)
    if success:
        return {"status": "success"}
    return {"error": "Failed to delete document"}
