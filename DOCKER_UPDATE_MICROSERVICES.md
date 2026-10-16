# Actualización de Docker con Microservicios

Esta guía explica cómo actualizar la imagen Docker existente para incluir los nuevos microservicios de notificaciones, generación de PDFs y generación de archivos.

## 📋 Cambios Realizados

### 1. Dockerfile Actualizado

**Cambios:**
- Creación de directorios para microservicios:
  - `/app/src/whatever/uploads/reports/` - Para reportes PDF
  - `/app/src/whatever/uploads/exports/` - Para archivos Excel/CSV

**Archivo:** `Dockerfile`

```dockerfile
# Antes
RUN mkdir -p /app/src/whatever/uploads && \
    chown -R nodejs:nodejs /app/src/whatever/uploads

# Después
RUN mkdir -p /app/src/whatever/uploads/reports && \
    mkdir -p /app/src/whatever/uploads/exports && \
    chown -R nodejs:nodejs /app/src/whatever/uploads
```

### 2. docker-compose.yml Actualizado

**Cambios:**
- Montaje de documentación de microservicios
- Los microservicios están integrados en el servidor principal

**Archivo:** `docker-compose.yml`

```yaml
volumes:
  - app_uploads:/app/src/whatever/uploads
  - ./MICROSERVICIOS.md:/app/MICROSERVICIOS.md:ro
```

### 3. Nueva Dependencia

**Paquete agregado:** `exceljs` para generación de archivos Excel

```bash
npm install exceljs
```

## 🚀 Pasos para Actualizar

### Opción 1: Usar Script Automático (Recomendado)

**Windows:**
```bash
scripts\rebuild-docker.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/rebuild-docker.sh
./scripts/rebuild-docker.sh
```

Este script:
1. Detiene los contenedores actuales
2. Reconstruye la imagen Docker sin caché
3. Reinicia los contenedores
4. Verifica el estado

### Opción 2: Reconstrucción Manual

```bash
# 1. Detener contenedores
docker compose down

# 2. Reconstruir imagen sin caché
docker compose build --no-cache

# 3. Iniciar contenedores
docker compose up -d

# 4. Verificar estado
docker compose ps

# 5. Ver logs
docker compose logs -f app
```

### Opción 3: Reconstrucción con Caché (Más Rápido)

```bash
# Reconstruir solo lo necesario
docker compose up -d --build
```

## ✅ Verificación

### 1. Verificar que el contenedor está corriendo

```bash
docker compose ps
```

Deberías ver el contenedor `sgm-ia-app` con estado `Up` y healthy.

### 2. Verificar logs

```bash
docker compose logs app
```

Busca mensajes como:
- `SGM-IA Server running on port 3000`
- Sin errores de importación de módulos

### 3. Verificar endpoints de microservicios

Dentro del contenedor:

```bash
# Acceder al contenedor
docker compose exec app sh

# Verificar que los archivos existen
ls -la src/whatever/Services/NotificationService.js
ls -la src/whatever/Services/PDFReportService.js
ls -la src/whatever/Services/FileGenerationService.js

# Verificar rutas
ls -la src/whatever/routes/notifications.js
ls -la src/whatever/routes/pdf-reports.js
ls -la src/whatever/routes/file-generation.js

# Verificar scripts de microservicios
ls -la src/whatever/microservices/
```

### 4. Probar endpoints desde fuera del contenedor

```bash
# Health check
curl http://localhost:3000/api/health

# (Necesitarás token JWT para probar endpoints de microservicios)
```

## 📝 Ejecutar Microservicios dentro del Contenedor

Los microservicios están integrados al servidor principal, pero también puedes ejecutar los scripts independientes dentro del contenedor:

```bash
# Microservicio de notificaciones
docker compose exec app npm run microservice:notifications

# Microservicio de PDFs
docker compose exec app npm run microservice:pdf-reports

# Microservicio de archivos
docker compose exec app npm run microservice:file-generation
```

Ejecutar con comandos específicos:

