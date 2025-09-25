-- ==================== USUARIOS ====================
INSERT INTO usuario (usuario, correo, contrasena, rol, estacion, activo)
VALUES
('admin', 'admin@cevicheria.com', '$2a$12$7vDkq.sa0r5LXnhiXojYPuwRVZUL5vM1vBlx1xZUAH0RninkqmHVu', 'admin', NULL, 1),
('mozo1', 'mozo1@cevicheria.com', '$2a$12$7vDkq.sa0r5LXnhiXojYPuwRVZUL5vM1vBlx1xZUAH0RninkqmHVu', 'mozo', NULL, 1),
('mozo2', 'mozo2@cevicheria.com', '$2a$12$7vDkq.sa0r5LXnhiXojYPuwRVZUL5vM1vBlx1xZUAH0RninkqmHVu', 'mozo', NULL, 1),
('cocina1', 'cocina1@cevicheria.com', '$2a$12$7vDkq.sa0r5LXnhiXojYPuwRVZUL5vM1vBlx1xZUAH0RninkqmHVu', 'cocina', 'frio', 1),
('cocina2', 'cocina2@cevicheria.com', '$2a$12$7vDkq.sa0r5LXnhiXojYPuwRVZUL5vM1vBlx1xZUAH0RninkqmHVu', 'cocina', 'caliente', 1),
('cocina3', 'cocina3@cevicheria.com', '$2a$12$7vDkq.sa0r5LXnhiXojYPuwRVZUL5vM1vBlx1xZUAH0RninkqmHVu', 'cocina', 'barra', 1),
('caja1', 'caja1@cevicheria.com', '$2a$12$7vDkq.sa0r5LXnhiXojYPuwRVZUL5vM1vBlx1xZUAH0RninkqmHVu', 'caja', NULL, 1);

-- ==================== PISO Y ZONA ====================
INSERT INTO piso (nombre) VALUES
('Primer Piso'), ('Segundo Piso');

INSERT INTO zona (nombre, piso_id) VALUES
('Terraza', 1),
('Salón Principal', 1),
('Barra', 1),
('VIP', 2);

-- ==================== MESESAS CON QR ====================
INSERT INTO mesa (numero, zona_id, capacidad, estado, qr_codigo, tipo)
VALUES
('M01', 1, 4, 'disponible', 'QR001', 'regular'),
('M02', 1, 2, 'ocupada', 'QR002', 'booth'),
('M03', 2, 4, 'disponible', 'QR003', 'regular'),
('M04', 3, 2, 'disponible', 'QR004', 'barra'),
('VIP01', 4, 8, 'reservada', 'QR005', 'vip');

-- ==================== CATEGORÍAS ====================
INSERT INTO categoria (nombre, descripcion) VALUES
('Ceviches', 'Frios - ceviches y tiraditos'),
('Entradas Frías', 'Causas, ensaladas'),
('Platos Calientes', 'Sudados, arroces'),
('Bebidas', 'Jugos, gaseosas, cocteles'),
('Postres', 'Dulces y postres');

-- ==================== PRODUCTOS POR ESTACIÓN ====================
-- Fríos (4 productos)
INSERT INTO producto (nombre, descripcion, precio, categoria_id, tipo_estacion, tiempo_preparacion, nivel_picante, disponible)
VALUES
('Ceviche Clásico', 'Pescado fresco, ají limo y limón.', 32, 1, 'frio', 12, 'medio', 1),
('Tiradito Especial', 'Salsa acevichada y rocoto.', 33, 1, 'frio', 13, 'alto', 1),
('Causa Limeña', 'Con pollo y palta.', 18, 2, 'frio', 9, 'ninguno', 1),
('Ensalada de Pulpo', 'Pulpo a la parrilla.', 36, 2, 'frio', 14, 'bajo', 1);

