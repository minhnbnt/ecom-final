import logging
import os

import httpx
from fastapi import APIRouter, Query, Request

logger = logging.getLogger(__name__)

router = APIRouter()

PRODUCT_SERVICE_URL = os.environ.get("PRODUCT_SERVICE_URL", "http://product-service:8000")


def _get_gru_predictions(
    chroma, gru_model, user_id: int, top_k: int = 5
) -> list[dict]:
    if gru_model is None:
        return []
    sequence = chroma.get_user_sequence(user_id) if chroma else []
    if not sequence:
        return []
    return gru_model.predict_next(sequence, top_k=top_k)


def _get_mlp_scores(
    chroma, mlp_model, user_id: int, product_ids: list[int], top_k: int = 5
) -> list[dict]:
    if mlp_model is None or not product_ids:
        return []
    return mlp_model.predict_scores(user_id, product_ids, top_k=top_k)


def _get_chroma_boost(
    chroma, user_id: int, candidate_ids: list[int], top_k: int = 5
) -> dict[int, float]:
    if chroma is None or not candidate_ids:
        return {}

    sequence = chroma.get_user_sequence(user_id)
    if not sequence:
        return {}

    last_products = sequence[-3:]
    if not last_products:
        return {}

    from rag import RAGPipeline
    from knowledge import KnowledgeGraph

    kg = KnowledgeGraph()
    rag = RAGPipeline(kg)
    scores: dict[int, float] = {}

    context = kg.get_product_context(last_products)
    for item in context:
        text = f"{item.get('name', '')} {item.get('description', '')} {item.get('category', '')}"
        emb = rag.get_embedding(text)
        if emb:
            similar = chroma.search_similar_products(emb, top_k=top_k)
            for s in similar:
                pid = s["product_id"]
                if pid in candidate_ids:
                    scores[pid] = max(scores.get(pid, 0), s["score"])

    kg.close()
    return scores


def _combine_scores(
    gru_results: list[dict],
    graph_results: list[dict],
    mlp_results: list[dict] | None = None,
    chroma_boost: dict[int, float] | None = None,
    w_gru: float = 0.3,
    w_graph: float = 0.3,
    w_mlp: float = 0.2,
    w_chroma: float = 0.2,
) -> list[int]:
    scores: dict[int, float] = {}

    for item in gru_results:
        pid = item["product_id"]
        scores[pid] = scores.get(pid, 0) + w_gru * item.get("lstm_score", 0)

    max_graph = max((r.get("score", 1) for r in graph_results), default=1)
    for item in graph_results:
        pid = item["product_id"]
        normalized = item.get("score", 0) / max_graph if max_graph > 0 else 0
        scores[pid] = scores.get(pid, 0) + w_graph * normalized

    if mlp_results:
        for item in mlp_results:
            pid = item["product_id"]
            scores[pid] = scores.get(pid, 0) + w_mlp * item.get("mlp_score", 0)

    if chroma_boost:
        for pid, boost in chroma_boost.items():
            scores[pid] = scores.get(pid, 0) + w_chroma * boost

    sorted_products = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [pid for pid, _ in sorted_products]


@router.get("/api/recommend")
async def recommend(
    request: Request,
    user_id: int = Query(..., description="User ID for personalized recommendations"),
    limit: int = Query(5, ge=1, le=20),
):
    kg = request.app.state.kg
    chroma = getattr(request.app.state, "chroma", None)
    gru_model = getattr(request.app.state, "gru_model", None)
    mlp_model = getattr(request.app.state, "mlp_model", None)

    graph_results = []
    if kg:
        try:
            graph_results = kg.get_graph_recommendations(user_id, limit=limit)
        except Exception as e:
            logger.warning(f"Graph recommendation failed: {e}")

    gru_results = _get_gru_predictions(chroma, gru_model, user_id, top_k=limit)

    candidate_ids = list(set(
        [r["product_id"] for r in graph_results]
        + [r["product_id"] for r in gru_results]
    ))
    mlp_results = _get_mlp_scores(chroma, mlp_model, user_id, candidate_ids, top_k=limit)

    chroma_boost = _get_chroma_boost(chroma, user_id, candidate_ids, top_k=limit)

    recommended_ids = _combine_scores(
        gru_results, graph_results, mlp_results, chroma_boost
    )

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
        "method": "hybrid_gru_mlp_chroma",
        "components": {
            "gru_count": len(gru_results),
            "graph_count": len(graph_results),
            "mlp_count": len(mlp_results),
            "chroma_count": len(chroma_boost),
        },
    }


@router.post("/api/ai/sync")
async def sync_products(request: Request):
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

        kg.sync_products(products)
        kg.create_similarity_edges()

        from rag import RAGPipeline
        rag = RAGPipeline(kg)
        embedded_count = 0
        for prod in products:
            text = (
                f"{prod.get('name', '')} {prod.get('description', '')} "
                f"{prod.get('category_name', '')}"
            )
            embedding = rag.get_embedding(text)
            if embedding:
                kg.sync_product_embeddings(prod["id"], embedding)
                embedded_count += 1

        chroma = getattr(request.app.state, "chroma", None)
        if chroma:
            chroma.sync_product_embeddings(products, rag, kg)

        num_products = len(products)
        from models import GRUNextProduct, MLPRecommender
        if num_products > 0:
            gru = GRUNextProduct(num_products)
            gru.build((None, 10))
            request.app.state.gru_model = gru

        mlp = MLPRecommender()
        mlp.build((None, 2))
        request.app.state.mlp_model = mlp

        return {
            "status": "success",
            "synced_products": num_products,
            "embedded_products": embedded_count,
            "chroma_synced": chroma is not None,
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
    kg = request.app.state.kg
    if not kg:
        return {"error": "Neo4j not connected"}

    try:
        kg.record_user_action(user_id, product_id, action)

        chroma = getattr(request.app.state, "chroma", None)
        if chroma:
            chroma.record_user_action(user_id, product_id, action)

        return {
            "status": "recorded",
            "user_id": user_id,
            "product_id": product_id,
            "action": action,
        }
    except Exception as e:
        return {"error": str(e)}
