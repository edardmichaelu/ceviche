#!/usr/bin/env python3
"""
Script específico para agregar la columna num_comensales a la tabla orden
"""

from app import create_app
from models import db
from sqlalchemy import text
import traceback

def add_comensales_column():
    """Agregar la columna num_comensales a la tabla orden"""
    app = create_app('development')

    with app.app_context():
        try:
            inspector = db.inspect(db.engine)

            print("🔍 Verificando tablas existentes...")
            tables = inspector.get_table_names()
            print(f"📋 Tablas encontradas: {len(tables)}")
            print(f"   Tablas: {', '.join(sorted(tables))}")

            if 'orden' in tables:
                print("✅ Tabla 'orden' encontrada")

                columns = [c['name'] for c in inspector.get_columns('orden')]
                print(f"📋 Columnas en orden: {', '.join(columns)}")

                with db.engine.connect() as conn:
                    changed = False

                    if 'num_comensales' not in columns:
                        print("🔄 Agregando columna num_comensales...")
                        conn.execute(text("ALTER TABLE orden ADD COLUMN num_comensales INTEGER NOT NULL DEFAULT 1"))
                        changed = True
                        print("✅ Columna num_comensales agregada exitosamente")

                        # Actualizar registros existentes con valor por defecto
                        conn.execute(text("UPDATE orden SET num_comensales = 1 WHERE num_comensales IS NULL"))
                        print("✅ Registros existentes actualizados")

                    else:
                        print("ℹ️  La columna num_comensales ya existe")

                    if changed:
                        conn.commit()
                        print("✅ Cambios confirmados en la base de datos")

                # Verificación final
                print("\n🔍 Verificación final:")
                columns_final = [c['name'] for c in inspector.get_columns('orden')]
                print(f"📋 Columnas finales en orden: {', '.join(columns_final)}")

                if 'num_comensales' in columns_final:
                    print("✅ ¡Columna num_comensales agregada correctamente!")
                    return True
                else:
                    print("❌ La columna num_comensales no se encontró después de la operación")
                    return False

            else:
                print(f"❌ Tabla 'orden' no encontrada. Tablas disponibles: {', '.join(sorted(tables))}")
                return False

        except Exception as e:
            print(f"❌ Error al agregar la columna: {e}")
            print("🔍 Stack trace:")
            traceback.print_exc()
            return False

if __name__ == "__main__":
    print("🔄 Agregando columna num_comensales a la tabla orden...")
    print("=" * 60)
    success = add_comensales_column()
    print("=" * 60)
    if success:
        print("\n🎉 ¡Columna agregada exitosamente!")
        print("📝 El sistema ahora puede manejar el número de comensales por orden.")
    else:
        print("\n💥 Hubo un error al agregar la columna.")
        print("💡 Verifica que la base de datos esté accesible y la tabla 'orden' exista.")
