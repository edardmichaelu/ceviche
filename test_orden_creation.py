#!/usr/bin/env python3
"""
Script para probar la creación de órdenes con mesas disponibles
"""

from app import create_app
from models import db
from models.local import Mesa
from services.orden_service import OrdenService

def test_orden_creation():
    """Probar la creación de una orden con una mesa disponible"""
    app = create_app('development')

    with app.app_context():
        try:
            print("🔍 Verificando mesas disponibles...")

            # Buscar mesas disponibles
            mesas_disponibles = Mesa.query.filter_by(estado='disponible', activo=True).all()
            print(f"✅ Mesas disponibles encontradas: {len(mesas_disponibles)}")

            if len(mesas_disponibles) == 0:
                print("❌ No hay mesas disponibles para crear órdenes")
                return False

            # Mostrar las primeras 5 mesas disponibles
            print("\n📋 Primeras 5 mesas disponibles:")
            for i, mesa in enumerate(mesas_disponibles[:5], 1):
                print(f"   {i}. Mesa {mesa.numero} - {mesa.zona} ({mesa.piso}) - Capacidad: {mesa.capacidad}")

            # Seleccionar la primera mesa disponible
            mesa_seleccionada = mesas_disponibles[0]
            print(f"\n🔄 Seleccionando mesa: {mesa_seleccionada.numero} (ID: {mesa_seleccionada.id})")
            print(f"   Capacidad: {mesa_seleccionada.capacidad} comensales")
            print(f"   Estado actual: {mesa_seleccionada.estado}")

            # Crear orden con 2 comensales (válido)
            num_comensales = 2
            print(f"\n🔄 Creando orden con {num_comensales} comensales...")

            orden = OrdenService.crear_orden(
                mesa_id=mesa_seleccionada.id,
                mozo_id=2,  # mozo1
                tipo='local',
                cliente_nombre='Cliente de Prueba Frontend',
                num_comensales=num_comensales
            )

            print("✅ Orden creada exitosamente!"            print(f"   • Orden: {orden.numero}")
            print(f"   • Mesa: {orden.mesa.numero}")
            print(f"   • Comensales: {orden.num_comensales}")
            print(f"   • Estado orden: {orden.estado}")
            print(f"   • Estado mesa: {orden.mesa.estado}")
            print(f"   • Mozo: {orden.mozo.usuario}")

            # Verificar que la mesa se marcó como ocupada
            mesa_actualizada = Mesa.query.get(mesa_seleccionada.id)
            print(f"\n✅ Estado de mesa actualizado: {mesa_actualizada.estado}")

            # Verificar en la base de datos
            orden_db = OrdenService.obtener_orden_por_id(orden.id)
            if orden_db:
                print(f"\n✅ Orden verificada en BD: {orden_db.numero}")
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
    print("🧪 PROBANDO CREACIÓN DE ÓRDENES CON MESAS DISPONIBLES")
    print("=" * 60)
    success = test_orden_creation()
    print("=" * 60)
    if success:
        print("\n🎉 ¡Prueba exitosa! La creación de órdenes funciona correctamente.")
        print("📝 El usuario puede crear órdenes seleccionando mesas disponibles.")
    else:
        print("\n💥 La prueba falló. Verifica los errores.")
