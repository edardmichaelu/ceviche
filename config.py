import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a-very-secret-flask-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'a-super-secret-jwt-key')
    
    # Configuración explícita para Flask-JWT-Extended
    JWT_TOKEN_LOCATION = ["headers"] # Le dice a JWT que busque el token en los encabezados
    JWT_HEADER_NAME = "Authorization"   # Nombre del encabezado
    JWT_HEADER_TYPE = "Bearer"          # Prefijo del token
    JWT_ACCESS_TOKEN_EXPIRES = False  # Deshabilitar expiración automática
    JWT_IDENTITY_CLAIM = "sub"  # Especificar el claim de identidad
    JWT_ALGORITHM = "HS256"  # Algoritmo de encriptación
    JWT_VERIFY_SUB = False  # Deshabilitar verificación estricta del subject
    JWT_DECODE_ALGORITHMS = ["HS256"]  # Algoritmos permitidos para decodificación

    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URI', 'sqlite:///ceviche_db_dev.sqlite')
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600
    }

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('PROD_DATABASE_URI')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URI', 'sqlite:///:memory:')
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-jwt-secret-key'

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}
