"""LSTM Recommendation Model — Sequence-based product prediction.

Predicts the next product a user will interact with based on their
behavior sequence (view → click → add_to_cart → purchase).

Architecture:
    Embedding → LSTM → Dense → Softmax → Product ID prediction

Combined with graph and RAG scores:
    final_score = w1 * lstm + w2 * graph + w3 * rag
"""

import logging
import os
from typing import Optional

import httpx
import numpy as np
from fastapi import APIRouter, Query, Request

logger = logging.getLogger(__name__)

router = APIRouter()

PRODUCT_SERVICE_URL = os.environ.get("PRODUCT_SERVICE_URL", "http://product-service:8000")

# ── LSTM Model (Keras) ─────────────────────────────────────────
# We build a simple LSTM model for demo purposes.
# In production, this would be trained on actual user behavior data.

_model = None
_product_ids = []


def _build_lstm_model(num_products: int, embedding_dim: int = 32, hidden_dim: int = 64):
    """Build a simple LSTM model for next-product prediction."""
    try:
        from keras.layers import LSTM, Dense, Embedding
        from keras.models import Sequential

        model = Sequential([
            Embedding(input_dim=num_products + 1, output_dim=embedding_dim),
            LSTM(hidden_dim, return_sequences=False),
            Dense(hidden_dim, activation='relu'),
            Dense(num_products, activation='softmax'),
        ])
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy'],
        )
        logger.info(f"LSTM model built: {num_products} products, {embedding_dim}d embedding")
        return model
    except Exception as e:
        logger.warning(f"Failed to build LSTM model: {e}")
        return None


def _get_lstm_predictions(user_history: list[int], top_k: int = 5) -> list[dict]:
    """Get LSTM-based predictions from user behavior sequence.

    For demo: uses random scores if model is not trained.
    In production: model.predict() on encoded sequence.
    """
    global _model, _product_ids

    if not user_history:
        return []

    if _model is not None and _product_ids:
        try:
            # Encode sequence: map product_ids to indices
            id_to_idx = {pid: idx for idx, pid in enumerate(_product_ids)}
            sequence = [id_to_idx.get(pid, 0) for pid in user_history[-10:]]

            # Pad sequence to fixed length
            max_len = 10
            if len(sequence) < max_len:
                sequence = [0] * (max_len - len(sequence)) + sequence

            x = np.array([sequence])
            scores = _model.predict(x, verbose=0)[0]

            # Get top-k predictions
            top_indices = np.argsort(scores)[-top_k:][::-1]
            results = []
            for idx in top_indices:
                if idx < len(_product_ids):
                    results.append({
                        "product_id": _product_ids[idx],
                        "lstm_score": float(scores[idx]),
                    })
            return results
        except Exception as e:
            logger.warning(f"LSTM prediction failed: {e}")

    # Fallback: return random scores for demo
    rng = np.random.default_rng(sum(user_history) if user_history else 42)
    demo_scores = rng.random(min(top_k, 10))
    return [
        {"product_id": pid, "lstm_score": float(s)}
        for pid, s in zip(user_history[:top_k], demo_scores)
    ]


# ── Hybrid Recommendation ──────────────────────────────────────

def _combine_scores(
    lstm_results: list[dict],
    graph_results: list[dict],
    w1: float = 0.4,
    w2: float = 0.4,
    w3: float = 0.2,
) -> list[int]:
    """Combine LSTM and Graph scores into final recommendation.

    final_score = w1 * lstm + w2 * graph + w3 * rag
    (RAG score is implicit from graph retrieval relevance)
    """
    scores = {}

    # LSTM scores
    for item in lstm_results:
        pid = item["product_id"]
        scores[pid] = scores.get(pid, 0) + w1 * item.get("lstm_score", 0)

    # Graph scores (normalize score to 0-1)
    max_graph = max((r.get("score", 1) for r in graph_results), default=1)
    for item in graph_results:
        pid = item["product_id"]
        normalized = item.get("score", 0) / max_graph if max_graph > 0 else 0
        scores[pid] = scores.get(pid, 0) + w2 * normalized

    # Sort by combined score
    sorted_products = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [pid for pid, _ in sorted_products]


