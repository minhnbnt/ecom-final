"""
Train GRUNextProduct and MLPRecommender from CSV training data.

Run this INSIDE the Docker container (where TensorFlow is available):
    python train.py

Or with docker-compose:
    docker compose exec ai-service python train.py
"""

import csv
import json
import os

import numpy as np
from keras.callbacks import EarlyStopping, ReduceLROnPlateau

from models import GRUNextProduct, LSTMNextProduct, BiLSTMNextProduct, MLPRecommender

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")


def load_gru_csv():
    X, y = [], []
    with open(os.path.join(DATA_DIR, "gru_sequences.csv")) as f:
        reader = csv.DictReader(f)
        for row in reader:
            seq = [int(row[f"step{j}"]) for j in range(10)]
            X.append(seq)
            y.append(int(row["next_product"]))
    return np.array(X, dtype=np.int32), np.array(y, dtype=np.int32)


def load_mlp_csv():
    X, y = [], []
    with open(os.path.join(DATA_DIR, "mlp_pairs.csv")) as f:
        reader = csv.DictReader(f)
        for row in reader:
            X.append([float(row["user_id"]), float(row["product_id"])])
            y.append(float(row["label"]))
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32).reshape(-1, 1)


def _train_seq_model(ModelClass, name, X, y, num_products):
    model = ModelClass(num_products)
    model.build((None, 10))
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    model.summary()

    model.fit(
        X, y,
        batch_size=128,
        epochs=50,
        validation_split=0.1,
        callbacks=[
            EarlyStopping(monitor="loss", patience=5, restore_best_weights=True),
            ReduceLROnPlateau(monitor="loss", factor=0.5, patience=3, min_lr=1e-5),
        ],
        verbose=1,
    )
    return model


def train_mlp(X, y):
    model = MLPRecommender()
    model.build((None, 2))
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
    model.summary()

    model.fit(
        X, y,
        batch_size=64,
        epochs=30,
        validation_split=0.1,
        callbacks=[
            EarlyStopping(monitor="loss", patience=5, restore_best_weights=True),
            ReduceLROnPlateau(monitor="loss", factor=0.5, patience=3, min_lr=1e-5),
        ],
        verbose=1,
    )
    return model


def main():
    with open(os.path.join(DATA_DIR, "meta.json")) as f:
        meta = json.load(f)
    print(f"Meta: {json.dumps(meta, indent=2)}")

    os.makedirs(MODELS_DIR, exist_ok=True)

    print("\n=== Loading GRU data ===")
    X_gru, y_gru = load_gru_csv()
    print(f"  X: {X_gru.shape}, y: {y_gru.shape}")

    seq_models = [
        (GRUNextProduct, "gru_next_product"),
        (LSTMNextProduct, "lstm_next_product"),
        (BiLSTMNextProduct, "bilstm_next_product"),
    ]

    for ModelClass, name in seq_models:
        print(f"\n=== Training {name} ===")
        model = _train_seq_model(ModelClass, name, X_gru, y_gru, meta["num_products"])
        model.save(os.path.join(MODELS_DIR, f"{name}.keras"))
        model.save_weights(os.path.join(MODELS_DIR, f"{name}.weights.h5"))
        print(f"  Saved {name}.keras + .weights.h5")

    print("\n=== Loading MLP data ===")
    X_mlp, y_mlp = load_mlp_csv()
    print(f"  X: {X_mlp.shape}, y: {y_mlp.shape}  (pos ratio: {y_mlp.mean():.1%})")

    print("\n=== Training MLPRecommender ===")
    mlp_model = train_mlp(X_mlp, y_mlp)
    mlp_model.save(os.path.join(MODELS_DIR, "mlp_recommender.keras"))
    mlp_model.save_weights(os.path.join(MODELS_DIR, "mlp_recommender.weights.h5"))
    print("  Saved mlp_recommender.keras + .weights.h5")

    print(f"\nDone! Models saved to {MODELS_DIR}/")


if __name__ == "__main__":
    main()
