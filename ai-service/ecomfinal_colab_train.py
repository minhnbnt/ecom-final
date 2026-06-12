# ============================================================
#   EcomFinal — Train GRU / LSTM / BiLSTM + MLP (Colab)
#   Copy từng cell vào Google Colab và Run theo thứ tự.
# ============================================================

# ────────────────────────────────────────────────────────────
# Cell 1: Mount Drive & cài đặt thư viện
# ────────────────────────────────────────────────────────────

from google.colab import drive
drive.mount('/content/drive')

!pip install tensorflow keras numpy pandas matplotlib scikit-learn -q

import os, csv, json, numpy as np, pandas as pd
import matplotlib.pyplot as plt
from keras import Model, layers
from keras.callbacks import EarlyStopping, ReduceLROnPlateau
from keras.saving import register_keras_serializable
from sklearn.metrics import f1_score as sk_f1_score

print("✅ Done — thư viện đã sẵn sàng")


# ────────────────────────────────────────────────────────────
# Cell 2: Upload dữ liệu CSV
# ────────────────────────────────────────────────────────────

from google.colab import files
print("📁 Upload 3 file: gru_sequences.csv, mlp_pairs.csv, products.csv")
uploaded = files.upload()

# ─── Load all data ───
gru = pd.read_csv("gru_sequences.csv")
X_gru = gru[[f"step{j}" for j in range(10)]].values.astype(np.int32)
y_gru = gru["next_product"].values.astype(np.int32)
print(f"📊 GRU data: X {X_gru.shape}, y {y_gru.shape}")

mlp = pd.read_csv("mlp_pairs.csv")
X_mlp = mlp[["user_id", "product_id"]].values.astype(np.float32)
y_mlp = mlp["label"].values.astype(np.float32).reshape(-1, 1)
print(f"📊 MLP data: X {X_mlp.shape}, y {y_mlp.shape}  (pos: {y_mlp.mean()*100:.1f}%)")

products = pd.read_csv("products.csv")
NUM_PRODUCTS = len(products)
print(f"📦 {NUM_PRODUCTS} sản phẩm")


# ────────────────────────────────────────────────────────────
# Cell 3: Định nghĩa tất cả models
# ────────────────────────────────────────────────────────────

@register_keras_serializable()
class GRUNextProduct(Model):
    def __init__(self, num_products: int, embedding_dim: int = 16, hidden_dim: int = 32, **kwargs):
        super().__init__(**kwargs)
        self.num_products = num_products
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim
        self.embedding = layers.Embedding(num_products + 1, embedding_dim)
        self.gru = layers.GRU(hidden_dim)
        self.dense = layers.Dense(hidden_dim, activation='relu')
        self.out = layers.Dense(num_products, activation='softmax')

    def call(self, inputs):
        x = self.embedding(inputs)
        x = self.gru(x)
        x = self.dense(x)
        return self.out(x)

    def get_config(self):
        config = super().get_config()
        config.update({"num_products": self.num_products, "embedding_dim": self.embedding_dim, "hidden_dim": self.hidden_dim})
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

    def predict_next(self, sequence, top_k=5):
        seq = sequence[-10:]
        if len(seq) < 10:
            seq = [0] * (10 - len(seq)) + seq
        probs = self.predict(np.array([seq]), verbose=0)[0]
        top = np.argsort(probs)[-top_k:][::-1]
        return [{"product_id": int(i), "score": float(probs[i])} for i in top if i < self.num_products]


