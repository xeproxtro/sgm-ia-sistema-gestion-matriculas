# Microservicios del Sistema de Gestión de Matrículas

Este proyecto incluye 3 microservicios integrados al servidor principal para gestionar notificaciones, generación de reportes PDF y generación de archivos Excel/CSV.

## Microservicios

### 1. Microservicio de Notificaciones (NotificationService)

**Propósito:** Gestión de notificaciones internas del sistema sin dependencias externas (sin Google).

**Características:**
- Notificaciones en memoria con persistencia en logs
- Tipos: info, warning, error, success
- Marcado de lectura individual o masivo
- Limpieza automática de notificaciones antiguas (30 días)
- Integración con eventos del sistema (matrícula, cola, etc.)

**Endpoint:** `/api/notifications`

**Rutas principales:**
- `GET /api/notifications` - Obtener notificaciones del usuario
- `GET /api/notifications?unread=true` - Obtener solo no leídas
- `GET /api/notifications/stats` - Obtener estadísticas
- `PUT /api/notifications/:id/read` - Marcar como leída
- `PUT /api/notifications/read-all` - Marcar todas como leídas
- `DELETE /api/notifications/:id` - Eliminar notificación
- `POST /api/notifications` - Crear notificación manual (admin/superadmin)
- `POST /api/notifications/cleanup` - Limpiar notificaciones antiguas (superadmin)

**Script independiente:**
```bash
npm run microservice:notifications
# o
node src/whatever/microservices/notification-service.js
```

**Comandos del script:**
- `test <userId>` - Crear notificación de prueba
- `stats <userId>` - Obtener estadísticas

**Archivo:** `src/whatever/Services/NotificationService.js`

---

### 2. Microservicio de Generación de Reportes PDF (PDFReportService)

**Propósito:** Generación de reportes en formato PDF para impresión y descarga.

**Características:**
- Historial académico con detalle de materias
- Mallas curriculares organizadas por semestre
- Certificados de matrícula
- Listas de estudiantes con filtros
- Limpieza automática de reportes antiguos (7 días)
- Formato PDF profesional con encabezados y pies de página

**Endpoint:** `/api/reports/pdf`

**Rutas principales:**
- `POST /api/reports/pdf/academic-history/:studentId` - Generar historial académico
- `POST /api/reports/pdf/curriculum/:curriculumId` - Generar malla curricular
- `POST /api/reports/pdf/enrollment-certificate/:studentId` - Generar certificado
- `POST /api/reports/pdf/student-list` - Generar lista de estudiantes (con filtros)
- `DELETE /api/reports/pdf/:filename` - Eliminar reporte
- `POST /api/reports/pdf/cleanup` - Limpiar reportes antiguos (superadmin)

**Script independiente:**
```bash
npm run microservice:pdf-reports
# o
node src/whatever/microservices/pdf-report-service.js
```

**Comandos del script:**
- `history <studentId>` - Generar historial académico
- `curriculum <curriculumId>` - Generar malla curricular
- `certificate <studentId>` - Generar certificado de matrícula
- `students [program] [semester]` - Generar lista de estudiantes
- `cleanup` - Limpiar reportes antiguos

**Archivo:** `src/whatever/Services/PDFReportService.js`

**Directorio de salida:** `src/whatever/uploads/reports/`

---

### 3. Microservicio de Generación de Archivos (FileGenerationService)

**Propósito:** Generación de archivos Excel (.xlsx) y CSV para exportación de datos.

**Características:**
- Exportación de listas de estudiantes (Excel y CSV)
- Exportación de historial académico (Excel)
- Exportación de mallas curriculares (Excel)
- Reportes de matrículas con filtros
- Generación de Excel personalizado con datos arbitrarios
- Limpieza automática de archivos antiguos (7 días)
- Formato con estilos profesionales (encabezados en color)

**Endpoint:** `/api/reports/files`

