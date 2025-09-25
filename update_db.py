#!/usr/bin/env python3
"""
Script para actualizar la base de datos con los nuevos modelos y campos
"""

from app import create_app
from models import db
from models.menu import Producto, ProductoImagen, Categoria

def update_database():
    """Actualizar la base de datos con nuevos modelos"""
    app = create_app('development')

    with app.app_context():
        try:
            inspector = db.inspect(db.engine)

            # Asegurar columnas nuevas en categoria
            if 'categoria' in inspector.get_table_names():
                columns = [c['name'] for c in inspector.get_columns('categoria')]
                with db.engine.connect() as conn:
                    changed = False
                    if 'orden' not in columns:
                        conn.execute(db.text("ALTER TABLE categoria ADD COLUMN orden INTEGER DEFAULT 0"))
                        changed = True
                        print("✅ Agregado columna categoria.orden")
                    if 'creado_en' not in columns:
                        conn.execute(db.text("ALTER TABLE categoria ADD COLUMN creado_en DATETIME NULL"))
                        changed = True
                        print("✅ Agregado columna categoria.creado_en")
                    if 'actualizado_en' not in columns:
                        conn.execute(db.text("ALTER TABLE categoria ADD COLUMN actualizado_en DATETIME NULL"))
                        changed = True
                        print("✅ Agregado columna categoria.actualizado_en")
                    if changed:
                        conn.commit()

            # Agregar columna num_comensales a la tabla orden
            if 'orden' in inspector.get_table_names():
                columns = [c['name'] for c in inspector.get_columns('orden')]
                with db.engine.connect() as conn:
                    changed = False
                    if 'num_comensales' not in columns:
                        conn.execute(db.text("ALTER TABLE orden ADD COLUMN num_comensales INTEGER NOT NULL DEFAULT 1"))
                        changed = True
                        print("✅ Agregado columna orden.num_comensales")

                        # Actualizar registros existentes con valor por defecto
                        conn.execute(db.text("UPDATE orden SET num_comensales = 1 WHERE num_comensales IS NULL"))
                        print("✅ Actualizados registros existentes en orden")

                    if changed:
                        conn.commit()

            # Crear todas las tablas (incluyendo nuevas)
            db.create_all()
            print("✅ Base de datos actualizada exitosamente")

            # Verificación
            tables = inspector.get_table_names()
            print(f"\n📋 Tablas en la base de datos: {len(tables)}")
            for table in sorted(tables):
                if any(k in table.lower() for k in ['producto', 'categoria']):
                    print(f"  - {table}")

        except Exception as e:
            print(f"❌ Error actualizando la base de datos: {e}")
            import traceback
            traceback.print_exc()
            return False

    return True

if __name__ == "__main__":
    print("🔄 Actualizando base de datos...")
    success = update_database()
    if success:
        print("\n🎉 ¡Actualización completada exitosamente!")
        print("📝 Los nuevos campos y modelos están listos para usar.")
    else:
        print("\n💥 Hubo un error en la actualización.")
