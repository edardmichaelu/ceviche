import os
from sqlalchemy import text
from app import create_app
from models import db
from models.user import Usuario
from werkzeug.security import generate_password_hash

# Importar el resto de modelos para que SQLAlchemy los reconozca
from models.core import SesionUsuario, PermisoTemporal, Auditoria
from models.local import Piso, Zona, Mesa
from models.menu import Categoria, Producto, Ingrediente, ProductoIngrediente, TipoIngrediente
from models.order import Orden, ItemOrden, Pago, Wishlist, Resena
from models.reserva import Reserva
from models.bloqueo import Bloqueo

# --- Definición de Triggers ---
trigger_descuenta_stock = """...""" # (El código de los triggers se mantiene igual)
trigger_auditoria_orden = """..."""

def seed_database():
    print("--- INICIANDO SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS ---")
    confirmacion = input("ADVERTENCIA: Este script borrará TODAS las tablas y datos existentes. ¿Desea continuar? (si/no): ")
    if confirmacion.lower() != 'si':
        print("Operación cancelada.")
        return

    print("\nLimpiando la base de datos existente...")
    db.drop_all()
    print("Base de datos limpia.")

    print("\nCreando todas las tablas basadas en los modelos (con índices)...")
    db.create_all()
    print("Tablas creadas exitosamente.")

    try:
        # --- PASO 1: Crear usuarios con hashes generados correctamente ---
        print("\nGenerando y creando usuarios iniciales...")
        # Usar la misma contraseña que está en el archivo SQL para consistencia con el frontend
        password_text = '12345'
        hashed_password = generate_password_hash(password_text, method='pbkdf2:sha256')
        usuarios = [
            Usuario(usuario='admin', correo='admin@cevicheria.com', contrasena=hashed_password, rol='admin'),
            Usuario(usuario='mozo1', correo='mozo1@cevicheria.com', contrasena=hashed_password, rol='mozo'),
            Usuario(usuario='mozo2', correo='mozo2@cevicheria.com', contrasena=hashed_password, rol='mozo'),
            Usuario(usuario='cocina1', correo='cocina1@cevicheria.com', contrasena=hashed_password, rol='cocina', estacion='frio'),
            Usuario(usuario='cocina2', correo='cocina2@cevicheria.com', contrasena=hashed_password, rol='cocina', estacion='caliente'),
            Usuario(usuario='cocina3', correo='cocina3@cevicheria.com', contrasena=hashed_password, rol='cocina', estacion='bebida'),
            Usuario(usuario='caja1', correo='caja1@cevicheria.com', contrasena=hashed_password, rol='caja')
        ]
        db.session.bulk_save_objects(usuarios)
        print("Usuarios creados correctamente.")

        # --- PASO 2: Crear pisos ---
        print("\nCreando pisos...")
        pisos_data = [
            {'nombre': 'Planta Baja', 'descripcion': 'Piso principal con acceso directo a cocina', 'orden': 1},
            {'nombre': 'Primer Piso', 'descripcion': 'Piso superior con terraza exterior', 'orden': 2},
            {'nombre': 'Segundo Piso', 'descripcion': 'Piso VIP y salas privadas', 'orden': 3},
            {'nombre': 'Terraza Exterior', 'descripcion': 'Área al aire libre con vista panorámica', 'orden': 4}
        ]
        
        pisos = []
        for piso_data in pisos_data:
            piso = Piso(**piso_data)
            db.session.add(piso)
            pisos.append(piso)
        
        db.session.flush()  # Para obtener los IDs
        print("Pisos creados correctamente.")
        
        # --- PASO 3: Crear zonas ---
        print("\nCreando zonas...")
        from models.local import Zona
        zonas_data = [
            # Planta Baja
            {'nombre': 'Recepción', 'piso_id': pisos[0].id, 'tipo': 'recepcion', 'capacidad_maxima': 15, 'orden': 1, 'color': '#6B7280', 'icono': '🏪'},
            {'nombre': 'Salón Principal', 'piso_id': pisos[0].id, 'tipo': 'interior', 'capacidad_maxima': 40, 'orden': 2, 'color': '#3B82F6', 'icono': '🏠'},
            {'nombre': 'Barra Principal', 'piso_id': pisos[0].id, 'tipo': 'barra', 'capacidad_maxima': 12, 'orden': 3, 'color': '#10B981', 'icono': '🍹'},
            {'nombre': 'Zona Infantil', 'piso_id': pisos[0].id, 'tipo': 'infantil', 'capacidad_maxima': 20, 'orden': 4, 'color': '#F59E0B', 'icono': '👶'},
            {'nombre': 'Zona Rápida', 'piso_id': pisos[0].id, 'tipo': 'rapida', 'capacidad_maxima': 8, 'orden': 5, 'color': '#EF4444', 'icono': '⚡'},

            # Primer Piso
            {'nombre': 'Terraza Exterior', 'piso_id': pisos[1].id, 'tipo': 'terraza', 'capacidad_maxima': 25, 'orden': 1, 'color': '#84CC16', 'icono': '🌅'},
            {'nombre': 'Salón Terraza', 'piso_id': pisos[1].id, 'tipo': 'interior', 'capacidad_maxima': 30, 'orden': 2, 'color': '#8B5CF6', 'icono': '🏡'},

            # Segundo Piso
            {'nombre': 'VIP Principal', 'piso_id': pisos[2].id, 'tipo': 'vip', 'capacidad_maxima': 16, 'orden': 1, 'color': '#EC4899', 'icono': '💎'},
            {'nombre': 'Sala Privada 1', 'piso_id': pisos[2].id, 'tipo': 'privada', 'capacidad_maxima': 10, 'orden': 2, 'color': '#6366F1', 'icono': '🚪'},
            {'nombre': 'Sala Privada 2', 'piso_id': pisos[2].id, 'tipo': 'privada', 'capacidad_maxima': 8, 'orden': 3, 'color': '#6366F1', 'icono': '🚪'},
            {'nombre': 'Business Lounge', 'piso_id': pisos[2].id, 'tipo': 'business', 'capacidad_maxima': 12, 'orden': 4, 'color': '#0EA5E9', 'icono': '💼'}
        ]
        
        zonas = []
        for zona_data in zonas_data:
            zona = Zona(**zona_data)
            db.session.add(zona)
            zonas.append(zona)
        
        db.session.flush()  # Para obtener los IDs
        print("Zonas creadas correctamente.")
        
        # --- PASO 4: Crear mesas ---
        print("\nCreando mesas...")
        from models.local import Mesa
        import uuid

        mesas_data = [
            # Recepción - Planta Baja
            {'numero': 'R01', 'zona_id': zonas[0].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},
            {'numero': 'R02', 'zona_id': zonas[0].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'R03', 'zona_id': zonas[0].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},

            # Salón Principal - Planta Baja
            {'numero': 'S01', 'zona_id': zonas[1].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'S02', 'zona_id': zonas[1].id, 'capacidad': 6, 'estado': 'disponible', 'activo': True},
            {'numero': 'S03', 'zona_id': zonas[1].id, 'capacidad': 4, 'estado': 'ocupada', 'activo': True},
            {'numero': 'S04', 'zona_id': zonas[1].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},
            {'numero': 'S05', 'zona_id': zonas[1].id, 'capacidad': 8, 'estado': 'disponible', 'activo': True},
            {'numero': 'S06', 'zona_id': zonas[1].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'S07', 'zona_id': zonas[1].id, 'capacidad': 6, 'estado': 'limpieza', 'activo': True},
            {'numero': 'S08', 'zona_id': zonas[1].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'S09', 'zona_id': zonas[1].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},
            {'numero': 'S10', 'zona_id': zonas[1].id, 'capacidad': 4, 'estado': 'reservada', 'activo': True},

            # Barra Principal - Planta Baja
            {'numero': 'B01', 'zona_id': zonas[2].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},
            {'numero': 'B02', 'zona_id': zonas[2].id, 'capacidad': 4, 'estado': 'ocupada', 'activo': True},
            {'numero': 'B03', 'zona_id': zonas[2].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},
            {'numero': 'B04', 'zona_id': zonas[2].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},

            # Zona Infantil - Planta Baja
            {'numero': 'N01', 'zona_id': zonas[3].id, 'capacidad': 6, 'estado': 'disponible', 'activo': True},
            {'numero': 'N02', 'zona_id': zonas[3].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'N03', 'zona_id': zonas[3].id, 'capacidad': 8, 'estado': 'ocupada', 'activo': True},

            # Zona Rápida - Planta Baja
            {'numero': 'Q01', 'zona_id': zonas[4].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},
            {'numero': 'Q02', 'zona_id': zonas[4].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},

            # Terraza Exterior - Primer Piso
            {'numero': 'T01', 'zona_id': zonas[5].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'T02', 'zona_id': zonas[5].id, 'capacidad': 6, 'estado': 'disponible', 'activo': True},
            {'numero': 'T03', 'zona_id': zonas[5].id, 'capacidad': 4, 'estado': 'ocupada', 'activo': True},
            {'numero': 'T04', 'zona_id': zonas[5].id, 'capacidad': 2, 'estado': 'disponible', 'activo': True},
            {'numero': 'T05', 'zona_id': zonas[5].id, 'capacidad': 8, 'estado': 'disponible', 'activo': True},

            # Salón Terraza - Primer Piso
            {'numero': 'ST1', 'zona_id': zonas[6].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'ST2', 'zona_id': zonas[6].id, 'capacidad': 6, 'estado': 'disponible', 'activo': True},
            {'numero': 'ST3', 'zona_id': zonas[6].id, 'capacidad': 4, 'estado': 'reservada', 'activo': True},
            {'numero': 'ST4', 'zona_id': zonas[6].id, 'capacidad': 6, 'estado': 'disponible', 'activo': True},

            # VIP Principal - Segundo Piso
            {'numero': 'V01', 'zona_id': zonas[7].id, 'capacidad': 6, 'estado': 'disponible', 'activo': True},
            {'numero': 'V02', 'zona_id': zonas[7].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True},
            {'numero': 'V03', 'zona_id': zonas[7].id, 'capacidad': 6, 'estado': 'reservada', 'activo': True},

            # Sala Privada 1 - Segundo Piso
            {'numero': 'P01', 'zona_id': zonas[8].id, 'capacidad': 8, 'estado': 'disponible', 'activo': True},
            {'numero': 'P02', 'zona_id': zonas[8].id, 'capacidad': 6, 'estado': 'ocupada', 'activo': True},

            # Sala Privada 2 - Segundo Piso
            {'numero': 'P03', 'zona_id': zonas[9].id, 'capacidad': 6, 'estado': 'disponible', 'activo': True},

            # Business Lounge - Segundo Piso
            {'numero': 'BL1', 'zona_id': zonas[10].id, 'capacidad': 8, 'estado': 'disponible', 'activo': True},
            {'numero': 'BL2', 'zona_id': zonas[10].id, 'capacidad': 4, 'estado': 'disponible', 'activo': True}
        ]
        
        mesas = []
        for mesa_data in mesas_data:
            # Generar QR único para cada mesa
            qr_code = f"MESA_{uuid.uuid4().hex[:8].upper()}"
            mesa = Mesa(numero=mesa_data['numero'], capacidad=mesa_data['capacidad'],
                       zona_id=mesa_data['zona_id'], estado=mesa_data['estado'],
                       activo=mesa_data['activo'], qr_code=qr_code)
            db.session.add(mesa)
            mesas.append(mesa)

        db.session.flush()  # Para obtener los IDs
        print(f"Mesas creadas correctamente: {len(mesas_data)} mesas")
        
        # --- PASO 5: Crear tipos de ingrediente ---
        print("\nCreando tipos de ingrediente...")
        from models.menu import TipoIngrediente
        tipos_ingrediente_data = [
            {'nombre': 'Proteínas', 'descripcion': 'Carnes, pescados y mariscos', 'color': '#EF4444'},
            {'nombre': 'Vegetales', 'descripcion': 'Verduras y hortalizas frescas', 'color': '#10B981'},
            {'nombre': 'Frutas', 'descripcion': 'Frutas tropicales y cítricos', 'color': '#F59E0B'},
            {'nombre': 'Cereales', 'descripcion': 'Arroces, maíz y otros granos', 'color': '#8B5CF6'},
            {'nombre': 'Lácteos', 'descripcion': 'Leche, quesos y derivados', 'color': '#06B6D4'},
            {'nombre': 'Condimentos', 'descripcion': 'Especias, hierbas y sazonadores', 'color': '#EC4899'},
            {'nombre': 'Líquidos', 'descripcion': 'Aceites, vinagres y salsas', 'color': '#3B82F6'},
            {'nombre': 'Embutidos', 'descripcion': 'Embutidos y productos cárnicos procesados', 'color': '#F97316'}
        ]

        tipos_ingrediente = []
        for tipo_data in tipos_ingrediente_data:
            tipo = TipoIngrediente(**tipo_data)
            db.session.add(tipo)
            tipos_ingrediente.append(tipo)

        db.session.flush()  # Para obtener los IDs
        print("Tipos de ingrediente creados correctamente.")

        # --- PASO 6: Crear ingredientes ---
        print("\nCreando ingredientes...")
        from models.menu import Ingrediente
        ingredientes_data = [
            # Proteínas
            {'nombre': 'Pescado fresco', 'descripcion': 'Pescado blanco fresco para ceviches', 'stock': 50.0, 'stock_minimo': 10.0, 'unidad': 'kg', 'precio_unitario': 25.0, 'tipo_ingrediente_id': tipos_ingrediente[0].id, 'proveedor': 'Mercado Pesquero', 'ubicacion_almacen': 'Cámara fría A1', 'codigo_barras': '7750123456789'},
            {'nombre': 'Pulpo', 'descripcion': 'Pulpo fresco para platos especiales', 'stock': 15.0, 'stock_minimo': 3.0, 'unidad': 'kg', 'precio_unitario': 45.0, 'tipo_ingrediente_id': tipos_ingrediente[0].id, 'proveedor': 'Importadora Marina', 'ubicacion_almacen': 'Cámara fría A2', 'codigo_barras': '7750123456790'},
            {'nombre': 'Camarones', 'descripcion': 'Camarones grandes frescos', 'stock': 25.0, 'stock_minimo': 5.0, 'unidad': 'kg', 'precio_unitario': 38.0, 'tipo_ingrediente_id': tipos_ingrediente[0].id, 'proveedor': 'Acuícola del Pacífico', 'ubicacion_almacen': 'Cámara fría B1', 'codigo_barras': '7750123456791'},

            # Vegetales
            {'nombre': 'Cebolla roja', 'descripcion': 'Cebolla roja fresca para ceviches', 'stock': 30.0, 'stock_minimo': 5.0, 'unidad': 'kg', 'precio_unitario': 3.5, 'tipo_ingrediente_id': tipos_ingrediente[1].id, 'proveedor': 'Hortalizas Andinas', 'ubicacion_almacen': 'Estante V1', 'codigo_barras': '7750123456792'},
            {'nombre': 'Limón', 'descripcion': 'Limones frescos para jugo', 'stock': 40.0, 'stock_minimo': 8.0, 'unidad': 'kg', 'precio_unitario': 4.0, 'tipo_ingrediente_id': tipos_ingrediente[1].id, 'proveedor': 'Citrus del Valle', 'ubicacion_almacen': 'Estante V2', 'codigo_barras': '7750123456793'},
            {'nombre': 'Camote', 'descripcion': 'Camote amarillo para acompañamiento', 'stock': 20.0, 'stock_minimo': 4.0, 'unidad': 'kg', 'precio_unitario': 2.8, 'tipo_ingrediente_id': tipos_ingrediente[1].id, 'proveedor': 'Hortalizas Andinas', 'ubicacion_almacen': 'Estante V3', 'codigo_barras': '7750123456794'},

            # Frutas
            {'nombre': 'Maracuyá', 'descripcion': 'Maracuyá fresca para bebidas', 'stock': 15.0, 'stock_minimo': 3.0, 'unidad': 'kg', 'precio_unitario': 5.5, 'tipo_ingrediente_id': tipos_ingrediente[2].id, 'proveedor': 'Frutas Tropicales', 'ubicacion_almacen': 'Estante F1', 'codigo_barras': '7750123456795'},
            {'nombre': 'Chirimoya', 'descripcion': 'Chirimoya madura para postres', 'stock': 10.0, 'stock_minimo': 2.0, 'unidad': 'kg', 'precio_unitario': 6.0, 'tipo_ingrediente_id': tipos_ingrediente[2].id, 'proveedor': 'Frutas Tropicales', 'ubicacion_almacen': 'Estante F2', 'codigo_barras': '7750123456796'},

            # Cereales
            {'nombre': 'Arroz blanco', 'descripcion': 'Arroz blanco de grano largo', 'stock': 100.0, 'stock_minimo': 20.0, 'unidad': 'kg', 'precio_unitario': 2.2, 'tipo_ingrediente_id': tipos_ingrediente[3].id, 'proveedor': 'Arroceros Unidos', 'ubicacion_almacen': 'Estante C1', 'codigo_barras': '7750123456797'},
            {'nombre': 'Maíz morado', 'descripcion': 'Maíz morado para chicha y postres', 'stock': 25.0, 'stock_minimo': 5.0, 'unidad': 'kg', 'precio_unitario': 3.0, 'tipo_ingrediente_id': tipos_ingrediente[3].id, 'proveedor': 'Granos Andinos', 'ubicacion_almacen': 'Estante C2', 'codigo_barras': '7750123456798'},

            # Condimentos
            {'nombre': 'Ají limo', 'descripcion': 'Ají limo fresco para picor', 'stock': 5.0, 'stock_minimo': 1.0, 'unidad': 'kg', 'precio_unitario': 15.0, 'tipo_ingrediente_id': tipos_ingrediente[5].id, 'proveedor': 'Especias del Perú', 'ubicacion_almacen': 'Estante S1', 'codigo_barras': '7750123456799'},
            {'nombre': 'Cilantro', 'descripcion': 'Cilantro fresco para sazonar', 'stock': 3.0, 'stock_minimo': 0.5, 'unidad': 'kg', 'precio_unitario': 8.0, 'tipo_ingrediente_id': tipos_ingrediente[5].id, 'proveedor': 'Hierbas Frescas', 'ubicacion_almacen': 'Estante S2', 'codigo_barras': '7750123456800'},
            {'nombre': 'Ajo', 'descripcion': 'Ajo fresco para sazonar', 'stock': 10.0, 'stock_minimo': 2.0, 'unidad': 'kg', 'precio_unitario': 6.0, 'tipo_ingrediente_id': tipos_ingrediente[5].id, 'proveedor': 'Hortalizas Andinas', 'ubicacion_almacen': 'Estante S3', 'codigo_barras': '7750123456801'},

            # Líquidos
            {'nombre': 'Aceite de oliva', 'descripcion': 'Aceite de oliva extra virgen', 'stock': 20.0, 'stock_minimo': 4.0, 'unidad': 'litros', 'precio_unitario': 12.0, 'tipo_ingrediente_id': tipos_ingrediente[6].id, 'proveedor': 'Importadora Gourmet', 'ubicacion_almacen': 'Estante L1', 'codigo_barras': '7750123456802'},
            {'nombre': 'Vinagre blanco', 'descripcion': 'Vinagre blanco para conservas', 'stock': 15.0, 'stock_minimo': 3.0, 'unidad': 'litros', 'precio_unitario': 4.5, 'tipo_ingrediente_id': tipos_ingrediente[6].id, 'proveedor': 'Productos Químicos', 'ubicacion_almacen': 'Estante L2', 'codigo_barras': '7750123456803'},

            # Lácteos
            {'nombre': 'Leche evaporada', 'descripcion': 'Leche evaporada para postres', 'stock': 30.0, 'stock_minimo': 6.0, 'unidad': 'latas', 'precio_unitario': 1.8, 'tipo_ingrediente_id': tipos_ingrediente[4].id, 'proveedor': 'Lácteos del Sur', 'ubicacion_almacen': 'Estante D1', 'codigo_barras': '7750123456804'},
            {'nombre': 'Queso parmesano', 'descripcion': 'Queso parmesano rallado', 'stock': 8.0, 'stock_minimo': 1.5, 'unidad': 'kg', 'precio_unitario': 25.0, 'tipo_ingrediente_id': tipos_ingrediente[4].id, 'proveedor': 'Lácteos del Sur', 'ubicacion_almacen': 'Cámara fría D2', 'codigo_barras': '7750123456805'},
        ]

        ingredientes = []
        for ingrediente_data in ingredientes_data:
            ingrediente = Ingrediente(**ingrediente_data)
            db.session.add(ingrediente)
            ingredientes.append(ingrediente)

        db.session.flush()  # Para obtener los IDs
        print("Ingredientes creados correctamente.")

        # --- PASO 7: Crear categorías ---
        print("\nCreando categorías...")
        from models.menu import Categoria
        categorias_data = [
            {'nombre': 'Ceviches Tradicionales', 'descripcion': 'Ceviches clásicos y tradicionales de pescado', 'icono': '🥘', 'color': 'blue', 'activo': True},
            {'nombre': 'Tiraditos y Sashimi', 'descripcion': 'Cortes finos de pescado con salsas especiales', 'icono': '🍣', 'color': 'purple', 'activo': True},
            {'nombre': 'Causas y Entradas Frías', 'descripcion': 'Causas, ensaladas y entradas frías', 'icono': '🥗', 'color': 'green', 'activo': True},
            {'nombre': 'Mariscos y Pulpo', 'descripcion': 'Platos principales de mariscos y pulpo', 'icono': '🦐', 'color': 'red', 'activo': True},
            {'nombre': 'Sudados y Guisos', 'descripcion': 'Platos calientes tradicionales', 'icono': '🍲', 'color': 'orange', 'activo': True},
            {'nombre': 'Arroces y Pastas', 'descripcion': 'Arroces con mariscos y pastas', 'icono': '🍜', 'color': 'yellow', 'activo': True},
            {'nombre': 'Bebidas Naturales', 'descripcion': 'Jugos naturales y refrescos', 'icono': '🥤', 'color': 'green', 'activo': True},
            {'nombre': 'Bebidas Alcohólicas', 'descripcion': 'Cervezas, vinos y cocteles', 'icono': '🍹', 'color': 'pink', 'activo': True},
            {'nombre': 'Postres Tradicionales', 'descripcion': 'Postres y dulces peruanos', 'icono': '🍰', 'color': 'indigo', 'activo': True},
            {'nombre': 'Para Niños', 'descripcion': 'Menú especial para niños', 'icono': '🧸', 'color': 'blue', 'activo': True}
        ]
        
        categorias = []
        for categoria_data in categorias_data:
            categoria = Categoria(**categoria_data)
            db.session.add(categoria)
            categorias.append(categoria)
        
        db.session.flush()  # Para obtener los IDs

        # Actualizar categorías existentes que no tienen el campo 'activo'
        print("Actualizando categorías existentes...")
        from sqlalchemy import text

        # Actualizar categorías que tienen activo = NULL a activo = True
        try:
            result = db.session.execute(text("""
                UPDATE categoria
                SET activo = TRUE
                WHERE activo IS NULL
            """))
            db.session.commit()
            if result.rowcount > 0:
                print(f"Actualizadas {result.rowcount} categorías con campo activo NULL")
        except Exception as e:
            print(f"Error actualizando categorías: {e}")

        print("Categorías creadas correctamente.")
        
        # --- PASO 6: Crear productos ---
        print("\nCreando productos...")
        from models.menu import Producto
        productos_data = [
            # CEVICHES TRADICIONALES (Estación: frío)
            {'nombre': 'Ceviche Clásico', 'descripcion': 'Pescado fresco, ají limo, limón, cebolla roja y camote.', 'precio': 32.00, 'categoria_id': categorias[0].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 12, 'nivel_picante': 'medio', 'etiquetas': 'recomendado,popular', 'disponible': True},
            {'nombre': 'Ceviche Mixto', 'descripcion': 'Pescado, pulpo, calamar, langostinos con salsa cevichera.', 'precio': 38.00, 'categoria_id': categorias[0].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 14, 'nivel_picante': 'medio', 'etiquetas': 'especial,nuevo', 'disponible': True},
            {'nombre': 'Ceviche de Camarones', 'descripcion': 'Camarones grandes con cebolla morada y ají limo.', 'precio': 42.00, 'categoria_id': categorias[0].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 13, 'nivel_picante': 'alto', 'etiquetas': 'premium', 'disponible': True},
            {'nombre': 'Ceviche Acevichado', 'descripcion': 'Estilo japonés con salsa cremosa y rocoto.', 'precio': 36.00, 'categoria_id': categorias[0].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 11, 'nivel_picante': 'medio', 'etiquetas': 'chef', 'disponible': True},

            # TIRADITOS Y SASHIMI (Estación: frío)
            {'nombre': 'Tiradito Nikkei', 'descripcion': 'Cortes finos de pescado con salsa acevichada y ají amarillo.', 'precio': 34.00, 'categoria_id': categorias[1].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 13, 'nivel_picante': 'medio', 'etiquetas': 'nikkei,fusion', 'disponible': True},
            {'nombre': 'Sashimi de Pescado', 'descripcion': 'Cortes frescos de pescado blanco con salsa ponzu.', 'precio': 40.00, 'categoria_id': categorias[1].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 10, 'nivel_picante': 'bajo', 'etiquetas': 'premium,sashimi', 'disponible': True},
            {'nombre': 'Tiradito Mediterráneo', 'descripcion': 'Pescado con aceite de oliva, alcaparras y aceitunas.', 'precio': 37.00, 'categoria_id': categorias[1].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 12, 'nivel_picante': 'ninguno', 'etiquetas': 'mediterraneo', 'disponible': True},

            # CAUSAS Y ENTRADAS FRÍAS (Estación: frío)
            {'nombre': 'Causa Limeña', 'descripcion': 'Causa rellena con pollo y palta, decorada con aceitunas.', 'precio': 18.00, 'categoria_id': categorias[2].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 9, 'nivel_picante': 'ninguno', 'etiquetas': 'clasico', 'disponible': True},
            {'nombre': 'Causa de Cangrejo', 'descripcion': 'Causa con cangrejo real y salsa rosada.', 'precio': 28.00, 'categoria_id': categorias[2].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 11, 'nivel_picante': 'bajo', 'etiquetas': 'premium', 'disponible': True},
            {'nombre': 'Ensalada de Pulpo', 'descripcion': 'Pulpo a la parrilla con vegetales frescos.', 'precio': 36.00, 'categoria_id': categorias[2].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 14, 'nivel_picante': 'bajo', 'etiquetas': 'saludable', 'disponible': True},
            {'nombre': 'Ensalada Marina', 'descripcion': 'Mezcla de mariscos con vinagreta de limón.', 'precio': 32.00, 'categoria_id': categorias[2].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 12, 'nivel_picante': 'ninguno', 'etiquetas': 'fresco', 'disponible': True},

            # MARISCOS Y PULPO (Estación: caliente)
            {'nombre': 'Pulpo al Olivo', 'descripcion': 'Pulpo con salsa de aceitunas y papas doradas.', 'precio': 45.00, 'categoria_id': categorias[3].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 16, 'nivel_picante': 'ninguno', 'etiquetas': 'signature', 'disponible': True},
            {'nombre': 'Camarones a la Plancha', 'descripcion': 'Camarones grandes con mantequilla de ajo.', 'precio': 42.00, 'categoria_id': categorias[3].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 14, 'nivel_picante': 'bajo', 'etiquetas': 'clasico', 'disponible': True},
            {'nombre': 'Conchas a la Parmesana', 'descripcion': 'Conchas gratinadas con queso parmesano.', 'precio': 38.00, 'categoria_id': categorias[3].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 12, 'nivel_picante': 'ninguno', 'etiquetas': 'gratinado', 'disponible': True},

            # SUDADOS Y GUISOS (Estación: caliente)
            {'nombre': 'Sudado de Pescado', 'descripcion': 'Guiso tradicional de pescado con vegetales.', 'precio': 37.00, 'categoria_id': categorias[4].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 16, 'nivel_picante': 'medio', 'etiquetas': 'tradicional', 'disponible': True},
            {'nombre': 'Sudado de Mariscos', 'descripcion': 'Mezcla de mariscos en su jugo con especias.', 'precio': 44.00, 'categoria_id': categorias[4].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 18, 'nivel_picante': 'medio', 'etiquetas': 'especial', 'disponible': True},
            {'nombre': 'Chupe de Camarones', 'descripcion': 'Sopa espesa de camarones con arroz y vegetales.', 'precio': 36.00, 'categoria_id': categorias[4].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 15, 'nivel_picante': 'bajo', 'etiquetas': 'tradicional', 'disponible': True},

            # ARROCES Y PASTAS (Estación: caliente)
            {'nombre': 'Arroz con Mariscos', 'descripcion': 'Arroz chaufa con mariscos y toque de ají amarillo.', 'precio': 42.00, 'categoria_id': categorias[5].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 15, 'nivel_picante': 'medio', 'etiquetas': 'popular', 'disponible': True},
            {'nombre': 'Fettuccine a la Huancaína', 'descripcion': 'Pasta con salsa huancaína y mariscos.', 'precio': 39.00, 'categoria_id': categorias[5].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 14, 'nivel_picante': 'medio', 'etiquetas': 'fusion', 'disponible': True},
            {'nombre': 'Risotto de Mariscos', 'descripcion': 'Arroz cremoso con mariscos y azafrán.', 'precio': 46.00, 'categoria_id': categorias[5].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 17, 'nivel_picante': 'ninguno', 'etiquetas': 'premium', 'disponible': True},

            # BEBIDAS NATURALES (Estación: bebida)
            {'nombre': 'Jugo de Maracuyá', 'descripcion': 'Natural y fresco, sin azúcar añadida.', 'precio': 7.00, 'categoria_id': categorias[6].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 2, 'disponible': True, 'etiquetas': 'natural,fresco'},
            {'nombre': 'Chicha Morada', 'descripcion': 'Bebida tradicional de maíz morado con especias.', 'precio': 6.00, 'categoria_id': categorias[6].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 3, 'disponible': True, 'etiquetas': 'tradicional'},
            {'nombre': 'Limonada de Hierbas', 'descripcion': 'Limón con menta y hierbabuena fresca.', 'precio': 8.00, 'categoria_id': categorias[6].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 2, 'disponible': True, 'etiquetas': 'refrescante'},
            {'nombre': 'Infusión de Coca', 'descripcion': 'Té de hoja de coca tradicional.', 'precio': 5.00, 'categoria_id': categorias[6].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 1, 'disponible': True, 'etiquetas': 'tradicional'},

            # BEBIDAS ALCOHÓLICAS (Estación: bebida)
            {'nombre': 'Cerveza Artesanal 300ml', 'descripcion': 'Rubia o roja de producción local.', 'precio': 13.00, 'categoria_id': categorias[7].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 0, 'disponible': True, 'etiquetas': 'artesanal'},
            {'nombre': 'Pisco Sour Clásico', 'descripcion': 'Pisco, limón, jarabe y clara de huevo.', 'precio': 18.00, 'categoria_id': categorias[7].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 3, 'disponible': True, 'etiquetas': 'clasico,coctel'},
            {'nombre': 'Chilcano de Pisco', 'descripcion': 'Pisco con ginger ale y limón.', 'precio': 16.00, 'categoria_id': categorias[7].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 2, 'disponible': True, 'etiquetas': 'refrescante'},
            {'nombre': 'Vino Blanco Chardonnay', 'descripcion': 'Copa de vino blanco semi-dulce.', 'precio': 22.00, 'categoria_id': categorias[7].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 0, 'disponible': True, 'etiquetas': 'vino'},

            # POSTRES TRADICIONALES (Estación: postre)
            {'nombre': 'Suspiro Limeño', 'descripcion': 'Postre clásico con merengue y manjar blanco.', 'precio': 10.00, 'categoria_id': categorias[8].id, 'tipo_estacion': 'postre', 'tiempo_preparacion': 4, 'disponible': True, 'etiquetas': 'clasico,popular'},
            {'nombre': 'Mazamorra Morada', 'descripcion': 'Postre de maíz morado con arroz con leche.', 'precio': 8.00, 'categoria_id': categorias[8].id, 'tipo_estacion': 'postre', 'tiempo_preparacion': 3, 'disponible': True, 'etiquetas': 'tradicional'},
            {'nombre': 'Arroz con Leche', 'descripcion': 'Arroz con leche cremoso con canela.', 'precio': 7.00, 'categoria_id': categorias[8].id, 'tipo_estacion': 'postre', 'tiempo_preparacion': 2, 'disponible': True, 'etiquetas': 'casero'},
            {'nombre': 'Torta de Chocolate', 'descripcion': 'Torta húmeda de chocolate con nueces.', 'precio': 12.00, 'categoria_id': categorias[8].id, 'tipo_estacion': 'postre', 'tiempo_preparacion': 5, 'disponible': True, 'etiquetas': 'chocolate'},

            # PARA NIÑOS (Estación: frío/caliente según corresponda)
            {'nombre': 'Mini Ceviche', 'descripcion': 'Porción pequeña de ceviche sin picante.', 'precio': 15.00, 'categoria_id': categorias[9].id, 'tipo_estacion': 'frio', 'tiempo_preparacion': 8, 'nivel_picante': 'ninguno', 'disponible': True, 'etiquetas': 'infantil'},
            {'nombre': 'Nuggets de Pescado', 'descripcion': 'Trozos de pescado empanizados para niños.', 'precio': 14.00, 'categoria_id': categorias[9].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 6, 'nivel_picante': 'ninguno', 'disponible': True, 'etiquetas': 'infantil'},
            {'nombre': 'Mini Arroz con Pollo', 'descripcion': 'Porción pequeña de arroz con pollo suave.', 'precio': 12.00, 'categoria_id': categorias[9].id, 'tipo_estacion': 'caliente', 'tiempo_preparacion': 10, 'nivel_picante': 'ninguno', 'disponible': True, 'etiquetas': 'infantil'},
            {'nombre': 'Jugo Natural Pequeño', 'descripcion': 'Jugos naturales en porción infantil.', 'precio': 5.00, 'categoria_id': categorias[9].id, 'tipo_estacion': 'bebida', 'tiempo_preparacion': 1, 'disponible': True, 'etiquetas': 'infantil,natural'}
        ]
        
        productos = []
        for producto_data in productos_data:
            producto = Producto(**producto_data)
            db.session.add(producto)
            productos.append(producto)
        
        db.session.flush()  # Para obtener los IDs
        print("Productos creados correctamente.")
        
        # --- PASO 7: Crear ingredientes ---
        print("\nCreando ingredientes...")
        from models.menu import Ingrediente
        ingredientes_data = [
            {'nombre': 'Pescado fresco', 'stock': 60, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[0].id},
            {'nombre': 'Pulpo', 'stock': 15, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[0].id},
            {'nombre': 'Mariscos mixtos', 'stock': 20, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[0].id},
            {'nombre': 'Cebolla', 'stock': 18, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[1].id},
            {'nombre': 'Limón', 'stock': 22, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[2].id},
            {'nombre': 'Palta', 'stock': 8, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[2].id},
            {'nombre': 'Ají amarillo', 'stock': 13, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[1].id},
            {'nombre': 'Maíz Morado', 'stock': 9, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[1].id},
            {'nombre': 'Maracuyá', 'stock': 7, 'unidad': 'kg', 'tipo_ingrediente_id': tipos_ingrediente[2].id},
            {'nombre': 'Cerveza', 'stock': 40, 'unidad': 'botella', 'tipo_ingrediente_id': tipos_ingrediente[4].id}
        ]
        
        ingredientes = []
        for ingrediente_data in ingredientes_data:
            ingrediente = Ingrediente(**ingrediente_data)
            db.session.add(ingrediente)
            ingredientes.append(ingrediente)
        
        db.session.flush()  # Para obtener los IDs
        print("Ingredientes creados correctamente.")
        
        # --- PASO 8: Crear relaciones producto-ingrediente ---
        print("\nCreando relaciones producto-ingrediente...")
        from models.menu import ProductoIngrediente
        relaciones_data = [
            # Ceviche Clásico (producto 1)
            {'producto_id': productos[0].id, 'ingrediente_id': ingredientes[0].id, 'cantidad': 0.2},
            {'producto_id': productos[0].id, 'ingrediente_id': ingredientes[3].id, 'cantidad': 0.04},
            {'producto_id': productos[0].id, 'ingrediente_id': ingredientes[4].id, 'cantidad': 0.03},
            {'producto_id': productos[0].id, 'ingrediente_id': ingredientes[6].id, 'cantidad': 0.01},
            
            # Tiradito Especial (producto 2)
            {'producto_id': productos[1].id, 'ingrediente_id': ingredientes[0].id, 'cantidad': 0.16},
            {'producto_id': productos[1].id, 'ingrediente_id': ingredientes[4].id, 'cantidad': 0.02},
            {'producto_id': productos[1].id, 'ingrediente_id': ingredientes[6].id, 'cantidad': 0.01},
            
            # Ensalada de Pulpo (producto 4)
            {'producto_id': productos[3].id, 'ingrediente_id': ingredientes[1].id, 'cantidad': 0.12},
            {'producto_id': productos[3].id, 'ingrediente_id': ingredientes[4].id, 'cantidad': 0.01},
            {'producto_id': productos[3].id, 'ingrediente_id': ingredientes[3].id, 'cantidad': 0.02},
            
            # Arroz con Mariscos (producto 5)
            {'producto_id': productos[4].id, 'ingrediente_id': ingredientes[2].id, 'cantidad': 0.35},
            
            # Chicha Morada (producto 11)
            {'producto_id': productos[10].id, 'ingrediente_id': ingredientes[7].id, 'cantidad': 0.13},
            {'producto_id': productos[10].id, 'ingrediente_id': ingredientes[6].id, 'cantidad': 0.01},
            
            # Cerveza Artesanal (producto 10)
            {'producto_id': productos[9].id, 'ingrediente_id': ingredientes[9].id, 'cantidad': 1.0}
        ]
        
        for relacion_data in relaciones_data:
            relacion = ProductoIngrediente(**relacion_data)
            db.session.add(relacion)
        
        print("Relaciones producto-ingrediente creadas correctamente.")
        
        # --- PASO 9: Crear permisos temporales ---
        print("\nCreando permisos temporales...")
        from models.core import PermisoTemporal
        from datetime import datetime, timedelta
        
        permisos_data = [
            {'usuario_id': 2, 'concedido_por': 1, 'permiso': 'acceso_vip', 'area': 'VIP', 'activo': True, 'creado_en': datetime.now(), 'expira_en': datetime.now() + timedelta(hours=3)},
            {'usuario_id': 4, 'concedido_por': 1, 'permiso': 'gestionar_frios', 'area': 'frio', 'activo': True, 'creado_en': datetime.now(), 'expira_en': datetime.now() + timedelta(hours=2)},
            {'usuario_id': 5, 'concedido_por': 1, 'permiso': 'gestionar_calientes', 'area': 'caliente', 'activo': True, 'creado_en': datetime.now(), 'expira_en': datetime.now() + timedelta(hours=2)},
            {'usuario_id': 6, 'concedido_por': 1, 'permiso': 'gestionar_barra', 'area': 'barra', 'activo': True, 'creado_en': datetime.now(), 'expira_en': datetime.now() + timedelta(hours=2)}
        ]
        
        for permiso_data in permisos_data:
            permiso = PermisoTemporal(**permiso_data)
            db.session.add(permiso)
        
        print("Permisos temporales creados correctamente.")
        
        # --- PASO 10: Crear wishlists ---
        print("\nCreando wishlists...")
        from models.order import Wishlist
        
        wishlists_data = [
            {'qr_sesion_id': 'SESIONFRIO', 'mesa_id': 1, 'producto_id': productos[0].id, 'creado_en': datetime.now()},
            {'qr_sesion_id': 'SESIONCAL', 'mesa_id': 3, 'producto_id': productos[4].id, 'creado_en': datetime.now()},
            {'qr_sesion_id': 'SESIONBARRA', 'mesa_id': 4, 'producto_id': productos[8].id, 'creado_en': datetime.now()}
        ]
        
        for wishlist_data in wishlists_data:
            wishlist = Wishlist(**wishlist_data)
            db.session.add(wishlist)
        
        print("Wishlists creadas correctamente.")
        
        # --- PASO 11: Crear reseñas ---
        print("\nCreando reseñas...")
        from models.order import Resena
        
        resenas_data = [
            {'producto_id': productos[0].id, 'nombre_cliente': 'Javier', 'puntuacion': 5, 'comentario': '¡El mejor ceviche!', 'aprobada': True, 'creado_en': datetime.now()},
            {'producto_id': productos[4].id, 'nombre_cliente': 'Laura', 'puntuacion': 5, 'comentario': 'Arroz con mariscos buenísimo.', 'aprobada': True, 'creado_en': datetime.now()},
            {'producto_id': productos[8].id, 'nombre_cliente': 'Juan', 'puntuacion': 4, 'comentario': 'Limonada y chicha muy frescas.', 'aprobada': True, 'creado_en': datetime.now()},
            {'producto_id': productos[11].id, 'nombre_cliente': 'Patricia', 'puntuacion': 4, 'comentario': 'Postre de Lima perfecto.', 'aprobada': True, 'creado_en': datetime.now()}
        ]
        
        for resena_data in resenas_data:
            resena = Resena(**resena_data)
            db.session.add(resena)
        
        print("Reseñas creadas correctamente.")

        # --- PASO 12: Crear reservas de ejemplo ---
        print("\nCreando reservas de ejemplo...")
        from models.reserva import Reserva
        from datetime import date, time, datetime, timedelta

        reservas_data = [
            # Reservas para hoy
            {'cliente_nombre': 'María García', 'cliente_telefono': '999888777', 'cliente_email': 'maria@email.com',
             'fecha_reserva': date.today(), 'hora_reserva': time(19, 30), 'duracion_estimada': 120,
             'numero_personas': 4, 'estado': 'confirmada', 'tipo_reserva': 'normal',
             'notas': 'Aniversario de bodas', 'mesa_id': mesas[0].id, 'usuario_id': 2},

            {'cliente_nombre': 'Carlos Rodríguez', 'cliente_telefono': '998877665', 'cliente_email': 'carlos@email.com',
             'fecha_reserva': date.today(), 'hora_reserva': time(20, 0), 'duracion_estimada': 90,
             'numero_personas': 2, 'estado': 'confirmada', 'tipo_reserva': 'especial',
             'notas': 'Cena romántica', 'mesa_id': mesas[12].id, 'usuario_id': 2},

            # Reservas para mañana
            {'cliente_nombre': 'Familia López', 'cliente_telefono': '997766554', 'cliente_email': 'lopez@email.com',
             'fecha_reserva': date.today() + timedelta(days=1), 'hora_reserva': time(13, 0), 'duracion_estimada': 150,
             'numero_personas': 6, 'estado': 'pendiente', 'tipo_reserva': 'grupo',
             'notas': 'Cumpleaños del abuelo', 'mesa_id': mesas[5].id, 'usuario_id': 2},

            {'cliente_nombre': 'Ana Mendoza', 'cliente_telefono': '996655443', 'cliente_email': 'ana@email.com',
             'fecha_reserva': date.today() + timedelta(days=1), 'hora_reserva': time(20, 30), 'duracion_estimada': 100,
             'numero_personas': 3, 'estado': 'confirmada', 'tipo_reserva': 'normal',
             'mesa_id': mesas[18].id, 'usuario_id': 2},

            # Reserva VIP para fin de semana
            {'cliente_nombre': 'Empresa XYZ', 'cliente_telefono': '995544332', 'cliente_email': 'contacto@empresa.com',
             'fecha_reserva': date.today() + timedelta(days=3), 'hora_reserva': time(21, 0), 'duracion_estimada': 180,
             'numero_personas': 8, 'estado': 'pendiente', 'tipo_reserva': 'especial',
             'notas': 'Cena de negocios - sala privada completa', 'mesa_id': mesas[28].id, 'usuario_id': 2}
        ]

        for reserva_data in reservas_data:
            reserva = Reserva(**reserva_data)
            db.session.add(reserva)

        print("Reservas de ejemplo creadas correctamente.")

        # --- PASO 13: Crear bloqueos de ejemplo ---
        print("\nCreando bloqueos de ejemplo...")
        from models.bloqueo import Bloqueo

        bloqueos_data = [
            # Mantenimiento de terraza
            {'titulo': 'Mantenimiento Terraza', 'descripcion': 'Limpieza profunda de terraza exterior',
             'fecha_inicio': date.today() + timedelta(days=2), 'hora_inicio': time(10, 0),
             'fecha_fin': date.today() + timedelta(days=2), 'hora_fin': time(14, 0),
             'tipo': 'mantenimiento', 'estado': 'programado', 'zona_id': 5, 'usuario_id': 1},

            # Evento privado
            {'titulo': 'Boda Familiar', 'descripcion': 'Celebración de matrimonio en sala VIP',
             'fecha_inicio': date.today() + timedelta(days=5), 'hora_inicio': time(18, 0),
             'fecha_fin': date.today() + timedelta(days=5), 'hora_fin': time(23, 0),
             'tipo': 'evento', 'estado': 'programado', 'mesa_id': 29, 'usuario_id': 1},

            # Reserva privada de zona infantil
            {'titulo': 'Fiesta Infantil', 'descripcion': 'Cumpleaños de 7 años en zona infantil',
             'fecha_inicio': date.today() + timedelta(days=7), 'hora_inicio': time(16, 0),
             'fecha_fin': date.today() + timedelta(days=7), 'hora_fin': time(20, 0),
             'tipo': 'reserva_privada', 'estado': 'programado', 'zona_id': 3, 'usuario_id': 1},

            # Mantenimiento de mesas VIP
            {'titulo': 'Mantenimiento Mesas VIP', 'descripcion': 'Limpieza y mantenimiento de mesas VIP',
             'fecha_inicio': date.today() + timedelta(days=1), 'hora_inicio': time(9, 0),
             'fecha_fin': date.today() + timedelta(days=1), 'hora_fin': time(12, 0),
             'tipo': 'mantenimiento', 'estado': 'programado', 'mesa_id': mesas[28].id, 'usuario_id': 1},

            # Bloqueo activo actual (mesa en limpieza)
            {'titulo': 'Limpieza Mesa S03', 'descripcion': 'Limpieza profunda después de cliente',
             'fecha_inicio': date.today(), 'hora_inicio': time(15, 0),
             'fecha_fin': date.today(), 'hora_fin': time(16, 0),
             'tipo': 'mantenimiento', 'estado': 'activo', 'mesa_id': mesas[2].id, 'usuario_id': 2}
        ]

        for bloqueo_data in bloqueos_data:
            bloqueo = Bloqueo(**bloqueo_data)
            db.session.add(bloqueo)

        print("Bloqueos de ejemplo creados correctamente.")

        # --- PASO 14: Crear órdenes de ejemplo ---
        print("\nCreando órdenes de ejemplo...")
        from models.order import Orden, ItemOrden

        # Crear algunas órdenes de ejemplo con num_comensales
        ordenes_data = [
            {'numero': 'ORD001', 'mesa_id': 5, 'mozo_id': 2, 'tipo': 'local', 'estado': 'servida', 'monto_total': 70.00, 'num_comensales': 2, 'cliente_nombre': 'Carlos Mendoza'},
            {'numero': 'ORD002', 'mesa_id': 21, 'mozo_id': 3, 'tipo': 'local', 'estado': 'pagada', 'monto_total': 58.00, 'num_comensales': 4, 'cliente_nombre': 'María López'},
            {'numero': 'ORD003', 'mesa_id': 33, 'mozo_id': 2, 'tipo': 'local', 'estado': 'preparando', 'monto_total': 82.00, 'num_comensales': 3, 'cliente_nombre': 'Juan Pérez'},
            {'numero': 'ORD004', 'mesa_id': 25, 'mozo_id': 3, 'tipo': 'local', 'estado': 'lista', 'monto_total': 45.00, 'num_comensales': 1, 'cliente_nombre': 'Ana García'},
            {'numero': 'ORD005', 'mesa_id': 10, 'mozo_id': 2, 'tipo': 'local', 'estado': 'pendiente', 'monto_total': 92.00, 'num_comensales': 6, 'cliente_nombre': 'Luis Rodríguez'}
        ]

        for orden_data in ordenes_data:
            orden = Orden(**orden_data)
            db.session.add(orden)

        db.session.flush()  # Para obtener los IDs de órdenes

        # Crear items para las órdenes
        items_data = [
            # Orden 1 (servida)
            {'orden_id': 1, 'producto_id': 1, 'cantidad': 2, 'precio_unitario': 32.00, 'estado': 'servido', 'estacion': 'frio'},
            {'orden_id': 1, 'producto_id': 12, 'cantidad': 1, 'precio_unitario': 6.00, 'estado': 'servido', 'estacion': 'bebida'},

            # Orden 2 (pagada)
            {'orden_id': 2, 'producto_id': 5, 'cantidad': 1, 'precio_unitario': 42.00, 'estado': 'servido', 'estacion': 'caliente'},
            {'orden_id': 2, 'producto_id': 24, 'cantidad': 2, 'precio_unitario': 8.00, 'estado': 'servido', 'estacion': 'bebida'},

            # Orden 3 (preparando)
            {'orden_id': 3, 'producto_id': 8, 'cantidad': 1, 'precio_unitario': 45.00, 'estado': 'preparando', 'estacion': 'caliente'},
            {'orden_id': 3, 'producto_id': 18, 'cantidad': 1, 'precio_unitario': 13.00, 'estado': 'listo', 'estacion': 'bebida'},
            {'orden_id': 3, 'producto_id': 28, 'cantidad': 2, 'precio': 10.00, 'estado': 'en_cola', 'estacion': 'postre'},

            # Orden 4 (lista)
            {'orden_id': 4, 'producto_id': 2, 'cantidad': 1, 'precio_unitario': 38.00, 'estado': 'listo', 'estacion': 'frio'},
            {'orden_id': 4, 'producto_id': 26, 'cantidad': 1, 'precio_unitario': 7.00, 'estado': 'listo', 'estacion': 'bebida'},

            # Orden 5 (pendiente)
            {'orden_id': 5, 'producto_id': 1, 'cantidad': 2, 'precio_unitario': 32.00, 'estado': 'en_cola', 'estacion': 'frio'},
            {'orden_id': 5, 'producto_id': 15, 'cantidad': 1, 'precio_unitario': 37.00, 'estado': 'pendiente', 'estacion': 'caliente'},
            {'orden_id': 5, 'producto_id': 27, 'cantidad': 2, 'precio_unitario': 7.00, 'estado': 'pendiente', 'estacion': 'bebida'}
        ]

        for item_data in items_data:
            # Calcular precio unitario si no está especificado
            if 'precio_unitario' not in item_data and 'precio' in item_data:
                item_data['precio_unitario'] = item_data.pop('precio')

            item = ItemOrden(**item_data)
            db.session.add(item)

        print("Órdenes e items de ejemplo creados correctamente.")

        # --- PASO 15: Crear pagos de ejemplo ---
        print("\nCreando pagos de ejemplo...")
        from models.order import Pago

        pagos_data = [
            {'orden_id': 1, 'monto': 70.00, 'metodo': 'efectivo', 'estado': 'pagado'},
            {'orden_id': 2, 'monto': 58.00, 'metodo': 'tarjeta', 'estado': 'pagado'},
            {'orden_id': 4, 'monto': 45.00, 'metodo': 'yape', 'estado': 'pagado'}
        ]

        for pago_data in pagos_data:
            pago = Pago(**pago_data)
            db.session.add(pago)

        print("Pagos de ejemplo creados correctamente.")

        # --- PASO 16: Crear más wishlists ---
        print("\nCreando más wishlists...")
        from models.order import Wishlist

        more_wishlists_data = [
            {'qr_sesion_id': 'SESIONVIP', 'mesa_id': 29, 'producto_id': productos[0].id},
            {'qr_sesion_id': 'SESIONBARRA2', 'mesa_id': 12, 'producto_id': productos[8].id},
            {'qr_sesion_id': 'SESIONFAMILIAR', 'mesa_id': 17, 'producto_id': productos[32].id},  # Infantil
            {'qr_sesion_id': 'SESIONRAPIDA', 'mesa_id': 20, 'producto_id': productos[1].id},
            {'qr_sesion_id': 'SESIONTERRAZA', 'mesa_id': 22, 'producto_id': productos[5].id}
        ]

        for wishlist_data in more_wishlists_data:
            wishlist = Wishlist(**wishlist_data)
            db.session.add(wishlist)

        print("Wishlists adicionales creadas correctamente.")

        # --- PASO 17: Crear más reseñas ---
        print("\nCreando más reseñas...")
        from models.order import Resena

        more_resenas_data = [
            {'producto_id': productos[1].id, 'nombre_cliente': 'Roberto', 'puntuacion': 4, 'comentario': 'Excelente tiradito, muy fresco.', 'aprobada': True},
            {'producto_id': productos[8].id, 'nombre_cliente': 'Carmen', 'puntuacion': 5, 'comentario': 'El pulpo al olivo es extraordinario.', 'aprobada': True},
            {'producto_id': productos[15].id, 'nombre_cliente': 'Miguel', 'puntuacion': 4, 'comentario': 'Sudado muy sabroso, buena porción.', 'aprobada': True},
            {'producto_id': productos[20].id, 'nombre_cliente': 'Sofia', 'puntuacion': 5, 'comentario': 'Arroz con mariscos perfecto, como siempre.', 'aprobada': True},
            {'producto_id': productos[25].id, 'nombre_cliente': 'Diego', 'puntuacion': 3, 'comentario': 'Pisco sour un poco fuerte, pero bueno.', 'aprobada': True},
            {'producto_id': productos[30].id, 'nombre_cliente': 'Lucía', 'puntuacion': 4, 'comentario': 'Suspiro limeño delicioso.', 'aprobada': True}
        ]

        for resena_data in more_resenas_data:
            resena = Resena(**resena_data)
            db.session.add(resena)

        print("Reseñas adicionales creadas correctamente.")


        # --- PASO 19: Crear bloqueos de ejemplo ---
        print("\nCreando bloqueos de ejemplo...")
        from models.bloqueo import Bloqueo
        from datetime import timedelta

        bloqueos_data = [
            {
                'titulo': 'Mantenimiento Terraza',
                'descripcion': 'Limpieza y mantenimiento general de la terraza',
                'fecha_inicio': date.today(),
                'hora_inicio': time(8, 0),
                'fecha_fin': date.today(),
                'hora_fin': time(10, 0),
                'tipo': 'mantenimiento',
                'estado': 'programado',
                'zona_id': zonas[2].id,  # Terraza
                'usuario_id': usuarios[0].id  # Admin
            },
            {
                'titulo': 'Evento Privado',
                'descripcion': 'Reserva privada para evento corporativo',
                'fecha_inicio': date.today(),
                'hora_inicio': time(20, 0),
                'fecha_fin': date.today(),
                'hora_fin': time(23, 0),
                'tipo': 'reserva_privada',
                'estado': 'programado',
                'piso_id': pisos[0].id,  # Planta Baja
                'usuario_id': usuarios[0].id  # Admin
            },
            {
                'titulo': 'Bloqueo Sala Privada',
                'descripcion': 'Sala reservada para reunión importante',
                'fecha_inicio': date.today() + timedelta(days=1),
                'hora_inicio': time(15, 0),
                'fecha_fin': date.today() + timedelta(days=1),
                'hora_fin': time(18, 0),
                'tipo': 'reserva_privada',
                'estado': 'activo',
                'zona_id': zonas[3].id,  # Privados
                'usuario_id': usuarios[0].id  # Admin
            }
        ]

        bloqueos = []
        for bloqueo_data in bloqueos_data:
            bloqueo = Bloqueo(**bloqueo_data)
            db.session.add(bloqueo)
            bloqueos.append(bloqueo)

        print(f"Bloqueos de ejemplo creados correctamente: {len(bloqueos)} bloqueos")

        db.session.commit()
        print("\n¡Transacción completada y confirmada!")
        print("\n📊 RESUMEN DE DATOS CREADOS:")
        print(f"   • {len(pisos)} pisos")
        print(f"   • {len(zonas)} zonas")
        print(f"   • {len([m for m in db.session.query(Mesa).all()])} mesas")
        print(f"   • {len(categorias)} categorías")
        print(f"   • {len(productos)} productos")
        print(f"   • {len(ingredientes)} ingredientes")
        print(f"   • {len([r for r in db.session.query(Reserva).all()])} reservas")
        print(f"   • {len([b for b in db.session.query(Bloqueo).all()])} bloqueos")
        print(f"   • {len([o for o in db.session.query(Orden).all()])} órdenes")
        print(f"   • {len([p for p in db.session.query(Pago).all()])} pagos")

    except Exception as e:
        db.session.rollback()
        print("\n--- ERROR DURANTE LA INICIALIZACIÓN ---")
        print(f"Error: {e}")
        print("Se ha revertido la transacción.")

# Solo ejecutar si se ejecuta como script principal
if __name__ == '__main__':
    env_name = os.getenv('FLASK_ENV', 'development')
    app = create_app(config_name=env_name)

    with app.app_context():
        seed_database()
    
    print("\n--- PROCESO DE INICIALIZACIÓN COMPLETADO ---")
    print("✅ Base de datos inicializada correctamente")
    print("📊 Verificación: Script ejecutado correctamente")
