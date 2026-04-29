"""Neo4j Knowledge Graph — sync product data and query relationships.

Graph Schema:
    Nodes: Product, Category, User
    Edges: BELONGS_TO, PURCHASED, VIEWED, SIMILAR_TO

Data flow:
    product-service → (HTTP sync) → Neo4j nodes + embeddings
"""

import logging
import os
from typing import Optional

from neo4j import GraphDatabase

logger = logging.getLogger(__name__)

NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "neo4jpass123")


class KnowledgeGraph:
    """Manages Neo4j connection and Knowledge Graph operations."""

    def __init__(self):
        self.driver = GraphDatabase.driver(
            NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)
        )

    def close(self):
        self.driver.close()

    def init_schema(self):
        """Create constraints and indexes for the Knowledge Graph."""
        with self.driver.session() as session:
            # Unique constraints
            session.run(
                "CREATE CONSTRAINT IF NOT EXISTS "
                "FOR (p:Product) REQUIRE p.product_id IS UNIQUE"
            )
            session.run(
                "CREATE CONSTRAINT IF NOT EXISTS "
                "FOR (c:Category) REQUIRE c.name IS UNIQUE"
            )
            session.run(
                "CREATE CONSTRAINT IF NOT EXISTS "
                "FOR (u:User) REQUIRE u.user_id IS UNIQUE"
            )
            # Vector index for semantic search (Neo4j 5+ with APOC)
            try:
                session.run(
                    "CREATE VECTOR INDEX product_embedding IF NOT EXISTS "
                    "FOR (p:Product) ON (p.embedding) "
                    "OPTIONS {indexConfig: {"
                    " `vector.dimensions`: 1536,"
                    " `vector.similarity_function`: 'cosine'"
                    "}}"
                )
                logger.info("Vector index created/verified")
            except Exception as e:
                logger.warning(f"Vector index creation skipped: {e}")

    def sync_products(self, products: list[dict]):
        """Sync product data from product-service into Neo4j.

        Creates/updates Product nodes with BELONGS_TO edges to Category nodes.
        """
        with self.driver.session() as session:
            for prod in products:
                session.run(
                    """
                    MERGE (c:Category {name: $category_name})
                    MERGE (p:Product {product_id: $product_id})
                    SET p.name = $name,
                        p.description = $description,
                        p.price = $price,
                        p.stock = $stock,
                        p.image_url = $image_url
                    MERGE (p)-[:BELONGS_TO]->(c)
                    """,
                    product_id=prod["id"],
                    name=prod["name"],
                    description=prod.get("description", ""),
                    price=float(prod.get("price", 0)),
                    stock=prod.get("stock", 0),
                    image_url=prod.get("image_url", ""),
                    category_name=prod.get("category_name", "Unknown"),
                )
            logger.info(f"Synced {len(products)} products to Neo4j")

    def sync_product_embeddings(self, product_id: int, embedding: list[float]):
        """Store OpenAI embedding vector on a Product node."""
        with self.driver.session() as session:
            session.run(
                "MATCH (p:Product {product_id: $pid}) SET p.embedding = $emb",
                pid=product_id,
                emb=embedding,
            )

    def record_user_action(self, user_id: int, product_id: int, action: str):
        """Record user behavior as edges: VIEWED, PURCHASED, ADDED_TO_CART."""
        edge_type = {
            "view": "VIEWED",
            "click": "VIEWED",
            "add_to_cart": "ADDED_TO_CART",
            "purchase": "PURCHASED",
        }.get(action, "VIEWED")

        with self.driver.session() as session:
            session.run(
                f"""
                MERGE (u:User {{user_id: $uid}})
                MERGE (p:Product {{product_id: $pid}})
                MERGE (u)-[:{edge_type}]->(p)
                """,
                uid=user_id,
                pid=product_id,
            )

    def create_similarity_edges(self):
        """Create SIMILAR_TO edges between products in the same category."""
        with self.driver.session() as session:
            session.run(
                """
                MATCH (p1:Product)-[:BELONGS_TO]->(c:Category)<-[:BELONGS_TO]-(p2:Product)
                WHERE p1 <> p2
                MERGE (p1)-[:SIMILAR_TO]->(p2)
                """
            )
            logger.info("SIMILAR_TO edges created based on shared categories")

    def get_graph_recommendations(self, user_id: int, limit: int = 5) -> list[dict]:
        """Get recommendations via graph traversal.

        Pattern: User -[PURCHASED|VIEWED]-> Product -[SIMILAR_TO]-> Recommendation
        """
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (u:User {user_id: $uid})-[:PURCHASED|VIEWED]->(p:Product)
                      -[:SIMILAR_TO]->(rec:Product)
                WHERE NOT (u)-[:PURCHASED]->(rec)
                RETURN DISTINCT rec.product_id AS product_id,
                       rec.name AS name,
                       rec.price AS price,
                       count(*) AS score
                ORDER BY score DESC
                LIMIT $limit
                """,
                uid=user_id,
                limit=limit,
            )
            return [dict(r) for r in result]

    def vector_search(self, query_embedding: list[float], limit: int = 5) -> list[dict]:
        """Semantic search using vector index (cosine similarity)."""
        with self.driver.session() as session:
            try:
                result = session.run(
                    """
                    CALL db.index.vector.queryNodes('product_embedding', $limit, $emb)
                    YIELD node, score
                    RETURN node.product_id AS product_id,
                           node.name AS name,
                           node.description AS description,
                           node.price AS price,
                           score
                    """,
                    emb=query_embedding,
                    limit=limit,
                )
                return [dict(r) for r in result]
            except Exception as e:
                logger.warning(f"Vector search failed: {e}")
                return []

    def get_product_context(self, product_ids: list[int]) -> list[dict]:
        """Get rich context for products including category and related products."""
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
                WHERE p.product_id IN $pids
                OPTIONAL MATCH (p)-[:SIMILAR_TO]->(sim:Product)
                RETURN p.product_id AS product_id,
                       p.name AS name,
                       p.description AS description,
                       p.price AS price,
                       c.name AS category,
                       collect(DISTINCT sim.name)[..3] AS similar_products
                """,
                pids=product_ids,
            )
            return [dict(r) for r in result]

    def cypher_search(self, query: str, limit: int = 5) -> list[dict]:
        """Text-based search using product name/description matching."""
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
                WHERE toLower(p.name) CONTAINS toLower($query)
                   OR toLower(p.description) CONTAINS toLower($query)
                   OR toLower(c.name) CONTAINS toLower($query)
                RETURN p.product_id AS product_id,
                       p.name AS name,
                       p.description AS description,
                       p.price AS price,
                       c.name AS category
                LIMIT $limit
                """,
                query=query,
                limit=limit,
            )
            return [dict(r) for r in result]
