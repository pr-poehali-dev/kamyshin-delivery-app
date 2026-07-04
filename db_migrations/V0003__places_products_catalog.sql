CREATE TABLE places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    section VARCHAR(10) NOT NULL DEFAULT 'food',
    address VARCHAR(255) NOT NULL,
    rating NUMERIC(2,1) DEFAULT 4.8,
    delivery_minutes INTEGER DEFAULT 35,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    place_id INTEGER NOT NULL REFERENCES places(id),
    name VARCHAR(160) NOT NULL,
    category VARCHAR(60),
    price INTEGER NOT NULL DEFAULT 0,
    weight VARCHAR(40),
    emoji VARCHAR(10) DEFAULT '🍽️',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_place ON products(place_id);

INSERT INTO places (name, section, address, rating, delivery_minutes) VALUES
('Пиццерия «Волга»', 'food', 'пр. Ленина, 20', 4.9, 35),
('ShaurmaBro', 'food', 'ул. Ленина, 8', 4.8, 25),
('Суши Рай', 'food', 'ул. Гагарина, 5', 4.7, 45),
('Бургер Хаус', 'food', 'ул. Октябрьская, 14', 4.6, 30),
('Рынок у моста', 'goods', 'ул. Мира, 2', 5.0, 40),
('Магнит', 'goods', 'ул. Мира, 15', 4.8, 30),
('Пятёрочка', 'goods', 'ул. Пролетарская, 30', 4.7, 35),
('Аптека+', 'goods', 'ул. Ленина, 25', 4.9, 30);

INSERT INTO products (place_id, name, category, price, weight, emoji) VALUES
(1, 'Пепперони 30см', 'Пицца', 549, '550 г', '🍕'),
(1, 'Маргарита 30см', 'Пицца', 449, '500 г', '🍕'),
(1, 'Комбо на двоих', 'Комбо', 899, '1200 г', '🍱'),
(2, 'Шаурма XL с курицей', 'Шаурма', 289, '450 г', '🌯'),
(2, 'Шаурма с говядиной', 'Шаурма', 329, '450 г', '🌯'),
(3, 'Сет «Камышинский»', 'Суши', 890, '1100 г', '🍣'),
(3, 'Филадельфия', 'Суши', 490, '250 г', '🍣'),
(4, 'Двойной чизбургер', 'Бургеры', 399, '380 г', '🍔'),
(4, 'Куриный бургер', 'Бургеры', 299, '320 г', '🍔'),
(5, 'Арбуз камышинский, 5кг', 'Фрукты', 350, '5 кг', '🍉'),
(6, 'Молоко 3.2%, 1л', 'Бакалея', 89, '1 л', '🥛'),
(6, 'Хлеб бородинский', 'Бакалея', 45, '400 г', '🍞'),
(7, 'Чипсы Lays, 150г', 'Снеки', 149, '150 г', '🥔'),
(7, 'Кока-Кола 1л', 'Напитки', 99, '1 л', '🥤'),
(8, 'Детское пюре, 6шт', 'Детское', 420, '600 г', '🍼');