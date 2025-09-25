from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
import os
import uuid
from datetime import datetime

upload_bp = Blueprint('upload', __name__)

# Decorador para requerir autenticación de administrador
def admin_required_upload(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            jwt_required()(lambda: None)() # Verifica que haya un JWT válido
            current_user_id = get_jwt_identity()
            # Aquí podrías añadir la lógica para verificar el rol del usuario
            # from models.user import Usuario
            # user = Usuario.query.get(int(current_user_id))
            # if not user or user.rol != 'admin':
            #     return jsonify({"error": "Acceso denegado. Se requiere rol de administrador."}), 403
        except Exception as e:
            return jsonify({"error": f"Error de autenticación: {str(e)}"}), 401
        return fn(*args, **kwargs)
    return wrapper

# Configuración de archivos permitidos
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/avatar', methods=['POST'])
@admin_required_upload
def upload_avatar():
    """Endpoint para subir avatares de usuarios"""
    try:
        # Verificar que hay un archivo en la petición
        if 'file' not in request.files:
            return jsonify({'error': 'No se encontró archivo en la petición'}), 400
        
        file = request.files['file']
        
        # Verificar que el archivo no esté vacío
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        # Verificar que el archivo sea válido
        if not allowed_file(file.filename):
            return jsonify({'error': 'Tipo de archivo no permitido. Use PNG, JPG, JPEG, GIF o WEBP'}), 400
        
        # Verificar tamaño del archivo
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'El archivo es demasiado grande. Máximo 5MB'}), 400
        
        # Generar nombre único para el archivo
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Crear directorio si no existe
        upload_folder = os.path.join(current_app.root_path, 'uploads', 'avatars')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Guardar archivo
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Generar URL relativa para el frontend
        file_url = f"/uploads/avatars/{unique_filename}"
        
        return jsonify({
            'success': True,
            'message': 'Archivo subido exitosamente',
            'file_url': file_url,
            'filename': unique_filename
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error subiendo archivo: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@upload_bp.route('/producto', methods=['POST'])
@admin_required_upload
def upload_producto_image():
    """Subir imagen para productos (uploads/productos)"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No se encontró archivo en la petición'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No se seleccionó ningún archivo'}), 400

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Tipo de archivo no permitido. Use PNG, JPG, JPEG, GIF o WEBP'}), 400

        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE:
            return jsonify({'success': False, 'error': 'El archivo es demasiado grande. Máximo 5MB'}), 400

        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        upload_folder = os.path.join(current_app.root_path, 'uploads', 'productos')
        os.makedirs(upload_folder, exist_ok=True)

        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)

        file_url = f"/uploads/productos/{unique_filename}"

        return jsonify({
            'success': True,
            'message': 'Imagen de producto subida exitosamente',
            'file_url': file_url,
            'filename': unique_filename
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error subiendo imagen de producto: {str(e)}")
        return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500

@upload_bp.route('/avatar/<filename>', methods=['DELETE'])
def delete_avatar(filename):
    """Endpoint para eliminar avatares"""
    try:
        # Verificar que el archivo existe
        upload_folder = os.path.join(current_app.root_path, 'uploads', 'avatars')
        file_path = os.path.join(upload_folder, secure_filename(filename))
        
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True, 'message': 'Archivo eliminado exitosamente'}), 200
        else:
            return jsonify({'error': 'Archivo no encontrado'}), 404
            
    except Exception as e:
        current_app.logger.error(f"Error eliminando archivo: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500
