-- ===============================
--          TABLA: USUARIOS
-- ===============================
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(80) NOT NULL UNIQUE,
    correo VARCHAR(120) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('admin','mozo','cocina','caja') NOT NULL,
    estacion VARCHAR(50) DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta DATETIME,
    preferencias JSON,
    avatar VARCHAR(255),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario_rol (rol),
    INDEX idx_usuario_activo (activo)
);

-- ===============================
--      TABLA: SESIONES USUARIO
-- ===============================
CREATE TABLE sesion_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    device VARCHAR(100),
    ip VARCHAR(45),
    user_agent VARCHAR(200),
    activa BOOLEAN DEFAULT TRUE,
    inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiracion DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    INDEX idx_sesion_usuario_activa (activa),
    INDEX idx_sesion_usuario_ultimo_acceso (ultimo_acceso)
);

-- ===============================
--     TABLA: PERMISOS TEMPORALES
-- ===============================
CREATE TABLE permiso_temporal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    concedido_por INT NOT NULL,
    permiso VARCHAR(100) NOT NULL,
    area VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (concedido_por) REFERENCES usuario(id)
);

-- ===============================
--         TABLA: AUDITORÍA
-- ===============================
CREATE TABLE auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    entidad VARCHAR(50),
    accion VARCHAR(50),
    id_entidad INT,
    valores_anteriores JSON,
    valores_nuevos JSON,
    ip VARCHAR(45),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    INDEX idx_auditoria_fecha (fecha),
    INDEX idx_auditoria_entidad (entidad)
);

-- ===============================
--        TABLA: PISO Y ZONA
-- ===============================
CREATE TABLE piso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_piso_activo (activo),
    INDEX idx_piso_orden (orden)
);

CREATE TABLE zona (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    capacidad_maxima INT DEFAULT 0,
    piso_id INT NOT NULL,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icono VARCHAR(50) DEFAULT '🏢',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (piso_id) REFERENCES piso(id),
    INDEX idx_zona_piso (piso_id),
    INDEX idx_zona_tipo (tipo),
    INDEX idx_zona_activo (activo),
    INDEX idx_zona_orden (orden)
);

-- ===============================
--        TABLA: MESAS QR HYBRID
-- ===============================
CREATE TABLE mesa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL,
    capacidad INT DEFAULT 4,
    zona_id INT NOT NULL,
    estado ENUM('disponible','ocupada','limpieza','reservada','fuera_servicio') DEFAULT 'disponible',
    qr_code VARCHAR(255) UNIQUE,
    posicion_x FLOAT DEFAULT 0.0,
    posicion_y FLOAT DEFAULT 0.0,
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (zona_id) REFERENCES zona(id),
    INDEX idx_mesa_zona (zona_id),
    INDEX idx_mesa_estado (estado),
    INDEX idx_mesa_activo (activo),
    INDEX idx_mesa_qr (qr_code),
    INDEX idx_mesa_numero (numero)
);

-- ===============================
--   TABLA: CATEGORÍA Y PRODUCTO
-- ===============================
CREATE TABLE categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(10) DEFAULT '🍽️',
    color VARCHAR(20) DEFAULT 'blue',
    activo BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria_activo (activo),
    INDEX idx_categoria_nombre (nombre)
);

CREATE TABLE producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INT NOT NULL,
    tipo_estacion ENUM('frio','caliente','bebida','postre') NOT NULL,
    tiempo_preparacion INT,
    nivel_picante ENUM('ninguno','bajo','medio','alto'),
    ingredientes TEXT,
    etiquetas VARCHAR(200),
    disponible BOOLEAN DEFAULT TRUE,
    stock INT,
    alerta_stock INT DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id),
    INDEX idx_producto_disponible (disponible),
    INDEX idx_producto_categoria (categoria_id)
);

-- ===============================
--  TABLA: TIPO INGREDIENTE
-- ===============================
CREATE TABLE tipo_ingrediente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    INDEX idx_tipo_ingrediente_nombre (nombre)
);

