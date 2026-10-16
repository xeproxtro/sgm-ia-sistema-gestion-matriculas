# Estructura de Microservicios y Endpoints

## 📁 Estructura de Carpetas

```
src/whatever/
├── Services/                          # Lógica de negocio de microservicios
│   ├── NotificationService.js        # ✨ Servicio de notificaciones
│   ├── PDFReportService.js           # ✨ Servicio de reportes PDF
│   └── FileGenerationService.js      # ✨ Servicio de generación de archivos
│
├── routes/                            # Endpoints REST de microservicios
│   ├── notifications.js              # ✨ Rutas de notificaciones
│   ├── pdf-reports.js                # ✨ Rutas de reportes PDF
│   └── file-generation.js            # ✨ Rutas de generación de archivos
│
├── microservices/                    # Scripts independientes de microservicios
│   ├── notification-service.js       # ✨ Script ejecutable de notificaciones
│   ├── pdf-report-service.js         # ✨ Script ejecutable de PDFs
│   └── file-generation-service.js    # ✨ Script ejecutable de archivos
│
└── uploads/                          # Directorios de salida
    ├── reports/                      # ✨ Reportes PDF generados
    └── exports/                      # ✨ Archivos Excel/CSV generados
```

---

## 🔔 Microservicio 1: Notificaciones

### 📁 Archivos

**Service (Lógica):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\Services\NotificationService.js" />

**Routes (Endpoints):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\routes\notifications.js" />

**Script (Ejecutable):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\microservices\notification-service.js" />

### 🌐 Endpoints REST

**Base URL:** `/api/notifications`

| Método | Endpoint | Descripción | Autenticación |
|--------|-----------|-------------|---------------|
| GET | `/api/notifications` | Obtener todas las notificaciones del usuario | ✅ Token JWT |
| GET | `/api/notifications?unread=true` | Obtener solo notificaciones no leídas | ✅ Token JWT |
| GET | `/api/notifications/stats` | Obtener estadísticas de notificaciones | ✅ Token JWT |
| PUT | `/api/notifications/:id/read` | Marcar notificación como leída | ✅ Token JWT |
| PUT | `/api/notifications/read-all` | Marcar todas como leídas | ✅ Token JWT |
| DELETE | `/api/notifications/:id` | Eliminar notificación | ✅ Token JWT |
| POST | `/api/notifications` | Crear notificación manual | ✅ Token JWT (Admin/Superadmin) |
| POST | `/api/notifications/cleanup` | Limpiar notificaciones antiguas | ✅ Token JWT (Superadmin) |

### 💻 Ejemplos de Uso

```bash
# Obtener notificaciones
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/notifications

# Marcar como leída
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/notifications/notif_123/read

# Crear notificación (admin)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"info","title":"Prueba","message":"Test"}' \
  http://localhost:3000/api/notifications
```

### 🖥️ Script Independiente

```bash
# Ejecutar microservicio
npm run microservice:notifications
# o
node src/whatever/microservices/notification-service.js

# Crear notificación de prueba
node src/whatever/microservices/notification-service.js test 1

# Obtener estadísticas
node src/whatever/microservices/notification-service.js stats 1
```

---

## 📄 Microservicio 2: Reportes PDF

### 📁 Archivos

**Service (Lógica):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\Services\PDFReportService.js" />

**Routes (Endpoints):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\routes\pdf-reports.js" />

**Script (Ejecutable):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\microservices\pdf-report-service.js" />

### 🌐 Endpoints REST

**Base URL:** `/api/reports/pdf`

| Método | Endpoint | Descripción | Autenticación |
|--------|-----------|-------------|---------------|
| POST | `/api/reports/pdf/academic-history/:studentId` | Generar historial académico en PDF | ✅ Token JWT (Student/Admin/Superadmin) |
| POST | `/api/reports/pdf/curriculum/:curriculumId` | Generar malla curricular en PDF | ✅ Token JWT (Student/Admin/Superadmin) |
| POST | `/api/reports/pdf/enrollment-certificate/:studentId` | Generar certificado de matrícula | ✅ Token JWT (Student/Admin/Superadmin) |
| POST | `/api/reports/pdf/student-list` | Generar lista de estudiantes en PDF | ✅ Token JWT (Student/Admin/Superadmin) |
| DELETE | `/api/reports/pdf/:filename` | Eliminar reporte PDF | ✅ Token JWT (Student/Admin/Superadmin) |
| POST | `/api/reports/pdf/cleanup` | Limpiar reportes antiguos | ✅ Token JWT (Superadmin) |