-- Calientes (4 productos)
INSERT INTO producto (nombre, descripcion, precio, categoria_id, tipo_estacion, tiempo_preparacion, nivel_picante, disponible)
VALUES
('Arroz con Mariscos', 'Arroz con mariscos y toque de ají amarillo.', 42, 3, 'caliente', 15, 'medio', 1),
('Sudado de Pescado', 'Guiso de pescado, cebolla y tomate.', 37, 3, 'caliente', 16, 'medio', 1),
('Sopa Marina', 'Mariscos, pescado y hierbas.', 29, 3, 'caliente', 10, 'ninguno', 1),
('Jalea Mixta', 'Fritura de mariscos.', 39, 3, 'caliente', 12, 'ninguno', 1);

-- Bebidas (3 productos)
INSERT INTO producto (nombre, descripcion, precio, categoria_id, tipo_estacion, tiempo_preparacion, disponible)
VALUES
('Jugo de Maracuyá', 'Natural y fresco.', 7, 4, 'barra', 2, 1),
('Cerveza Artesanal', '300ml rubia o roja.', 13, 4, 'barra', 0, 1),
('Chicha Morada', 'Maíz morado y especias.', 6, 4, 'barra', 3, 1);

-- Postres (2 productos)
INSERT INTO producto (nombre, descripcion, precio, categoria_id, tipo_estacion, tiempo_preparacion, disponible)
VALUES
('Suspiro Limeño', 'Clásico de Lima.', 10, 5, 'postre', 4, 1),
('Mazamorra Morada', 'Postre de maíz morado.', 8, 5, 'postre', 3, 1);

-- ==================== INGREDIENTES Y VÍNCULO ====================
INSERT INTO ingrediente (nombre, stock, unidad) VALUES
('Pescado fresco', 60, 'kg'),
('Pulpo', 15, 'kg'),
('Mariscos mixtos', 20, 'kg'),
('Cebolla', 18, 'kg'),
('Limón', 22, 'kg'),
('Palta', 8, 'kg'),
('Ají amarillo', 13, 'kg'),
('Maíz Morado', 9, 'kg'),
('Maracuyá', 7, 'kg'),
('Cerveza', 40, 'botella');

INSERT INTO producto_ingrediente (producto_id, ingrediente_id, cantidad)
VALUES
(1, 1, 0.2), (1, 4, 0.04), (1, 5, 0.03), (1, 7, 0.01),
(2, 1, 0.16), (2, 5, 0.02), (2, 7, 0.01),
(4, 2, 0.12), (4, 5, 0.01), (4, 4, 0.02),
(5, 3, 0.35),
(9, 8, 0.13), (9, 7, 0.01),
(10, 10, 1.0);

-- ==================== PERMISOS TEMPORALES POR ÁREA ====================
INSERT INTO permiso_temporal (usuario_id, concedido_por, permiso, area, activo, creado_en, expira_en)
VALUES
(2, 1, 'acceso_vip', 'VIP', 1, NOW(), DATE_ADD(NOW(), INTERVAL 3 HOUR)),
(4, 1, 'gestionar_frios', 'frio', 1, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(5, 1, 'gestionar_calientes', 'caliente', 1, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR)),
(6, 1, 'gestionar_barra', 'barra', 1, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR));

-- ==================== WISHLIST POR QR Y ESTACIÓN ====================
INSERT INTO wishlist (qr_sesion_id, mesa_id, producto_id, creado_en)
VALUES
('SESIONFRIO', 1, 1, NOW()),
('SESIONCAL', 3, 5, NOW()),
('SESIONBARRA', 4, 9, NOW());

-- ==================== RESEÑAS DE EJEMPLO ====================
INSERT INTO resena (producto_id, nombre_cliente, puntuacion, comentario, aprobada, creado_en)
VALUES
(1, 'Javier', 5, '¡El mejor ceviche!', 1, NOW()),
(5, 'Laura', 5, 'Arroz con mariscos buenísimo.', 1, NOW()),
(9, 'Juan', 4, 'Limonada y chicha muy frescas.', 1, NOW()),
(11, 'Patricia', 4, 'Postre de Lima perfecto.', 1, NOW());
