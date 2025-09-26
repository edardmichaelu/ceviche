# 🔒 Lista de Verificación de Seguridad - VPS Hostinger

## ⚠️ CRÍTICO - Hacer ANTES del despliegue

### 1. Variables de Entorno
- [ ] **SECRET_KEY** cambiado (min. 50 caracteres aleatorios)
- [ ] **JWT_SECRET_KEY** cambiado (diferente a SECRET_KEY)  
- [ ] **MYSQL_ROOT_PASSWORD** cambiado (min. 16 caracteres)
- [ ] **MYSQL_PASSWORD** cambiado (diferente a root password)
- [ ] No usar contraseñas por defecto del archivo `.env.production`

### 2. Servidor VPS
- [ ] Cambiar password por defecto del usuario root
- [ ] Deshabilitar login SSH con password (usar solo claves)
- [ ] Configurar fail2ban contra ataques de fuerza bruta
- [ ] Firewall UFW activado y configurado
- [ ] Actualizar sistema operativo

### 3. Base de Datos
- [ ] Usuario MySQL limitado solo a la base de datos de la app
- [ ] Puerto MySQL (3306) NO expuesto públicamente
- [ ] Configurar backups automáticos
- [ ] Usar contraseñas fuertes

## 🛡️ Configuración de Seguridad Avanzada

### 1. SSH Seguro
```bash
# Editar configuración SSH
nano /etc/ssh/sshd_config

# Cambiar configuración:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Reiniciar SSH
systemctl restart sshd
```

### 2. Generar y Usar Claves SSH
```bash
# En tu máquina local, generar clave SSH
ssh-keygen -t rsa -b 4096 -C "tu_email@example.com"

# Copiar clave pública al VPS
ssh-copy-id usuario@ip_del_vps
```

### 3. Configurar Fail2Ban más estrictamente
```bash
# Crear configuración personalizada
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 2

[nginx-limit-req]
enabled = true
filter = nginx-limit-req  
logpath = /var/log/nginx/error.log
maxretry = 2
EOF

# Reiniciar fail2ban
systemctl restart fail2ban
```

### 4. Configurar Rate Limiting en Nginx
```nginx
# Agregar al inicio del bloque http en nginx.conf
http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # En el bloque server, agregar:
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        # ... resto de configuración
    }
    
    location /auth/ {
        limit_req zone=login burst=5 nodelay;
        # ... resto de configuración
    }
}
```

## 🔍 Monitoreo de Seguridad

### 1. Logs importantes a vigilar
```bash
# Logs de autenticación SSH
tail -f /var/log/auth.log

# Logs de fail2ban
tail -f /var/log/fail2ban.log

# Logs de nginx (accesos sospechosos)
tail -f /var/log/nginx/access.log | grep -E "(40[0-9]|50[0-9])"

# Intentos de acceso a archivos sensibles
tail -f /var/log/nginx/access.log | grep -E "(\.env|config|admin|wp-)"
```

### 2. Comandos de monitoreo
```bash
# Ver conexiones activas
ss -tuln

# Ver procesos sospechosos
ps aux | grep -v "\["

# Ver uso de recursos
top
htop

# Ver intentos de login fallidos
lastb

# Ver logins exitosos
last
```

### 3. Verificar puertos abiertos
```bash
# Escanear puertos desde el VPS
nmap localhost

# Ver qué servicios escuchan
netstat -tlnp
```

## 🚨 Respuesta a Incidentes

### Si detectas actividad sospechosa:

1. **Bloquear IP inmediatamente**
   ```bash
   ufw deny from [IP_SOSPECHOSA]
   ```

2. **Ver actividad de la IP**
   ```bash
   grep [IP_SOSPECHOSA] /var/log/nginx/access.log
   grep [IP_SOSPECHOSA] /var/log/auth.log
   ```

3. **Cambiar contraseñas críticas**
   ```bash
   # Cambiar password de usuario
   passwd
   
   # Rotar claves de la aplicación
   # Editar .env y reiniciar servicios
   ```

4. **Revisar logs de aplicación**
   ```bash
   docker-compose logs backend | grep -i error
   docker-compose logs nginx | grep -E "(40[0-9]|50[0-9])"
   ```

## 📋 Mantenimiento de Seguridad Regular

### Semanal:
- [ ] Revisar logs de fail2ban
- [ ] Verificar actualizaciones de sistema
- [ ] Comprobar espacio en disco
- [ ] Verificar que los backups funcionen

### Mensual:
- [ ] Actualizar sistema operativo
- [ ] Actualizar Docker y Docker Compose
- [ ] Revisar y limpiar logs antiguos
- [ ] Verificar certificados SSL (expiración)
- [ ] Rotar contraseñas si es necesario

### Trimestral:
- [ ] Auditoria completa de seguridad
- [ ] Revisar configuración de firewall
- [ ] Actualizar documentación de seguridad
- [ ] Probar procedimientos de respaldo y recuperación

## 🔐 Generación de Contraseñas Seguras

### Generar contraseñas fuertes:
```bash
# Usando openssl (disponible en la mayoría de sistemas)
openssl rand -base64 32

# Usando Python
python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits + '!@#$%^&*') for i in range(32)))"

# Para claves de aplicación (solo alfanuméricos)
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

## ⚡ Respuesta Rápida a Problemas

### Aplicación comprometida:
```bash
# 1. Aislar inmediatamente
docker-compose down

# 2. Preservar evidencia
cp -r logs/ incident_logs_$(date +%Y%m%d_%H%M%S)/

# 3. Cambiar todas las contraseñas
# 4. Revisar código por vulnerabilidades
# 5. Reinstalar desde fuente limpia
```

### Sistema comprometido:
```bash
# 1. Desconectar de internet (si es posible)
ufw --force disable

# 2. Preservar evidencia
cp /var/log/auth.log auth_log_incident_$(date +%Y%m%d_%H%M%S).log

# 3. Contactar a soporte de Hostinger
# 4. Considerar reinstalación completa del VPS
```

---

## ❗ RECORDATORIOS CRÍTICOS

1. **NUNCA** comitees archivos `.env` con contraseñas reales al repositorio
2. **SIEMPRE** usa HTTPS en producción
3. **NUNCA** ejecutes la aplicación como root
4. **SIEMPRE** mantén backups actualizados
5. **NUNCA** uses contraseñas por defecto
6. **SIEMPRE** actualiza el sistema regularmente

¡La seguridad es un proceso continuo, no un evento único! 🛡️