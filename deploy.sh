#!/bin/bash

# Script de despliegue para VPS Hostinger
# Uso: ./deploy.sh

echo "🚀 Iniciando despliegue en VPS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar errores
error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar advertencias
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "app.py" ] || [ ! -f "docker-compose.yml" ]; then
    error "Debe ejecutar este script desde el directorio raíz del proyecto"
fi

# 1. Verificar dependencias
echo "📦 Verificando dependencias..."
command -v docker >/dev/null 2>&1 || error "Docker no está instalado"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose no está instalado"
success "Dependencias verificadas"

# 2. Construir el frontend
echo "🏗️  Construyendo frontend..."
cd ceviche-frontend
npm install || error "No se pudo instalar dependencias del frontend"
npm run build || error "No se pudo construir el frontend"
cd ..
success "Frontend construido"

# 3. Verificar archivo .env
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        warning "Copiando .env.production a .env"
        cp .env.production .env
    else
        error "No se encontró archivo .env ni .env.production"
    fi
else
    success "Archivo .env ya existe"
fi

# 4. Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p logs uploads ssl mysql-init
success "Directorios creados"

# 5. Detener servicios existentes (si existen)
echo "🛑 Deteniendo servicios existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# 6. Construir y levantar servicios
echo "🔨 Construyendo y desplegando servicios..."
docker-compose up -d --build || error "Error al desplegar servicios"

# 7. Esperar que los servicios estén listos
echo "⏳ Esperando que los servicios estén listos..."
sleep 30

# 8. Verificar que los servicios están corriendo
echo "🔍 Verificando servicios..."
if ! docker-compose ps | grep -q "Up"; then
    error "Los servicios no están ejecutándose correctamente"
fi

# 9. Ejecutar migraciones de base de datos
echo "💾 Ejecutando migraciones de base de datos..."
docker-compose exec -T backend python -c "
from app import create_app
from models import db
app = create_app('production')
with app.app_context():
    db.create_all()
    print('✅ Base de datos inicializada')
" || warning "No se pudieron ejecutar las migraciones automáticamente"

# 10. Mostrar estado final
echo "📊 Estado de los servicios:"
docker-compose ps

# 11. Mostrar URLs de acceso
echo ""
success "🎉 Despliegue completado!"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://tu_dominio.com"
echo "   API: http://tu_dominio.com/api/"
echo "   Test endpoint: http://tu_dominio.com/api/test"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Configura tu dominio en nginx.conf"
echo "   2. Obtén un certificado SSL con Let's Encrypt"
echo "   3. Actualiza las variables de entorno en .env"
echo "   4. Configura backups automáticos de la base de datos"
echo ""
warning "¡Recuerda cambiar todas las contraseñas por defecto!"

# 12. Mostrar logs en tiempo real (opcional)
read -p "¿Deseas ver los logs en tiempo real? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
fi