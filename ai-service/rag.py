"""GraphRAG Pipeline — Retrieve + Augment + Generate.

Combines:
1. Neo4j Vector Search (semantic similarity via OpenAI embeddings)
2. Neo4j Cypher Traversal (structured graph queries)
3. OpenAI Chat API (augmented generation)

Architecture (MCP pattern):
    User Query → Embedding → Neo4j (vector + cypher) → Context → OpenAI → Response
"""

import logging
import os
from typing import Optional

import openai

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_API_BASE_URL = os.environ.get("OPENAI_API_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


class RAGPipeline:
    """GraphRAG pipeline using Neo4j as knowledge source and OpenAI as generator."""

    def __init__(self, knowledge_graph):
        self.kg = knowledge_graph
        self.model = OPENAI_MODEL
        self.client = openai.OpenAI(
            api_key=OPENAI_API_KEY,
            base_url=OPENAI_API_BASE_URL,
        ) if OPENAI_API_KEY and OPENAI_API_KEY != "sk-placeholder" else None

    def get_embedding(self, text: str) -> list[float]:
        """Get OpenAI embedding for a text query."""
        if not self.client:
            return []

        try:
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            logger.warning(f"Embedding failed: {e}")
            return []

    def retrieve(self, query: str, user_id: Optional[int] = None) -> dict:
        """Retrieve relevant context from Neo4j Knowledge Graph.

        Combines:
        - Vector search (semantic similarity)
        - Cypher text search (structured matching)
        - Graph-based recommendations (if user_id provided)
        """
        context = {
            "vector_results": [],
            "cypher_results": [],
            "graph_recommendations": [],
        }

        # 1. Vector search via embeddings
        embedding = self.get_embedding(query)
        if embedding:
            context["vector_results"] = self.kg.vector_search(embedding, limit=5)

        # 2. Cypher text search (fallback / complement)
        context["cypher_results"] = self.kg.cypher_search(query, limit=5)

        # 3. Graph-based recommendations
        if user_id:
            context["graph_recommendations"] = self.kg.get_graph_recommendations(
                user_id, limit=5
            )

        return context

    def build_prompt(self, query: str, context: dict) -> str:
        """Build augmented prompt with retrieved context."""
        prompt_parts = [
            "Bạn là trợ lý AI tư vấn sản phẩm cho cửa hàng e-commerce.",
            "Dựa trên thông tin sản phẩm bên dưới, hãy trả lời câu hỏi của khách hàng.",
            "Nếu không có thông tin phù hợp, hãy nói rõ và gợi ý khách tìm kiếm thêm.",
            "",
        ]

        # Add vector search results
        if context.get("vector_results"):
            prompt_parts.append("=== Sản phẩm liên quan (semantic search) ===")
            for item in context["vector_results"]:
                prompt_parts.append(
                    f"- {item.get('name', 'N/A')} — {item.get('price', 'N/A')}đ "
                    f"— {item.get('description', '')[:100]}"
                )
            prompt_parts.append("")

        # Add cypher search results
        if context.get("cypher_results"):
            prompt_parts.append("=== Sản phẩm tìm thấy (text search) ===")
            for item in context["cypher_results"]:
                prompt_parts.append(
                    f"- {item.get('name', 'N/A')} [{item.get('category', 'N/A')}] "
                    f"— {item.get('price', 'N/A')}đ"
                )
            prompt_parts.append("")

        # Add graph recommendations
        if context.get("graph_recommendations"):
            prompt_parts.append("=== Gợi ý dựa trên hành vi (graph) ===")
            for item in context["graph_recommendations"]:
                prompt_parts.append(
                    f"- {item.get('name', 'N/A')} — {item.get('price', 'N/A')}đ "
                    f"(score: {item.get('score', 0)})"
                )
            prompt_parts.append("")

        prompt_parts.append(f"Câu hỏi: {query}")
        return "\n".join(prompt_parts)

    def generate(self, query: str, user_id: Optional[int] = None) -> dict:
        """Full RAG pipeline: Retrieve → Augment → Generate.

        Returns response with sources for transparency.
        """
        # 1. Retrieve context from Neo4j
        context = self.retrieve(query, user_id)

        # 2. Build augmented prompt
        prompt = self.build_prompt(query, context)

        # 3. Generate response via OpenAI
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "Bạn là trợ lý AI tư vấn sản phẩm e-commerce. "
                                "Trả lời bằng tiếng Việt, ngắn gọn, hữu ích. "
                                "Luôn dựa trên dữ liệu sản phẩm được cung cấp."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.7,
                    max_tokens=500,
                )
                answer = response.choices[0].message.content
            except Exception as e:
                logger.error(f"OpenAI generation failed: {e}")
                answer = self._fallback_response(context)
        else:
            # Fallback without OpenAI API key
            answer = self._fallback_response(context)

        return {
            "answer": answer,
            "sources": {
                "vector_count": len(context.get("vector_results", [])),
                "cypher_count": len(context.get("cypher_results", [])),
                "graph_count": len(context.get("graph_recommendations", [])),
            },
            "products": (
                context.get("cypher_results", [])
                or context.get("vector_results", [])
            ),
        }

    def _fallback_response(self, context: dict) -> str:
        """Generate a simple response without OpenAI."""
        products = context.get("cypher_results", []) or context.get("vector_results", [])
        if not products:
            return "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp. Bạn có thể mô tả chi tiết hơn không?"

        lines = ["Dựa trên tìm kiếm, đây là các sản phẩm phù hợp:"]
        for p in products[:3]:
            lines.append(f"• {p.get('name', 'N/A')} — Giá: {p.get('price', 'N/A')}đ")

        recs = context.get("graph_recommendations", [])
        if recs:
            lines.append("\nCó thể bạn cũng thích:")
            for r in recs[:2]:
                lines.append(f"• {r.get('name', 'N/A')} — Giá: {r.get('price', 'N/A')}đ")

        return "\n".join(lines)