### 💻 Ejemplos de Uso

```bash
# Generar historial académico
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/reports/pdf/academic-history/1

# Generar lista de estudiantes con filtros
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"program":"Ingeniería de Sistemas","semester":5}' \
  http://localhost:3000/api/reports/pdf/student-list

# Generar certificado
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/reports/pdf/enrollment-certificate/1
```

### 🖥️ Script Independiente

```bash
# Ejecutar microservicio
npm run microservice:pdf-reports
# o
node src/whatever/microservices/pdf-report-service.js

# Generar historial académico
node src/whatever/microservices/pdf-report-service.js history 1

# Generar malla curricular
node src/whatever/microservices/pdf-report-service.js curriculum 1

# Generar certificado
node src/whatever/microservices/pdf-report-service.js certificate 1

# Generar lista de estudiantes
node src/whatever/microservices/pdf-report-service.js students

# Limpiar reportes antiguos
node src/whatever/microservices/pdf-report-service.js cleanup
```

### 📁 Archivos Generados

Los PDFs se guardan en: `src/whatever/uploads/reports/`

Nomenclatura de archivos:
- `historial_[documento]_[timestamp].pdf` - Historial académico
- `malla_[programa]_[timestamp].pdf` - Malla curricular
- `certificado_[documento]_[timestamp].pdf` - Certificado
- `lista_estudiantes_[timestamp].pdf` - Lista de estudiantes

---

## 📊 Microservicio 3: Generación de Archivos

### 📁 Archivos

**Service (Lógica):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\Services\FileGenerationService.js" />

**Routes (Endpoints):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\routes\file-generation.js" />

**Script (Ejecutable):**
<ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\src\whatever\microservices\file-generation-service.js" />

### 🌐 Endpoints REST

**Base URL:** `/api/reports/files`

| Método | Endpoint | Descripción | Autenticación |
|--------|-----------|-------------|---------------|
| POST | `/api/reports/files/students/excel` | Generar Excel de estudiantes | ✅ Token JWT (Admin/Superadmin) |
| POST | `/api/reports/files/students/csv` | Generar CSV de estudiantes | ✅ Token JWT (Admin/Superadmin) |
| POST | `/api/reports/files/academic-history/:studentId/excel` | Generar Excel de historial académico | ✅ Token JWT (Admin/Superadmin) |
| POST | `/api/reports/files/curriculum/:curriculumId/excel` | Generar Excel de malla curricular | ✅ Token JWT (Admin/Superadmin) |
| POST | `/api/reports/files/enrollment-report/excel` | Generar Excel de reporte de matrículas | ✅ Token JWT (Admin/Superadmin) |
| POST | `/api/reports/files/custom/excel` | Generar Excel personalizado | ✅ Token JWT (Admin/Superadmin) |
| GET | `/api/reports/files/list` | Listar archivos exportados | ✅ Token JWT (Admin/Superadmin) |
| DELETE | `/api/reports/files/:filename` | Eliminar archivo exportado | ✅ Token JWT (Admin/Superadmin) |
| POST | `/api/reports/files/cleanup` | Limpiar archivos antiguos | ✅ Token JWT (Superadmin) |

### 💻 Ejemplos de Uso

```bash
# Generar Excel de estudiantes
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"program":"Ingeniería de Sistemas","semester":5}' \
  http://localhost:3000/api/reports/files/students/excel

# Generar CSV de estudiantes
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"program":"Ingeniería de Sistemas"}' \
  http://localhost:3000/api/reports/files/students/csv

# Generar Excel de historial académico
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/reports/files/academic-history/1/excel

# Generar Excel personalizado
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":[],"sheetName":"Hoja1","columns":[]}' \
  http://localhost:3000/api/reports/files/custom/excel
```

