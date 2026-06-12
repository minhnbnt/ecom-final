import numpy as np
from keras import Model, layers
from keras.saving import register_keras_serializable


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
        config.update({
            "num_products": self.num_products,
            "embedding_dim": self.embedding_dim,
            "hidden_dim": self.hidden_dim,
        })
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

    def predict_next(self, sequence: list[int], top_k: int = 5) -> list[dict]:
        seq = sequence[-10:]
        if len(seq) < 10:
            seq = [0] * (10 - len(seq)) + seq
        x = np.array([seq])
        probs = self.predict(x, verbose=0)[0]
        top_indices = np.argsort(probs)[-top_k:][::-1]
        return [
            {"product_id": int(i), "score": float(probs[i])}
            for i in top_indices
            if i < self.num_products
        ]


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
        config.update({
            "num_products": self.num_products,
            "embedding_dim": self.embedding_dim,
            "hidden_dim": self.hidden_dim,
        })
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

    def predict_next(self, sequence: list[int], top_k: int = 5) -> list[dict]:
        seq = sequence[-10:]
        if len(seq) < 10:
            seq = [0] * (10 - len(seq)) + seq
        x = np.array([seq])
        probs = self.predict(x, verbose=0)[0]
        top_indices = np.argsort(probs)[-top_k:][::-1]
        return [
            {"product_id": int(i), "score": float(probs[i])}
            for i in top_indices
            if i < self.num_products
        ]


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
        config.update({
            "num_products": self.num_products,
            "embedding_dim": self.embedding_dim,
            "hidden_dim": self.hidden_dim,
        })
        return config

    @classmethod
    def from_config(cls, config):
        return cls(**config)

    def predict_next(self, sequence: list[int], top_k: int = 5) -> list[dict]:
        seq = sequence[-10:]
        if len(seq) < 10:
            seq = [0] * (10 - len(seq)) + seq
        x = np.array([seq])
        probs = self.predict(x, verbose=0)[0]
        top_indices = np.argsort(probs)[-top_k:][::-1]
        return [
            {"product_id": int(i), "score": float(probs[i])}
            for i in top_indices
            if i < self.num_products
        ]


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

    def predict_scores(
        self, user_id: int, product_ids: list[int], top_k: int = 5
    ) -> list[dict]:
        pairs = np.array([[float(user_id), float(pid)] for pid in product_ids])
        scores = self.predict(pairs, verbose=0).flatten()
        top_indices = np.argsort(scores)[-top_k:][::-1]
        return [
            {"product_id": product_ids[i], "mlp_score": float(scores[i])}
            for i in top_indices
        ]
