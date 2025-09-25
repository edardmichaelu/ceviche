#!/usr/bin/env python3
"""
Script simple para debug
"""

from app import create_app
from models.local import Mesa

def simple_debug():
    app = create_app('development')

    with app.app_context():
        try:
            print("🔍 Simple debug...")

            # Verificar mesas
            mesas = Mesa.query.all()
            print(f"Total mesas: {len(mesas)}")

            if mesas:
                mesa = mesas[0]
                print(f"Primera mesa: {mesa.numero} - Estado: {mesa.estado}")
                print(f"Zona: {mesa.zona.nombre if mesa.zona else 'Sin zona'}")

                # Verificar estados
                estados = {}
                for m in mesas:
                    estado = m.estado
                    estados[estado] = estados.get(estado, 0) + 1

                print("Estados encontrados:")
                for estado, count in estados.items():
                    print(f"  {estado}: {count}")

            print("✅ Debug completado")
            return True

        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    simple_debug()
