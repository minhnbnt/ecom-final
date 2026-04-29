# Chương 2 — Phát triển Hệ E-Commerce Microservices

## 1. Yêu cầu chức năng (Functional Requirements)

- Quản lý sản phẩm đa domain: **book**, **electronics**, **fashion**
- Quản lý người dùng theo vai trò: **admin**, **staff**, **customer**
- Giỏ hàng (cart)
- Đặt hàng (order)
- Thanh toán (payment)
- Giao hàng (shipping)
- Tìm kiếm và gợi ý sản phẩm

## 2. Yêu cầu phi chức năng (Non-functional Requirements)

- **Scalability**: scale từng service độc lập
- **High Availability**: hệ thống luôn sẵn sàng
- **Security**: JWT, authentication
- **Maintainability**: dễ bảo trì

---

## 3. Phân rã hệ thống theo DDD

### Bounded Context → Microservice

| Bounded Context | Service | Database |
|---|---|---|
| User Context | `user-service` | MySQL |
| Product Context | `product-service` | PostgreSQL |
| Cart Context | `cart-service` | (tự chọn) |
| Order Context | `order-service` | (tự chọn) |
| Payment Context | `payment-service` | (tự chọn) |
| Shipping Context | `shipping-service` | (tự chọn) |

**Nguyên tắc:**
- Mỗi context = 1 database riêng
- Giao tiếp qua REST API, không truy cập DB của service khác

---

## 4. Thiết kế từng Service

### 4.1 Product Service (Django)

**Phân loại sản phẩm:**
- Book: giáo trình, tiểu thuyết
- Electronics: mobile, laptop, tủ lạnh, điều hòa
- Fashion: áo, quần, giày

**Model yêu cầu:**

```python
# Model tổng quát
Category(name)
Product(name, price, stock, category→FK)

# Domain cụ thể (OneToOne với Product)
Book(author, publisher, isbn)
Electronics(brand, warranty)
Fashion(size, color)
```

**API tối thiểu:**
```
GET  /products/
POST /products/
GET  /products/{id}
```

---

### 4.2 User Service (Django)

**Phân loại người dùng:**
- `admin` — toàn quyền hệ thống
- `staff` — xử lý đơn hàng, vận hành
- `customer` — mua hàng

**Model yêu cầu:**
```python
User(AbstractUser)(role: admin | staff | customer)
```

**Phân quyền RBAC:**
- Admin: CRUD toàn bộ
- Staff: xử lý order, shipping
- Customer: mua hàng, xem sản phẩm

**API tối thiểu:**
```
POST /auth/register
POST /auth/login
GET  /users/
```

---

### 4.3 Cart Service

**Model yêu cầu:**
```python
Cart(user_id)
CartItem(cart→FK, product_id, quantity)
```

**Logic:**
- Add product vào cart
- Update số lượng
- Remove item

**API tối thiểu:**
```
POST   /cart/add
GET    /cart/
DELETE /cart/remove
```

---

### 4.4 Order Service

**Model yêu cầu:**
```python
Order(user_id, total_price, status)
OrderItem(order→FK, product_id, quantity)
```

**Workflow:**
1. Tạo order từ cart
2. Gửi request sang `payment-service`
3. Sau thanh toán thành công → gọi `shipping-service`

---

### 4.5 Payment Service

**Model yêu cầu:**
```python
Payment(order_id, amount, status)
```

**Trạng thái:** `pending` → `success` / `failed`

**API tối thiểu:**
```
POST /payment/pay
GET  /payment/status
```

---

### 4.6 Shipping Service

**Model yêu cầu:**
```python
Shipment(order_id, address, status)
```

**Trạng thái:** `processing` → `shipping` → `delivered`

**API tối thiểu:**
```
POST /shipping/create
GET  /shipping/status
```

---

## 5. Luồng hệ thống tổng thể (End-to-End Flow)

```
1. User đăng nhập          → user-service
2. Xem sản phẩm            → product-service
3. Thêm vào giỏ hàng       → cart-service
4. Tạo đơn hàng            → order-service
5. Thanh toán              → payment-service
6. Giao hàng               → shipping-service
```

---

## 6. Yêu cầu thực hành

### 6.1 Class Diagram (Visual Paradigm)

**Các lớp cần vẽ:**

| Service | Lớp |
|---|---|
| Product Service | Product, Category, Book, Electronics, Fashion |
| User Service | User, Role |
| Order Service | Order, OrderItem |
| Cart Service | Cart, CartItem |
| Payment Service | Payment |
| Shipping Service | Shipment |

**Các quan hệ cần thể hiện:**

| Loại | Ví dụ |
|---|---|
| Association | Product → Category |
| Inheritance | Book / Electronics / Fashion kế thừa Product |
| Composition | Order chứa OrderItem |
| Multiplicity | `1..*` (one-to-many), `1..1` (one-to-one) |

**Yêu cầu nộp:** Export PNG/PDF từ Visual Paradigm, có đủ class + relationship + thuộc tính.

---

### 6.2 Database Schema

**Nguyên tắc mapping:**
```
Class      → Table
Attribute  → Column
Relationship → Foreign Key
```

**Database cho từng service:**

| Service | Database | Lý do |
|---|---|---|
| Product Service | **PostgreSQL** | Hỗ trợ JSON tốt, phù hợp dữ liệu phức tạp |
| User Service | **MySQL** | Phổ biến, phù hợp authentication |
| Các service còn lại | Tự chọn | Ghi rõ lý do trong bài |

**Schema tối thiểu cần có:**

```sql
-- Product Service (PostgreSQL)
category(id, name)
product(id, name, price, stock, category_id→FK)
book(product_id→PK, author, isbn)

-- User Service (MySQL)
user(id, username, password, role)

-- Cart Service
cart(id, user_id)
cart_item(id, cart_id, product_id, quantity)

-- Order Service
orders(id, user_id, total_price, status)
order_item(id, order_id, product_id, quantity)

-- Payment Service
payment(id, order_id, amount, status)

-- Shipping Service
shipment(id, order_id, address, status)
```

**So sánh MySQL vs PostgreSQL:**

| Tiêu chí | MySQL | PostgreSQL |
|---|---|---|
| Hiệu năng | Tốt | Tốt |
| Hỗ trợ JSON | Trung bình | Mạnh |
| Quan hệ phức tạp | Trung bình | Tốt |

---

## 7. Bài tập

- [ ] Vẽ Class Diagram đầy đủ cho toàn bộ hệ thống bằng Visual Paradigm
- [ ] Mapping Class Diagram → Database schema
- [ ] Triển khai database bằng MySQL và PostgreSQL

---

## 8. Checklist đánh giá

- [ ] Có sơ đồ Class Diagram đúng chuẩn UML
- [ ] Có mapping rõ ràng từ Class Diagram sang Database
- [ ] Database tách riêng từng service (không share DB)
- [ ] Có sử dụng cả MySQL lẫn PostgreSQL với lý do rõ ràng
