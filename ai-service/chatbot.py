"""Chatbot endpoint — MCP-powered agentic RAG with true async streaming.

Flow (per MCP spec):
  1. User sends prompt
  2. AsyncOpenAI selects & calls MCP tools  [non-streaming phase]
  3. Tool results (Neo4j data) fed back to model
  4. Model streams final answer token-by-token [async streaming phase]

API:
  POST /api/chatbot        — JSON response (awaits full answer)
  POST /api/chatbot/stream — SSE: tool_start events → token events → done event
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from mcp_tools import MCPChatbot
from rag import OPENAI_API_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL, RAGPipeline

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    sources: dict
    products: list


def _make_bot(kg) -> MCPChatbot | None:
    """Build MCPChatbot if OpenAI API key is configured."""
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-placeholder":
        return None
    return MCPChatbot(
        kg=kg,
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_API_BASE_URL,
        model=OPENAI_MODEL,
    )


@router.post("/api/chatbot", response_model=ChatResponse)
async def chatbot(request: Request, chat: ChatRequest):
    """POST /api/chatbot — standard JSON (awaits full agentic loop)."""
    kg = request.app.state.kg
    bot = _make_bot(kg) if kg else None

    if bot:
        result = await bot.run(user_message=chat.message, user_id=chat.user_id)
    elif kg:
        rag = RAGPipeline(kg)
        result = rag.generate(query=chat.message, user_id=chat.user_id)
    else:
        result = {
            "answer": "Hệ thống tư vấn đang khởi động. Vui lòng thử lại sau.",
            "sources": {},
            "products": [],
        }

    return ChatResponse(
        answer=result["answer"],
        sources=result.get("sources", {}),
        products=result.get("products", []),
    )


@router.post("/api/chatbot/stream")
async def chatbot_stream(request: Request, chat: ChatRequest):
    """POST /api/chatbot/stream — SSE streaming.

    SSE event shape:
      data: {"type": "tool_start", "tool": "search_products", "args": {...}, "done": false}
      data: {"type": "token", "token": "...", "done": false}
      data: {"type": "done", "token": "", "products": [...], "done": true}
    """
    kg = request.app.state.kg
    bot = _make_bot(kg) if kg else None

    async def generate():
        if bot:
            # Full MCP agentic streaming (AsyncOpenAI)
            async for event in bot.stream(
                user_message=chat.message, user_id=chat.user_id
            ):
                yield event
        else:
            # Fallback: classic RAG or static message
            if kg:
                rag = RAGPipeline(kg)
                context = rag.retrieve(query=chat.message, user_id=chat.user_id)
                text = rag._fallback_response(context)
                products = context.get("cypher_results", []) or context.get("vector_results", [])
            else:
                text = "Hệ thống tư vấn đang khởi động. Vui lòng thử lại sau."
                products = []

            for char in text:
                yield f"data: {json.dumps({'type': 'token', 'token': char, 'done': False})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'token': '', 'done': True, 'products': products, 'sources': {}})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
