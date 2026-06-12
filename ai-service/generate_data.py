"""
Generate synthetic training data for GRU and MLP recommendation models.

Outputs CSV files in the data/ directory:
  - gru_sequences.csv  : user session sequences for next-product prediction
  - mlp_pairs.csv      : (user_id, product_id, label) for preference scoring
  - products.csv       : product catalog reference

Run anywhere (only needs numpy, no TensorFlow required).

  python generate_data.py
"""

import csv
import json
import os
import random
from collections import defaultdict

random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

PRODUCTS = [
    {"id": 1,  "name": "Clean Code",                       "category": "Sách",       "price": 450000},
    {"id": 2,  "name": "Design Patterns",                  "category": "Sách",       "price": 520000},
    {"id": 3,  "name": "Nhập môn Machine Learning",        "category": "Sách",       "price": 380000},
    {"id": 4,  "name": "Atomic Habits",                    "category": "Sách",       "price": 195000},
    {"id": 5,  "name": 'MacBook Pro 16" M4 Pro',           "category": "Laptop",     "price": 62990000},
    {"id": 6,  "name": "Dell XPS 15 9530",                 "category": "Laptop",     "price": 42990000},
    {"id": 7,  "name": "ThinkPad X1 Carbon Gen 11",        "category": "Laptop",     "price": 35990000},
    {"id": 8,  "name": 'iPhone 16 Pro Max 256GB',          "category": "Điện thoại", "price": 34990000},
    {"id": 9,  "name": "Samsung Galaxy S25 Ultra",         "category": "Điện thoại", "price": 31990000},
    {"id": 10, "name": "Xiaomi 15 Pro",                    "category": "Điện thoại", "price": 18990000},
    {"id": 11, "name": "Samsung French Door RF28T5001SR",  "category": "Tủ lạnh",    "price": 28990000},
    {"id": 12, "name": "LG InstaView Door-in-Door",        "category": "Tủ lạnh",    "price": 32990000},
    {"id": 13, "name": "Panasonic NR-BX471WGKV",           "category": "Tủ lạnh",    "price": 15990000},
    {"id": 14, "name": "Daikin Inverter FTKZ35XVMV",       "category": "Điều hòa",   "price": 14990000},
    {"id": 15, "name": "Panasonic CU/CS-XU12ZKH-8",        "category": "Điều hòa",   "price": 16990000},
    {"id": 16, "name": "LG Dualcool V13WIN",               "category": "Điều hòa",   "price": 11990000},
    {"id": 17, "name": "Sony WH-1000XM5",                  "category": "Tai nghe",   "price": 7990000},
    {"id": 18, "name": "AirPods Pro 2 USB-C",              "category": "Tai nghe",   "price": 5990000},
    {"id": 19, "name": "JBL Tune 770NC",                   "category": "Tai nghe",   "price": 2490000},
    {"id": 20, "name": "Apple Watch Ultra 2",              "category": "Đồng hồ",    "price": 21990000},
    {"id": 21, "name": "Samsung Galaxy Watch 7",           "category": "Đồng hồ",    "price": 8990000},
    {"id": 22, "name": "Garmin Venu 3",                    "category": "Đồng hồ",    "price": 12990000},
    {"id": 23, "name": "Áo Thun Uniqlo DRY-EX",            "category": "Áo",         "price": 390000},
    {"id": 24, "name": "Áo Polo Ralph Lauren Classic",     "category": "Áo",         "price": 2490000},
    {"id": 25, "name": "Áo Khoác Adidas Tiro 24",          "category": "Áo",         "price": 1590000},
    {"id": 26, "name": "Nike Air Max 270",                 "category": "Giày",       "price": 3690000},
    {"id": 27, "name": "Adidas Ultraboost Light",          "category": "Giày",       "price": 4290000},
    {"id": 28, "name": "New Balance 574 Core",             "category": "Giày",       "price": 2390000},
    {"id": 29, "name": 'Balo Laptop Tomtoc 15.6"',         "category": "Balo & Túi", "price": 1290000},
    {"id": 30, "name": "Peak Design Everyday Backpack 20L","category": "Balo & Túi", "price": 7490000},
    {"id": 31, "name": "Balo Xiaomi City 2",               "category": "Balo & Túi", "price": 690000},
]

NUM_PRODUCTS = len(PRODUCTS)
PRODUCT_IDS = [p["id"] for p in PRODUCTS]

