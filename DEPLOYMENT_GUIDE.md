# 🚀 Guía de Despliegue - Sistema Cevichería en VPS Hostinger

## 📋 Pre-requisitos

### En tu máquina local:
- Git instalado
- Acceso SSH al VPS
- Dominio configurado (opcional pero recomendado)

### En el VPS de Hostinger:
- Ubuntu 20.04+ o similar
- Acceso root/sudo
- Al menos 2GB RAM y 20GB storage

## 🔧 Preparación del VPS

### 1. Conexión inicial y configuración básica
```bash
# Conectar al VPS
ssh root@tu_ip_del_vps

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias básicas
apt install -y curl wget git ufw fail2ban htop nano
```

### 2. Instalación de Docker
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 3. Configuración de seguridad
```bash
# Configurar firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable

# Configurar fail2ban (protección contra ataques de fuerza bruta)
systemctl enable fail2ban
systemctl start fail2ban
```

### 4. Crear usuario para la aplicación
```bash
# Crear usuario sin privilegios de sudo para la aplicación
useradd -m -s /bin/bash ceviche
usermod -aG docker ceviche
```

## 📂 Preparación del código

### 1. Clonar el repositorio en el VPS
```bash
# Como usuario ceviche
su - ceviche
git clone https://github.com/tu-usuario/tu-repo.git /home/ceviche/ceviche
cd /home/ceviche/ceviche
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.production .env

# Editar con valores seguros (¡MUY IMPORTANTE!)
nano .env
```

**⚠️ Variables críticas a cambiar:**
- `SECRET_KEY`: Genera una clave aleatoria de 50+ caracteres
- `JWT_SECRET_KEY`: Genera otra clave diferente
- `MYSQL_ROOT_PASSWORD`: Password seguro para MySQL root
- `MYSQL_PASSWORD`: Password seguro para usuario de aplicación
- `DOMAIN`: Tu dominio real (ej: micevicheria.com)

### 3. Generar claves seguras
```bash
# Generar claves aleatorias
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(64))"
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(64))"
```

## 🌐 Configuración del dominio

### 1. DNS Configuration
En el panel de Hostinger o tu proveedor DNS:
```
Tipo: A
Nombre: @
Valor: [IP_DE_TU_VPS]
TTL: 300

Tipo: A  
Nombre: www
Valor: [IP_DE_TU_VPS]
TTL: 300
```

### 2. Actualizar nginx.conf
```bash
# Editar configuración de nginx
nano nginx.conf

# Cambiar "tu_dominio.com" por tu dominio real en las líneas:
# server_name tu_dominio.com www.tu_dominio.com;
```

## 🚀 Despliegue

### 1. Construcción y despliegue automático
```bash
# Hacer ejecutable el script de despliegue
chmod +x deploy.sh

# Ejecutar despliegue
./deploy.sh
```

### 2. Despliegue manual paso a paso
```bash
# 1. Construir frontend
cd ceviche-frontend
npm install
npm run build
cd ..

# 2. Crear directorios necesarios
mkdir -p logs uploads ssl mysql-init

# 3. Levantar servicios
docker-compose up -d --build

# 4. Verificar servicios
docker-compose ps

# 5. Ver logs
docker-compose logs -f
```

## 🔒 Configuración SSL (HTTPS)

### 1. Instalar Certbot
```bash
# Como root
apt install snapd
snap install core; snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot
```

### 2. Obtener certificado SSL
```bash
# Detener nginx temporalmente
docker-compose stop nginx

# Obtener certificado
certbot certonly --standalone -d tu_dominio.com -d www.tu_dominio.com

# Copiar certificados
cp /etc/letsencrypt/live/tu_dominio.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/tu_dominio.com/privkey.pem ssl/key.pem

# Reiniciar nginx
docker-compose start nginx
```

### 3. Habilitar HTTPS en nginx.conf
```bash
# Editar nginx.conf y descomentar la sección HTTPS
nano nginx.conf

# Descomentar las líneas de configuración SSL (líneas 82-95)
# Reiniciar nginx
docker-compose restart nginx
```

## 💾 Configuración de Backups

### 1. Script de backup de base de datos
```bash
# Crear script de backup
cat > backup_db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ceviche/backups"
mkdir -p $BACKUP_DIR

# Backup de MySQL
docker exec ceviche_mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ceviche_prod > "$BACKUP_DIR/ceviche_db_$DATE.sql"

# Comprimir backup
gzip "$BACKUP_DIR/ceviche_db_$DATE.sql"

# Eliminar backups de más de 30 días
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completado: ceviche_db_$DATE.sql.gz"
EOF

chmod +x backup_db.sh
```

### 2. Programar backups automáticos
```bash
# Agregar a crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /home/ceviche/ceviche/backup_db.sh
```

## 🔍 Monitoreo y Logs

### 1. Ver logs de los servicios
```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f mysql
```

### 2. Comandos útiles de monitoreo
```bash
# Estado de contenedores
docker-compose ps

# Uso de recursos
docker stats

# Espacio en disco
df -h

# Procesos del sistema
htop
```

## 🛠️ Mantenimiento

### 1. Actualizar la aplicación
```bash
cd /home/ceviche/ceviche
git pull origin main
docker-compose down
docker-compose up -d --build
```

### 2. Reiniciar servicios
```bash
# Reiniciar todo
docker-compose restart

# Reiniciar servicio específico
docker-compose restart backend
docker-compose restart nginx
```

### 3. Limpiar Docker
```bash
# Limpiar imágenes no utilizadas
docker system prune -a

# Limpiar volúmenes no utilizados
docker volume prune
```

## 🆘 Troubleshooting

### Problemas comunes:

1. **Error "Port already in use"**
   ```bash
   # Ver qué proceso usa el puerto
   sudo lsof -i :80
   sudo lsof -i :443
   # Matar proceso si es necesario
   sudo kill -9 [PID]
   ```

2. **Base de datos no se conecta**
   ```bash
   # Verificar logs de MySQL
   docker-compose logs mysql
   # Verificar variables de entorno
   cat .env
   ```

3. **Frontend no se ve**
   ```bash
   # Verificar que el build existe
   ls -la ceviche-frontend/dist/
   # Reconstruir frontend
   cd ceviche-frontend && npm run build
   ```

4. **Error 502 Bad Gateway**
   ```bash
   # Verificar que el backend está corriendo
   docker-compose ps
   # Ver logs del backend
   docker-compose logs backend
   ```

## 📞 URLs importantes

Después del despliegue exitoso:
- **Frontend**: https://tu_dominio.com
- **API**: https://tu_dominio.com/api/
- **Test endpoint**: https://tu_dominio.com/api/test
- **Admin**: https://tu_dominio.com/admin (si existe)

## ✅ Checklist final

- [ ] VPS configurado con Docker
- [ ] Variables de entorno configuradas con valores seguros
- [ ] Dominio apuntando al VPS
- [ ] SSL configurado (HTTPS)
- [ ] Base de datos funcionando
- [ ] Frontend construido y servido
- [ ] API respondiendo
- [ ] Backups programados
- [ ] Firewall configurado
- [ ] Logs monitorizándose

¡Tu aplicación debería estar funcionando en producción! 🎉