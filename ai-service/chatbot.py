"""Chatbot endpoint — GraphRAG-powered product consultation.

Pipeline:
1. NLP: understand intent from user query
2. Retrieve: search Neo4j Knowledge Graph (vector + cypher)
3. Generate: augmented response via OpenAI Chat API

API: POST /api/chatbot
"""

import logging
from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel

from knowledge import KnowledgeGraph
from rag import RAGPipeline

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    sources: dict
    products: list


@router.post("/api/chatbot", response_model=ChatResponse)
async def chatbot(request: Request, chat: ChatRequest):
    """POST /api/chatbot — AI chatbot tư vấn sản phẩm.

    Input: {"message": "tôi cần laptop giá rẻ", "user_id": 1}

    Pipeline:
    1. NLP hiểu intent
    2. Retrieve sản phẩm từ Neo4j (vector search + Cypher)
    3. Generate response qua OpenAI (augmented with context)

    Output: {"answer": "Bạn có thể tham khảo...", "sources": {...}, "products": [...]}
    """
    kg = request.app.state.kg

    if kg:
        rag = RAGPipeline(kg)
        result = rag.generate(
            query=chat.message,
            user_id=chat.user_id,
        )
    else:
        # Fallback when Neo4j is not available
        result = {
            "answer": (
                "Xin lỗi, hệ thống tư vấn đang khởi động. "
                "Bạn có thể thử lại sau hoặc tìm kiếm trực tiếp trên trang sản phẩm."
            ),
            "sources": {"vector_count": 0, "cypher_count": 0, "graph_count": 0},
            "products": [],
        }

    return ChatResponse(**result)
