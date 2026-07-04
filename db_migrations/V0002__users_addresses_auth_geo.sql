CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    district VARCHAR(60) NOT NULL,
    address VARCHAR(255) NOT NULL,
    comment VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    lat NUMERIC(10,6),
    lon NUMERIC(10,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_codes_phone ON auth_codes(phone);
CREATE INDEX idx_addresses_user ON addresses(user_id);

ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN pickup_lat NUMERIC(10,6);
ALTER TABLE orders ADD COLUMN pickup_lon NUMERIC(10,6);
ALTER TABLE orders ADD COLUMN delivery_lat NUMERIC(10,6);
ALTER TABLE orders ADD COLUMN delivery_lon NUMERIC(10,6);

ALTER TABLE couriers ADD COLUMN lat NUMERIC(10,6) DEFAULT 50.078;
ALTER TABLE couriers ADD COLUMN lon NUMERIC(10,6) DEFAULT 45.383;

UPDATE orders SET
  pickup_lat = 50.0785, pickup_lon = 45.3850,
  delivery_lat = 50.0720, delivery_lon = 45.3920
WHERE id = 1;
UPDATE orders SET
  pickup_lat = 50.0810, pickup_lon = 45.3780,
  delivery_lat = 50.0650, delivery_lon = 45.3980
WHERE id = 2;
UPDATE orders SET
  pickup_lat = 50.0900, pickup_lon = 45.3700,
  delivery_lat = 50.0580, delivery_lon = 45.4050
WHERE id = 3;