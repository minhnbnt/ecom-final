#!/usr/bin/env python3
"""
Populate image_url for all products in PostgreSQL.
Each product gets a unique, curated Unsplash photo based on its category.
Run inside the product-service container or with DB env vars set.

Usage:
    python seed_images.py
"""

import os
import psycopg2

# ── Image pools per category ─────────────────────────────────────────────────
# Each list has enough images so every product in that category looks unique.
IMAGE_POOLS: dict[str, list[str]] = {
    "Laptop": [
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
        "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80",
        "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&q=80",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80",
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80",
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80",
    ],
    "Điện thoại": [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80",
        "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80",
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80",
        "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80",
    ],
    "Tai nghe": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
        "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=800&q=80",
        "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80",
    ],
    "Đồng hồ": [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80",
        "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800&q=80",
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80",
        "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80",
        "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=800&q=80",
    ],
    "Sách": [
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80",
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    ],
    "Điều hòa": [
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
        "https://images.unsplash.com/photo-1626816740498-1fe2fccc5f11?w=800&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    "Tủ lạnh": [
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80",
        "https://images.unsplash.com/photo-1620456259900-1fcfa07ec1a6?w=800&q=80",
        "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80",
        "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=800&q=80",
    ],
    "Áo": [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
        "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80",
    ],
    "Giày": [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
        "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80",
        "https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&q=80",
    ],
    "Balo & Túi": [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
        "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&q=80",
        "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&q=80",
        "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=800&q=80",
    ],
}

FALLBACK = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
]


def main() -> None:
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "products_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )
    cur = conn.cursor()

    # Fetch all products with their category name
    cur.execute("""
        SELECT p.id, p.name, c.name AS category_name
        FROM products_product p
        JOIN products_category c ON p.category_id = c.id
        ORDER BY c.name, p.id
    """)
    products = cur.fetchall()

    updated = 0
    # track per-category index so each product in same category gets next image
    cat_index: dict[str, int] = {}

    for pid, pname, cat in products:
        pool = IMAGE_POOLS.get(cat, FALLBACK)
        idx = cat_index.get(cat, 0)
        url = pool[idx % len(pool)]
        cat_index[cat] = idx + 1

        cur.execute(
            "UPDATE products_product SET image_url = %s WHERE id = %s",
            (url, pid),
        )
        updated += 1
        print(f"  [{pid:3d}] {cat:12s} → {pname[:40]}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✅ Updated {updated} products.")


if __name__ == "__main__":
    main()
