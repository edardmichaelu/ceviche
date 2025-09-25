"""
Sistema centralizado de manejo de errores para la aplicación Ceviche
"""
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import traceback
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ErrorHandler:
    """Clase para manejo centralizado de errores"""
    
    @staticmethod
    def handle_service_error(error: Exception, operation: str, entity: str = None) -> Tuple[None, Dict[str, str]]:
        """
        Maneja errores en servicios y retorna formato estándar
        
        Args:
            error: La excepción capturada
            operation: Operación que se estaba realizando (crear, actualizar, eliminar, etc.)
            entity: Entidad afectada (usuario, reserva, bloqueo, etc.)
        
        Returns:
            Tuple con (None, dict_error)
        """
        error_message = str(error)
        entity_name = entity or "entidad"
        
        # Log del error para debugging
        logger.error(f"Error en {operation} {entity_name}: {error_message}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Determinar tipo de error y mensaje apropiado
        if "IntegrityError" in str(type(error)):
            return None, {
                "error": f"Error de integridad de datos en {operation} {entity_name}",
                "details": "Los datos proporcionados violan las restricciones de la base de datos",
                "code": "INTEGRITY_ERROR"
            }
        elif "DataError" in str(type(error)):
            return None, {
                "error": f"Error de datos en {operation} {entity_name}",
                "details": "Los datos proporcionados no son válidos para el campo especificado",
                "code": "DATA_ERROR"
            }
        elif "OperationalError" in str(type(error)):
            return None, {
                "error": f"Error de operación de base de datos en {operation} {entity_name}",
                "details": "Error de conexión o consulta a la base de datos",
                "code": "DATABASE_ERROR"
            }
        else:
            return None, {
                "error": f"Error interno en {operation} {entity_name}",
                "details": error_message,
                "code": "INTERNAL_ERROR"
            }
    
    @staticmethod
    def handle_validation_error(field: str, message: str, value: Any = None) -> Tuple[None, Dict[str, str]]:
        """
        Maneja errores de validación
        
        Args:
            field: Campo que falló la validación
            message: Mensaje de error específico
            value: Valor que causó el error (opcional)
        
        Returns:
            Tuple con (None, dict_error)
        """
        error_data = {
            "error": f"Error de validación en campo '{field}'",
            "details": message,
            "field": field,
            "code": "VALIDATION_ERROR"
        }
        
        if value is not None:
            error_data["value"] = str(value)
        
        logger.warning(f"Error de validación: {field} - {message}")
        return None, error_data
    
    @staticmethod
    def handle_not_found_error(entity: str, entity_id: Any = None) -> Tuple[None, Dict[str, str]]:
        """
        Maneja errores de entidad no encontrada
        
        Args:
            entity: Tipo de entidad (usuario, reserva, bloqueo, etc.)
            entity_id: ID de la entidad no encontrada (opcional)
        
        Returns:
            Tuple con (None, dict_error)
        """
        message = f"{entity.capitalize()} no encontrado"
        if entity_id is not None:
            message += f" con ID: {entity_id}"
        
        logger.warning(f"Entidad no encontrada: {entity} - ID: {entity_id}")
        return None, {
            "error": message,
            "details": f"El {entity} especificado no existe en el sistema",
            "code": "NOT_FOUND"
        }
    
    @staticmethod
    def handle_business_logic_error(message: str, details: str = None) -> Tuple[None, Dict[str, str]]:
        """
        Maneja errores de lógica de negocio
        
        Args:
            message: Mensaje principal del error
            details: Detalles adicionales (opcional)
        
        Returns:
            Tuple con (None, dict_error)
        """
        error_data = {
            "error": message,
            "code": "BUSINESS_LOGIC_ERROR"
        }
        
        if details:
            error_data["details"] = details
        
        logger.warning(f"Error de lógica de negocio: {message}")
        return None, error_data
    
    @staticmethod
    def handle_permission_error(action: str, resource: str) -> Tuple[None, Dict[str, str]]:
        """
        Maneja errores de permisos
        
        Args:
            action: Acción que se intentó realizar
            resource: Recurso al que se intentó acceder
        
        Returns:
            Tuple con (None, dict_error)
        """
        logger.warning(f"Error de permisos: {action} en {resource}")
        return None, {
            "error": f"No tiene permisos para {action} {resource}",
            "details": "Contacte al administrador si necesita acceso",
            "code": "PERMISSION_DENIED"
        }
    
    @staticmethod
    def create_success_response(data: Any = None, message: str = None) -> Dict[str, Any]:
        """
        Crea una respuesta de éxito estandarizada
        
        Args:
            data: Datos a retornar (opcional)
            message: Mensaje de éxito (opcional)
        
        Returns:
            Dict con respuesta de éxito
        """
        response = {
            "success": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if data is not None:
            response["data"] = data
        
        if message:
            response["message"] = message
        
        return response
    
    @staticmethod
    def create_error_response(error_data, status_code: int = 400) -> Tuple[Dict[str, Any], int]:
        """
        Crea una respuesta de error estandarizada

        Args:
            error_data: Datos del error (puede ser dict o tupla (None, dict))
            status_code: Código de estado HTTP

        Returns:
            Tuple con (dict_error, status_code)
        """
        # Si error_data es una tupla (resultado de handle_service_error), extraer el diccionario
        if isinstance(error_data, tuple) and len(error_data) == 2 and error_data[0] is None:
            error_dict = error_data[1]
        elif isinstance(error_data, dict):
            error_dict = error_data
        else:
            error_dict = {"error": "Formato de error_data inválido", "code": "INTERNAL_ERROR"}

        response = {
            "success": False,
            "error": error_dict.get("error", "Error desconocido"),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Agregar campos adicionales si existen
        for key in ["details", "field", "value", "code"]:
            if key in error_dict:
                response[key] = error_dict[key]

        return response, status_code

class ValidationError(Exception):
    """Excepción personalizada para errores de validación"""
    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"Error de validación en {field}: {message}")

class BusinessLogicError(Exception):
    """Excepción personalizada para errores de lógica de negocio"""
    def __init__(self, message: str, details: str = None):
        self.message = message
        self.details = details
        super().__init__(message)
