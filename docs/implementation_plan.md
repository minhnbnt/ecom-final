# Implementation Plan — E-Commerce Microservices (Chương 2 + 3 + 4)

> Dựa trên `document_pdf.pdf` (file yêu cầu chính thức của giảng viên)

## Stack tổng quan

| Thành phần | Giá trị |
|---|---|
| Python | `3.12` |
| Django | `6.0` |
| API Framework | Django REST Framework + `djangorestframework-simplejwt` |
| AI Service Framework | FastAPI + Keras (TensorFlow backend) + OpenAI API |
| **Knowledge Graph (RAG)** | **Neo4j `neo4j:2026-community-ubi10` + MCP + OpenAI Embeddings** |
| **Frontend** | **Vite + React 19 + TypeScript** |
| **Frontend Styling** | **TailwindCSS 4 + Glassmorphism** |
| **Frontend Routing** | **React Router v7** |
| **Frontend Build** | **pnpm + multi-stage Docker build** |
| Container runtime | `podman compose` |
| Reverse Proxy / API Gateway | `nginx:1.29-alpine` |
| DB cho user-service | `mariadb:12-ubi` |
| DB cho các service còn lại | `postgres:18-alpine` |
| DB cho Knowledge Graph (AI) | `neo4j:2026-community-ubi10` |

---

## Containers tổng hợp

| Container name | Base image | Build | Vai trò |
|---|---|---|---|
| `nginx` | `nginx:1.29-alpine` | pull | Reverse proxy / API Gateway + phpMyAdmin FastCGI |
| `frontend` | `node:22-alpine` → `alpine:3` | `./frontend` | Vite React TS — SPA (build multi-stage, serve qua nginx) |
| `user-service` | `python:3.12-slim` | `./user-service` | Django — User & Auth (admin/staff/customer) |
| `product-service` | `python:3.12-slim` | `./product-service` | Django — Product catalog (10 nhóm) |
| `cart-service` | `python:3.12-slim` | `./cart-service` | Django — Giỏ hàng |
| `order-service` | `python:3.12-slim` | `./order-service` | Django — Đơn hàng |
| `payment-service` | `python:3.12-slim` | `./payment-service` | Django — Thanh toán |
| `shipping-service` | `python:3.12-slim` | `./shipping-service` | Django — Giao hàng |
| `ai-service` | `python:3.12-slim` | `./ai-service` | **FastAPI** — Keras LSTM + OpenAI chatbot + **Neo4j GraphRAG** |
| `mariadb` | — | pull | `mariadb:12-ubi` — chứa DB `userdb` |
| `postgres` | — | pull | `postgres:18-alpine` — chứa `productdb`, `cartdb`, `orderdb`, `paymentdb`, `shippingdb` |
| `neo4j` | `neo4j:2026-community-ubi10` | pull | Knowledge Graph cho RAG — product/category/order relationships |
| `phpmyadmin` | `phpmyadmin:5-fpm-alpine` | pull | DB admin UI cho MariaDB |
| `pgadmin` | `dpage/pgadmin4:9.14` | pull | DB admin UI cho PostgreSQL |

**Tổng:** 14 containers (8 app build riêng + 3 DB pull + 2 admin UI + 1 nginx pull)

> [!IMPORTANT]
> Ghi chú quan trọng từ PDF (`//THỂ HIỆN QUAN TRỌNG`):
> - Phải có đủ 3 role: **staff, admin, customer**
> - Product service phải có **10 nhóm loại sản phẩm** (không chỉ 3)
> - `ai-service` dùng **FastAPI** (không phải Django)
> - Mỗi service vẫn có **database riêng** (DDD — database-per-service), chỉ dùng chung **DB server**
> - `ai-service` dùng **Neo4j** làm Knowledge Graph cho **GraphRAG** (Retrieval-Augmented Generation)
> - Chatbot dùng **MCP (Model Context Protocol)** để truy vấn Neo4j → lấy context → gọi **OpenAI API**

---

## Lý do chọn database

