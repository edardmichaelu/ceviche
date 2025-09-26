#!/usr/bin/env python3
"""
Generador de códigos QR para acceso rápido desde dispositivos móviles
"""
import qrcode
import os
from PIL import Image, ImageDraw, ImageFont

def generate_qr_code():
    # URL de tu aplicación
    url = "http://10.135.72.183:5173"
    
    # Configuración del QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(url)
    qr.make(fit=True)
    
    # Crear imagen del QR
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Crear imagen con texto
    img_width = 400
    img_height = 500
    
    # Crear imagen base
    img = Image.new('RGB', (img_width, img_height), 'white')
    
    # Redimensionar QR
    qr_img = qr_img.resize((300, 300))
    
    # Pegar QR en el centro
    qr_x = (img_width - 300) // 2
    qr_y = 50
    img.paste(qr_img, (qr_x, qr_y))
    
    # Agregar texto
    draw = ImageDraw.Draw(img)
    
    try:
        # Intentar usar una fuente del sistema
        font_title = ImageFont.truetype("arial.ttf", 20)
        font_url = ImageFont.truetype("arial.ttf", 14)
    except:
        # Fuente por defecto si no encuentra arial
        font_title = ImageFont.load_default()
        font_url = ImageFont.load_default()
    
    # Título
    title = "🍤 Sistema Cevichería"
    title_bbox = draw.textbbox((0, 0), title, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (img_width - title_width) // 2
    draw.text((title_x, 15), title, fill="black", font=font_title)
    
    # URL
    url_bbox = draw.textbbox((0, 0), url, font=font_url)
    url_width = url_bbox[2] - url_bbox[0]
    url_x = (img_width - url_width) // 2
    draw.text((url_x, 370), url, fill="blue", font=font_url)
    
    # Instrucciones
    instructions = [
        "Escanea desde tu celular para acceder",
        "Asegúrate de estar en la misma WiFi"
    ]
    
    y_pos = 400
    for instruction in instructions:
        bbox = draw.textbbox((0, 0), instruction, font=font_url)
        width = bbox[2] - bbox[0]
        x_pos = (img_width - width) // 2
        draw.text((x_pos, y_pos), instruction, fill="gray", font=font_url)
        y_pos += 25
    
    # Guardar imagen
    qr_path = "ceviche_qr_access.png"
    img.save(qr_path)
    
    print("✅ Código QR generado exitosamente!")
    print(f"📁 Guardado como: {qr_path}")
    print(f"🌐 URL: {url}")
    print("\n📱 Para usar desde celular:")
    print("1. Escanea el código QR")
    print("2. O ve directamente a: http://10.135.72.183:5173")
    print("3. Asegúrate de estar conectado a la misma WiFi")
    
    # Intentar abrir la imagen
    try:
        os.startfile(qr_path)
        print(f"\n🖼️ Abriendo imagen del QR...")
    except:
        print(f"\n💡 Puedes ver el QR en: {os.path.abspath(qr_path)}")

if __name__ == "__main__":
    try:
        generate_qr_code()
    except ImportError:
        print("❌ Para generar QR necesitas instalar: pip install qrcode[pil]")
        print("💡 Alternativamente, usa este enlace directamente:")
        print("   http://10.135.72.183:5173")
    except Exception as e:
        print(f"❌ Error generando QR: {e}")
        print("💡 Puedes acceder directamente desde: http://10.135.72.183:5173")