-- Enable pgcrypto extension for secure UUID generation 
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================
-- Creation of ENUM types
-- =====================================
CREATE TYPE enum_users_role AS ENUM ('admin', 'user');
CREATE TYPE enum_products_type AS ENUM ('manuscript', 'historical_cartography', 'photograph',
                                    'painting', 'map', 'document', 'newspaper', 'book');
CREATE TYPE enum_purchases_type AS ENUM ('standard','gift','additional_download');

-- =====================================
-- Creation of tables
-- =====================================

-- USERS table
CREATE TABLE IF NOT EXISTS users (
    id_user SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role enum_users_role NOT NULL,
    tokens FLOAT DEFAULT 20
);

-- PRODUCTS table
CREATE TABLE IF NOT EXISTS products (
    id_product SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    type enum_products_type NOT NULL,
    year INT NOT NULL,
    format VARCHAR(10) NOT NULL,       -- jpg, png, mp4
    cost FLOAT NOT NULL,
    path VARCHAR(255) NOT NULL
);

-- PURCHASES table
CREATE TABLE IF NOT EXISTS purchases (
    id_purchase SERIAL PRIMARY KEY,
    buyer_id INT NOT NULL REFERENCES users(id_user),
    recipient_id INT REFERENCES users(id_user),         -- user who receives the gift 
    recipient_email VARCHAR(255),                  -- optional, stored for logging purposes
    product_id INT NOT NULL REFERENCES products(id_product),
    type enum_purchases_type NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- DOWNLOADS table
CREATE TABLE IF NOT EXISTS downloads (
    id_download SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(id_purchase),
    download_url UUID NOT NULL DEFAULT gen_random_uuid(), -- secure unique link
    times_used INT DEFAULT 0,
    max_times INT NOT NULL,      -- 1 for normal purchase, 2 for gift
    expires_at TIMESTAMP,        -- optional, link expiration
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================

-- USERS seed

-- Admin: Giovanni Ferri / password: admin123
INSERT INTO users (first_name, last_name, email, password, role, tokens) VALUES
('Giovanni', 'Ferri', 'giovanni.ferri@example.com',
'$2a$10$E0wk9PcxmEPnKxfdIf4zJez7MIg/fh3c.HxZ9ZyjnwVHkNWnma64y', 
'admin', 0);

-- Mario Rossi / password: mario123
INSERT INTO users (first_name, last_name, email, password, role, tokens) VALUES
('Mario', 'Rossi', 'mario.rossi@example.com',
'$2a$10$6FKB6rRyhUY71RWUn5/55Od7X2GwmAvtXkA58Y4fY/Pn6uZe0bK3.',  
'user', 20);

-- Luigi Bianchi / password: luigi123
INSERT INTO users (first_name, last_name, email, password, role, tokens) VALUES
('Luigi', 'Bianchi', 'luigi.bianchi@example.com',
'$2a$10$WXl9OlCrZMjiLS2luhdad.gO2Rn4JvNtBop1pnoDFvCfN5fNhR6Yy',  
'user', 20);

-- Anna Verdi / password: anna123
INSERT INTO users (first_name, last_name, email, password, role, tokens) VALUES
('Anna', 'Verdi', 'anna.verdi@example.com',
'$2a$10$YrUW9iAuZP/MHAu3sRla5uUrH8SX00.Tl.R9HAJQ/ek8ddaxpj1wu',  
'user', 20);

-- Paolo Neri / password: paolo123
INSERT INTO users (first_name, last_name, email, password, role, tokens) VALUES
('Paolo', 'Neri', 'paolo.neri@example.com',
'$2a$10$ICNU23xHtYIPGfbagEWbhu9VdlU1IljW/b2Asockpb7qrNL.Zkur6', 
'user', 20);


-- PRODUCTS seed

INSERT INTO products (title, type, year, format, cost, path) VALUES
('Ancient Manuscript', 'manuscript', 1620, 'jpg', 5, '/usr/src/app/uploads/manuscript1620.jpg'),
('Historic Map', 'historical_cartography', 1780, 'png', 7, '/usr/src/app/uploads/map1780.png'),
('Restoration Video', 'historical_cartography', 1900, 'mp4', 8, '/usr/src/app/uploads/restoration1900.mp4'),
('Old Photograph', 'photograph', 1925, 'jpg', 4, '/usr/src/app/uploads/photo1925.jpg'),
('Historic Newspaper', 'newspaper', 1912, 'png', 6, '/usr/src/app/uploads/newspaper1912.png');


-- PURCHASES seed

INSERT INTO purchases (buyer_id, product_id, type)
VALUES (2, 1, 'standard');

INSERT INTO purchases (buyer_id, product_id, type)
VALUES (3, 2, 'standard');

INSERT INTO purchases (buyer_id, recipient_id, recipient_email, product_id, type)
VALUES (4, 5, 'paolo.neri@example.com', 4, 'gift');

INSERT INTO purchases (buyer_id, product_id, type)
VALUES (2, 1, 'additional_download');


-- DOWNLOADS seed

INSERT INTO downloads (purchase_id, max_times)
VALUES (1, 1);

INSERT INTO downloads (purchase_id, max_times)
VALUES (2, 1);

INSERT INTO downloads (purchase_id, max_times)
VALUES (3, 2);

INSERT INTO downloads (purchase_id, max_times)
VALUES (4, 1);