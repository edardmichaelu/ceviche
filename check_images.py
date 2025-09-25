#!/usr/bin/env python3

from models.menu import Producto, ProductoImagen, db

def check_images():
    # Inicializar la app y la base de datos
    from app import create_app
    app = create_app()

    with app.app_context():
        # Verificar productos con imágenes
        productos = Producto.query.filter(Producto.imagenes.any()).all()

        print(f"Productos con imágenes: {len(productos)}")

        for producto in productos:
            print(f"Producto: {producto.nombre} (ID: {producto.id})")
            for imagen in producto.imagenes:
                print(f"  Imagen ID: {imagen.id}, URL: {imagen.imagen_url}, Principal: {imagen.es_principal}")

if __name__ == "__main__":
    check_images()

