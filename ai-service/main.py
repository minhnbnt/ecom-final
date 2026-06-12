import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from chroma_client import ChromaClient
from knowledge import KnowledgeGraph
from models import LSTMNextProduct, MLPRecommender
from recommend import router as recommend_router
from chatbot import router as chatbot_router

import os
from keras.models import load_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Service...")

    kg = None
    try:
        kg = KnowledgeGraph()
        kg.init_schema()
        app.state.kg = kg
        logger.info("Neo4j Knowledge Graph connected")
    except Exception as e:
        logger.warning(f"Neo4j connection failed: {e}")
        app.state.kg = None

    chroma = None
    try:
        chroma = ChromaClient()
        app.state.chroma = chroma
        logger.info("ChromaDB connected")
    except Exception as e:
        logger.warning(f"ChromaDB connection failed: {e}")
        app.state.chroma = None

    lstm_model = None
    lstm_path = os.path.join(MODELS_DIR, "lstm_next_product.keras")
    if os.path.exists(lstm_path):
        try:
            lstm_model = load_model(lstm_path)
            lstm_model.predict_next([0] * 10)
            logger.info("LSTM model loaded from saved_models")
        except Exception as e:
            logger.warning(f"Failed to load LSTM model: {e}")
            lstm_model = None
    else:
        logger.warning("lstm_next_product.keras not found in saved_models/")

    app.state.gru_model = lstm_model
    app.state.mlp_model = None

    yield

    if kg:
        kg.close()
        logger.info("Neo4j connection closed")


app = FastAPI(
    title="AI Service — E-Commerce",
    description="GRU Recommendation + ChromaDB + GraphRAG Chatbot",
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


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
    )
