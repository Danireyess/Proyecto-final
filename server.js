const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (index.html, App.js, style.css)
app.use(express.static(__dirname));

// Conexión a SQLite
const db = new sqlite3.Database(path.join(__dirname, 'bluey.db'), (err) => {
    if (err) return console.error("Error al crear el archivo SQLite:", err.message);
    console.log("Base de datos SQLite conectada con éxito (Archivo: bluey.db)");
});

// ── CREAR TODAS LAS TABLAS SI NO EXISTEN ──
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT DEFAULT 'cliente',
            direccion TEXT DEFAULT ''
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS productos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            precio REAL NOT NULL,
            categoria TEXT NOT NULL,
            icon TEXT,
            paletteIdx INTEGER
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referencia TEXT UNIQUE NOT NULL,
            usuario_id INTEGER NOT NULL,
            fecha TEXT NOT NULL,
            status TEXT DEFAULT 'EN PROCESO',
            total REAL NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS detalles_pedido (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id INTEGER NOT NULL,
            producto_id INTEGER NOT NULL,
            cantidad INTEGER NOT NULL,
            precio_unitario REAL NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        )
    `);

    // Insertar admin por defecto
    db.run(`
        INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, direccion)
        VALUES ('Administrador Global', 'admin@bluey.com', 'admin', 'admin', 'Oficinas Centrales')
    `);

    // Insertar catálogo de productos por defecto si la tabla está vacía
    db.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
        if (!err && row.count === 0) {
            const productos = [
                [1,  'CHAMARRA ESTRUCTURA',     1299, 'mujer',  'chamarra',   0],
                [3,  'PANTALÓN WIDE LEG',         899, 'mujer',  'pantalon',   2],
                [4,  'VESTIDO LENCERO',            749, 'mujer',  'vestido',    3],
                [5,  'FALDA MIDI',                 649, 'mujer',  'falda',      4],
                [6,  'TOP HALTER',                 449, 'mujer',  'top',        5],
                [23, 'BUFANDA LANA',               599, 'mujer',  'bufanda',    6],
                [24, 'BOLSO TOTE',                1099, 'mujer',  'bolso',      7],
                [7,  'CAMISA LINO',                799, 'hombre', 'camisa',     0],
                [8,  'PANTALÓN CHINO',             849, 'hombre', 'pantalon',   1],
                [9,  'PLAYERA ESSENTIAL',          699, 'hombre', 'playera',    2],
                [10, 'CAMISETA BÁSICA',            349, 'hombre', 'camiseta',   3],
                [11, 'TENIS',                      999, 'hombre', 'tenis',      4],
                [12, 'POLO PIQUÉ',                 549, 'hombre', 'polo',       5],
                [13, 'CONJUNTO NIÑO',              499, 'niños',  'conjunto',   0],
                [14, 'VESTIDO NIÑA FLORAL',        429, 'niños',  'vestido',    1],
                [15, 'SUDADERA NIÑO PRINT',        379, 'niños',  'sudadera',   2],
                [16, 'PLAYERA ESSENTIAL KIDS',     299, 'niños',  'camisa',     3],
                [17, 'SÉRUM VITAMINA C',           549, 'beauty', 'serum',      0],
                [18, 'CREMA HIDRATANTE',           449, 'beauty', 'crema',      1],
                [19, 'MASCARILLA ARCILLA',         299, 'beauty', 'mascarilla', 2],
                [20, 'ACEITE FACIAL',              649, 'beauty', 'aceite',     3],
                [21, 'TÓNICO CALMANTE',            349, 'beauty', 'tonico',     4],
            ];
            const stmt = db.prepare(
                "INSERT OR IGNORE INTO productos (id, nombre, precio, categoria, icon, paletteIdx) VALUES (?,?,?,?,?,?)"
            );
            productos.forEach(p => stmt.run(p));
            stmt.finalize();
            console.log("Catálogo de productos insertado correctamente.");
        }
    });
});

// ── RUTA DE REGISTRO ──
app.post('/api/register', (req, res) => {
    const { nombre, email, password, rol, direccion } = req.body;
    const query = 'INSERT INTO usuarios (nombre, email, password, rol, direccion) VALUES (?, ?, ?, ?, ?)';
    db.run(query, [nombre, email, password, rol || 'cliente', direccion || ''], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ message: "El correo ya está registrado" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, nombre, email, rol: rol || 'cliente', direccion });
    });
});

// ── RUTA DE LOGIN ──
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM usuarios WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ message: "Credenciales incorrectas" });
        res.json({ id: row.id, email: row.email, nombre: row.nombre, rol: row.rol });
    });
});

// OBTENER TODOS LOS PRODUCTOS
// Nota: el frontend usa p.category, así que renombramos categoria → category
app.get('/api/productos', (req, res) => {
    db.all('SELECT id, nombre, precio, categoria AS category, icon, paletteIdx FROM productos', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// AGREGAR PRODUCTO (Admin)
app.post('/api/productos', (req, res) => {
    const { nombre, precio, categoria } = req.body;
    db.run(
        'INSERT INTO productos (nombre, precio, categoria) VALUES (?, ?, ?)',
        [nombre, precio, categoria],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, nombre, precio, category: categoria });
        }
    );
});

//ELIMINAR PRODUCTO (Admin)
app.delete('/api/productos/:id', (req, res) => {
    db.run('DELETE FROM productos WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// OBTENER PEDIDOS (cliente ve los suyos, admin ve todos)
app.get('/api/pedidos', (req, res) => {
    const { usuario_id, rol } = req.query;
    let query, params;

    if (rol === 'admin') {
        query = `
            SELECT p.*, u.nombre AS cliente_nombre
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.id DESC
        `;
        params = [];
    } else {
        query = `
            SELECT p.*, u.nombre AS cliente_nombre
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.usuario_id = ?
            ORDER BY p.id DESC
        `;
        params = [usuario_id];
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREAR PEDIDO 
app.post('/api/pedidos', (req, res) => {
    const { referencia, usuario_id, fecha, total, items } = req.body;
    db.run(
        'INSERT INTO pedidos (referencia, usuario_id, fecha, total) VALUES (?, ?, ?, ?)',
        [referencia, usuario_id, fecha, total],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const pedidoId = this.lastID;
            const stmt = db.prepare(
                'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)'
            );
            items.forEach(i => stmt.run([pedidoId, i.id, i.qty, i.price]));
            stmt.finalize();
            res.status(201).json({ id: pedidoId, referencia });
        }
    );
});

// DETALLES DE UN PEDIDO 
app.get('/api/pedidos/:id/detalles', (req, res) => {
    const query = `
        SELECT dp.cantidad, dp.precio_unitario, pr.nombre
        FROM detalles_pedido dp
        JOIN productos pr ON dp.producto_id = pr.id
        WHERE dp.pedido_id = ?
    `;
    db.all(query, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// INICIAR SERVIDOR 
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});