@register_keras_serializable()
class LSTMNextProduct(Model):
    def __init__(self, num_products: int, embedding_dim: int = 16, hidden_dim: int = 32, **kwargs):
        super().__init__(**kwargs)
        self.num_products = num_products
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim
        self.embedding = layers.Embedding(num_products + 1, embedding_dim)
        self.lstm = layers.LSTM(hidden_dim)
        self.dense = layers.Dense(hidden_dim, activation='relu')
        self.out = layers.Dense(num_products, activation='softmax')

    def call(self, inputs):
        x = self.embedding(inputs)
        x = self.lstm(x)
        x = self.dense(x)
        return self.out(x)

    def get_config(self):
        config = super().get_config()
        config.update({"num_products": self.num_products, "embedding_dim": self.embedding_dim, "hidden_dim": self.hidden_dim})
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

    def predict_next(self, sequence, top_k=5):
        seq = sequence[-10:]
        if len(seq) < 10:
            seq = [0] * (10 - len(seq)) + seq
        probs = self.predict(np.array([seq]), verbose=0)[0]
        top = np.argsort(probs)[-top_k:][::-1]
        return [{"product_id": int(i), "score": float(probs[i])} for i in top if i < self.num_products]


@register_keras_serializable()
class BiLSTMNextProduct(Model):
    def __init__(self, num_products: int, embedding_dim: int = 16, hidden_dim: int = 32, **kwargs):
        super().__init__(**kwargs)
        self.num_products = num_products
        self.embedding_dim = embedding_dim
        self.hidden_dim = hidden_dim
        self.embedding = layers.Embedding(num_products + 1, embedding_dim)
        self.bilstm = layers.Bidirectional(layers.LSTM(hidden_dim))
        self.dense = layers.Dense(hidden_dim * 2, activation='relu')
        self.out = layers.Dense(num_products, activation='softmax')

    def call(self, inputs):
        x = self.embedding(inputs)
        x = self.bilstm(x)
        x = self.dense(x)
        return self.out(x)

    def get_config(self):
        config = super().get_config()
        config.update({"num_products": self.num_products, "embedding_dim": self.embedding_dim, "hidden_dim": self.hidden_dim})
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

    def predict_next(self, sequence, top_k=5):
        seq = sequence[-10:]
        if len(seq) < 10:
            seq = [0] * (10 - len(seq)) + seq
        probs = self.predict(np.array([seq]), verbose=0)[0]
        top = np.argsort(probs)[-top_k:][::-1]
        return [{"product_id": int(i), "score": float(probs[i])} for i in top if i < self.num_products]


@register_keras_serializable()
class MLPRecommender(Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.dense1 = layers.Dense(64, activation='relu')
        self.dense2 = layers.Dense(32, activation='relu')
        self.out = layers.Dense(1, activation='sigmoid')

    def call(self, inputs):
        x = self.dense1(inputs)
        x = self.dense2(x)
        return self.out(x)

    def get_config(self):
        return super().get_config()

    def predict_scores(self, user_id, product_ids, top_k=5):
        pairs = np.array([[float(user_id), float(pid)] for pid in product_ids])
        scores = self.predict(pairs, verbose=0).flatten()
        top = np.argsort(scores)[-top_k:][::-1]
        return [{"product_id": product_ids[i], "mlp_score": float(scores[i])} for i in top]

print("✅ All model classes defined")


# ────────────────────────────────────────────────────────────
# Cell 4: Train tất cả sequence models + thu thập history
# ────────────────────────────────────────────────────────────

def train_seq_model(ModelClass, name):
    print(f"\n🚀 Training {name} ...")
    model = ModelClass(NUM_PRODUCTS)
    model.build((None, 10))
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()

    history = model.fit(
        X_gru, y_gru,
        batch_size=128, epochs=50, validation_split=0.1,
        callbacks=[
            EarlyStopping(monitor="loss", patience=5, restore_best_weights=True),
            ReduceLROnPlateau(monitor="loss", factor=0.5, patience=3, min_lr=1e-5),
        ],
        verbose=1,
    )
    val_acc = max(history.history.get("val_accuracy", [0]))
    y_pred = model.predict(X_gru, verbose=0).argmax(axis=1)
    sk_f1 = sk_f1_score(y_gru, y_pred, average="weighted")
    print(f"🎯 {name} — val_acc: {val_acc:.4f} | F1 (weighted): {sk_f1:.4f}")

    model.save(f"{name}.keras")
    model.save_weights(f"{name}.weights.h5")
    print(f"💾 Saved: {name}.keras + {name}.weights.h5")
    return model, history

histories = {}
trained_models = {}
for ModelClass, name in [
    (GRUNextProduct, "gru_next_product"),
    (LSTMNextProduct, "lstm_next_product"),
    (BiLSTMNextProduct, "bilstm_next_product"),
]:
    model, hist = train_seq_model(ModelClass, name)
    histories[name] = hist
    trained_models[name] = model


# ────────────────────────────────────────────────────────────
# Cell 5: Train MLPRecommender
# ────────────────────────────────────────────────────────────

print("\n🚀 Training MLPRecommender ...")
mlp_model = MLPRecommender()
mlp_model.build((None, 2))
from keras.callbacks import Callback

class F1Callback(Callback):
    def __init__(self, X, y, key="f1"):
        super().__init__()
        self.X, self.y = X, y
        self.key = key
    def on_epoch_end(self, epoch, logs=None):
        y_pred = (self.model.predict(self.X, verbose=0) > 0.5).astype(np.int32).flatten()
        f1 = sk_f1_score(self.y.flatten().astype(np.int32), y_pred)
        logs[f"{self.key}_score"] = f1

mlp_model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy", keras.metrics.F1Score(threshold=0.5, name="f1_score")],
)
mlp_model.summary()