CATEGORY_PRODUCTS = defaultdict(list)
for p in PRODUCTS:
    CATEGORY_PRODUCTS[p["category"]].append(p["id"])

PERSONAS = [
    {"name": "sinh_vien",     "weight": 0.25, "cats": ["Sách", "Laptop", "Tai nghe", "Balo & Túi"],              "intra": 0.70},
    {"name": "van_phong",     "weight": 0.20, "cats": ["Laptop", "Điện thoại", "Áo", "Giày", "Balo & Túi"],     "intra": 0.65},
    {"name": "game_thu",      "weight": 0.10, "cats": ["Laptop", "Tai nghe", "Áo", "Giày"],                      "intra": 0.60},
    {"name": "noi_tro",       "weight": 0.15, "cats": ["Tủ lạnh", "Điều hòa", "Điện thoại"],                     "intra": 0.75},
    {"name": "thoi_trang",    "weight": 0.15, "cats": ["Áo", "Giày", "Đồng hồ", "Balo & Túi"],                   "intra": 0.70},
    {"name": "doc_sach",      "weight": 0.10, "cats": ["Sách", "Tai nghe", "Đồng hồ"],                           "intra": 0.60},
    {"name": "apple_fan",     "weight": 0.05, "cats": ["Laptop", "Điện thoại", "Tai nghe", "Đồng hồ"],           "intra": 0.80},
]

NUM_USERS = 200


def pick_persona():
    r = random.random()
    cum = 0.0
    for p in PERSONAS:
        cum += p["weight"]
        if r < cum:
            return p
    return PERSONAS[0]


def generate_gru_csv():
    rows = []
    for uid in range(1, NUM_USERS + 1):
        persona = pick_persona()
        pref_products = []
        for c in persona["cats"]:
            pref_products.extend(CATEGORY_PRODUCTS[c])

        session_len = random.randint(5, 35)
        session = []
        for _ in range(session_len):
            if random.random() < persona["intra"] and pref_products:
                session.append(random.choice(pref_products))
            else:
                session.append(random.choice(PRODUCT_IDS))

        for i in range(1, len(session)):
            seq = session[max(0, i - 10):i]
            while len(seq) < 10:
                seq.insert(0, 0)
            row = {"user_id": uid, "persona": persona["name"], "session_id": f"user{uid}_session"}
            for j in range(10):
                row[f"step{j}"] = seq[j]         # 1-indexed product id (padding=0)
            row["next_product"] = session[i] - 1  # 0-indexed for softmax
            rows.append(row)

    path = os.path.join(DATA_DIR, "gru_sequences.csv")
    with open(path, "w", newline="") as f:
        fieldnames = ["user_id", "persona", "session_id"] + [f"step{j}" for j in range(10)] + ["next_product"]
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"GRU: {len(rows)} sequences → {path}")


def generate_mlp_csv():
    rows = []
    for uid in range(1, NUM_USERS + 1):
        persona = pick_persona()
        pref_products = set()
        for c in persona["cats"]:
            pref_products.update(CATEGORY_PRODUCTS[c])

        for pid in random.sample(list(pref_products), min(15, len(pref_products))):
            rows.append({"user_id": uid, "persona": persona["name"], "product_id": pid, "label": 1})

        neg_pool = [p for p in PRODUCT_IDS if p not in pref_products]
        for pid in random.sample(neg_pool, min(25, len(neg_pool))):
            rows.append({"user_id": uid, "persona": persona["name"], "product_id": pid, "label": 0})

    path = os.path.join(DATA_DIR, "mlp_pairs.csv")
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["user_id", "persona", "product_id", "label"])
        w.writeheader()
        w.writerows(rows)
    print(f"MLP:  {len(rows)} pairs → {path}")


def generate_products_csv():
    path = os.path.join(DATA_DIR, "products.csv")
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "name", "category", "price"])
        w.writeheader()
        w.writerows(PRODUCTS)
    print(f"Products: {len(PRODUCTS)} items → {path}")


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    generate_products_csv()
    generate_gru_csv()
    generate_mlp_csv()

    meta = {
        "num_products": NUM_PRODUCTS,
        "num_users": NUM_USERS,
        "categories": list(CATEGORY_PRODUCTS.keys()),
        "personas": [p["name"] for p in PERSONAS],
    }
    with open(os.path.join(DATA_DIR, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\nAll data saved to {DATA_DIR}/")


if __name__ == "__main__":
    main()
