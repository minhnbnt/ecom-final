"""AI Service — FastAPI entry point.

Mounts:
- /api/recommend — LSTM-based product recommendation
- /api/chatbot  — GraphRAG chatbot (Neo4j + OpenAI)
- /api/ai/sync  — Sync product data to Neo4j Knowledge Graph
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from knowledge import KnowledgeGraph
from recommend import router as recommend_router
from chatbot import router as chatbot_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to Neo4j and initialize schema."""
    logger.info("Starting AI Service...")
    try:
        kg = KnowledgeGraph()
        kg.init_schema()
        app.state.kg = kg
        logger.info("Neo4j Knowledge Graph connected and schema initialized")
    except Exception as e:
        logger.warning(f"Neo4j connection failed (will retry on request): {e}")
        app.state.kg = None

    yield

    # Shutdown: close Neo4j driver
    if hasattr(app.state, 'kg') and app.state.kg:
        app.state.kg.close()
        logger.info("Neo4j connection closed")


app = FastAPI(
    title="AI Service — E-Commerce",
    description="LSTM Recommendation + GraphRAG Chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend_router)
app.include_router(chatbot_router)


@app.get("/api/ai/health")
async def health():
    return {"status": "ok", "service": "ai-service"}
