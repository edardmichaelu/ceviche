#!/usr/bin/env python3
"""
Script para probar la funcionalidad de comensales en órdenes
"""

from app import create_app
from models import db
from models.local import Mesa
from models.order import Orden
from services.orden_service import OrdenService

def test_comensales():
    """Probar la creación de una orden con comensales"""
    app = create_app('development')

    with app.app_context():
        try:
            print("🔍 Buscando mesas disponibles...")

            # Buscar una mesa disponible
            mesa_disponible = Mesa.query.filter_by(estado='disponible').first()
            if not mesa_disponible:
                print("❌ No hay mesas disponibles")
                return False

            print(f"✅ Mesa disponible encontrada: {mesa_disponible.numero} (ID: {mesa_disponible.id})")
            print(f"   Capacidad: {mesa_disponible.capacidad} comensales")

            # Crear una orden con comensales
            print("\n🔄 Creando orden con comensales...")
            num_comensales = min(2, mesa_disponible.capacidad)  # Usar cantidad válida
            print(f"   • Solicitando: {num_comensales} comensales (capacidad de mesa: {mesa_disponible.capacidad})")

            if num_comensales > mesa_disponible.capacidad:
                print(f"❌ Error: {num_comensales} comensales excede la capacidad de {mesa_disponible.capacidad}")
                return False

            # Crear orden usando el servicio
            orden = OrdenService.crear_orden(
                mesa_id=mesa_disponible.id,
                mozo_id=2,  # mozo1
                tipo='local',
                cliente_nombre='Cliente de Prueba',
                num_comensales=num_comensales
            )

            print("✅ Orden creada exitosamente!")
            print(f"   • Orden: {orden.numero}")
            print(f"   • Mesa: {orden.mesa.numero}")
            print(f"   • Comensales: {orden.num_comensales}")
            print(f"   • Estado: {orden.estado}")
            print(f"   • Mozo: {orden.mozo.usuario}")

            # Verificar que la mesa se marcó como ocupada
            mesa_actualizada = Mesa.query.get(mesa_disponible.id)
            print(f"   • Estado de mesa: {mesa_actualizada.estado}")

            # Verificar los datos en la base de datos
            print("\n🔍 Verificando datos en base de datos...")
            orden_db = Orden.query.filter_by(numero=orden.numero).first()
            if orden_db:
                print(f"✅ Orden encontrada en BD: {orden_db.numero}")
                print(f"   • Comensales: {orden_db.num_comensales}")
                print(f"   • Mesa: {orden_db.mesa.numero if orden_db.mesa else 'Sin mesa'}")
                print(f"   • Estado: {orden_db.estado}")

                return True
            else:
                print("❌ Orden no encontrada en BD")
                return False

        except Exception as e:
            print(f"❌ Error al crear orden: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    print("🧪 PROBANDO FUNCIONALIDAD DE COMENSALES")
    print("=" * 50)
    success = test_comensales()
    print("=" * 50)
    if success:
        print("\n🎉 ¡Prueba exitosa! La funcionalidad de comensales funciona correctamente.")
    else:
        print("\n💥 La prueba falló. Verifica los errores.")