f1_cb = F1Callback(X_mlp, y_mlp, key="f1")
mlp_history = mlp_model.fit(
    X_mlp, y_mlp,
    batch_size=64, epochs=30, validation_split=0.1,
    callbacks=[
        EarlyStopping(monitor="loss", patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor="loss", factor=0.5, patience=3, min_lr=1e-5),
        f1_cb,
    ],
    verbose=1,
)

val_acc = max(mlp_history.history.get("val_accuracy", [0]))
val_f1 = max(mlp_history.history.get("val_f1_score", [0]))
sk_f1 = max(mlp_history.history.get("f1_score", [0]))
print(f"🎯 MLP best val_accuracy: {val_acc:.4f} | val_f1: {val_f1:.4f} | sk_f1: {sk_f1:.4f}")

mlp_model.save("mlp_recommender.keras")
mlp_model.save_weights("mlp_recommender.weights.h5")
print("💾 Saved: mlp_recommender.keras + mlp_recommender.weights.h5")

test_pair = np.array([[1.0, 5.0]])
score = mlp_model.predict(test_pair, verbose=0)[0][0]
print(f"🔮 User 1 → Product 5 (MacBook Pro): {score:.3f}  (>{0.5} = thích)")

# ────────────────────────────────────────────────────────────
# Cell 6: Vẽ biểu đồ Loss & Accuracy cho tất cả models
# ────────────────────────────────────────────────────────────

colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"]

# ─── 6a: Sequence models ───
plt.figure(figsize=(14, 5))
plt.subplot(1, 2, 1)
for i, (name, hist) in enumerate(histories.items()):
    label = name.replace("_next_product", "").upper()
    plt.plot(hist.history["loss"], color=colors[i], linestyle="-", label=f"{label} (train)")
    plt.plot(hist.history["val_loss"], color=colors[i], linestyle="--", label=f"{label} (val)")
plt.title("Sequence Models — Loss", fontsize=14, fontweight="bold")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(alpha=0.3)

plt.subplot(1, 2, 2)
for i, (name, hist) in enumerate(histories.items()):
    label = name.replace("_next_product", "").upper()
    plt.plot(hist.history["accuracy"], color=colors[i], linestyle="-", label=f"{label} (train)")
    plt.plot(hist.history["val_accuracy"], color=colors[i], linestyle="--", label=f"{label} (val)")
plt.title("Sequence Models — Accuracy", fontsize=14, fontweight="bold")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("seq_models_training.png", dpi=150, bbox_inches="tight")
plt.show()