```bash
# Crear notificación de prueba
docker compose exec app node src/whatever/microservices/notification-service.js test 1

# Generar PDF de historial
docker compose exec app node src/whatever/microservices/pdf-report-service.js history 1

# Generar Excel de estudiantes
docker compose exec app node src/whatever/microservices/file-generation-service.js students-excel
```

## 🔧 Troubleshooting

### Problema: Error "Cannot find module 'exceljs'"

**Solución:**
```bash
# Reconstruir la imagen para incluir la nueva dependencia
docker compose build --no-cache
docker compose up -d
```

### Problema: Directorios de uploads no existen

**Solución:**
```bash
# Verificar que el Dockerfile crea los directorios
docker compose exec app ls -la src/whatever/uploads/

# Si no existen, recrearlos manualmente
docker compose exec app mkdir -p src/whatever/uploads/reports
docker compose exec app mkdir -p src/whatever/uploads/exports
```

### Problema: Contenedor no inicia después de rebuild

**Solución:**
```bash
# Ver logs para identificar el error
docker compose logs app

# Si es error de dependencias, limpiar y reconstruir
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Problema: Health check falla

**Solución:**
```bash
# Verificar que el servidor inició correctamente
docker compose logs app | grep "Server running"

# Verificar puerto
docker compose exec app wget -O- http://localhost:3000/api/health
```

## 📊 Estructura de Archivos en el Contenedor

Después de la actualización, el contenedor tendrá:

```
/app/
├── src/
│   └── whatever/
│       ├── Services/
│       │   ├── NotificationService.js       # ✨ Nuevo
│       │   ├── PDFReportService.js          # ✨ Nuevo
│       │   └── FileGenerationService.js     # ✨ Nuevo
│       ├── routes/
│       │   ├── notifications.js              # ✨ Nuevo
│       │   ├── pdf-reports.js                # ✨ Nuevo
│       │   └── file-generation.js            # ✨ Nuevo
│       ├── microservices/
│       │   ├── notification-service.js       # ✨ Nuevo
│       │   ├── pdf-report-service.js         # ✨ Nuevo
│       │   └── file-generation-service.js    # ✨ Nuevo
│       └── uploads/
│           ├── reports/                      # ✨ Nuevo
│           └── exports/                      # ✨ Nuevo
├── node_modules/
│   └── exceljs/                             # ✨ Nueva dependencia
├── package.json
├── MICROSERVICIOS.md                         # ✨ Montado como volumen
└── server.js
```

## 🎯 Endpoints Disponibles

Una vez actualizado, los siguientes endpoints estarán disponibles:

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones
- `POST /api/notifications` - Crear notificación
- `PUT /api/notifications/:id/read` - Marcar como leída
- `DELETE /api/notifications/:id` - Eliminar notificación

### Reportes PDF
- `POST /api/reports/pdf/academic-history/:studentId` - Historial académico
- `POST /api/reports/pdf/curriculum/:curriculumId` - Malla curricular
- `POST /api/reports/pdf/enrollment-certificate/:studentId` - Certificado
- `POST /api/reports/pdf/student-list` - Lista de estudiantes

### Generación de Archivos
- `POST /api/reports/files/students/excel` - Excel de estudiantes
- `POST /api/reports/files/students/csv` - CSV de estudiantes
- `POST /api/reports/files/academic-history/:studentId/excel` - Historial
- `POST /api/reports/files/curriculum/:curriculumId/excel` - Malla

## 📚 Documentación Adicional

- [MICROSERVICIOS.md](MICROSERVICIOS.md) - Documentación completa de microservicios
- [DOCKER_KUBERNETES_ANSIBLE.md](DOCKER_KUBERNETES_ANSIBLE.md) - Guía de despliegue Docker/K8s
- [AGENTS.md](AGENTS.md) - Configuración del proyecto

## ✨ Próximos Pasos

1. Ejecutar el script de reconstrucción
2. Verificar que el contenedor está healthy
3. Probar los endpoints de microservicios
4. Actualizar la documentación de Kubernetes si es necesario
