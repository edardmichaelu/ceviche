from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models.menu import Producto, Categoria, ProductoImagen
from models.user import Usuario
from services.error_handler import ErrorHandler
from routes.admin_routes import admin_required
from models import db
import os
from werkzeug.utils import secure_filename

producto_bp = Blueprint('producto_bp', __name__)

# --- Rutas Públicas ---
@producto_bp.route('/public', methods=['GET'])
def get_productos_public():
    """Obtener todos los productos (ruta pública) - Favoritos primero"""
    try:
        # Obtener favoritos primero, luego el resto
        productos_favoritos = Producto.query.filter_by(es_favorito=True, disponible=True).order_by(Producto.nombre).all()
        productos_normales = Producto.query.filter_by(es_favorito=False, disponible=True).order_by(Producto.nombre).all()

        productos = productos_favoritos + productos_normales

        return jsonify({
            'success': True,
            'data': [producto.to_dict() for producto in productos],
            'total': len(productos),
            'favoritos_count': len(productos_favoritos)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo productos: {str(e)}'
        }), 500

# --- Decorador Admin o Mesero ---
def admin_or_mesero_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Usuario.query.get(current_user_id)
        if user and (user.rol in ['admin', 'mesero', 'mozo']):
            return fn(*args, **kwargs)
        else:
            return jsonify({"error": "Acceso denegado. Se requiere rol de Admin, Mesero o Mozo."}), 403
    return wrapper

# --- Rutas Protegidas ---
@producto_bp.route('/', methods=['GET'])
@admin_or_mesero_required
def get_productos():
    """Obtener todos los productos - Favoritos primero"""
    try:
        # Obtener favoritos primero, luego el resto
        productos_favoritos = Producto.query.filter_by(es_favorito=True).order_by(Producto.nombre).all()
        productos_normales = Producto.query.filter_by(es_favorito=False).order_by(Producto.nombre).all()

        productos = productos_favoritos + productos_normales

        return jsonify({
            'success': True,
            'data': [producto.to_dict() for producto in productos],
            'total': len(productos),
            'favoritos_count': len(productos_favoritos)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo productos: {str(e)}'
        }), 500

@producto_bp.route('/<int:producto_id>', methods=['GET'])
@admin_required
def get_producto(producto_id):
    """Obtener un producto específico por ID"""
    try:
        producto = Producto.query.get_or_404(producto_id)

        return jsonify({
            'success': True,
            'data': producto.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error obteniendo producto: {str(e)}'
        }), 500

@producto_bp.route('/', methods=['POST'])
@admin_required
def create_producto():
    """Crear un nuevo producto"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Datos requeridos'
            }), 400

        # Validaciones básicas
        if not data.get('nombre'):
            return jsonify({
                'success': False,
                'error': 'El nombre del producto es requerido'
            }), 400

        if data.get('precio') is None:
            return jsonify({
                'success': False,
                'error': 'El precio del producto es requerido'
            }), 400
        try:
            float(data.get('precio'))
        except Exception:
            return jsonify({'success': False, 'error': 'El precio debe ser numérico'}), 400

        if not data.get('categoria_id'):
            return jsonify({
                'success': False,
                'error': 'El ID de la categoría es requerido'
            }), 400

        # Validar categoría
        if not Categoria.query.get(data.get('categoria_id')):
            return jsonify({'success': False, 'error': 'Categoría no existe'}), 404

        # Crear el producto
        producto = Producto(
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion', ''),
            precio=float(data.get('precio')),
            categoria_id=data.get('categoria_id'),
            tipo_estacion=data.get('tipo_estacion', 'frio'),
            tiempo_preparacion=data.get('tiempo_preparacion'),
            nivel_picante=data.get('nivel_picante'),
            ingredientes=data.get('ingredientes', ''),
            etiquetas=data.get('etiquetas', ''),
            disponible=data.get('disponible', True),
            stock=data.get('stock'),
            alerta_stock=data.get('alerta_stock', 0),
            es_favorito=data.get('es_favorito', False),
            imagen_url=data.get('imagen_url', None)
        )

        db.session.add(producto)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': producto.to_dict(),
            'message': 'Producto creado exitosamente'
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error creando producto: {str(e)}'
        }), 500

@producto_bp.route('/<int:producto_id>', methods=['PUT'])
@admin_required
def update_producto(producto_id):
    """Actualizar un producto existente"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Datos requeridos'}), 400

        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({'success': False, 'error': 'Producto no encontrado', 'code': 'NOT_FOUND'}), 404

        if 'nombre' in data:
            if not data['nombre']:
                return jsonify({'success': False, 'error': 'El nombre es obligatorio'}), 400
            producto.nombre = data['nombre']

        if 'precio' in data:
            try:
                producto.precio = float(data['precio'])
            except Exception:
                return jsonify({'success': False, 'error': 'El precio debe ser numérico'}), 400

        if 'categoria_id' in data:
            if not Categoria.query.get(data['categoria_id']):
                return jsonify({'success': False, 'error': 'Categoría no existe'}), 404
            producto.categoria_id = data['categoria_id']

        for key in ['descripcion','tipo_estacion','tiempo_preparacion','nivel_picante','ingredientes','etiquetas','disponible','stock','alerta_stock','imagen_url','es_favorito']:
            if key in data:
                setattr(producto, key, data[key])

        db.session.commit()

        return jsonify({'success': True, 'data': producto.to_dict(), 'message': 'Producto actualizado exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error actualizando producto: {str(e)}'}), 500