# ─── 6b: MLP curves ───
plt.figure(figsize=(10, 4))
plt.subplot(1, 2, 1)
plt.plot(mlp_history.history["loss"], label="train", color="#9b59b6")
plt.plot(mlp_history.history["val_loss"], label="val", color="#9b59b6", linestyle="--")
plt.title("MLP Recommender — Loss", fontsize=14, fontweight="bold")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(mlp_history.history["accuracy"], label="train", color="#9b59b6")
plt.plot(mlp_history.history["val_accuracy"], label="val", color="#9b59b6", linestyle="--")
plt.title("MLP Recommender — Accuracy", fontsize=14, fontweight="bold")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("mlp_training.png", dpi=150, bbox_inches="tight")
plt.show()

# ─── 6c: So sánh val_accuracy & F1 ───
f1_scores = {}
for label, key in [("GRU", "gru_next_product"), ("LSTM", "lstm_next_product"), ("BiLSTM", "bilstm_next_product")]:
    m = trained_models[key]
    y_p = m.predict(X_gru, verbose=0).argmax(axis=1)
    f1_scores[label] = sk_f1_score(y_gru, y_p, average="weighted")
mlp_preds = (mlp_model.predict(X_mlp, verbose=0) > 0.5).astype(np.int32).flatten()
f1_scores["MLP"] = sk_f1_score(y_mlp.flatten().astype(np.int32), mlp_preds)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
names_seq = []
val_accs, f1s_seq = [], []
for name, hist in histories.items():
    label = name.replace("_next_product", "").upper()
    names_seq.append(label)
    val_accs.append(max(hist.history.get("val_accuracy", [0])))
    f1s_seq.append(f1_scores.get(label, 0))

x = np.arange(len(names_seq))
w = 0.35
bars1 = ax1.bar(x - w/2, val_accs, w, label="Val Accuracy", color=colors[0], edgecolor="black")
bars2 = ax1.bar(x + w/2, f1s_seq, w, label="F1 (weighted)", color=colors[1], edgecolor="black")
ax1.set_xticks(x)
ax1.set_xticklabels(names_seq)
ax1.set_ylabel("Score")
ax1.set_title("Sequence Models — Accuracy vs F1", fontsize=14, fontweight="bold")
ax1.legend()
ax1.grid(axis="y", alpha=0.3)
for b in bars1:
    ax1.text(b.get_x() + b.get_width()/2, b.get_height() + 0.005, f"{b.get_height():.3f}", ha="center", fontsize=9)
for b in bars2:
    ax1.text(b.get_x() + b.get_width()/2, b.get_height() + 0.005, f"{b.get_height():.3f}", ha="center", fontsize=9)

ax2.bar(["MLP"], [f1_scores["MLP"]], color=colors[2], width=0.4, edgecolor="black")
ax2.set_ylabel("Score")
ax2.set_title("MLP — F1 Score", fontsize=14, fontweight="bold")
ax2.set_ylim(0, max(f1_scores.values()) * 1.2)
ax2.grid(axis="y", alpha=0.3)
mlp_f1 = f1_scores["MLP"]
ax2.text(0, mlp_f1 + 0.01, f"{mlp_f1:.4f}", ha="center", fontsize=12, fontweight="bold")
plt.tight_layout()
plt.savefig("comparison.png", dpi=150, bbox_inches="tight")
plt.show()

print("📊 Biểu đồ đã lưu: seq_models_training.png, mlp_training.png, comparison.png")


# ────────────────────────────────────────────────────────────
# Cell 7: Download models + biểu đồ
# ────────────────────────────────────────────────────────────

from google.colab import files
files_to_download = [
    "gru_next_product.keras", "gru_next_product.weights.h5",
    "lstm_next_product.keras", "lstm_next_product.weights.h5",
    "bilstm_next_product.keras", "bilstm_next_product.weights.h5",
    "mlp_recommender.keras", "mlp_recommender.weights.h5",
    "seq_models_training.png", "mlp_training.png", "comparison.png",
]
for fname in files_to_download:
    files.download(fname)

print("✅ Download xong! Copy models vào ai-service/saved_models/")


# ────────────────────────────────────────────────────────────
# (Tuỳ chọn) Danh sách sản phẩm tham khảo
# ────────────────────────────────────────────────────────────

products
