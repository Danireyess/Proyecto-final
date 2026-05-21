CREATE DATABASE IF NOT EXISTS bluey_db;
USE bluey_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'admin') DEFAULT 'cliente',
    direccion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    paletteIdx INT
);

-- 3. TABLA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referencia VARCHAR(20) UNIQUE NOT NULL,
    usuario_id INT NOT NULL,
    fecha VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'EN PROCESO',
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. TABLA DETALLES DE PEDIDO
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ── INSERCIÓN DE ADMINISTRADOR DE PRUEBA ──
-- Email: admin@bluey.com | Contraseña: admin
INSERT INTO usuarios (nombre, email, password, rol, direccion) 
VALUES ('Administrador Global', 'admin@bluey.com', 'admin', 'admin', 'Oficinas Centrales')
ON DUPLICATE KEY UPDATE id=id;

-- ── INSERCIÓN DEL CATÁLOGO ORIGINAL COMPLETO ──
INSERT INTO productos (id, nombre, precio, categoria, icon, paletteIdx) VALUES
(1, 'CHAMARRA ESTRUCTURA', 1299.00, 'mujer', 'chamarra', 0),
(3, 'PANTALÓN WIDE LEG', 899.00, 'mujer', 'pantalon', 2),
(4, 'VESTIDO LENCERO', 749.00, 'mujer', 'vestido', 3),
(5, 'FALDA MIDI', 649.00, 'mujer', 'falda', 4),
(6, 'TOP HALTER', 449.00, 'mujer', 'top', 5),
(23, 'BUFANDA LANA', 599.00, 'mujer', 'bufanda', 6),
(24, 'BOLSO TOTE', 1099.00, 'mujer', 'bolso', 7),
(7, 'CAMISA LINO', 799.00, 'hombre', 'camisa', 0),
(8, 'PANTALÓN CHINO', 849.00, 'hombre', 'pantalon', 1),
(9, 'PLAYERA ESSENTIAL', 699.00, 'hombre', 'playera', 2),
(10, 'CAMISETA BÁSICA', 349.00, 'hombre', 'camiseta', 3),
(11, 'TENIS', 999.00, 'hombre', 'tenis', 4),
(12, 'POLO PIQUÉ', 549.00, 'hombre', 'polo', 5),
(13, 'CONJUNTO NIÑO', 499.00, 'niños', 'conjunto', 0),
(14, 'VESTIDO NIÑA FLORAL', 429.00, 'niños', 'vestido', 1),
(15, 'SUDADERA NIÑO PRINT', 379.00, 'niños', 'sudadera', 2),
(16, 'PLAYERA ESSENTIAL KIDS', 299.00, 'niños', 'camisa', 3),
(17, 'SÉRUM VITAMINA C', 549.00, 'beauty', 'serum', 0),
(18, 'CREMA HIDRATANTE', 449.00, 'beauty', 'crema', 1),
(19, 'MASCARILLA ARCILLA', 299.00, 'beauty', 'mascarilla', 2),
(20, 'ACEITE FACIAL', 649.00, 'beauty', 'aceite', 3),
(21, 'TÓNICO CALMANTE', 349.00, 'beauty', 'tonico', 4)
ON DUPLICATE KEY UPDATE id=id;