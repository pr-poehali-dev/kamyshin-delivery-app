CREATE TABLE couriers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    has_child_seat BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20),
    section VARCHAR(10) NOT NULL DEFAULT 'food',
    place VARCHAR(160) NOT NULL,
    pickup_address VARCHAR(255) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL,
    district VARCHAR(60) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total_price INTEGER NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
    comment TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    courier_id INTEGER REFERENCES couriers(id),
    eta_minutes INTEGER DEFAULT 35,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_courier ON orders(courier_id);

INSERT INTO couriers (name, phone, has_child_seat, is_online) VALUES
('Алексей В.', '+79271234567', TRUE, TRUE),
('Дмитрий К.', '+79371234568', FALSE, TRUE);

INSERT INTO orders (customer_name, customer_phone, section, place, pickup_address, delivery_address, district, items, total_price, payment_method, comment, status, eta_minutes) VALUES
('Ирина', '+79051112233', 'food', 'ShaurmaBro', 'ул. Ленина, 8', 'ул. Пролетарская, 12, кв. 45', 'Центр', '[{"name":"Шаурма XL с курицей","qty":2,"price":289}]', 578, 'card', 'Позвонить в домофон 45', 'new', 25),
('Сергей', '+79052223344', 'food', 'Пиццерия «Волга»', 'пр. Ленина, 20', 'ул. Некрасова, 7, кв. 3', '5-й микрорайон', '[{"name":"Пепперони 30см","qty":1,"price":549}]', 549, 'cash', 'Постучать в дверь, звонок не работает', 'new', 35),
('Мария', '+79053334455', 'goods', 'Магнит', 'ул. Мира, 15', 'ул. Ташкентская, 3, кв. 88', 'Текстильщики', '[{"name":"Молоко 3.2%, 1л","qty":3,"price":89},{"name":"Чипсы Lays, 150г","qty":2,"price":149}]', 565, 'card', NULL, 'new', 40);