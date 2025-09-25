from models.menu import Categoria, Producto
from models import db
from services.error_handler import ErrorHandler, ValidationError, BusinessLogicError
from typing import List, Dict, Any, Optional

class CategoriaService:
    @staticmethod
    def get_categorias() -> List[Dict[str, Any]]:
        """Obtener todas las categorías"""
        try:
            categorias = Categoria.query.all()
            return [categoria.to_dict() for categoria in categorias]
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener categorías')

    @staticmethod
    def get_categoria_by_id(categoria_id: int) -> Optional[Dict[str, Any]]:
        """Obtener una categoría por ID"""
        try:
            categoria = Categoria.query.get(categoria_id)
            if not categoria:
                return None
            return categoria.to_dict()
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener categoría')

    @staticmethod
    def create_categoria(data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Crear una nueva categoría"""
        try:
            # Validaciones
            if not data.get('nombre'):
                raise ValidationError('El nombre de la categoría es obligatorio')
            
            if len(data.get('nombre', '')) > 50:
                raise ValidationError('El nombre de la categoría no puede exceder 50 caracteres')
            
            # Verificar si ya existe una categoría con el mismo nombre
            categoria_existente = Categoria.query.filter_by(nombre=data['nombre']).first()
            if categoria_existente:
                raise BusinessLogicError('Ya existe una categoría con este nombre')
            
            # Crear la categoría
            categoria = Categoria(
                nombre=data['nombre'].strip(),
                descripcion=data.get('descripcion', '').strip() if data.get('descripcion') else None,
                icono=data.get('icono', '🍽️'),
                color=data.get('color', 'blue'),
                activo=data.get('activo', True)
            )
            
            db.session.add(categoria)
            db.session.commit()
            
            return True, categoria.to_dict()
            
        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'crear categoría')

    @staticmethod
    def update_categoria(categoria_id: int, data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Actualizar una categoría existente"""
        try:
            categoria = Categoria.query.get(categoria_id)
            if not categoria:
                raise BusinessLogicError('Categoría no encontrada')
            
            # Validaciones
            if 'nombre' in data:
                if not data['nombre']:
                    raise ValidationError('El nombre de la categoría es obligatorio')
                
                if len(data['nombre']) > 50:
                    raise ValidationError('El nombre de la categoría no puede exceder 50 caracteres')
                
                # Verificar si ya existe otra categoría con el mismo nombre
                categoria_existente = Categoria.query.filter(
                    Categoria.nombre == data['nombre'],
                    Categoria.id != categoria_id
                ).first()
                if categoria_existente:
                    raise BusinessLogicError('Ya existe otra categoría con este nombre')
                
                categoria.nombre = data['nombre'].strip()
            
            if 'descripcion' in data:
                categoria.descripcion = data['descripcion'].strip() if data['descripcion'] else None

            if 'icono' in data:
                categoria.icono = data['icono']

            if 'color' in data:
                categoria.color = data['color']

            if 'activo' in data:
                categoria.activo = data['activo']

            db.session.commit()

            return True, categoria.to_dict()
            
        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'actualizar categoría')

    @staticmethod
    def delete_categoria(categoria_id: int) -> tuple[bool, Dict[str, Any]]:
        """Eliminar una categoría"""
        try:
            categoria = Categoria.query.get(categoria_id)
            if not categoria:
                raise BusinessLogicError('Categoría no encontrada')
            
            # Verificar si tiene productos asociados
            productos_count = Producto.query.filter_by(categoria_id=categoria_id).count()
            if productos_count > 0:
                raise BusinessLogicError(f'No se puede eliminar la categoría porque tiene {productos_count} producto(s) asociado(s). Elimine primero los productos.')
            
            db.session.delete(categoria)
            db.session.commit()
            
            return True, {'message': 'Categoría eliminada exitosamente'}
            
        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'eliminar categoría')

    @staticmethod
    def get_categoria_with_products(categoria_id: int) -> Optional[Dict[str, Any]]:
        """Obtener una categoría con sus productos"""
        try:
            categoria = Categoria.query.get(categoria_id)
            if not categoria:
                return None
            
            categoria_data = categoria.to_dict()
            categoria_data['productos'] = [
                {
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'precio': float(producto.precio),
                    'disponible': producto.disponible,
                    'tipo_estacion': producto.tipo_estacion
                }
                for producto in categoria.productos
            ]
            
            return categoria_data
            
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener categoría con productos')