| Service | DB | Lý do |
|---|---|---|
| `user-service` | MariaDB (`mariadb:12-ubi`) | Đề yêu cầu MySQL-compatible; MariaDB là drop-in replacement, tương thích hoàn toàn với Django `mysql` backend; `ubi` base image ổn định hơn cho production |
| `product-service` | PostgreSQL (`postgres:18-alpine`) | Đề yêu cầu; hỗ trợ JSONB tốt cho dữ liệu sản phẩm phức tạp (Book/Electronics/Fashion) |
| `cart-service` | PostgreSQL | Cần ACID đầy đủ, FK đến user_id và product_id; cùng image tái dụng |
| `order-service` | PostgreSQL | Workflow multi-step (cart → order → payment → shipping), cần transaction mạnh |
| `payment-service` | PostgreSQL | Tài chính — cần isolation level cao (`SERIALIZABLE` option của Django/PostgreSQL) |
| `shipping-service` | PostgreSQL | Đồng nhất với phần còn lại; đơn giản, không cần JSONB |
| `ai-service` (knowledge) | **Neo4j** (`neo4j:2026-community-ubi10`) | Graph database tối ưu cho **Knowledge Graph** — lưu quan hệ phức tạp giữa Product↔Category↔Order↔User dưới dạng nodes/edges; hỗ trợ **vector search** cho semantic retrieval + **Cypher** cho multi-hop traversal, kết hợp thành **GraphRAG pipeline** |

---

## Cấu trúc thư mục

```
final-exam/
├── compose.yml
├── nginx/
│   └── nginx.conf
├── user-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   └── app/
│       ├── settings.py
│       ├── urls.py
│       └── users/
│           ├── models.py       # User(AbstractUser) + role
│           ├── serializers.py
│           └── views.py        # register, login, list
├── product-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── products/
│           └── models.py       # Category, Product, Book, Electronics, Fashion
├── cart-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── cart/
│           └── models.py       # Cart, CartItem
├── order-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── orders/
│           └── models.py       # Order, OrderItem
├── payment-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── payments/
│           └── models.py       # Payment
└── shipping-service/
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        └── shipping/
            └── models.py       # Shipment
```

---

## Django Database Backend

### user-service → MariaDB (mysql.connector.django)

Theo [MySQL Connector/Python Django Back End](https://dev.mysql.com/doc/connector-python/en/connector-python-django-backend.html):

```python
# user-service/app/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'mysql.connector.django',
        'NAME': 'userdb',
        'HOST': 'mariadb',           # ← tên container trong compose.yml
        'PORT': 3306,
        'USER': 'django',
        'PASSWORD': os.environ['DB_PASSWORD'],
        'OPTIONS': {
            'autocommit': True,
        },
    }
}
```

**Package:** `mysql-connector-python` (pip)

> **Lưu ý:** MariaDB 12 tương thích với MySQL protocol. Django cũng hỗ trợ
> `django.db.backends.mysql` natively nếu cần fallback.

**JWT Auth (tất cả services):** `djangorestframework-simplejwt`
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}
```

---

### Các service còn lại → PostgreSQL (psycopg 3)

Theo [Django 6.0 PostgreSQL Notes](https://docs.djangoproject.com/en/6.0/ref/databases/#postgresql-notes):
- Django 6.0 yêu cầu **psycopg 3.1.12+** (psycopg2 sắp bị deprecated)
- Recommended: `psycopg[binary]` hoặc `psycopg[c]`

```python
# product-service/app/settings.py (tương tự cho cart, order, payment, shipping)
# Tất cả đều kết nối vào cùng 1 postgres container, nhưng khác tên database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'productdb',       # mỗi service dùng tên DB riêng
        'HOST': 'postgres',        # cùng 1 container
        'PORT': 5432,
        'USER': 'django',
        'PASSWORD': os.environ['DB_PASSWORD'],
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    }
}
# cart-service  → NAME: 'cartdb'
# order-service → NAME: 'orderdb'
# payment-service → NAME: 'paymentdb'
# shipping-service → NAME: 'shippingdb'
```

**Package:** `psycopg[binary]>=3.1.12`

---

## Nginx Routing

```nginx
# gateway/nginx.conf