**Rutas principales:**
- `POST /api/reports/files/students/excel` - Generar Excel de estudiantes
- `POST /api/reports/files/students/csv` - Generar CSV de estudiantes
- `POST /api/reports/files/academic-history/:studentId/excel` - Historial académico
- `POST /api/reports/files/curriculum/:curriculumId/excel` - Malla curricular
- `POST /api/reports/files/enrollment-report/excel` - Reporte de matrículas
- `POST /api/reports/files/custom/excel` - Excel personalizado
- `GET /api/reports/files/list` - Listar archivos exportados
- `DELETE /api/reports/files/:filename` - Eliminar archivo
- `POST /api/reports/files/cleanup` - Limpiar archivos antiguos (superadmin)

**Script independiente:**
```bash
npm run microservice:file-generation
# o
node src/whatever/microservices/file-generation-service.js
```

**Comandos del script:**
- `students-excel [program] [semester]` - Generar Excel de estudiantes
- `students-csv [program] [semester]` - Generar CSV de estudiantes
- `history <studentId>` - Generar Excel de historial académico
- `curriculum <curriculumId>` - Generar Excel de malla curricular
- `enrollment-report [program] [sem]` - Generar reporte de matrículas
- `list` - Listar archivos exportados
- `cleanup` - Limpiar archivos antiguos

**Archivo:** `src/whatever/Services/FileGenerationService.js`

**Directorio de salida:** `src/whatever/uploads/exports/`

---

## Integración con el Servidor Principal

Los microservicios están integrados en el servidor Express principal (`src/whatever/server.js`):

```javascript
// Rutas de notificaciones - accesible por todos los roles autenticados
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Rutas de reportes PDF - accesible por student, admin y superadmin
app.use('/api/reports/pdf', authenticateToken, checkRole(['student', 'admin', 'superadmin']), pdfReportRoutes);

// Rutas de generación de archivos - accesible por admin y superadmin
app.use('/api/reports/files', authenticateToken, checkRole(['admin', 'superadmin']), fileGenerationRoutes);
```

Los archivos generados se sirven estáticamente:
- `/uploads/reports/` - Reportes PDF
- `/uploads/exports/` - Archivos Excel/CSV

---

## Validadores

Cada microservicio tiene sus propios validadores en `src/whatever/middleware/validation.js`:

- `validateNotification` - Validación de creación de notificaciones
- `validatePDFReport` - Validación de parámetros de reportes PDF
- `validateFileGeneration` - Validación de filtros para generación de archivos
- `validateCustomExcel` - Validación de Excel personalizado

---

## Dependencias

- `pdfkit` - Generación de PDFs
- `exceljs` - Generación de archivos Excel
- `express-validator` - Validación de requests

---

## Ejemplos de Uso

### Crear notificación desde el código

```javascript
const NotificationService = require('./Services/NotificationService');

await NotificationService.createNotification(
  userId,
  'success',
  'Matrícula Exitosa',
  'Te has matriculado en Programación II',
  { studentId: 1, courseName: 'Programación II' }
);
```

### Generar PDF de historial académico

```javascript
const PDFReportService = require('./Services/PDFReportService');

const result = await PDFReportService.generateAcademicHistoryReport(studentId);
// result.filename - nombre del archivo generado
// result.path - ruta completa del archivo
```

### Generar Excel de estudiantes

```javascript
const FileGenerationService = require('./Services/FileGenerationService');

const result = await FileGenerationService.generateStudentListExcel({
  program: 'Ingeniería de Sistemas',
  semester: 5
});
// result.filename - nombre del archivo generado
// result.count - cantidad de registros
```

---

## Notas Importantes

1. **Sin Docker:** Los microservicios están integrados como módulos del servidor principal, no como contenedores Docker separados.

2. **Scripts Independientes:** Cada microservicio tiene un script independiente que puede ejecutarse por separado para tareas de mantenimiento o generación batch.

3. **Limpieza Automática:** Los microservicios incluyen limpieza automática de archivos antiguos para evitar acumulación en disco.

4. **Roles y Permisos:**
   - Notificaciones: Todos los roles autenticados
   - Reportes PDF: Student, Admin, Superadmin
   - Generación de archivos: Admin, Superadmin

5. **Directorios de Salida:**
   - Reportes PDF: `src/whatever/uploads/reports/`
   - Archivos Excel/CSV: `src/whatever/uploads/exports/`

6. **Logs del Sistema:** Las notificaciones se registran en la tabla `SystemLogs` para auditoría.