# ── API Routes ──────────────────────────────────────────────────

@router.get("/api/recommend")
async def recommend(
    request: Request,
    user_id: int = Query(..., description="User ID for personalized recommendations"),
    limit: int = Query(5, ge=1, le=20),
):
    """GET /api/recommend?user_id=1 — Hybrid recommendation.

    Combines LSTM (behavior sequence) + Graph (product relationships).
    Returns list of recommended product IDs.
    """
    kg = request.app.state.kg

    # 1. Get graph-based recommendations from Neo4j
    graph_results = []
    if kg:
        try:
            graph_results = kg.get_graph_recommendations(user_id, limit=limit)
        except Exception as e:
            logger.warning(f"Graph recommendation failed: {e}")

    # 2. Get LSTM-based predictions (using dummy history for demo)
    # In production: fetch actual user behavior from a behavior tracking service
    user_history = [r["product_id"] for r in graph_results] if graph_results else list(range(1, 6))
    lstm_results = _get_lstm_predictions(user_history, top_k=limit)

    # 3. Combine scores: final_score = w1 * lstm + w2 * graph + w3 * rag
    recommended_ids = _combine_scores(lstm_results, graph_results)

    # If no results, fetch popular products as fallback
    if not recommended_ids:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{PRODUCT_SERVICE_URL}/api/products/",
                    params={"ordering": "-created_at", "limit": limit},
                    timeout=5,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    products = data if isinstance(data, list) else data.get("results", [])
                    recommended_ids = [p["id"] for p in products[:limit]]
        except Exception as e:
            logger.warning(f"Fallback product fetch failed: {e}")

    return {
        "user_id": user_id,
        "recommended_product_ids": recommended_ids[:limit],
        "method": "hybrid_lstm_graph",
        "components": {
            "lstm_count": len(lstm_results),
            "graph_count": len(graph_results),
        },
    }


@router.post("/api/ai/sync")
async def sync_products(request: Request):
    """POST /api/ai/sync — Sync products from product-service to Neo4j.

    Fetches all products and creates/updates nodes + relationships.
    """
    kg = request.app.state.kg
    if not kg:
        return {"error": "Neo4j not connected", "status": "failed"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{PRODUCT_SERVICE_URL}/api/products/",
                timeout=10,
            )
            if resp.status_code != 200:
                return {"error": f"Product service returned {resp.status_code}"}

            data = resp.json()
            products = data if isinstance(data, list) else data.get("results", [])

        # Sync to Neo4j
        kg.sync_products(products)
        kg.create_similarity_edges()

        # Generate embeddings for each product (if OpenAI key available)
        from rag import RAGPipeline
        rag = RAGPipeline(kg)
        embedded_count = 0
        for prod in products:
            text = f"{prod.get('name', '')} {prod.get('description', '')} {prod.get('category_name', '')}"
            embedding = rag.get_embedding(text)
            if embedding:
                kg.sync_product_embeddings(prod["id"], embedding)
                embedded_count += 1

        # Update LSTM model product list
        global _product_ids, _model
        _product_ids = [p["id"] for p in products]
        if _product_ids:
            _model = _build_lstm_model(len(_product_ids))

        return {
            "status": "success",
            "synced_products": len(products),
            "embedded_products": embedded_count,
            "lstm_model_products": len(_product_ids),
        }

    except Exception as e:
        logger.error(f"Sync failed: {e}")
        return {"error": str(e), "status": "failed"}


@router.post("/api/ai/track")
async def track_behavior(
    request: Request,
    user_id: int = Query(...),
    product_id: int = Query(...),
    action: str = Query("view", description="view|click|add_to_cart|purchase"),
):
    """POST /api/ai/track — Record user behavior in Neo4j Knowledge Graph."""
    kg = request.app.state.kg
    if not kg:
        return {"error": "Neo4j not connected"}

    try:
        kg.record_user_action(user_id, product_id, action)
        return {"status": "recorded", "user_id": user_id, "product_id": product_id, "action": action}
    except Exception as e:
        return {"error": str(e)}
