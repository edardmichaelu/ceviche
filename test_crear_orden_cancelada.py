#!/usr/bin/env python3
"""
Script para crear una orden cancelada y probar que aparece en el kanban
"""

from app import create_app
from models.order import Orden
from models import db

def test_crear_orden_cancelada():
    """Crear una orden cancelada y verificar que aparece en el kanban"""
    app = create_app('development')

    with app.app_context():
        try:
            print("🔧 === CREANDO ORDEN CANCELADA PARA PRUEBA ===")

            # Obtener una orden existente para cancelar
            from services.orden_service import OrdenService
            ordenes_activas = OrdenService.obtener_ordenes_activas()
            print(f"✅ Órdenes activas disponibles: {len(ordenes_activas)}")

            if not ordenes_activas:
                print("❌ No hay órdenes activas para cancelar")
                return False

            # Buscar una orden que pueda ser cancelada (confirmada, preparando, o lista)
            orden_a_cancelar = None
            for orden in ordenes_activas:
                if orden.estado in ['confirmada', 'preparando', 'lista']:
                    orden_a_cancelar = orden
                    break

            if not orden_a_cancelar:
                print("❌ No hay órdenes en estado válido para cancelar (confirmada, preparando, lista)")
                return False

            print(f"📋 Orden seleccionada: #{orden_a_cancelar.numero} - Estado: {orden_a_cancelar.estado}")

            # Cancelar la orden
            orden_cancelada = OrdenService.actualizar_estado_orden(orden_a_cancelar.id, 'cancelada')
            print(f"✅ Orden cancelada correctamente: {orden_cancelada.estado}")

            # Verificar que aparece en el kanban
            from services.orden_service import OrdenService
            ordenes = OrdenService.obtener_ordenes_activas()

            # Filtrar como hace el endpoint de cocina
            ordenes_pendientes = [
                o for o in ordenes
                if o.estado in ['confirmada', 'preparando', 'lista', 'servida', 'cancelada'] or
                   (o.items and any(item.estado in ['en_cola', 'preparando', 'listo'] for item in o.items))
            ]

            # Buscar la orden cancelada
            orden_en_kanban = next((o for o in ordenes_pendientes if o.id == orden_cancelada.id), None)

            if orden_en_kanban and orden_en_kanban.estado == 'cancelada':
                print("\n✅ ¡ORDEN CANCELADA ENCONTRADA EN EL KANBAN!")
                print(f"   📋 Orden #{orden_en_kanban.numero}")
                print(f"      • Estado: {orden_en_kanban.estado}")
                print(f"      • Mesa: {orden_en_kanban.mesa.numero if orden_en_kanban.mesa else 'N/A'}")
                print(f"      • Cliente: {orden_en_kanban.cliente_nombre or 'Sin nombre'}")
                print(f"      • Total: S/ {orden_en_kanban.monto_total}")

                # Contar órdenes por estado
                estados_kanban = {}
                for orden in ordenes_pendientes:
                    estado = orden.estado
                    estados_kanban[estado] = estados_kanban.get(estado, 0) + 1

                print("\n📊 Distribución en kanban:")
                for estado, count in estados_kanban.items():
                    print(f"   {estado}: {count} órdenes")

                # Revertir el cambio para no afectar la BD
                OrdenService.actualizar_estado_orden(orden_cancelada.id, orden_a_cancelar.estado)
                print("✅ Cambio revertido para no afectar la BD")

                return True
            else:
                print("\n❌ La orden cancelada no aparece en el kanban")
                return False

        except Exception as e:
            print(f"❌ Error al crear orden cancelada: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    print("🧪 CREANDO Y PROBANDO ORDEN CANCELADA EN KANBAN")
    print("=" * 50)
    success = test_crear_orden_cancelada()
    print("=" * 50)
    if success:
        print("\n🎉 ¡Las órdenes canceladas funcionan correctamente!")
        print("📝 Las órdenes canceladas aparecen en la columna 'Cancelada' del kanban")
    else:
        print("\n💥 Hay problemas con las órdenes canceladas")