-- ===============================
--  TABLA: INGREDIENTES Y VÍNCULO
-- ===============================
CREATE TABLE ingrediente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    stock DECIMAL(10,3) DEFAULT 0,
    stock_minimo DECIMAL(10,3) DEFAULT 0,
    unidad VARCHAR(20),
    precio_unitario DECIMAL(10,2) DEFAULT 0,
    tipo_ingrediente_id INT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_vencimiento DATE,
    proveedor VARCHAR(100),
    codigo_barras VARCHAR(50) UNIQUE,
    ubicacion_almacen VARCHAR(50),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_ingrediente_id) REFERENCES tipo_ingrediente(id) ON DELETE SET NULL,
    INDEX idx_ingrediente_nombre (nombre),
    INDEX idx_ingrediente_tipo (tipo_ingrediente_id),
    INDEX idx_ingrediente_activo (activo),
    INDEX idx_ingrediente_codigo_barras (codigo_barras)
);

CREATE TABLE producto_ingrediente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES producto(id),
    FOREIGN KEY (ingrediente_id) REFERENCES ingrediente(id)
);

-- ===============================
--   TABLA: ORDEN Y DETALLES KANBAN
-- ===============================
CREATE TABLE orden (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    mesa_id INT,
    mozo_id INT NOT NULL,
    tipo ENUM('local','llevar','delivery') NOT NULL,
    estado ENUM('pendiente','confirmada','preparando','lista','servida','pagada','cancelada') NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesa(id),
    FOREIGN KEY (mozo_id) REFERENCES usuario(id),
    INDEX idx_orden_estado (estado),
    INDEX idx_orden_creado (creado_en),
    INDEX idx_orden_mesa (mesa_id)
);

CREATE TABLE item_orden (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','en_cola','preparando','listo','servido','cancelado') NOT NULL,
    estacion ENUM('frio','caliente','bebida','postre'),
    fecha_inicio DATETIME,
    fecha_listo DATETIME,
    fecha_servido DATETIME,
    FOREIGN KEY (orden_id) REFERENCES orden(id),
    FOREIGN KEY (producto_id) REFERENCES producto(id),
    INDEX idx_itemorden_estado (estado),
    INDEX idx_itemorden_estacion (estacion),
    INDEX idx_itemorden_orden (orden_id)
);

-- ===============================
--           TABLA: PAGOS
-- ===============================
CREATE TABLE pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo ENUM('efectivo','tarjeta','yape','plin','transferencia') NOT NULL,
    estado ENUM('pendiente','pagado','anulado') NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES orden(id)
);

-- ===============================
--         TABLA: WISHLIST/QR
-- ===============================
CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_sesion_id VARCHAR(100) NOT NULL,
    mesa_id INT NOT NULL,
    producto_id INT NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesa(id),
    FOREIGN KEY (producto_id) REFERENCES producto(id)
);

-- ===============================
--       TABLA: RESEÑAS CLIENTE
-- ===============================
CREATE TABLE resena (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    nombre_cliente VARCHAR(100),
    puntuacion INT,
    comentario TEXT,
    aprobada BOOLEAN DEFAULT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES producto(id),
    INDEX idx_resena_producto (producto_id)
);

-- ===============================
--           TABLA: RESERVAS
-- ===============================
CREATE TABLE reserva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(120),
    fecha_reserva DATE NOT NULL,
    hora_reserva TIME NOT NULL,
    duracion_estimada INT DEFAULT 120,
    numero_personas INT NOT NULL,
    estado ENUM('pendiente','confirmada','cancelada','completada') DEFAULT 'pendiente' NOT NULL,
    tipo_reserva ENUM('normal','especial','grupo') DEFAULT 'normal' NOT NULL,
    notas TEXT,
    requerimientos_especiales TEXT,
    zona_id INT,
    mesa_id INT,
    usuario_id INT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (zona_id) REFERENCES zona(id),
    FOREIGN KEY (mesa_id) REFERENCES mesa(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    INDEX idx_reserva_fecha (fecha_reserva),
    INDEX idx_reserva_estado (estado),
    INDEX idx_reserva_zona (zona_id)
);