### 🖥️ Script Independiente

```bash
# Ejecutar microservicio
npm run microservice:file-generation
# o
node src/whatever/microservices/file-generation-service.js

# Generar Excel de estudiantes
node src/whatever/microservices/file-generation-service.js students-excel "Ingeniería de Sistemas" 5

# Generar CSV de estudiantes
node src/whatever/microservices/file-generation-service.js students-csv "Ingeniería de Sistemas"

# Generar Excel de historial académico
node src/whatever/microservices/file-generation-service.js history 1

# Generar Excel de malla curricular
node src/whatever/microservices/file-generation-service.js curriculum 1

# Generar reporte de matrículas
node src/whatever/microservices/file-generation-service.js enrollment-report

# Listar archivos exportados
node src/whatever/microservices/file-generation-service.js list

# Limpiar archivos antiguos
node src/whatever/microservices/file-generation-service.js cleanup
```

### 📁 Archivos Generados

Los archivos se guardan en: `src/whatever/uploads/exports/`

Nomenclatura de archivos:
- `estudiantes_[timestamp].xlsx` - Excel de estudiantes
- `estudiantes_[timestamp].csv` - CSV de estudiantes
- `historial_[documento]_[timestamp].xlsx` - Historial académico
- `malla_[programa]_[timestamp].xlsx` - Malla curricular
- `reporte_matriculas_[timestamp].xlsx` - Reporte de matrículas
- `custom_[timestamp].xlsx` - Excel personalizado

---

## 🔗 Integración con Servidor Principal

Los microservicios están integrados en `src/whatever/server.js`:

```javascript
// Rutas de notificaciones - accesible por todos los roles autenticados
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Rutas de reportes PDF - accesible por student, admin y superadmin
app.use('/api/reports/pdf', authenticateToken, checkRole(['student', 'admin', 'superadmin']), pdfReportRoutes);

// Rutas de generación de archivos - accesible por admin y superadmin
app.use('/api/reports/files', authenticateToken, checkRole(['admin', 'superadmin']), fileGenerationRoutes);
```

### Servidor de Archivos Estáticos

```javascript
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, './uploads')));
app.use('/uploads/reports', express.static(path.join(__dirname, './uploads/reports')));
app.use('/uploads/exports', express.static(path.join(__dirname, './uploads/exports')));
```

### Acceso a Archivos Generados

Los archivos generados son accesibles vía HTTP:

**PDFs:**
```
http://localhost:3000/uploads/reports/historial_123456_1234567890.pdf
```

**Excel/CSV:**
```
http://localhost:3000/uploads/exports/estudiantes_1234567890.xlsx
http://localhost:3000/uploads/exports/estudiantes_1234567890.csv
```

---

## 🧪 Probar Endpoints con Docker

```bash
# Ejecutar dentro del contenedor Docker
docker compose exec app curl http://localhost:3000/api/health

# Ejecutar microservicios
docker compose exec app npm run microservice:notifications
docker compose exec app npm run microservice:pdf-reports
docker compose exec app npm run microservice:file-generation
```

---

## 📊 Resumen de Endpoints

### Notificaciones (8 endpoints)
- GET: obtener notificaciones, estadísticas
- PUT: marcar como leída, marcar todas
- DELETE: eliminar notificación
- POST: crear notificación, limpiar antiguas

### Reportes PDF (6 endpoints)
- POST: generar historial, malla, certificado, lista
- DELETE: eliminar reporte
- POST: limpiar antiguos

### Generación de Archivos (9 endpoints)
- POST: generar Excel/CSV (estudiantes, historial, malla, reporte, custom)
- GET: listar archivos
- DELETE: eliminar archivo
- POST: limpiar antiguos

**Total: 23 endpoints REST para los 3 microservicios**

---

## 📚 Documentación Adicional

- <ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\MICROSERVICIOS.md" /> - Documentación completa de microservicios
- <ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\AGENTS.md" /> - Configuración del proyecto
