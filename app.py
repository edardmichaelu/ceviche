import os
import datetime
import json
from flask import Flask, request, jsonify
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config_by_name
from models import db

# Importar los blueprints
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.permission_routes import permission_bp
from routes.upload_routes import upload_bp
from routes.caja_routes import caja_bp
from routes.mesero_routes import mesero_bp
from routes.cocina_routes import cocina_bp
from routes.audit_routes import audit_bp
from routes.audit_routes_simple import audit_bp_simple
from routes.local_routes import local_bp
from routes.reserva_routes import reserva_bp
from routes.reserva_routes_public import reserva_public_bp
from routes.bloqueo_routes import bloqueo_bp
from routes.bloqueo_routes_public import bloqueo_public_bp
from routes.categoria_routes import categoria_bp
from routes.ingrediente_routes import ingrediente_bp
from routes.producto_routes import producto_bp
from routes.tipo_ingrediente_routes import tipo_ingrediente_bp
from routes.producto_ingrediente_routes import producto_ingrediente_bp
from routes.orden_routes import orden_bp

def create_app(config_name=None):
    """
    Application Factory para crear y configurar la aplicación Flask.
    """
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Configurar CORS para desarrollo (permitir acceso desde IPs de la red)
    CORS(app,
         resources={
             r"/api/*": {"origins": "*"},
             r"/auth/*": {"origins": "*"},
             r"/uploads/*": {"origins": "*"}  # Permitir acceso a archivos estáticos
         },
         origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://localhost:3001", "http://10.135.72.183:5173", "http://10.135.72.183:5174", "http://10.135.72.183:5000"],
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
         expose_headers=["Authorization", "Content-Type"])

    # Inicializar extensiones
    db.init_app(app)
    jwt = JWTManager(app)

    # Registrar Blueprints (módulos de rutas) con verificación
    try:
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(permission_bp, url_prefix='/api/permissions')
        app.register_blueprint(upload_bp, url_prefix='/api/upload')
        app.register_blueprint(caja_bp, url_prefix='/api/caja')
        app.register_blueprint(mesero_bp, url_prefix='/api/mesero')
        app.register_blueprint(cocina_bp, url_prefix='/api/cocina')
        app.register_blueprint(audit_bp, url_prefix='/api/audit')
        app.register_blueprint(audit_bp_simple, url_prefix='/api/audit-simple')
        app.register_blueprint(local_bp, url_prefix='/api/local')
        app.register_blueprint(reserva_bp)
        app.register_blueprint(reserva_public_bp)
        app.register_blueprint(bloqueo_bp)
        app.register_blueprint(bloqueo_public_bp)
        app.register_blueprint(categoria_bp, url_prefix='/api/categoria')
        app.register_blueprint(ingrediente_bp, url_prefix='/api/ingrediente')
        app.register_blueprint(producto_bp, url_prefix='/api/producto')
        app.register_blueprint(tipo_ingrediente_bp, url_prefix='/api/tipo-ingrediente')
        app.register_blueprint(producto_ingrediente_bp, url_prefix='/api/producto-ingrediente')
        app.register_blueprint(orden_bp, url_prefix='/api/orden')

        # Verificar que las rutas se registraron correctamente
        tipo_routes = [rule for rule in app.url_map.iter_rules() if 'tipo_ingrediente' in str(rule)]
        ingrediente_routes = [rule for rule in app.url_map.iter_rules() if 'ingrediente' in str(rule) and 'tipo' not in str(rule)]

        if not tipo_routes:
            print("WARNING: No tipo_ingrediente routes found!")
        else:
            print(f"✓ Found {len(tipo_routes)} tipo_ingrediente routes")

        if not ingrediente_routes:
            print("WARNING: No ingrediente routes found!")
        else:
            print(f"✓ Found {len(ingrediente_routes)} ingrediente routes")

    except Exception as e:
        print(f"ERROR registering blueprints: {e}")
        raise

    @app.route("/")
    def index():
        return "<h1>Backend Cevichería</h1><p>Todas las rutas conectadas.</p>"

    @app.route("/test-cors")
    def test_cors():
        """Endpoint de prueba para verificar CORS"""
        return jsonify({
            "message": "CORS funcionando correctamente",
            "status": "success",
            "timestamp": datetime.datetime.now().isoformat()
        }), 200

    @app.route("/api/test")
    def test_api():
        """Endpoint de prueba para verificar que la API funciona"""
        return jsonify({
            "message": "API funcionando correctamente",
            "status": "success",
            "endpoints": [
                "/api/local/pisos/public",
                "/api/local/zonas/public",
                "/api/local/mesas/public"
            ]
        }), 200

    @app.route("/api/test-image")
    def test_image():
        """Crear y servir una imagen de prueba"""
        try:
            from PIL import Image
            import io

            # Crear imagen de prueba
            img = Image.new('RGB', (300, 200), color='red')
            from PIL import ImageDraw
            draw = ImageDraw.Draw(img)
            draw.text((20, 20), "TEST IMAGE", fill='white')

            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)

            from flask import Response
            return Response(
                img_bytes.getvalue(),
                mimetype='image/png',
                headers={'Access-Control-Allow-Origin': '*'}
            )

        except ImportError:
            # Si PIL no está disponible, devolver JSON
            return jsonify({
                "message": "PIL no disponible - instala con: pip install Pillow",
                "status": "error"
            }), 500

    @app.route("/api/test/mesero")
    def test_mesero():
        """Endpoint de prueba para el servicio de mesero"""
        try:
            from services.mesero_service import MeseroService
            layout = MeseroService.get_layout_with_realtime_data()
            return jsonify({
                "message": "MeseroService funcionando",
                "status": "success",
                "layout_length": len(layout),
                "first_piso": layout[0]['nombre'] if layout else None
            }), 200
        except Exception as e:
            return jsonify({
                "message": "Error en MeseroService",
                "error": str(e),
                "status": "error"
            }), 500
    
    # Ruta para servir archivos subidos
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        from flask import send_from_directory
        upload_folder = os.path.join(app.root_path, 'uploads')
        response = send_from_directory(upload_folder, filename)

        # Agregar headers CORS para archivos estáticos
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Vary'] = 'Origin'
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'

        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    # Manejar preflight requests (CORS)
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            origin = request.headers.get('Origin')
            headers = response.headers
            headers['Access-Control-Allow-Origin'] = origin or '*'
            headers['Access-Control-Allow-Credentials'] = 'true'
            headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            headers['Access-Control-Allow-Headers'] = request.headers.get('Access-Control-Request-Headers', 'Authorization, Content-Type, X-Requested-With')
            headers['Vary'] = 'Origin'
            return response

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Vary'] = 'Origin'
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    # --- Manejadores globales de errores para responder siempre JSON ---
    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        payload = {
            "success": False,
            "error": error.name,
            "code": error.code,
            "details": error.description,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        response = app.response_class(
            response=json.dumps(payload),
            status=error.code,
            mimetype='application/json'
        )
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error: Exception):
        # Loguear el error y responder JSON para evitar páginas HTML de error
        app.logger.exception("Unhandled exception: %s", error)
        payload = {
            "success": False,
            "error": "Error interno del servidor",
            "code": "INTERNAL_ERROR",
            "details": str(error),
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        return jsonify(payload), 500

    return app

if __name__ == '__main__':
    env_name = os.getenv('FLASK_ENV', 'development')
    app = create_app(env_name)

    app.run(host='0.0.0.0', port=5000, debug=True)

# Para importación
env_name = os.getenv('FLASK_ENV', 'development')
app = create_app(env_name)