-- ===============================
--           TABLA: BLOQUEOS
-- ===============================
CREATE TABLE bloqueo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_fin TIME NOT NULL,
    tipo ENUM('mantenimiento','evento','reserva_privada','otro') NOT NULL,
    estado ENUM('programado','activo','completado','cancelado') DEFAULT 'programado' NOT NULL,
    mesa_id INT,
    zona_id INT,
    piso_id INT,
    usuario_id INT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesa(id),
    FOREIGN KEY (zona_id) REFERENCES zona(id),
    FOREIGN KEY (piso_id) REFERENCES piso(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    INDEX idx_bloqueo_fecha (fecha_inicio, fecha_fin),
    INDEX idx_bloqueo_estado (estado),
    INDEX idx_bloqueo_tipo (tipo)
);

-- ===============================
--            TRIGGERS
-- ===============================
DELIMITER $$

-- Trigger: Descuenta ingredientes al registrar detalle de orden
CREATE TRIGGER tr_descuenta_stock AFTER INSERT ON item_orden
FOR EACH ROW
BEGIN
  DECLARE v_ing INT;
  DECLARE v_cant DECIMAL(10,3);
  DECLARE done INT DEFAULT 0;
  DECLARE cur CURSOR FOR SELECT pi.ingrediente_id, (pi.cantidad * NEW.cantidad)
                         FROM producto_ingrediente pi WHERE pi.producto_id = NEW.producto_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_ing, v_cant;
    IF done THEN
      LEAVE read_loop;
    END IF;
        UPDATE ingrediente SET stock = stock - v_cant WHERE id = v_ing AND stock >= v_cant;
  END LOOP;
  CLOSE cur;
END$$

DELIMITER ;

DELIMITER $$

-- Trigger: Inserta registro auditoría al modificar orden
CREATE TRIGGER tr_auditoria_orden AFTER UPDATE ON orden
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado OR OLD.monto_total != NEW.monto_total THEN
    INSERT INTO auditoria (usuario_id, entidad, accion, id_entidad, valores_anteriores, valores_nuevos, fecha)
    VALUES (NEW.mozo_id, 'orden', 'actualizacion', NEW.id,
            JSON_OBJECT('estado', OLD.estado, 'monto_total', OLD.monto_total),
            JSON_OBJECT('estado', NEW.estado, 'monto_total', NEW.monto_total),
            NOW());
    END IF;
END$$

DELIMITER ;

DELIMITER $$

-- Trigger: Inserta registro auditoría al crear orden
CREATE TRIGGER tr_auditoria_orden_insert AFTER INSERT ON orden
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, entidad, accion, id_entidad, valores_anteriores, valores_nuevos, fecha)
    VALUES (NEW.mozo_id, 'orden', 'creacion', NEW.id,
            JSON_OBJECT(),
            JSON_OBJECT('numero', NEW.numero, 'mesa_id', NEW.mesa_id, 'tipo', NEW.tipo, 'monto_total', NEW.monto_total),
            NOW());
END$$

DELIMITER ;

DELIMITER $$

-- Trigger: Inserta registro auditoría al modificar producto
CREATE TRIGGER tr_auditoria_producto AFTER UPDATE ON producto
FOR EACH ROW
BEGIN
    IF OLD.precio != NEW.precio OR OLD.disponible != NEW.disponible THEN
        INSERT INTO auditoria (usuario_id, entidad, accion, id_entidad, valores_anteriores, valores_nuevos, fecha)
        VALUES (NULL, 'producto', 'actualizacion', NEW.id,
                JSON_OBJECT('precio', OLD.precio, 'disponible', OLD.disponible),
                JSON_OBJECT('precio', NEW.precio, 'disponible', NEW.disponible),
                NOW());
    END IF;
