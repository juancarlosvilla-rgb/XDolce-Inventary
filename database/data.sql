-- ============================================================
-- Datos iniciales del sistema X Dolce
-- Ejecutar después de schema.sql
-- ============================================================

-- Insertar usuario administrador (contraseña: 123456)
INSERT INTO users (full_name, email, username, password_hash, role) VALUES 
('Administrador', 'admin@xdolce.com', 'admin', '123456', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Insertar categorías
INSERT INTO categories (name, description) VALUES 
('Gafas', 'Gafas de sol y accesorios ópticos'),
('Audio', 'Audífonos, parlantes y accesorios de audio'),
('Gorras', 'Gorras de diseño y moda urbana'),
('Relojes', 'Relojes analógicos y digitales de lujo'),
('Accesorios', 'Otros accesorios de moda y lujo')
ON CONFLICT (name) DO NOTHING;

-- Nota: Los productos los crea el usuario manualmente desde la interfaz.
-- No se insertan productos predeterminados según requerimiento del sistema.
