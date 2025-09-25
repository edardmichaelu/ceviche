#!/usr/bin/env python3
"""
Script para verificar el estado de las mesas después de la inicialización
"""

from app import create_app
from models import db
from models.local import Mesa
from sqlalchemy import text

def check_mesas_status():
    """Verificar el estado de todas las mesas"""
    app = create_app('development')

    with app.app_context():
        try:
            # Obtener todas las mesas
            mesas = Mesa.query.all()

            print("📋 ESTADO ACTUAL DE LAS MESAS:")
            print("=" * 60)

            total_mesas = len(mesas)
            mesas_disponibles = 0
            mesas_ocupadas = 0
            mesas_reservadas = 0
            mesas_limpieza = 0

            for mesa in mesas:
                zona_name = mesa.zona.nombre if mesa.zona else 'Sin zona'
                print(f"Mesa {mesa.numero:3} | ID: {mesa.id:2} | Estado: {mesa.estado:12} | Zona: {zona_name:10} | Capacidad: {mesa.capacidad}")

                if mesa.estado == 'disponible':
                    mesas_disponibles += 1
                elif mesa.estado == 'ocupada':
                    mesas_ocupadas += 1
                elif mesa.estado == 'reservada':
                    mesas_reservadas += 1
                elif mesa.estado == 'limpieza':
                    mesas_limpieza += 1

            print("\n📊 RESUMEN:")
            print(f"   • Total mesas: {total_mesas}")
            print(f"   • Disponibles: {mesas_disponibles}")
            print(f"   • Ocupadas: {mesas_ocupadas}")
            print(f"   • Reservadas: {mesas_reservadas}")
            print(f"   • Limpieza: {mesas_limpieza}")

            # Verificar mesas con capacidad
            print("\n🏗️  CAPACIDAD POR MESA:")
            capacidades = {}
            for mesa in mesas:
                cap = mesa.capacidad
                if cap not in capacidades:
                    capacidades[cap] = 0
                capacidades[cap] += 1

            for capacidad, cantidad in sorted(capacidades.items()):
                print(f"   • Capacidad {capacidad}: {cantidad} mesas")

            # Verificar órdenes existentes
            from models.order import Orden
            ordenes = Orden.query.all()
            print(f"\n📝 ÓRDENES EXISTENTES: {len(ordenes)}")
            for orden in ordenes:
                print(f"   • Orden {orden.numero}: Mesa {orden.mesa.numero if orden.mesa else 'Sin mesa'} - {orden.num_comensales} comensales")

            print("\n✅ Verificación completada")

        except Exception as e:
            print(f"❌ Error al verificar mesas: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    check_mesas_status()
