import traceback
from models.menu import ProductoIngrediente, Producto, Ingrediente
from models import db
from services.error_handler import ErrorHandler, ValidationError, BusinessLogicError
from typing import List, Dict, Any, Optional

class ProductoIngredienteService:
    @staticmethod
    def get_productos_ingredientes() -> List[Dict[str, Any]]:
        """Obtener todas las asociaciones producto-ingrediente"""
        try:
            asociaciones = ProductoIngrediente.query.all()
            return [asociacion.to_dict() for asociacion in asociaciones]
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener asociaciones producto-ingrediente')

    @staticmethod
    def get_producto_ingrediente_by_id(asociacion_id: int) -> Optional[Dict[str, Any]]:
        """Obtener una asociación producto-ingrediente por ID"""
        try:
            asociacion = ProductoIngrediente.query.get(asociacion_id)
            if not asociacion:
                return None
            return asociacion.to_dict()
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener asociación producto-ingrediente')

    @staticmethod
    def get_ingredientes_by_producto(producto_id: int) -> List[Dict[str, Any]]:
        """Obtener todos los ingredientes de un producto"""
        try:
            producto = Producto.query.get(producto_id)
            if not producto:
                return []

            ingredientes = []
            for asociacion in producto.ingredientes_asociados:
                ingredientes.append({
                    'asociacion_id': asociacion.id,
                    'ingrediente_id': asociacion.ingrediente.id,
                    'ingrediente_nombre': asociacion.ingrediente.nombre,
                    'cantidad': float(asociacion.cantidad),
                    'unidad': asociacion.ingrediente.unidad,
                    'tipo_ingrediente': asociacion.ingrediente.tipo.nombre if asociacion.ingrediente.tipo else None,
                    'stock_disponible': float(asociacion.ingrediente.stock)
                })

            return ingredientes
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener ingredientes del producto')

    @staticmethod
    def get_productos_by_ingrediente(ingrediente_id: int) -> List[Dict[str, Any]]:
        """Obtener todos los productos que usan un ingrediente"""
        try:
            ingrediente = Ingrediente.query.get(ingrediente_id)
            if not ingrediente:
                return []

            productos = []
            for asociacion in ingrediente.productos_asociados:
                productos.append({
                    'asociacion_id': asociacion.id,
                    'producto_id': asociacion.producto.id,
                    'producto_nombre': asociacion.producto.nombre,
                    'cantidad': float(asociacion.cantidad),
                    'categoria': asociacion.producto.categoria.nombre if asociacion.producto.categoria else None,
                    'precio': float(asociacion.producto.precio),
                    'disponible': asociacion.producto.disponible
                })

            return productos
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'obtener productos del ingrediente')

    @staticmethod
    def create_producto_ingrediente(data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Crear una nueva asociación producto-ingrediente"""
        try:
            # Validaciones
            if not data.get('producto_id'):
                raise ValidationError('El ID del producto es obligatorio')

            if not data.get('ingrediente_id'):
                raise ValidationError('El ID del ingrediente es obligatorio')

            cantidad = data.get('cantidad')
            if cantidad is None:
                raise ValidationError('La cantidad es obligatoria')

            try:
                cantidad = float(cantidad)
                if cantidad <= 0:
                    raise ValidationError('La cantidad debe ser mayor a cero')
            except (ValueError, TypeError):
                raise ValidationError('La cantidad debe ser un número válido')

            # Verificar que el producto existe
            producto = Producto.query.get(data['producto_id'])
            if not producto:
                raise ValidationError('Producto no encontrado')

            # Verificar que el ingrediente existe
            ingrediente = Ingrediente.query.get(data['ingrediente_id'])
            if not ingrediente:
                raise ValidationError('Ingrediente no encontrado')

            # Verificar si ya existe la asociación
            asociacion_existente = ProductoIngrediente.query.filter_by(
                producto_id=data['producto_id'],
                ingrediente_id=data['ingrediente_id']
            ).first()
            if asociacion_existente:
                raise BusinessLogicError('Ya existe una asociación entre este producto e ingrediente')

            # Crear la asociación
            asociacion = ProductoIngrediente(
                producto_id=data['producto_id'],
                ingrediente_id=data['ingrediente_id'],
                cantidad=cantidad
            )

            db.session.add(asociacion)
            db.session.commit()

            return True, asociacion.to_dict()

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'crear asociación producto-ingrediente')

    @staticmethod
    def update_producto_ingrediente(asociacion_id: int, data: Dict[str, Any]) -> tuple[bool, Dict[str, Any]]:
        """Actualizar una asociación producto-ingrediente existente"""
        try:
            asociacion = ProductoIngrediente.query.get(asociacion_id)
            if not asociacion:
                raise BusinessLogicError('Asociación producto-ingrediente no encontrada')

            # Validaciones para cantidad
            if 'cantidad' in data:
                cantidad = data['cantidad']
                try:
                    cantidad = float(cantidad)
                    if cantidad <= 0:
                        raise ValidationError('La cantidad debe ser mayor a cero')
                    asociacion.cantidad = cantidad
                except (ValueError, TypeError):
                    raise ValidationError('La cantidad debe ser un número válido')

            if 'producto_id' in data:
                if not data['producto_id']:
                    raise ValidationError('El ID del producto es obligatorio')

                producto = Producto.query.get(data['producto_id'])
                if not producto:
                    raise ValidationError('Producto no encontrado')
                asociacion.producto_id = data['producto_id']

            if 'ingrediente_id' in data:
                if not data['ingrediente_id']:
                    raise ValidationError('El ID del ingrediente es obligatorio')

                ingrediente = Ingrediente.query.get(data['ingrediente_id'])
                if not ingrediente:
                    raise ValidationError('Ingrediente no encontrado')
                asociacion.ingrediente_id = data['ingrediente_id']

            db.session.commit()

            return True, asociacion.to_dict()

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'actualizar asociación producto-ingrediente')

    @staticmethod
    def delete_producto_ingrediente(asociacion_id: int) -> tuple[bool, Dict[str, Any]]:
        """Eliminar una asociación producto-ingrediente"""
        try:
            asociacion = ProductoIngrediente.query.get(asociacion_id)
            if not asociacion:
                raise BusinessLogicError('Asociación producto-ingrediente no encontrada')

            db.session.delete(asociacion)
            db.session.commit()

            return True, {'message': 'Asociación producto-ingrediente eliminada exitosamente'}

        except (ValidationError, BusinessLogicError) as e:
            return False, {'error': str(e)}
        except Exception as e:
            return ErrorHandler.handle_service_error(e, 'eliminar asociación producto-ingrediente')

    @staticmethod
    def verificar_stock_suficiente(producto_id: int, cantidad_necesaria: int = 1) -> tuple[bool, Dict[str, Any]]:
        """Verificar si hay stock suficiente para producir un producto"""
        try:
            print(f"[SERVICE DEBUG] Verificando stock para producto {producto_id}")
            producto = Producto.query.get(producto_id)
            print(f"[SERVICE DEBUG] Producto encontrado: {producto}")
            if not producto:
                print(f"[SERVICE DEBUG] Producto no encontrado: {producto_id}")
                return False, {'error': 'Producto no encontrado'}

            ingredientes_insuficientes = []
            print(f"[SERVICE DEBUG] Producto tiene {len(producto.ingredientes_asociados)} ingredientes asociados")

            for asociacion in producto.ingredientes_asociados:
                stock_necesario = float(asociacion.cantidad) * cantidad_necesaria
                stock_disponible = float(asociacion.ingrediente.stock)

                print(f"[SERVICE DEBUG] Ingrediente {asociacion.ingrediente.nombre}: stock_disponible={stock_disponible}, stock_necesario={stock_necesario}")

                if stock_disponible < stock_necesario:
                    ingredientes_insuficientes.append({
                        'ingrediente_id': asociacion.ingrediente.id,
                        'ingrediente_nombre': asociacion.ingrediente.nombre,
                        'stock_disponible': stock_disponible,
                        'stock_necesario': stock_necesario,
                        'diferencia': stock_necesario - stock_disponible,
                        'unidad': asociacion.ingrediente.unidad
                    })

            if ingredientes_insuficientes:
                print(f"[SERVICE DEBUG] Stock insuficiente para {len(ingredientes_insuficientes)} ingredientes")
                return False, {
                    'error': 'Stock insuficiente',
                    'ingredientes_insuficientes': ingredientes_insuficientes
                }

            print("[SERVICE DEBUG] Stock suficiente disponible")
            return True, {'message': 'Stock suficiente disponible'}

        except Exception as e:
            print(f"[SERVICE DEBUG] Error en verificar_stock_suficiente: {str(e)}")
            print(f"[SERVICE DEBUG] Traceback: {traceback.format_exc()}")
            return False, {'error': f'Error verificando stock: {str(e)}'}