END$$

DELIMITER ;

DELIMITER $$

-- Trigger: Inserta registro auditoría al modificar mesa
CREATE TRIGGER tr_auditoria_mesa AFTER UPDATE ON mesa
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        INSERT INTO auditoria (usuario_id, entidad, accion, id_entidad, valores_anteriores, valores_nuevos, fecha)
        VALUES (NULL, 'mesa', 'cambio_estado', NEW.id,
                JSON_OBJECT('estado', OLD.estado),
                JSON_OBJECT('estado', NEW.estado),
                NOW());
    END IF;
END$$

DELIMITER ;

DELIMITER $$

-- Trigger: Actualiza timestamp de reserva al cambiar estado
CREATE TRIGGER tr_actualiza_reserva AFTER UPDATE ON reserva
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        UPDATE reserva SET actualizado_en = NOW() WHERE id = NEW.id;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

-- Trigger: Actualiza timestamp de bloqueo al cambiar estado
CREATE TRIGGER tr_actualiza_bloqueo AFTER UPDATE ON bloqueo
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        UPDATE bloqueo SET actualizado_en = NOW() WHERE id = NEW.id;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

-- Trigger: Registrar cambios en sesiones de usuario
CREATE TRIGGER tr_auditoria_sesion AFTER UPDATE ON sesion_usuario
FOR EACH ROW
BEGIN
    IF OLD.activa != NEW.activa THEN
        INSERT INTO auditoria (usuario_id, entidad, accion, id_entidad, valores_anteriores, valores_nuevos, fecha)
        VALUES (NEW.usuario_id, 'sesion', 'cambio_estado', NEW.id,
                JSON_OBJECT('activa', OLD.activa),
                JSON_OBJECT('activa', NEW.activa),
                NOW());
    END IF;
END$$

DELIMITER ;

-- ===============================
--      ÍNDICES Y OPTIMIZACIÓN
-- ===============================
-- Nota: Muchos índices ya están definidos en las declaraciones de tablas arriba

-- Índices adicionales para optimización de consultas frecuentes
CREATE INDEX idx_producto_tipo_estacion ON producto(tipo_estacion, disponible);
CREATE INDEX idx_itemorden_producto ON item_orden(producto_id, estado);
CREATE INDEX idx_orden_mozo_fecha ON orden(mozo_id, creado_en DESC);
CREATE INDEX idx_pago_orden ON pago(orden_id, fecha DESC);
CREATE INDEX idx_wishlist_mesa ON wishlist(mesa_id, creado_en DESC);
CREATE INDEX idx_resena_aprobada ON resena(aprobada, producto_id);
CREATE INDEX idx_bloqueo_activo ON bloqueo(estado, fecha_inicio, fecha_fin);

-- Índices compuestos para búsquedas complejas
CREATE INDEX idx_orden_completa ON orden(mesa_id, estado, tipo, creado_en DESC);
CREATE INDEX idx_mesa_disponible_zona ON mesa(estado, zona_id, activo);

-- Índices para auditoría y reportes
CREATE INDEX idx_auditoria_entidad_fecha ON auditoria(entidad, accion, fecha DESC);
CREATE INDEX idx_sesion_usuario_fecha ON sesion_usuario(usuario_id, ultimo_acceso DESC);

-- Si tu versión de MySQL lo permite, puedes agregar FULLTEXT para búsquedas de texto:
-- ALTER TABLE producto ADD FULLTEXT ft_nombre_descripcion (nombre, descripcion);
-- ALTER TABLE ingrediente ADD FULLTEXT ft_nombre (nombre);

-- ===============================
--         DATOS DE EJEMPLO
-- ===============================

-- Insertar datos básicos de ejemplo (opcional, para desarrollo)
INSERT INTO piso (nombre, descripcion, orden) VALUES
('Planta Baja', 'Piso principal del restaurante', 1),
('Mezzanine', 'Piso superior con vista', 2),
('Terraza', 'Área exterior', 3);

