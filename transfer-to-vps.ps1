# Script para transferir archivos al VPS
# Ejecutar desde PowerShell en el directorio del proyecto

$VPS_IP = "72.60.163.176"
$VPS_USER = "root"
$PROJECT_PATH = "/home/ceviche/ceviche"

Write-Host "🚀 Transfiriendo archivos al VPS $VPS_IP..." -ForegroundColor Green

# Crear directorio en el VPS
ssh $VPS_USER@$VPS_IP "mkdir -p $PROJECT_PATH && chown -R ceviche:ceviche /home/ceviche"

# Transferir archivos de configuración Docker
Write-Host "📦 Transfeririendo archivos Docker..." -ForegroundColor Yellow
scp "Dockerfile" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/"
scp "docker-compose.yml" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/"
scp "nginx.conf" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/"

# Transferir archivos de configuración
Write-Host "⚙️ Transfeririendo configuración..." -ForegroundColor Yellow
scp ".env.production" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/.env"
scp "requirements.txt" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/"

# Transferir código Python
Write-Host "🐍 Transfeririendo código Python..." -ForegroundColor Yellow
scp "*.py" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/"
scp -r "routes/" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/" 2>$null
scp -r "models/" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/" 2>$null
scp -r "services/" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/" 2>$null

# Transferir frontend
Write-Host "⚛️ Transfeririendo frontend..." -ForegroundColor Yellow
scp -r "ceviche-frontend/" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/"

# Transferir scripts
Write-Host "📜 Transfeririendo scripts..." -ForegroundColor Yellow
scp "deploy.sh" "${VPS_USER}@${VPS_IP}:${PROJECT_PATH}/"

# Configurar permisos
Write-Host "🔒 Configurando permisos..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP "chown -R ceviche:ceviche $PROJECT_PATH && chmod +x ${PROJECT_PATH}/deploy.sh"

Write-Host "✅ Transferencia completada!" -ForegroundColor Green
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. ssh root@$VPS_IP" -ForegroundColor White
Write-Host "   2. su - ceviche" -ForegroundColor White
Write-Host "   3. cd $PROJECT_PATH" -ForegroundColor White
Write-Host "   4. ./deploy.sh" -ForegroundColor White