#!/bin/bash

# Script de configuración para VPS después de git clone
# Ejecutar como usuario ceviche en /home/ceviche/ceviche

set -e

echo "🔧 Configurando proyecto en VPS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Verificar que estamos en el directorio correcto
if [ ! -f "app.py" ] || [ ! -f "docker-compose.yml" ]; then
    error "Debe ejecutar este script desde el directorio del proyecto"
fi

# 1. Configurar archivo .env
echo "📄 Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        cp .env.production .env
        success "Copiado .env.production a .env"
    else
        error "No se encontró archivo .env.production"
    fi
else
    warning "Archivo .env ya existe, no se sobrescribirá"
fi

# 2. Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p logs uploads ssl mysql-init
success "Directorios creados"

# 3. Verificar permisos
echo "🔒 Verificando permisos..."
chmod +x deploy.sh
success "Permisos configurados"

# 4. Construir frontend
echo "🏗️ Construyendo frontend..."
if [ -d "ceviche-frontend" ]; then
    cd ceviche-frontend
    if command -v npm >/dev/null 2>&1; then
        npm install
        npm run build
        success "Frontend construido exitosamente"
        cd ..
    else
        error "npm no está disponible. Instalar Node.js primero."
    fi
else
    warning "Directorio ceviche-frontend no encontrado"
fi

# 5. Inicializar servicios Docker
echo "🐳 Iniciando servicios con Docker..."
if command -v docker-compose >/dev/null 2>&1; then
    # Detener servicios existentes si existen
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Construir y levantar servicios
    docker-compose up -d --build
    
    # Esperar un momento para que los servicios se inicien
    echo "⏳ Esperando que los servicios se inicien..."
    sleep 30
    
    # Verificar estado
    echo "📊 Estado de los servicios:"
    docker-compose ps
    
    success "Servicios Docker iniciados"
else
    error "docker-compose no está disponible"
fi

# 6. Verificar conexión
echo "🔍 Verificando servicios..."
if curl -f http://localhost/api/test >/dev/null 2>&1; then
    success "API respondiendo correctamente"
else
    warning "API no responde aún, puede necesitar más tiempo"
fi

echo ""
success "🎉 Configuración completada!"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://edardium.cloud"
echo "   API: http://edardium.cloud/api/"
echo "   Test: http://edardium.cloud/api/test"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Configurar SSL con: sudo snap install --classic certbot"
echo "   2. Obtener certificado: sudo certbot certonly --standalone -d edardium.cloud"
echo "   3. Configurar backups automáticos"
echo ""
warning "¡Recuerda configurar SSL para seguridad!"