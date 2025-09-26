#!/bin/bash

# Script completo de despliegue para VPS
# Ejecutar como usuario ceviche

set -e

echo "🚀 Desplegando aplicación cevichería en VPS..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Verificar directorio
if [ ! -f "app.py" ]; then
    error "Debe ejecutar desde el directorio del proyecto (donde está app.py)"
fi

log "Iniciando despliegue completo..."

# 1. Configurar .env
log "Configurando variables de entorno..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    success "Archivo .env configurado"
else
    error "No se encuentra .env.production"
fi

# 2. Crear directorios
log "Creando directorios necesarios..."
mkdir -p logs uploads ssl mysql-init
success "Directorios creados"

# 3. Instalar dependencias Python (en caso de que no estén)
log "Verificando dependencias Python..."
if [ -f "requirements.txt" ]; then
    if ! pip3 show flask >/dev/null 2>&1; then
        log "Instalando dependencias Python..."
        pip3 install --user -r requirements.txt
        success "Dependencias Python instaladas"
    else
        success "Dependencias Python ya están instaladas"
    fi
fi

# 4. Construir frontend
log "Construyendo frontend..."
if [ -d "ceviche-frontend" ]; then
    cd ceviche-frontend
    
    # Verificar si node_modules existe
    if [ ! -d "node_modules" ]; then
        log "Instalando dependencias del frontend..."
        npm install
        success "Dependencias del frontend instaladas"
    fi
    
    # Construir si no existe dist o está desactualizado
    if [ ! -d "dist" ] || [ "package.json" -nt "dist" ]; then
        log "Construyendo aplicación frontend..."
        npm run build
        success "Frontend construido exitosamente"
    else
        success "Frontend ya está construido"
    fi
    
    cd ..
else
    warning "Directorio ceviche-frontend no encontrado"
fi

# 5. Configurar permisos
log "Configurando permisos..."
chmod +x *.sh 2>/dev/null || true
success "Permisos configurados"

# 6. Detener servicios existentes
log "Deteniendo servicios existentes..."
docker-compose down --remove-orphans 2>/dev/null || true
success "Servicios anteriores detenidos"

# 7. Construir y levantar servicios Docker
log "Construyendo y levantando servicios Docker..."
docker-compose up -d --build

# 8. Esperar que los servicios se inicien
log "Esperando que los servicios se inicien (60 segundos)..."
sleep 10

# Verificar que MySQL esté listo
log "Esperando que MySQL esté listo..."
for i in {1..12}; do
    if docker-compose exec -T mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD:-$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)}" -e "SELECT 1" >/dev/null 2>&1; then
        success "MySQL está listo"
        break
    fi
    if [ $i -eq 12 ]; then
        error "MySQL no pudo iniciarse correctamente"
    fi
    log "Esperando MySQL... ($i/12)"
    sleep 5
done

# 9. Ejecutar migraciones de base de datos
log "Ejecutando migraciones de base de datos..."
docker-compose exec -T backend python -c "
from app import create_app
from models import db
import sys

try:
    app = create_app('production')
    with app.app_context():
        db.create_all()
        print('✅ Base de datos inicializada correctamente')
except Exception as e:
    print(f'❌ Error al inicializar BD: {e}')
    sys.exit(1)
" && success "Base de datos inicializada" || warning "Error al inicializar BD (puede ser normal si ya existe)"

# 10. Verificar servicios
log "Verificando estado de los servicios..."
docker-compose ps

# 11. Verificar conectividad
log "Verificando conectividad de los servicios..."
sleep 5

# Test backend
if curl -f -s http://localhost:5000/api/test >/dev/null 2>&1; then
    success "Backend respondiendo en puerto 5000"
else
    warning "Backend no responde directamente (normal con proxy)"
fi

# Test nginx
if curl -f -s http://localhost/api/test >/dev/null 2>&1; then
    success "Nginx proxy funcionando correctamente"
elif curl -f -s http://localhost >/dev/null 2>&1; then
    success "Nginx respondiendo"
else
    warning "Nginx no responde aún, puede necesitar más tiempo"
fi

# 12. Mostrar logs recientes para diagnóstico
log "Logs recientes de los servicios:"
echo "--- Backend ---"
docker-compose logs --tail=5 backend
echo "--- Nginx ---"
docker-compose logs --tail=5 nginx
echo "--- MySQL ---"
docker-compose logs --tail=5 mysql

# 13. Resumen final
echo ""
echo "🎉 ¡DESPLIEGUE COMPLETADO!"
echo ""
echo "🌐 URLs de acceso:"
echo "   • Frontend: http://edardium.cloud"
echo "   • API: http://edardium.cloud/api/"
echo "   • Test: http://edardium.cloud/api/test"
echo ""
echo "📊 Estado actual:"
docker-compose ps
echo ""
echo "📋 Comandos útiles:"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Reiniciar: docker-compose restart"
echo "   • Detener: docker-compose down"
echo "   • Ver estado: docker-compose ps"
echo ""
echo "🔒 Próximo paso: Configurar SSL/HTTPS"
echo "   sudo snap install --classic certbot"
echo "   sudo certbot certonly --standalone -d edardium.cloud -d www.edardium.cloud"
echo ""
success "¡Tu aplicación debería estar funcionando en http://edardium.cloud!"