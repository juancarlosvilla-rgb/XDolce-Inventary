-- ============================================================
-- Script de migración para bases de datos existentes
-- Ejecutar SOLO si la base de datos ya fue creada previamente
-- ============================================================

-- IMPORTANTE: Ampliar el tipo de la columna movement_type (era VARCHAR(10), insuficiente)
ALTER TABLE inventory_movements ALTER COLUMN movement_type TYPE VARCHAR(30);

-- Agregar columnas faltantes a inventory_movements
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS provider VARCHAR(100);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS notes TEXT;

-- Agregar columnas faltantes a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

-- Crear tabla customers si no existe
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    document VARCHAR(50) UNIQUE
);

-- Migrar layaways: añadir columnas que puedan faltar
ALTER TABLE layaways ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE layaways ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE layaways ADD COLUMN IF NOT EXISTS notes TEXT;
-- Si existia customer_name, lo mantenemos por compatibilidad y lo ignoramos desde el codigo