@producto_bp.route('/<int:producto_id>', methods=['DELETE'])
@admin_required
def delete_producto(producto_id):
    """Eliminar un producto"""
    try:
        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({'success': False, 'error': 'Producto no encontrado', 'code': 'NOT_FOUND'}), 404

        # Verificar si el producto tiene órdenes asociadas
        from models.order import ItemOrden
        ordenes_asociadas = ItemOrden.query.filter_by(producto_id=producto_id).count()
        if ordenes_asociadas > 0:
            return jsonify({
                'success': False,
                'error': f'No se puede eliminar el producto porque tiene {ordenes_asociadas} orden(es) asociada(s)',
                'code': 'INTEGRITY_ERROR'
            }), 409

        db.session.delete(producto)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Producto eliminado exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error eliminando producto: {str(e)}'}), 500

# --- Rutas para Imágenes de Productos ---
@producto_bp.route('/<int:producto_id>/imagenes', methods=['POST'])
def upload_producto_imagenes(producto_id):
    """Subir múltiples imágenes para un producto"""
    try:
        # Verificar que el producto existe
        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404

        if 'imagenes' not in request.files:
            return jsonify({'success': False, 'error': 'No se encontraron imágenes'}), 400

        imagenes = request.files.getlist('imagenes')

        # Crear directorio si no existe
        upload_dir = os.path.join('uploads', 'productos')
        os.makedirs(upload_dir, exist_ok=True)

        imagenes_subidas = []

        for imagen in imagenes:
            if imagen and imagen.filename:
                # Validar extensión
                allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
                if not '.' in imagen.filename or \
                   imagen.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
                    continue

                filename = secure_filename(imagen.filename)
                # Agregar timestamp para evitar conflictos
                import time
                timestamp = str(int(time.time()))
                filename = f"{timestamp}_{filename}"
                filepath = os.path.join(upload_dir, filename)

                imagen.save(filepath)

                # Crear registro en la base de datos
                nueva_imagen = ProductoImagen(
                    producto_id=producto_id,
                    imagen_url=f"/uploads/productos/{filename}",
                    orden=len(producto.imagenes) + len(imagenes_subidas),
                    descripcion=imagen.filename
                )

                db.session.add(nueva_imagen)
                imagenes_subidas.append(nueva_imagen.to_dict())

        if imagenes_subidas:
            db.session.commit()
            return jsonify({
                'success': True,
                'data': imagenes_subidas,
                'message': f'Se subieron {len(imagenes_subidas)} imágenes exitosamente'
            }), 201
        else:
            return jsonify({'success': False, 'error': 'No se pudieron procesar las imágenes'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Error subiendo imágenes: {str(e)}'}), 500

@producto_bp.route('/<int:producto_id>/imagenes', methods=['GET'])
@admin_required
def get_producto_imagenes(producto_id):
    """Obtener todas las imágenes de un producto"""
    try:
        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404

        return jsonify({
            'success': True,
            'data': [imagen.to_dict() for imagen in producto.imagenes],
            'total': len(producto.imagenes)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error obteniendo imágenes: {str(e)}'}), 500

# --- Endpoint de prueba para debug (temporal) ---
@producto_bp.route('/test-upload', methods=['POST'])
def test_upload():
    """Endpoint de prueba para subir imágenes sin autenticación"""
    try:
        if 'imagenes' not in request.files:
            return jsonify({'success': False, 'error': 'No se encontraron imágenes'}), 400

        imagenes = request.files.getlist('imagenes')

        # Crear directorio si no existe
        upload_dir = os.path.join('uploads', 'productos')
        os.makedirs(upload_dir, exist_ok=True)

        imagenes_subidas = []

        for imagen in imagenes:
            if imagen and imagen.filename:
                filename = secure_filename(imagen.filename)
                import time
                timestamp = str(int(time.time()))
                filename = f"{timestamp}_{filename}"
                filepath = os.path.join(upload_dir, filename)

                imagen.save(filepath)

                imagenes_subidas.append({
                    'filename': filename,
                    'size': os.path.getsize(filepath),
                    'url': f"/uploads/productos/{filename}"
                })

        return jsonify({
            'success': True,
            'data': imagenes_subidas,
            'message': f'Se subieron {len(imagenes_subidas)} imágenes de prueba exitosamente'
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': f'Error en prueba: {str(e)}'}), 500

@producto_bp.route('/imagenes/<int:imagen_id>', methods=['DELETE'])
def delete_producto_imagen(imagen_id):
    """Eliminar una imagen de producto"""
    try:
        imagen = ProductoImagen.query.get(imagen_id)
        if not imagen:
            return jsonify({'success': False, 'error': 'Imagen no encontrada'}), 404

        # Eliminar archivo físico si existe
        if imagen.imagen_url:
            filepath = imagen.imagen_url.replace('/uploads/', 'uploads/')
            if os.path.exists(filepath):
                os.remove(filepath)

        db.session.delete(imagen)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Imagen eliminada exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error eliminando imagen: {str(e)}'}), 500

@producto_bp.route('/imagenes/<int:imagen_id>/principal', methods=['PUT'])
@admin_required
def set_imagen_principal(imagen_id):
    """Marcar una imagen como principal"""
    try:
        imagen = ProductoImagen.query.get(imagen_id)
        if not imagen:
            return jsonify({'success': False, 'error': 'Imagen no encontrada'}), 404

        # Desmarcar todas las imágenes principales del producto
        ProductoImagen.query.filter_by(producto_id=imagen.producto_id, es_principal=True).update({'es_principal': False})

        # Marcar la imagen actual como principal
        imagen.es_principal = True
        db.session.commit()

        return jsonify({
            'success': True,
            'data': imagen.to_dict(),
            'message': 'Imagen marcada como principal'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error actualizando imagen: {str(e)}'}), 500

# --- Rutas para Favoritos ---
@producto_bp.route('/<int:producto_id>/favorito', methods=['PUT'])
@admin_required
def toggle_favorito(producto_id):
    """Alternar estado de favorito de un producto"""
    try:
        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404

        producto.es_favorito = not producto.es_favorito
        db.session.commit()

        return jsonify({
            'success': True,
            'data': producto.to_dict(),
            'message': f'Producto {"marcado" if producto.es_favorito else "desmarcado"} como favorito'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error actualizando favorito: {str(e)}'}), 500

@producto_bp.route('/favoritos', methods=['GET'])
def get_favoritos():
    """Obtener todos los productos favoritos"""
    try:
        productos_favoritos = Producto.query.filter_by(es_favorito=True, disponible=True).all()
        return jsonify({
            'success': True,
            'data': [producto.to_dict() for producto in productos_favoritos],
            'total': len(productos_favoritos)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error obteniendo favoritos: {str(e)}'}), 500
