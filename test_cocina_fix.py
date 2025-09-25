#!/usr/bin/env python3
"""
Script para probar las correcciones de CocinaPage
"""

def test_modelo_orden():
    """Probar que el modelo Orden incluye items en to_dict"""
    print("🔍 Probando modelo Orden...")

    try:
        from models.order import Orden, ItemOrden

        # Verificar que el método to_dict existe
        orden = Orden()
        orden_dict = orden.to_dict()

        if 'items' in orden_dict:
            print("✅ Modelo Orden incluye 'items' en to_dict")
            return True
        else:
            print("❌ Modelo Orden no incluye 'items' en to_dict")
            return False

    except Exception as e:
        print(f"❌ Error al probar modelo Orden: {e}")
        return False

def test_modelo_item_orden():
    """Probar que el modelo ItemOrden incluye producto en to_dict"""
    print("🔍 Probando modelo ItemOrden...")

    try:
        from models.order import ItemOrden

        # Verificar que el método to_dict existe
        item = ItemOrden()
        item_dict = item.to_dict()

        if 'producto' in item_dict:
            print("✅ Modelo ItemOrden incluye 'producto' en to_dict")
            return True
        else:
            print("❌ Modelo ItemOrden no incluye 'producto' en to_dict")
            return False

    except Exception as e:
        print(f"❌ Error al probar modelo ItemOrden: {e}")
        return False

def test_frontend_seguridad():
    """Probar que el frontend tiene verificaciones de seguridad"""
    print("🔍 Probando verificaciones de seguridad en frontend...")

    try:
        with open('ceviche-frontend/src/pages/CocinaPage.tsx', 'r', encoding='utf-8') as f:
            content = f.read()

        if 'ordenes && Array.isArray(ordenes) && ordenes.map' in content:
            print("✅ Frontend tiene verificación de seguridad para ordenes")
        else:
            print("❌ Frontend no tiene verificación de seguridad para ordenes")
            return False

        if 'orden.items && Array.isArray(orden.items) && orden.items.map' in content:
            print("✅ Frontend tiene verificación de seguridad para orden.items")
        else:
            print("❌ Frontend no tiene verificación de seguridad para orden.items")
            return False

        return True

    except Exception as e:
        print(f"❌ Error al probar frontend: {e}")
        return False

def main():
    """Ejecutar todas las pruebas"""
    print("🧪 Probando correcciones de CocinaPage...\n")

    tests = [
        test_modelo_orden,
        test_modelo_item_orden,
        test_frontend_seguridad
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
                print("✅ PASSED\n")
            else:
                print("❌ FAILED\n")
        except Exception as e:
            print(f"❌ ERROR: {e}\n")

    print(f"📊 Resultados: {passed}/{total} pruebas pasaron")

    if passed == total:
        print("🎉 ¡Todas las correcciones de CocinaPage están funcionando correctamente!")
        return True
    else:
        print("⚠️ Algunas correcciones necesitan atención")
        return False

if __name__ == "__main__":
    main()
