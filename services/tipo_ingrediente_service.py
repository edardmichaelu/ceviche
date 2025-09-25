from models.menu import TipoIngrediente, Ingrediente
from models import db
from services.error_handler import ErrorHandler, ValidationError, BusinessLogicError
from typing import List, Dict, Any, Optional

class TipoIngredienteService:
    @staticmethod
    def get_tipos_ingrediente() -> List[Dict[str, Any]]:
        """Obtener todos los tipos de ingrediente"""
        try:
            tipos = TipoIngrediente.query.all()
            return [tipo.to_dict() for tipo in tipos]
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener tipos de ingrediente')

    @staticmethod
    def get_tipo_ingrediente_by_id(tipo_id: int) -> Optional[Dict[str, Any]]:
        """Obtener un tipo de ingrediente por ID"""
        try:
            tipo = TipoIngrediente.query.get(tipo_id)
            if not tipo:
                return None
            return tipo.to_dict()
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener tipo de ingrediente')

    @staticmethod
    def create_tipo_ingrediente(data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Crear un nuevo tipo de ingrediente"""
        try:
            # Validaciones
            if not data.get('nombre'):
                raise ValidationError('El nombre del tipo de ingrediente es obligatorio')

            if len(data.get('nombre', '')) > 50:
                raise ValidationError('El nombre del tipo de ingrediente no puede exceder 50 caracteres')

            # Verificar si ya existe un tipo con el mismo nombre
            tipo_existente = TipoIngrediente.query.filter_by(nombre=data['nombre']).first()
            if tipo_existente:
                raise BusinessLogicError('Ya existe un tipo de ingrediente con este nombre')

            # Crear el tipo de ingrediente
            tipo_ingrediente = TipoIngrediente(
                nombre=data['nombre'].strip(),
                descripcion=data.get('descripcion', '').strip() if data.get('descripcion') else None,
                color=data.get('color', '#6B7280')
            )

            db.session.add(tipo_ingrediente)
            db.session.commit()

            return True, tipo_ingrediente.to_dict()

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'crear tipo de ingrediente')

    @staticmethod
    def update_tipo_ingrediente(tipo_id: int, data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Actualizar un tipo de ingrediente existente"""
        try:
            tipo = TipoIngrediente.query.get(tipo_id)
            if not tipo:
                raise BusinessLogicError('Tipo de ingrediente no encontrado')

            # Validaciones
            if 'nombre' in data:
                if not data['nombre']:
                    raise ValidationError('El nombre del tipo de ingrediente es obligatorio')

                if len(data['nombre']) > 50:
                    raise ValidationError('El nombre del tipo de ingrediente no puede exceder 50 caracteres')

                # Verificar si ya existe otro tipo con el mismo nombre
                tipo_existente = TipoIngrediente.query.filter(
                    TipoIngrediente.nombre == data['nombre'],
                    TipoIngrediente.id != tipo_id
                ).first()
                if tipo_existente:
                    raise BusinessLogicError('Ya existe otro tipo de ingrediente con este nombre')

                tipo.nombre = data['nombre'].strip()

            if 'descripcion' in data:
                tipo.descripcion = data['descripcion'].strip() if data['descripcion'] else None

            if 'color' in data:
                tipo.color = data['color']

            db.session.commit()

            return True, tipo.to_dict()

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'actualizar tipo de ingrediente')

    @staticmethod
    def delete_tipo_ingrediente(tipo_id: int) -> tuple[bool, Dict[str, Any]]:
        """Eliminar un tipo de ingrediente"""
        try:
            tipo = TipoIngrediente.query.get(tipo_id)
            if not tipo:
                raise BusinessLogicError('Tipo de ingrediente no encontrado')

            # Verificar si tiene ingredientes asociados
            ingredientes_count = Ingrediente.query.filter_by(tipo_ingrediente_id=tipo_id).count()
            if ingredientes_count > 0:
                raise BusinessLogicError(f'No se puede eliminar el tipo de ingrediente porque tiene {ingredientes_count} ingrediente(s) asociado(s). Elimine primero los ingredientes.')

            db.session.delete(tipo)
            db.session.commit()

            return True, {'message': 'Tipo de ingrediente eliminado exitosamente'}

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'eliminar tipo de ingrediente')

    @staticmethod
    def get_tipo_ingrediente_with_ingredientes(tipo_id: int) -> Optional[Dict[str, Any]]:
        """Obtener un tipo de ingrediente con sus ingredientes"""
        try:
            tipo = TipoIngrediente.query.get(tipo_id)
            if not tipo:
                return None

            tipo_data = tipo.to_dict()
            tipo_data['ingredientes'] = [
                {
                    'id': ingrediente.id,
                    'nombre': ingrediente.nombre,
                    'stock': float(ingrediente.stock),
                    'unidad': ingrediente.unidad,
                    'activo': ingrediente.activo
                }
                for ingrediente in tipo.ingredientes
            ]

            return tipo_data

        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener tipo de ingrediente con ingredientes')
