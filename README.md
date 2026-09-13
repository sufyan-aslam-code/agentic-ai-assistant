# Agentic AI Assistant: Dual-Routing LLM Architecture

A highly capable Agentic AI Assistant featuring autonomous dual-routing capabilities. This system intelligently decides whether to retrieve information from a local, memory-safe RAG pipeline or perform real-time web searches using Tavily. 

## 🚀 Architecture Highlights

* **Autonomous Routing:** Built on LangGraph state machines, the assistant dynamically toggles between querying your local Qdrant vector database (RAG) and executing live web searches (Tavily) based on the user's intent.
* **Memory-Safe Ingestion:** Features a zero-disk I/O pipeline using PyMuPDF to process raw byte streams directly from memory, ensuring high performance and thread safety.
* **Collision-Proof Vectors:** Implements robust `uuid.uuid4()` generation for mathematically safe chunk indexing, preventing vector overwrites or collisions in Qdrant during document lifecycle changes.
* **Frontend Polish:** A beautiful, responsive React/Tailwind interface featuring a ChatGPT-style multi-session sidebar, citation deduplication, and full execution state controls (AbortController) to halt AI generation mid-stream.

## 🛠️ Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/agentic-ai-assistant.git
cd agentic-ai-assistant
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
Copy `.env.example` to `.env` and add your API keys:
```env
GEMINI_API_KEY="your_gemini_api_key"
TAVILY_API_KEY="your_tavily_api_key"
QDRANT_URL="" # Leave blank for local file-based Qdrant
```
Run the backend:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup (React/Vite)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Your Agentic AI Assistant will now be running concurrently at `http://localhost:5173`!
