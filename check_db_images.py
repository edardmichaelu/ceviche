#!/usr/bin/env python3

from models.menu import Producto, ProductoImagen, db
from app import create_app

def check_images():
    """Verificar si hay imágenes en la base de datos"""
    app = create_app()

    with app.app_context():
        # Verificar productos con imágenes
        productos = Producto.query.filter(Producto.imagenes.any()).all()

        print(f"Productos con imágenes: {len(productos)}")

        for producto in productos:
            print(f"\nProducto: {producto.nombre} (ID: {producto.id})")
            for imagen in producto.imagenes:
                print(f"  Imagen ID: {imagen.id}, URL: {imagen.imagen_url}, Principal: {imagen.es_principal}")

        # Verificar total de imágenes
        total_imagenes = ProductoImagen.query.count()
        print(f"\nTotal de imágenes en la base de datos: {total_imagenes}")

        # Verificar productos favoritos
        favoritos = Producto.query.filter_by(es_favorito=True).all()
        print(f"Productos favoritos: {len(favoritos)}")
        for fav in favoritos:
            print(f"  - {fav.nombre}")

if __name__ == "__main__":
    check_images()