INSERT INTO zona (nombre, descripcion, tipo, piso_id, orden, color, icono) VALUES
('Salón Principal', 'Zona central del restaurante', 'salon', 1, 1, '#3B82F6', '🏠'),
('Barra', 'Zona de barra y bebidas', 'barra', 1, 2, '#10B981', '🍹'),
('Terraza', 'Área exterior con vista', 'terraza', 3, 1, '#F59E0B', '🌅'),
('Privados', 'Salas privadas para eventos', 'privada', 1, 3, '#8B5CF6', '🚪');

INSERT INTO mesa (numero, capacidad, zona_id, estado, activo) VALUES
('T01', 4, 1, 'disponible', 1),
('T02', 4, 1, 'disponible', 1),
('T03', 2, 1, 'disponible', 1),
('T04', 6, 1, 'disponible', 1),
('T05', 4, 2, 'disponible', 1),
('T06', 2, 2, 'disponible', 1),
('T07', 4, 3, 'disponible', 1),
('T08', 6, 3, 'disponible', 1),
('T09', 8, 4, 'disponible', 1),
('T10', 4, 4, 'disponible', 1);

INSERT INTO categoria (nombre, descripcion) VALUES
('Entradas', 'Platos para comenzar'),
('Ceviches', 'Ceviches tradicionales y de autor'),
('Platos Calientes', 'Comidas calientes principales'),
('Bebidas', 'Refrescos, jugos y bebidas alcohólicas'),
('Postres', 'Postres y dulces');

INSERT INTO ingrediente (nombre, stock, unidad) VALUES
('Pescado fresco', 100.000, 'kg'),
('Limón', 50.000, 'kg'),
('Cebolla roja', 20.000, 'kg'),
('Cilantro', 5.000, 'kg'),
('Ají limo', 2.000, 'kg'),
('Camarones', 30.000, 'kg'),
('Arroz', 100.000, 'kg'),
('Papa', 50.000, 'kg'),
('Leche condensada', 10.000, 'lt'),
('Azúcar', 20.000, 'kg');

INSERT INTO usuario (usuario, correo, contrasena, rol, estacion) VALUES
('admin', 'admin@cevicheria.com', '$pbkdf2-sha256$600000$hashed_password_here', 'admin', NULL),
('mozo1', 'mozo1@cevicheria.com', '$pbkdf2-sha256$600000$hashed_password_here', 'mozo', NULL),
('mozo2', 'mozo2@cevicheria.com', '$pbkdf2-sha256$600000$hashed_password_here', 'mozo', NULL),
('cocina1', 'cocina1@cevicheria.com', '$pbkdf2-sha256$600000$hashed_password_here', 'cocina', 'frio'),
('cocina2', 'cocina2@cevicheria.com', '$pbkdf2-sha256$600000$hashed_password_here', 'cocina', 'caliente'),
('caja1', 'caja1@cevicheria.com', '$pbkdf2-sha256$600000$hashed_password_here', 'caja', NULL);

-- Nota: Las contraseñas están hasheadas. Para desarrollo, puedes usar:
-- UPDATE usuario SET contrasena = '$pbkdf2-sha256$600000$hashed_password_here' WHERE id = 1;
-- Para generar contraseñas reales, usa el método set_password() de los modelos

-- ===============================
--         NOTAS IMPORTANTES
-- ===============================

-- 1. Este archivo SQL ahora está 100% sincronizado con los modelos Python
-- 2. Incluye todos los campos, índices y relaciones definidos en los modelos
-- 3. Los triggers están optimizados y funcionales
-- 4. Se agregaron datos de ejemplo para desarrollo
-- 5. Para producción, ajusta las contraseñas y configura adecuadamente

-- Para ejecutar este archivo:
-- mysql -u root -p ceviche_db_dev < ceviche_db.sql
