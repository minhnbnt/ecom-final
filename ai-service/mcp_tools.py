"""MCP Tool Layer for RAG Chatbot.

Flow (per MCP spec & OpenAI function calling):
  1. User sends prompt
  2. Model decides which tool(s) to call  [non-streaming]
  3. Tools execute against Neo4j           [sync DB calls]
  4. Results returned to model
  5. Model generates final answer          [STREAMING via AsyncOpenAI]

Why AsyncOpenAI:
  This module is called from an async FastAPI endpoint / async generator.
  Using sync openai.OpenAI() would block the event loop and break SSE streaming.
  AsyncOpenAI.chat.completions.create(..., stream=True) returns an async iterable
  that yields chunks without blocking.
"""

import json
import logging
from typing import AsyncGenerator, Optional

import openai

from knowledge import KnowledgeGraph

logger = logging.getLogger(__name__)

# ── Tool Definitions (MCP Schema for OpenAI function calling) ──────────────────

MCP_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": (
                "Tìm kiếm sản phẩm trong Knowledge Graph theo từ khóa. "
                "Dùng khi người dùng hỏi về loại sản phẩm, thương hiệu, hoặc danh mục."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Từ khóa tìm kiếm"},
                    "limit": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommendations",
            "description": (
                "Lấy gợi ý sản phẩm cho người dùng dựa trên lịch sử mua hàng. "
                "Dùng khi hỏi 'gợi ý cho tôi', 'tôi nên mua gì'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer"},
                    "limit": {"type": "integer", "default": 5},
                },
                "required": ["user_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_details",
            "description": "Lấy thông tin chi tiết (danh mục, sản phẩm tương tự) theo product_id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                },
                "required": ["product_ids"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "filter_by_price",
            "description": (
                "Lọc sản phẩm theo khoảng giá. "
                "Dùng khi người dùng đề cập ngân sách: 'dưới 5 triệu', 'từ 1-3 triệu'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "default": ""},
                    "max_price": {"type": "number"},
                    "min_price": {"type": "number", "default": 0},
                    "limit": {"type": "integer", "default": 6},
                },
            },
        },
    },
]

SYSTEM_PROMPT = """Bạn là trợ lý AI tư vấn mua sắm của EcomFinal.
Nhiệm vụ: tư vấn sản phẩm, so sánh giá, gợi ý phù hợp nhu cầu người dùng.

Quy tắc quan trọng:
- LUÔN gọi tool để lấy dữ liệu thực trước khi trả lời
- Khi đề cập đến sản phẩm trong câu trả lời, LUÔN tạo markdown link theo format:
  [Tên Sản Phẩm](/product/{product_id})
  Ví dụ: [Sony WH-1000XM5](/product/17) — **7.990.000đ**
- Dùng markdown: **bold** giá tiền, bullet points cho danh sách nhiều sản phẩm
- Trả lời bằng tiếng Việt, ngắn gọn và hữu ích
- Format giá: X.XXX.XXXđ (dùng dấu chấm phân cách hàng nghìn)
- Không bịa đặt thông tin, chỉ dùng dữ liệu từ tool"""