# ── Server 1: API Gateway (port 8080) ────────────────────────
upstream user_service     { server user-service:8000; }
upstream product_service  { server product-service:8000; }
upstream cart_service     { server cart-service:8000; }
upstream order_service    { server order-service:8000; }
upstream payment_service  { server payment-service:8000; }
upstream shipping_service { server shipping-service:8000; }
upstream ai_service       { server ai-service:8001; }

server {
    listen 8080;

    location /api/auth/     { proxy_pass http://user_service; }
    location /api/users/    { proxy_pass http://user_service; }
    location /api/products/ { proxy_pass http://product_service; }
    location /api/cart/     { proxy_pass http://cart_service; }
    location /api/orders/   { proxy_pass http://order_service; }
    location /api/payment/  { proxy_pass http://payment_service; }
    location /api/shipping/ { proxy_pass http://shipping_service; }
    location /api/recommend { proxy_pass http://ai_service; }
    location /api/chatbot   { proxy_pass http://ai_service; }
}

# ── Server 2: phpMyAdmin qua FastCGI (port 8081) ─────────────
server {
    listen 8081;
    root /var/www/html;    # shared volume với phpmyadmin container
    index index.php;

    location / {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    location ~ \.php$ {
        fastcgi_pass   phpmyadmin:9000;
        fastcgi_index  index.php;
        include        fastcgi_params;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

**External port:** `8080:80` (tránh conflict với port 80)

---

## requirements.txt mẫu

### user-service
```txt
django>=6.0
djangorestframework
djangorestframework-simplejwt
mysql-connector-python
```

### product/cart/order/payment/shipping service
```txt
django>=6.0
djangorestframework
djangorestframework-simplejwt
psycopg[binary]>=3.1.12
requests
```

### ai-service
```txt
fastapi
uvicorn[standard]
keras         # keras.layers.LSTM, keras.layers.Dense, etc.
tensorflow    # backend cho Keras, Python 3.12 cần >= 2.16
openai        # chatbot via OpenAI API + embeddings cho vector search
numpy
neo4j         # Neo4j Python driver — kết nối Knowledge Graph
httpx         # async HTTP client cho inter-service calls
```

> **Keras LSTM** dùng trực tiếp: `from keras.layers import LSTM, Dense, Embedding`
> — không cần import TensorFlow riêng, Keras handle backend tự động.

> **Neo4j GraphRAG pipeline:**
> 1. Product/Category data được sync vào Neo4j dưới dạng nodes + relationships
> 2. Text descriptions được embed bằng OpenAI Embeddings → lưu vector trong Neo4j
> 3. Khi chatbot nhận query → vector search (semantic) + Cypher traversal (structured)
> 4. Context được augment vào prompt → gọi OpenAI Chat API → trả response grounded

---

## Dockerfile (Django services — dùng chung)

Dựa trên template của bạn với **BuildKit cache mount** để speed up pip install:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Tạo và dùng venv (inside container)
RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy requirements trước để tận dụng layer cache
COPY requirements.txt .

# Cache pip deps — chỉ reinstall khi requirements.txt thay đổi
RUN --mount=type=cache,id=pip,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

## Dockerfile (ai-service — FastAPI + Keras + OpenAI)

```dockerfile
# syntax=docker/dockerfile:1.7
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY requirements.txt .

# TensorFlow lớn (~600MB) — cache mount giúp rất nhiều khi rebuild
RUN --mount=type=cache,id=pip,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## compose.yml skeleton

```yaml
services:

  # ── Databases (3 instances) ─────────────────────────────────

  mariadb:
    image: mariadb:12-ubi
    environment:
      MARIADB_DATABASE: userdb
      MARIADB_USER: django
      MARIADB_PASSWORD: ${DB_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - mariadb-data:/var/lib/mysql
      - ./mariadb-init.sql:/docker-entrypoint-initdb.d/init.sql:ro

  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: django
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: productdb        # DB mặc định
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres-init.sql:/docker-entrypoint-initdb.d/init.sql:ro

  neo4j:
    image: neo4j:2026-community-ubi10
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc"]'     # APOC cho vector index + utility procedures
    ports:
      - "7474:7474"    # Neo4j Browser UI
      - "7687:7687"    # Bolt protocol
    volumes:
      - neo4j-data:/data

  # ── DB Admin UIs ─────────────────────────────────────────────

  phpmyadmin:
    image: phpmyadmin:5-fpm-alpine   # nhẹ hơn, dùng FPM
    environment:
      PMA_HOST: mariadb
      PMA_USER: root
      PMA_PASSWORD: ${DB_ROOT_PASSWORD}
      PMA_ARBITRARY: 1
    volumes:
      - phpmyadmin-data:/var/www/html
    depends_on:
      - mariadb

  pgadmin:
    image: dpage/pgadmin4:9.14
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@local.dev
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: "False"   # không hỏi master password
    ports:
      - "8082:80"
    depends_on:
      - postgres

  # ── Application Services ────────────────────────────────────

  user-service:
    build: ./user-service
    environment:
      DB_HOST: mariadb
      DB_NAME: userdb
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - mariadb

  product-service:
    build: ./product-service
    environment:
      DB_HOST: postgres
      DB_NAME: productdb
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - postgres

  # cart-service    → DB_NAME: cartdb,    depends_on: postgres
  # order-service   → DB_NAME: orderdb,   depends_on: postgres
  # payment-service → DB_NAME: paymentdb, depends_on: postgres
  # shipping-service→ DB_NAME: shippingdb,depends_on: postgres

  ai-service:
    build: ./ai-service
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: ${NEO4J_PASSWORD}
      PRODUCT_SERVICE_URL: http://product-service:8000
    depends_on:
      - neo4j
      - product-service

  # ── Reverse Proxy (2 ports) ────────────────────────────────

  nginx:
    image: nginx:1.29-alpine
    ports:
      - "8080:8080"    # API gateway cho microservices
      - "8081:8081"    # phpMyAdmin qua FastCGI
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - phpmyadmin-data:/var/www/html:ro    # shared với phpmyadmin
    depends_on:
      - user-service
      - product-service
      - cart-service
      - order-service
      - payment-service
      - shipping-service
      - ai-service
      - phpmyadmin

volumes:
  mariadb-data:
  postgres-data:
  neo4j-data:
  phpmyadmin-data:
```

| UI | URL | Credentials |
|---|---|---|
| phpMyAdmin | `http://localhost:8081` | root / `${DB_ROOT_PASSWORD}` |
| pgAdmin4 | `http://localhost:8082` | admin@local.dev / `admin` |
| Neo4j Browser | `http://localhost:7474` | neo4j / `${NEO4J_PASSWORD}` |

### postgres-init/init.sql

```sql
-- Chạy tự động khi postgres container khởi tạo lần đầu
CREATE DATABASE cartdb;
CREATE DATABASE orderdb;
CREATE DATABASE paymentdb;
CREATE DATABASE shippingdb;
-- productdb được tạo tự động qua POSTGRES_DB env var

GRANT ALL PRIVILEGES ON DATABASE cartdb TO django;
GRANT ALL PRIVILEGES ON DATABASE orderdb TO django;
GRANT ALL PRIVILEGES ON DATABASE paymentdb TO django;
GRANT ALL PRIVILEGES ON DATABASE shippingdb TO django;
```

---

## Cấu trúc thư mục (từ PDF §4.2.6)

```
final-exam/
├── compose.yml
├── .env
├── mariadb-init.sql
├── postgres-init.sql
├── gateway/
│   └── nginx.conf
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx          # React entry + Router setup
│       ├── index.css         # Tailwind + CSS vars (glassmorphism tokens)
│       ├── App.tsx
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Products.tsx
│       │   ├── ProductDetail.tsx
│       │   ├── Cart.tsx
│       │   ├── Checkout.tsx
│       │   ├── Orders.tsx
│       │   ├── Login.tsx
│       │   └── Register.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── ProductCard.tsx
│       │   └── GlassCard.tsx
│       └── api/              # fetch wrappers → nginx:8080
├── user-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   └── app/         # settings.py, urls.py, users/
├── product-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/         # products/ — Category, Product, Book, Electronics, Fashion
├── cart-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/         # cart/ — Cart, CartItem
├── order-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/         # orders/ — Order, OrderItem
├── payment-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/         # payments/ — Payment
├── shipping-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/         # shipping/ — Shipment
└── ai-service/
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py          # FastAPI entry: mount routers
    ├── knowledge.py     # Neo4j Knowledge Graph — sync + query
    ├── rag.py           # GraphRAG pipeline — retrieve + augment + generate
    ├── recommend.py     # LSTM recommendation endpoint
    └── chatbot.py       # Chatbot endpoint (RAG via Neo4j MCP + OpenAI)
```

---

## Frontend (Vite + React + TS)

### Stack

| Package | Version | Mục đích |
|---|---|---|
| `vite` | latest | Build tool |
| `react` + `react-dom` | 18 | UI framework |
| `typescript` | 5 | Type safety |
| `tailwindcss` | **4** | Styling |
| `react-router-dom` | **7** | Client-side routing |
| `lucide-react` | latest | SVG icons |

### Install commands

```bash
pnpm create vite@latest frontend -- --template react-ts
cd frontend
pnpm add react-router-dom
pnpm add -D tailwindcss @tailwindcss/vite
```

### Design System (UI/UX Pro Max — Glassmorphism)

| Token | Giá trị | Vai trò |
|---|---|---|
| `--color-primary` | `#7C3AED` | Tím đậm (củ hàng) |
| `--color-secondary` | `#A78BFA` | Tím nhạt (hover) |
| `--color-accent` | `#10B981` | Xanh lục (badge, success) |
| `--color-pink` | `#F472B6` | Hồng (CTA, highlight) |
| `--color-bg` | `#FAF5FF` | Nền trắng-tím |
| `--glass-bg` | `rgba(255,255,255,0.15)` | Card glass |
| `--glass-blur` | `backdrop-filter: blur(12px)` | Hiệu ứng sương |
| Font heading | **Rubik** | Google Fonts |
| Font body | **Nunito Sans** | Google Fonts |

### Dockerfile (multi-stage — từ template của bạn)

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Cache pnpm store giống pattern pip cache
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: serve bằng nginx
FROM nginx:1.29-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback: mọi route đều trả về index.html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
```

### nginx-spa.conf (SPA fallback cho React Router)

```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }
}
```

### Pages & Routes

| Route | Component | Mô tả |
|---|---|---|
| `/` | `Home` | Trang chủ, sản phẩm nổi bật |
| `/products` | `Products` | Danh sách sản phẩm + filter theo 10 nhóm |
| `/products/:id` | `ProductDetail` | Chi tiết sản phẩm + AI recommend |
| `/cart` | `Cart` | Giỏ hàng |
| `/checkout` | `Checkout` | Thanh toán |
| `/orders` | `Orders` | Lịch sử đơn hàng |
| `/login` | `Login` | Đăng nhập (JWT) |
| `/register` | `Register` | Đăng ký |

### Nginx routing cập nhật (thêm frontend)

Frontend container expose port 3000, nginx gateway route:
```nginx
# thêm vào gateway/nginx.conf server block 8080
location / {
    proxy_pass http://frontend:3000;
}
```

---

## Các bước thực hiện (theo thứ tự)

**Chương 2 — Core Microservices:**
- [x] **Bước 1** — Tạo cấu trúc thư mục + `compose.yml` + `.env`
- [x] **Bước 2** — Viết `Dockerfile` cho Django services và FastAPI service
- [x] **Bước 3** — Scaffold `user-service`: `AbstractUser` + role (admin/staff/customer), simplejwt
- [x] **Bước 4** — Scaffold `product-service`: Category (10 nhóm), Product, Book/Electronics/Fashion (OneToOne)
- [x] **Bước 5** — Scaffold `cart-service`: Cart, CartItem + API add/get/remove
- [x] **Bước 6** — Scaffold `order-service`: Order, OrderItem + gọi payment-service qua `requests`
- [x] **Bước 7** — Scaffold `payment-service`: Payment + status (pending→success/failed)
- [x] **Bước 8** — Scaffold `shipping-service`: Shipment + status (processing→shipping→delivered)

**Chương 3 — AI Service + Neo4j Knowledge Graph:**
- [x] **Bước 9** — Scaffold `ai-service` (FastAPI): endpoint `GET /recommend` + `POST /chatbot`
- [x] **Bước 10** — Implement LSTM model đơn giản cho recommendation
- [x] **Bước 11** — Setup Neo4j Knowledge Graph: tạo schema (nodes: Product, Category, User; edges: BELONGS_TO, PURCHASED, SIMILAR_TO)
- [x] **Bước 12** — Implement data sync: product-service → Neo4j (on startup + webhook)
- [x] **Bước 13** — Implement GraphRAG pipeline: vector search (OpenAI Embeddings) + Cypher traversal → context → OpenAI Chat
- [x] **Bước 14** — Connect chatbot endpoint tới RAG pipeline qua MCP pattern

**Chương 4 — Integration:**
- [x] **Bước 15** — Cấu hình `nginx.conf` routing tất cả services + Frontend (Vite React TS)
- [ ] **Bước 16** — Test end-to-end flow: login → product → cart → order → payment → shipping
- [ ] **Bước 17** — Test AI flow: recommend khi search/add-to-cart
- [ ] **Bước 18** — Test chatbot GraphRAG: hỏi về sản phẩm → Neo4j retrieval → grounded response

---

## Checklist đánh giá (tổng hợp từ PDF)

**Chương 2:**
- [ ] Có sơ đồ Class Diagram đúng chuẩn UML (Visual Paradigm)
- [ ] Có mapping rõ ràng từ Class Diagram sang Database
- [ ] Database tách riêng từng service (không share DB)
- [ ] Có sử dụng cả MySQL (MariaDB) lẫn PostgreSQL với lý do rõ ràng
- [ ] Role: admin, staff, customer hoạt động đúng RBAC
- [ ] 10 nhóm loại sản phẩm

**Chương 3:**
- [ ] Có pipeline AI rõ ràng
- [ ] Có model LSTM
- [ ] Có API recommendation hoạt động (`GET /recommend`)
- [ ] Có chatbot cơ bản (`POST /chatbot`)
- [ ] Có **Neo4j Knowledge Graph** với schema Product↔Category↔User
- [ ] Có **GraphRAG pipeline**: vector search + Cypher → context → OpenAI
- [ ] Chatbot trả lời **grounded** (dựa trên dữ liệu thực từ Neo4j, không hallucinate)

**Chương 4:**
- [ ] Có API Gateway (Nginx)
- [ ] Có JWT Auth (simplejwt)
- [ ] Có Docker/Podman chạy được
- [ ] Có flow order → payment → shipping

---

> [!NOTE]
> **Django 6.0 + psycopg3:** `psycopg[binary]>=3.1.12` — psycopg2 đang bị deprecated.

> [!NOTE]
> **TensorFlow + Python 3.12:** ổn định từ `tensorflow>=2.16`. Keras 3 là default, LSTM có sẵn trong `keras.layers`.

> [!NOTE]
> **Neo4j GraphRAG Architecture:**
> ```
> User Query → OpenAI Embedding → Neo4j Vector Search (semantic)
>                                → Cypher Traversal (structured)
>                                → Combined Context
>            → OpenAI Chat API (augmented prompt)
>            → Grounded Response
> ```
> Neo4j MCP pattern: ai-service expose Neo4j query capabilities as MCP tools,
> cho phép chatbot agent tự quyết định khi nào cần truy vấn knowledge graph.
