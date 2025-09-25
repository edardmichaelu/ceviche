#!/usr/bin/env python3

import os
import random
from app import create_app
from models.menu import Producto, ProductoImagen, db

def seed_product_images():
    """Asociar imágenes existentes con productos de forma aleatoria"""
    app = create_app()

    with app.app_context():
        # Obtener todos los productos
        productos = Producto.query.all()
        print(f"Total de productos: {len(productos)}")

        # Obtener archivos de imagen del directorio uploads/productos
        upload_dir = os.path.join(app.root_path, 'uploads', 'productos')
        if os.path.exists(upload_dir):
            imagen_files = [f for f in os.listdir(upload_dir)
                          if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
                          and not f.startswith('test_')]
        else:
            print(f"Directorio {upload_dir} no existe")
            return

        print(f"Total de imágenes disponibles: {len(imagen_files)}")
        print(f"Primeras 5 imágenes: {imagen_files[:5]}")

        # Crear asociaciones aleatorias
        imagenes_creadas = 0
        for producto in productos:
            # Asignar entre 1 y 3 imágenes por producto
            num_imagenes = min(random.randint(1, 3), len(imagen_files))

            for i in range(num_imagenes):
                if not imagen_files:
                    break

                # Tomar una imagen aleatoria
                imagen_file = random.choice(imagen_files)
                imagen_files.remove(imagen_file)

                # Crear registro en la base de datos
                nueva_imagen = ProductoImagen(
                    producto_id=producto.id,
                    imagen_url=f"/uploads/productos/{imagen_file}",
                    orden=i,
                    es_principal=(i == 0),  # La primera imagen será la principal
                    descripcion=imagen_file
                )

                db.session.add(nueva_imagen)
                imagenes_creadas += 1

                print(f"Asociando {imagen_file} con {producto.nombre}")

        # Hacer commit de todos los cambios
        db.session.commit()
        print(f"\nTotal de imágenes asociadas: {imagenes_creadas}")

        # Verificar algunos productos con imágenes
        print("\n--- Verificando productos con imágenes ---")
        productos_con_imagenes = Producto.query.filter(Producto.imagenes.any()).limit(5).all()
        for producto in productos_con_imagenes:
            print(f"Producto: {producto.nombre}")
            for imagen in producto.imagenes:
                print(f"  - {imagen.imagen_url} (Principal: {imagen.es_principal})")

if __name__ == "__main__":
    seed_product_images()