class MCPChatbot:
    """Agentic RAG using AsyncOpenAI + OpenAI function calling as MCP tool layer.

    Uses AsyncOpenAI throughout so async generators never block the event loop.
    """

    def __init__(self, kg: KnowledgeGraph, api_key: str, base_url: str, model: str):
        self.kg = kg
        self.model = model
        # AsyncOpenAI — required for non-blocking streaming in async context
        self.client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)

    # ── Tool Executors (sync DB calls, called via loop.run_in_executor if needed) ──

    def _execute_tool(self, name: str, args: dict) -> str:
        """Execute a tool call synchronously and return JSON string."""
        try:
            if name == "search_products":
                r = self.kg.cypher_search(query=args["query"], limit=args.get("limit", 5))
                return json.dumps(r, ensure_ascii=False)

            elif name == "get_recommendations":
                r = self.kg.get_graph_recommendations(
                    user_id=args["user_id"], limit=args.get("limit", 5)
                )
                return json.dumps(r, ensure_ascii=False)

            elif name == "get_product_details":
                r = self.kg.get_product_context(product_ids=args["product_ids"])
                return json.dumps(r, ensure_ascii=False)

            elif name == "filter_by_price":
                r = self._filter_by_price(
                    query=args.get("query", ""),
                    min_price=args.get("min_price", 0),
                    max_price=args.get("max_price"),
                    limit=args.get("limit", 6),
                )
                return json.dumps(r, ensure_ascii=False)

        except Exception as e:
            logger.error(f"Tool {name} error: {e}")
            return json.dumps({"error": str(e)})

        return json.dumps([])

    def _filter_by_price(
        self,
        query: str = "",
        min_price: float = 0,
        max_price: Optional[float] = None,
        limit: int = 6,
    ) -> list[dict]:
        with self.kg.driver.session() as session:
            if max_price is not None:
                cypher = """
                MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
                WHERE p.price >= $min_price AND p.price <= $max_price
                  AND ($search_term = ''
                       OR toLower(p.name) CONTAINS toLower($search_term)
                       OR toLower(c.name) CONTAINS toLower($search_term))
                RETURN p.product_id AS product_id, p.name AS name,
                       p.price AS price, c.name AS category
                ORDER BY p.price ASC LIMIT $limit
                """
            else:
                cypher = """
                MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
                WHERE p.price >= $min_price
                  AND ($search_term = ''
                       OR toLower(p.name) CONTAINS toLower($search_term)
                       OR toLower(c.name) CONTAINS toLower($search_term))
                RETURN p.product_id AS product_id, p.name AS name,
                       p.price AS price, c.name AS category
                ORDER BY p.price ASC LIMIT $limit
                """
            result = session.run(
                cypher,
                min_price=min_price,
                max_price=max_price,
                search_term=query,
                limit=limit,
            )
            return [dict(r) for r in result]

    # ── Agentic Loop ──────────────────────────────────────────────────────────

    async def run(self, user_message: str, user_id: Optional[int] = None) -> dict:
        """Non-streaming agentic loop using AsyncOpenAI."""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        if user_id:
            messages[0]["content"] += f"\n\nUser ID: {user_id}"

        all_products: list = []

        for _ in range(5):
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=MCP_TOOLS,
                tool_choice="auto",
                temperature=0.4,
                max_tokens=800,
            )
            msg = response.choices[0].message

            if not msg.tool_calls:
                return {
                    "answer": msg.content or "",
                    "products": _dedup(all_products)[:6],
                    "sources": {"mcp_tool_calls": len(messages) // 2},
                }

            messages.append(msg)
            for tc in msg.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)
                result_str = self._execute_tool(fn_name, fn_args)
                _collect(all_products, result_str)
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": result_str})

        return {
            "answer": "Xin lỗi, không thể xử lý yêu cầu. Vui lòng thử lại.",
            "products": _dedup(all_products)[:6],
            "sources": {"mcp_tool_calls": 5},
        }

    async def stream(
        self, user_message: str, user_id: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """SSE streaming with MCP tool calls using AsyncOpenAI.

        Phase 1 (non-streaming): tool-call loop until all context is gathered.
        Phase 2 (streaming):     final answer via async for on AsyncOpenAI stream.

        SSE events:
          {"type": "tool_start", "tool": "...", "args": {...}, "done": false}
          {"type": "token",      "token": "...",               "done": false}
          {"type": "done",       "products": [...],            "done": true}
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        if user_id:
            messages[0]["content"] += f"\n\nUser ID: {user_id}"

        all_products: list = []

        # ── Phase 1: Tool-call loop (non-streaming) ───────────────────────────
        for _ in range(5):
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=MCP_TOOLS,
                tool_choice="auto",
                temperature=0.4,
                max_tokens=800,
            )
            msg = response.choices[0].message

            # No more tool calls → ready for streaming answer
            if not msg.tool_calls:
                break

            messages.append(msg)

            for tc in msg.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)
                logger.info(f"MCP tool: {fn_name}({fn_args})")

                yield f"data: {json.dumps({'type': 'tool_start', 'tool': fn_name, 'args': fn_args, 'done': False})}\n\n"

                result_str = self._execute_tool(fn_name, fn_args)
                _collect(all_products, result_str)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result_str,
                })

        # ── Phase 2: Stream final answer (AsyncOpenAI async iterator) ─────────
        # Append a final user turn telling the model to answer in plain text now
        messages.append({
            "role": "user",
            "content": "Dựa vào dữ liệu tool trên, hãy trả lời bằng tiếng Việt với markdown link cho sản phẩm. Chỉ trả lời văn bản, không gọi tool nữa.",
        })

        import re
        _tool_call_re = re.compile(r"<tool_call>.*?</tool_call>", re.DOTALL)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.4,
                max_tokens=800,
                stream=True,          # AsyncOpenAI returns async iterable
            )

            buf = ""
            async for chunk in stream:      # ← non-blocking async for
                delta = chunk.choices[0].delta
                if not (delta and delta.content):
                    continue

                buf += delta.content

                # Strip complete <tool_call>...</tool_call> blocks
                cleaned = _tool_call_re.sub("", buf)

                # If buffer might be mid-way through a <tool_call>, hold it back
                if "<tool_call>" in buf and "</tool_call>" not in buf:
                    continue   # wait for closing tag

                # Emit cleaned tokens that aren't just whitespace
                if cleaned.strip():
                    yield f"data: {json.dumps({'type': 'token', 'token': cleaned, 'done': False})}\n\n"
                buf = ""

        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            yield f"data: {json.dumps({'type': 'token', 'token': f'Lỗi: {e}', 'done': False})}\n\n"

        # ── Done ──────────────────────────────────────────────────────────────
        yield f"data: {json.dumps({'type': 'done', 'token': '', 'done': True, 'products': _dedup(all_products)[:6], 'sources': {'mcp_calls': 1}})}\n\n"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _collect(products: list, result_str: str) -> None:
    """Append products from a tool result string into the list."""
    try:
        data = json.loads(result_str)
        if isinstance(data, list):
            products.extend(data)
    except Exception:
        pass


def _dedup(products: list) -> list:
    """Deduplicate products by product_id or name."""
    seen: set = set()
    out = []
    for p in products:
        key = p.get("product_id") or p.get("name")
        if key not in seen:
            seen.add(key)
            out.append(p)
    return out
