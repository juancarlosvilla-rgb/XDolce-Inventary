-- ============================================================
-- X Dolce Inventory System - Schema completo
-- Ejecutar en orden. Si las tablas ya existen, use el script
-- de migracion alter_schema.sql para agregar columnas faltantes.
-- ============================================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
);

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    document VARCHAR(50) UNIQUE
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    stock_level INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(15, 2) NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

-- Crear tabla de movimientos de inventario (entradas, salidas, histórico)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    movement_type VARCHAR(30) NOT NULL, -- IN, OUT, CREATE_PRODUCT, EDIT_PRODUCT, DELETE_PRODUCT, LAYAWAY_CREATE, LAYAWAY_PAYMENT, LAYAWAY_CANCEL
    quantity INTEGER NOT NULL DEFAULT 0,
    movement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    provider VARCHAR(100),
    reference VARCHAR(100),
    notes TEXT
);

-- Crear tabla de apartados (layaways)
CREATE TABLE IF NOT EXISTS layaways (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'READY', 'CANCELLED'
    notes TEXT
);

-- Crear tabla de ventas (POS)
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    total_amount DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    sale_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Crear tabla de items de venta
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL
);
