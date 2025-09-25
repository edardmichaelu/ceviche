from models.menu import Ingrediente, TipoIngrediente, ProductoIngrediente
from models import db
from services.error_handler import ErrorHandler, ValidationError, BusinessLogicError
from typing import List, Dict, Any, Optional
from datetime import datetime

class IngredienteService:
    @staticmethod
    def get_ingredientes() -> List[Dict[str, Any]]:
        """Obtener todos los ingredientes"""
        try:
            ingredientes = Ingrediente.query.all()
            return [ingrediente.to_dict() for ingrediente in ingredientes]
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener ingredientes')

    @staticmethod
    def get_ingrediente_by_id(ingrediente_id: int) -> Optional[Dict[str, Any]]:
        """Obtener un ingrediente por ID"""
        try:
            ingrediente = Ingrediente.query.get(ingrediente_id)
            if not ingrediente:
                return None
            return ingrediente.to_dict()
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener ingrediente')

    @staticmethod
    def create_ingrediente(data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Crear un nuevo ingrediente"""
        try:
            # Validaciones
            if not data.get('nombre'):
                raise ValidationError('El nombre del ingrediente es obligatorio')

            if len(data.get('nombre', '')) > 100:
                raise ValidationError('El nombre del ingrediente no puede exceder 100 caracteres')

            # Verificar si ya existe un ingrediente con el mismo nombre
            ingrediente_existente = Ingrediente.query.filter_by(nombre=data['nombre']).first()
            if ingrediente_existente:
                raise BusinessLogicError('Ya existe un ingrediente con este nombre')

            # Validar tipo_ingrediente_id si se proporciona
            if 'tipo_ingrediente_id' in data:
                tipo_ingrediente = TipoIngrediente.query.get(data['tipo_ingrediente_id'])
                if not tipo_ingrediente:
                    raise ValidationError('Tipo de ingrediente no válido')

            # Validar stock
            stock = data.get('stock', 0)
            try:
                stock = float(stock)
                if stock < 0:
                    raise ValidationError('El stock no puede ser negativo')
            except (ValueError, TypeError):
                raise ValidationError('El stock debe ser un número válido')

            stock_minimo = data.get('stock_minimo', 0)
            try:
                stock_minimo = float(stock_minimo)
                if stock_minimo < 0:
                    raise ValidationError('El stock mínimo no puede ser negativo')
            except (ValueError, TypeError):
                raise ValidationError('El stock mínimo debe ser un número válido')

            precio_unitario = data.get('precio_unitario', 0)
            try:
                precio_unitario = float(precio_unitario)
                if precio_unitario < 0:
                    raise ValidationError('El precio unitario no puede ser negativo')
            except (ValueError, TypeError):
                raise ValidationError('El precio unitario debe ser un número válido')

            # Crear el ingrediente
            ingrediente = Ingrediente(
                nombre=data['nombre'].strip(),
                descripcion=data.get('descripcion', '').strip() if data.get('descripcion') else None,
                stock=stock,
                stock_minimo=stock_minimo,
                unidad=data.get('unidad', '').strip() if data.get('unidad') else None,
                precio_unitario=precio_unitario,
                tipo_ingrediente_id=data.get('tipo_ingrediente_id'),
                activo=data.get('activo', True),
                fecha_vencimiento=data.get('fecha_vencimiento'),
                proveedor=data.get('proveedor', '').strip() if data.get('proveedor') else None,
                codigo_barras=data.get('codigo_barras', '').strip() if data.get('codigo_barras') else None,
                ubicacion_almacen=data.get('ubicacion_almacen', '').strip() if data.get('ubicacion_almacen') else None
            )

            db.session.add(ingrediente)
            db.session.commit()

            return True, ingrediente.to_dict()

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'crear ingrediente')

    @staticmethod
    def update_ingrediente(ingrediente_id: int, data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Actualizar un ingrediente existente"""
        try:
            ingrediente = Ingrediente.query.get(ingrediente_id)
            if not ingrediente:
                raise BusinessLogicError('Ingrediente no encontrado')

            # Validaciones
            if 'nombre' in data:
                if not data['nombre']:
                    raise ValidationError('El nombre del ingrediente es obligatorio')

                if len(data['nombre']) > 100:
                    raise ValidationError('El nombre del ingrediente no puede exceder 100 caracteres')

                # Verificar si ya existe otro ingrediente con el mismo nombre
                ingrediente_existente = Ingrediente.query.filter(
                    Ingrediente.nombre == data['nombre'],
                    Ingrediente.id != ingrediente_id
                ).first()
                if ingrediente_existente:
                    raise BusinessLogicError('Ya existe otro ingrediente con este nombre')

                ingrediente.nombre = data['nombre'].strip()

            if 'descripcion' in data:
                ingrediente.descripcion = data['descripcion'].strip() if data['descripcion'] else None

            if 'stock' in data:
                try:
                    stock = float(data['stock'])
                    if stock < 0:
                        raise ValidationError('El stock no puede ser negativo')
                    ingrediente.stock = stock
                except (ValueError, TypeError):
                    raise ValidationError('El stock debe ser un número válido')

            if 'stock_minimo' in data:
                try:
                    stock_minimo = float(data['stock_minimo'])
                    if stock_minimo < 0:
                        raise ValidationError('El stock mínimo no puede ser negativo')
                    ingrediente.stock_minimo = stock_minimo
                except (ValueError, TypeError):
                    raise ValidationError('El stock mínimo debe ser un número válido')

            if 'precio_unitario' in data:
                try:
                    precio_unitario = float(data['precio_unitario'])
                    if precio_unitario < 0:
                        raise ValidationError('El precio unitario no puede ser negativo')
                    ingrediente.precio_unitario = precio_unitario
                except (ValueError, TypeError):
                    raise ValidationError('El precio unitario debe ser un número válido')

            if 'tipo_ingrediente_id' in data:
                if data['tipo_ingrediente_id']:
                    tipo_ingrediente = TipoIngrediente.query.get(data['tipo_ingrediente_id'])
                    if not tipo_ingrediente:
                        raise ValidationError('Tipo de ingrediente no válido')
                ingrediente.tipo_ingrediente_id = data['tipo_ingrediente_id']

            if 'unidad' in data:
                ingrediente.unidad = data['unidad'].strip() if data['unidad'] else None

            if 'activo' in data:
                ingrediente.activo = data['activo']

            if 'fecha_vencimiento' in data:
                if data['fecha_vencimiento']:
                    try:
                        if isinstance(data['fecha_vencimiento'], str):
                            ingrediente.fecha_vencimiento = datetime.fromisoformat(data['fecha_vencimiento'])
                        else:
                            ingrediente.fecha_vencimiento = data['fecha_vencimiento']
                    except ValueError:
                        raise ValidationError('Fecha de vencimiento no válida')
                else:
                    ingrediente.fecha_vencimiento = None

            if 'proveedor' in data:
                ingrediente.proveedor = data['proveedor'].strip() if data['proveedor'] else None

            if 'codigo_barras' in data:
                ingrediente.codigo_barras = data['codigo_barras'].strip() if data['codigo_barras'] else None

            if 'ubicacion_almacen' in data:
                ingrediente.ubicacion_almacen = data['ubicacion_almacen'].strip() if data['ubicacion_almacen'] else None

            db.session.commit()

            return True, ingrediente.to_dict()

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'actualizar ingrediente')

    @staticmethod
    def delete_ingrediente(ingrediente_id: int) -> tuple[bool, Dict[str, Any]]:
        """Eliminar un ingrediente"""
        try:
            ingrediente = Ingrediente.query.get(ingrediente_id)
            if not ingrediente:
                raise BusinessLogicError('Ingrediente no encontrado')

            # Verificar si tiene productos asociados
            productos_count = ProductoIngrediente.query.filter_by(ingrediente_id=ingrediente_id).count()
            if productos_count > 0:
                raise BusinessLogicError(f'No se puede eliminar el ingrediente porque está asociado a {productos_count} producto(s). Elimine primero las asociaciones.')

            db.session.delete(ingrediente)
            db.session.commit()

            return True, {'message': 'Ingrediente eliminado exitosamente'}

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'eliminar ingrediente')

    @staticmethod
    def get_ingrediente_with_productos(ingrediente_id: int) -> Optional[Dict[str, Any]]:
        """Obtener un ingrediente con sus productos asociados"""
        try:
            ingrediente = Ingrediente.query.get(ingrediente_id)
            if not ingrediente:
                return None

            ingrediente_data = ingrediente.to_dict()
            ingrediente_data['productos_asociados'] = [
                {
                    'id': producto_asociado.producto.id,
                    'nombre': producto_asociado.producto.nombre,
                    'precio': float(producto_asociado.producto.precio),
                    'cantidad': float(producto_asociado.cantidad),
                    'categoria': producto_asociado.producto.categoria.nombre if producto_asociado.producto.categoria else None
                }
                for producto_asociado in ingrediente.productos_asociados
            ]

            return ingrediente_data

        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener ingrediente con productos')

    @staticmethod
    def get_ingredientes_bajos_stock() -> List[Dict[str, Any]]:
        """Obtener ingredientes con stock bajo"""
        try:
            ingredientes_bajos = Ingrediente.query.filter(
                Ingrediente.stock <= Ingrediente.stock_minimo,
                Ingrediente.activo == True
            ).all()

            return [ingrediente.to_dict() for ingrediente in ingredientes_bajos]
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener ingredientes con stock bajo')
