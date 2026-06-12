import logging
import os
from typing import Optional

import chromadb
from chromadb import Collection

logger = logging.getLogger(__name__)

CHROMA_HOST = os.environ.get("CHROMA_HOST", "chromadb")
CHROMA_PORT = int(os.environ.get("CHROMA_PORT", "8000"))


class ChromaClient:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=CHROMA_HOST,
            port=CHROMA_PORT,
        )
        self._init_collections()
        logger.info("ChromaDB connected at %s:%s", CHROMA_HOST, CHROMA_PORT)

    def _init_collections(self):
        self.product_collection = self.client.get_or_create_collection(
            name="product_embeddings",
            metadata={"hnsw:space": "cosine"},
        )
        self.sequence_collection = self.client.get_or_create_collection(
            name="user_sequences",
        )
        self.interaction_collection = self.client.get_or_create_collection(
            name="user_interactions",
        )

    def sync_product_embeddings(
        self, products: list[dict], rag_pipeline, kg
    ):
        ids = []
        embeddings = []
        metadatas = []

        for prod in products:
            pid = str(prod["id"])
            text = (
                f"{prod.get('name', '')} {prod.get('description', '')} "
                f"{prod.get('category_name', '')}"
            )
            embedding = rag_pipeline.get_embedding(text)
            if not embedding:
                continue

            ids.append(pid)
            embeddings.append(embedding)
            metadatas.append({
                "name": prod.get("name", ""),
                "price": str(prod.get("price", 0)),
                "category": prod.get("category_name", ""),
            })

            kg.sync_product_embeddings(prod["id"], embedding)

        if ids:
            self.product_collection.upsert(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            logger.info("Synced %d products to ChromaDB", len(ids))

    def search_similar_products(
        self, embedding: list[float], top_k: int = 5
    ) -> list[dict]:
        results = self.product_collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
        )
        out = []
        ids = results.get("ids", [[]])[0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        for pid, dist, meta in zip(ids, distances, metadatas):
            out.append({
                "product_id": int(pid),
                "score": 1.0 - float(dist),
                "metadata": meta,
            })
        return out

    def record_user_action(
        self, user_id: int, product_id: int, action: str
    ):
        seq_id = f"seq_{user_id}"
        existing = self.sequence_collection.get(ids=[seq_id])

        if existing and existing["ids"]:
            current = existing["metadatas"][0]
            products = current.get("products", "")
            products += f",{product_id}" if products else str(product_id)
        else:
            products = str(product_id)

        self.sequence_collection.upsert(
            ids=[seq_id],
            documents=[products],
            metadatas=[{
                "user_id": str(user_id),
                "products": products,
            }],
        )

        self.interaction_collection.add(
            ids=[f"{user_id}_{product_id}_{action}_{id(self)}"],
            documents=[f"{user_id}_{product_id}_{action}"],
            metadatas=[{
                "user_id": str(user_id),
                "product_id": str(product_id),
                "action": action,
            }],
        )

        logger.info("Tracked user=%d product=%d action=%s", user_id, product_id, action)

    def get_user_sequence(self, user_id: int) -> list[int]:
        seq_id = f"seq_{user_id}"
        existing = self.sequence_collection.get(ids=[seq_id])
        if not existing or not existing["ids"]:
            return []
        products = existing["metadatas"][0].get("products", "")
        return [int(p) for p in products.split(",") if p.strip()]

    def get_all_product_ids(self) -> list[int]:
        results = self.product_collection.get()
        return [int(pid) for pid in results.get("ids", [])]
