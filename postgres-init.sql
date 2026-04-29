-- Chạy tự động khi postgres container khởi tạo lần đầu
-- productdb được tạo tự động qua POSTGRES_DB env var

CREATE DATABASE cartdb;
CREATE DATABASE orderdb;
CREATE DATABASE paymentdb;
CREATE DATABASE shippingdb;

GRANT ALL PRIVILEGES ON DATABASE cartdb TO django;
GRANT ALL PRIVILEGES ON DATABASE orderdb TO django;
GRANT ALL PRIVILEGES ON DATABASE paymentdb TO django;
GRANT ALL PRIVILEGES ON DATABASE shippingdb TO django;
