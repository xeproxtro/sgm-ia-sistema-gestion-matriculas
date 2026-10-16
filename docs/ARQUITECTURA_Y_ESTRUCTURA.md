# Documento de Arquitectura y Estructura del Proyecto SGM-IA

## Sistema de Gestión de Matrículas con Apoyo y Filtros de Inteligencia Artificial
**Unidades Tecnológicas de Santander (UTS)**

**Autores:**
- John Eduardo Ortiz Castellanos (Analista, diseñador y programador frontend)
- Emmanuel Moreno Rueda (Programador backend y tester)

**Docente a cargo:** Carlos Alfonso Pineda

---

## 1. Resumen Ejecutivo

El SGM-IA es un sistema web completo para la gestión de matrículas universitarias que implementa un enfoque innovador mediante:

- **Colas de espera inteligentes** por lotes secuenciales (200 estudiantes por lote)
- **Filtros de Inteligencia Artificial** para optimización de horarios
- **Autenticación de dos factores** mediante códigos OTP vía SMS
- **Arquitectura MVW** (Model-View-Whatever) para separación de responsabilidades
- **Control de acceso basado en roles** (Estudiante, Administrador, SuperAdministrador)

---

## 2. Arquitectura del Sistema

### 2.1 Patrón Arquitectónico MVW

El sistema implementa el patrón **Model-View-Whatever** con las siguientes capas:

#### **Model (Capa de Datos)**
- **Ubicación:** `src/Model/`
- **Responsabilidades:**
  - Definición de esquemas de base de datos
  - Modelos Sequelize para ORM
  - Relaciones entre entidades
  - Lógica de persistencia de datos

**Modelos implementados:**
- `User` - Usuarios del sistema (estudiantes, admins, superadmins)
- `Student` - Información académica de estudiantes
- `Curriculum` - Mallas curriculares por programa
- `Subject` - Materias/asignaturas
- `Course` - Cursos específicos con horarios y cupos
- `AcademicRecord` - Historial académico
- `Queue` - Sistema de colas de espera
- `Enrollment` - Matrículas confirmadas

#### **View (Capa de Presentación)**
- **Ubicación:** `src/View/` y `src/Assets/`
- **Responsabilidades:**
  - Interfaces de usuario HTML modulares
  - Estilos CSS responsivos
  - Componentes visuales interactivos
  - JavaScript del lado del cliente

**Vistas implementadas:**
- `login.html` - Página de inicio de sesión con OTP
- `student-dashboard.html` - Panel de control del estudiante
- `admin-dashboard.html` - Panel de administración
- `superadmin-dashboard.html` - Panel de superadministración

**Assets:**
- `css/` - Hojas de estilos (styles.css, login.css, dashboard.css, admin.css, superadmin.css)
- `js/` - ViewModels del lado del cliente (login.js, student-dashboard.js, admin-dashboard.js, superadmin-dashboard.js)
- `images/` - Imágenes y recursos gráficos

#### **Whatever (Capa de Lógica de Presentación)**
- **Ubicación:** `src/whatever/`
- **Responsabilidades:**
  - Servidor Express.js
  - Middleware de autenticación y autorización
  - Rutas API RESTful
  - Lógica de negocio y coordinación
  - Manejo de estados y sesiones

**Componentes:**
- `server.js` - Servidor principal Express
- `middleware/` - Middleware de autenticación, roles, validación
- `routes/` - Rutas API por rol y funcionalidad

### 2.2 Servicios del Sistema

**Ubicación:** `src/Services/`

#### **AuthService**
- Autenticación de usuarios
- Generación y verificación de tokens JWT
- Gestión de contraseñas (bcrypt)
- Registro de usuarios

#### **OTPService**
- Generación de códigos OTP de 6 dígitos
- Envío de SMS mediante Twilio
- Verificación de códigos con expiración
- Reenvío de códigos

#### **AIService**
- Integración con API de IA externa (OpenAI)
- Optimización de horarios
- Análisis de historial académico
- Generación de sugerencias personalizadas

#### **QueueService**
- Gestión de colas de espera por lotes
- Procesamiento secuencial (200 estudiantes/lote)
- Control de concurrencia
- Estadísticas en tiempo real

---

## 3. Estructura de Archivos y Directorios

```
SGM-IA/
├── package.json                    # Configuración del proyecto y dependencias
├── .env                           # Variables de entorno (configuración)
├── .gitignore                     # Archivos ignorados por Git
│
├── src/
│   ├── Model/                     # Capa de Datos (Model)
│   │   ├── index.js              # Exportación de modelos y sincronización
│   │   ├── User.js               # Modelo de usuarios
│   │   ├── Student.js            # Modelo de estudiantes
│   │   ├── Curriculum.js          # Modelo de mallas curriculares
│   │   ├── Subject.js             # Modelo de materias
│   │   ├── Course.js              # Modelo de cursos
│   │   ├── AcademicRecord.js     # Modelo de historial académico
│   │   ├── Queue.js               # Modelo de colas de espera
│   │   └── Enrollment.js          # Modelo de matrículas
│   │
│   ├── View/                      # Capa de Presentación (View)
│   │   ├── login.html            # Página de inicio de sesión
│   │   ├── student-dashboard.html # Panel de estudiante
│   │   ├── admin-dashboard.html  # Panel de administrador
│   │   └── superadmin-dashboard.html # Panel de superadministrador
│   │
│   ├── Assets/                    # Recursos estáticos
│   │   ├── css/                  # Hojas de estilos
│   │   │   ├── styles.css        # Estilos globales
│   │   │   ├── login.css         # Estilos de login
│   │   │   ├── dashboard.css     # Estilos de dashboards
│   │   │   ├── admin.css         # Estilos específicos de admin
│   │   │   └── superadmin.css    # Estilos específicos de superadmin
│   │   │
│   │   ├── js/                   # JavaScript del cliente
│   │   │   ├── login.js          # ViewModel de login
│   │   │   ├── student-dashboard.js # ViewModel de estudiante
│   │   │   ├── admin-dashboard.js    # ViewModel de administrador
│   │   │   └── superadmin-dashboard.js # ViewModel de superadmin
│   │   │
│   │   └── images/              # Imágenes y recursos gráficos
│   │       └── README.md        # Instrucciones para imágenes
│   │
│   ├── whatever/                # Capa de Lógica de Presentación
│   │   ├── server.js            # Servidor Express principal
│   │   ├── middleware/          # Middleware del servidor
│   │   │   ├── auth.js          # Autenticación JWT
│   │   │   ├── roles.js         # Control de acceso por roles
│   │   │   ├── maintenance.js   # Modo mantenimiento
│   │   │   └── validation.js    # Validación de datos
│   │   │
│   │   └── routes/              # Rutas API
│   │       ├── auth.js          # Rutas de autenticación
│   │       ├── student.js       # Rutas de estudiantes
│   │       ├── admin.js         # Rutas de administradores
│   │       ├── superadmin.js    # Rutas de superadministradores
│   │       ├── queue.js         # Rutas de colas
│   │       ├── enrollment.js    # Rutas de matrículas
│   │       ├── ai.js            # Rutas de IA
│   │       └── curriculum.js    # Rutas de mallas curriculares
│   │
│   ├── Services/                # Servicios del sistema
│   │   ├── AuthService.js       # Servicio de autenticación
│   │   ├── OTPService.js        # Servicio de OTP/SMS
│   │   ├── AIService.js         # Servicio de Inteligencia Artificial
│   │   └── QueueService.js      # Servicio de colas
│   │
│   └── Config/                  # Configuración
│       └── database.js          # Configuración de base de datos
│
├── tests/                       # Pruebas unitarias y de integración
├── docs/                        # Documentación del proyecto
│   └── ARQUITECTURA_Y_ESTRUCTURA.md # Este documento
│
└── README.md                    # Documentación general del proyecto
```

---

## 4. Tecnologías Implementadas

### 4.1 Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web para servidor
- **Sequelize** - ORM para base de datos MySQL
- **MySQL2** - Driver de base de datos
- **JWT** - Autenticación basada en tokens
- **bcryptjs** - Encriptación de contraseñas
- **Twilio** - Servicio de SMS para OTP
- **Axios** - Cliente HTTP para API externa

### 4.2 Frontend
- **HTML5** - Estructura de páginas
- **CSS3** - Estilos y diseño responsivo
- **JavaScript (ES6+)** - Lógica del cliente
- **MVW Pattern** - Arquitectura de presentación

### 4.3 Inteligencia Artificial
- **OpenAI API** - Motor de IA para optimización de horarios
- **GPT-4** - Modelo de lenguaje para análisis y sugerencias

### 4.4 Seguridad
- **Helmet** - Headers de seguridad HTTP
- **CORS** - Control de acceso cruzado
- **Rate Limiting** - Limitación de solicitudes por IP
- **Express Validator** - Validación de datos de entrada
- **Express Session** - Gestión de sesiones

---

## 5. Flujo de Autenticación y Autorización

### 5.1 Proceso de Login
1. Usuario ingresa documento, contraseña y rol
2. Sistema valida credenciales en base de datos
3. Si válidas, genera código OTP de 6 dígitos
4. Envía OTP al teléfono del usuario vía SMS (Twilio)
5. Usuario ingresa OTP en la interfaz
6. Sistema verifica OTP y expiración
7. Si correcto, genera token JWT
8. Token almacenado en localStorage del cliente
9. Redirección al dashboard correspondiente al rol

### 5.2 Control de Acceso por Roles
- **Estudiante:** Acceso a dashboard de estudiante, matrícula, consulta de malla
- **Administrador:** Acceso a gestión de estudiantes, mallas, cursos, colas, reportes
- **SuperAdministrador:** Acceso a gestión de administradores, permisos globales, mantenimiento, logs, auditoría

### 5.3 Middleware de Seguridad
- `authenticateToken` - Verifica token JWT en cada solicitud
- `checkRole` - Valida que el usuario tenga el rol requerido
- `maintenanceMode` - Bloquea acceso durante mantenimiento
- `validation` - Valida datos de entrada según esquemas

---

## 6. Sistema de Colas de Espera

### 6.1 Funcionamiento
- **Lotes secuenciales:** 200 estudiantes por lote
- **Procesamiento:** Un estudiante activo a la vez por lote
- **Control de concurrencia:** Máximo 200 estudiantes activos simultáneamente
- **Intervalo de verificación:** 5 segundos entre activaciones

### 6.2 Estados de Cola
- `waiting` - En espera de ser activado
- `active` - Actualmente en proceso de matrícula
- `completed` - Proceso de matrícula finalizado
- `skipped` - Saltado por el estudiante

### 6.3 API de Colas
- `POST /api/queue/add` - Añadir estudiante a cola
- `GET /api/queue/status` - Obtener estado actual
- `POST /api/queue/complete` - Marcar como completado
- `POST /api/queue/skip` - Saltar turno
- `GET /api/queue/statistics` - Estadísticas globales (admin)

---

## 7. Integración con Inteligencia Artificial

### 7.1 Servicio AIService
- **API:** OpenAI GPT-4
- **Funciones:**
  - Optimización de horarios
  - Análisis de historial académico
  - Sugerencias de materias
  - Consejos académicos personalizados

### 7.2 Proceso de Optimización
1. Sistema recopila datos del estudiante (historial, malla, preferencias)
2. Obtiene cursos disponibles con horarios y cupos
3. Envía solicitud estructurada a API de IA
4. IA analiza y genera combinaciones óptimas
5. Sistema presenta sugerencias al estudiante
6. Estudiante puede aplicar sugerencias o modificar

### 7.3 Criterios de Optimización
- Priorizar materias reprobadas/canceladas
- Evitar cruces de horario
- Minimizar tiempos muertos (>3 horas)
- Considerar carga académica adecuada
- Respetar prerrequisitos y malla curricular

---

## 8. Sistema de OTP (One-Time Password)

### 8.1 Implementación
- **Longitud:** 6 dígitos numéricos
- **Caducidad:** 5 minutos (login), 10 minutos (matrícula)
- **Servicio SMS:** Twilio
- **Almacenamiento:** Base de datos temporal

### 8.2 Flujos OTP
- **Login OTP:** Segundo factor de autenticación
- **Enrollment OTP:** Confirmación de matrícula crítica
- **Reenvío:** Permitido con límite de seguridad

---

## 9. Base de Datos

### 9.1 Esquema Relacional
- **Users:** Tabla principal de usuarios
- **Students:** Información académica (1:1 con Users)
- **Curricula:** Mallas curriculares por programa
- **Subjects:** Materias con relación a mallas
- **Courses:** Cursos específicos (grupos, horarios, cupos)
- **AcademicRecords:** Historial académico (estudiantes ↔ materias)
- **Queue:** Sistema de colas (estudiantes ↔ lotes)
- **Enrollments:** Matrículas confirmadas (estudiantes ↔ cursos)

### 9.2 Configuración
- **Motor:** MySQL
- **ORM:** Sequelize
- **Migraciones:** Sincronización automática en desarrollo
- **Pool de conexiones:** Configurado para alta concurrencia

---

## 10. Seguridad y Rendimiento

### 10.1 Medidas de Seguridad
- **Autenticación JWT** con expiración
- **Encriptación bcrypt** para contraseñas
- **OTP vía SMS** como segundo factor
- **Helmet** para headers de seguridad
- **Rate limiting** (100 solicitudes/15 minutos por IP)
- **Validación de entrada** con express-validator
- **Control de acceso** basado en roles
- **Modo mantenimiento** para intervenciones críticas

### 10.2 Optimización de Rendimiento
- **Colas por lotes** para evitar saturación
- **Pool de conexiones** a base de datos
- **Caché de sesiones** en memoria
- **Static file serving** optimizado
- **Compresión** de respuestas (configurable)
- **Índices de base de datos** en campos críticos

---

## 11. Despliegue y Configuración

### 11.1 Variables de Entorno (.env)
```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgm_ia_db
DB_USER=root
DB_PASSWORD=

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# API de IA
AI_API_KEY=your_openai_api_key
AI_API_URL=https://api.openai.com/v1/chat/completions

# Colas
BATCH_SIZE=200
QUEUE_CHECK_INTERVAL=5000

# Mantenimiento
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=Sistema en mantenimiento
```

### 11.2 Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Editar archivo .env

# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start

# Ejecutar pruebas
npm test

# Análisis de código
npm run lint
```

---

## 12. Requisitos Funcionales Implementados

### Must Have (RF)
- ✅ **RF01:** Autenticación y Control de Acceso por Rol
- ✅ **RF02:** Proceso de Inscripción con Filtro Especializado
- ✅ **RF03:** Gestión Administrativa de Mallas y Cupos
- ✅ **RF04:** Control de Mantenimiento y Permisos Globales

### Should Have (RF)
- ✅ **RF05:** Optimización de Horarios con IA
- ✅ **RF06:** Consulta de Malla e Historial Académico
- ✅ **RF07:** Registro de Credenciales de Estudiantes

### Could Have (RF)
- ✅ **RF08:** Exploración de Electivas y Optativas
- ✅ **RF09:** Monitoreo Técnico de Concurrencia
- ✅ **RF10:** Generación de Reportes de Matrícula

---

## 13. Requisitos No Funcionales Implementados

- ✅ **RNF01:** Jerarquía y Seguridad de Accesos (3 niveles)
- ✅ **RNF02:** Control de Disponibilidad y Mantenimiento
- ✅ **RNF03:** Rendimiento del Filtro y Motor IA (<2 segundos)
- ✅ **RNF04:** Usabilidad e Interfaz Ligera (HTML responsivo)
- ✅ **RNF05:** Monitoreo y Métrica de Concurrencia

---

## 14. Historias de Usuario Implementadas

- ✅ **HU1:** Estudiante - Acceso y matrícula
- ✅ **HU2:** Estudiante - Optimización con IA
- ✅ **HU3:** Estudiante - Consulta de avance
- ✅ **HU4:** Administrador - Gestión académica
- ✅ **HU5:** Administrador - Monitoreo
- ✅ **HU6:** Super Administrador - Control global

---

## 15. Casos de Uso Implementados

### Actor: Estudiante
- ✅ Iniciar sesión estudiante
- ✅ Ingresar al sistema de matrículas → Ejecución del filtro especializado → Matricular asignaturas
- ✅ Optimizar horario con IA
- ✅ Consultar malla curricular
- ✅ Revisar historial académico
- ✅ Explorar electivas y optativas

### Actor: Administrador del Sistema
- ✅ Iniciar sesión admin
- ✅ Registrar credenciales de estudiantes
- ✅ Gestionar mallas curriculares
- ✅ Configurar cupos
- ✅ Generar reportes de matrícula
- ✅ Monitorear rendimiento y concurrencia

### Actor: Super Administrador
- ✅ Iniciar sesión superadmin
- ✅ Poner el sistema en modo mantenimiento
- ✅ Validar credenciales de admins
- ✅ Gestionar permisos globales

---

## 16. Próximos Pasos y Mejoras

### 16.1 Corto Plazo
- [ ] Implementar sistema de tests unitarios
- [ ] Configurar CI/CD para despliegue automático
- [ ] Agregar logging estructurado
- [ ] Implementar sistema de caché (Redis)

### 16.2 Mediano Plazo
- [ ] Agregar modelo predictivo de rendimiento académico
- [ ] Implementar notificaciones push
- [ ] Optimización avanzada de cupos
- [ ] Escalabilidad para otras sedes

### 16.3 Largo Plazo
- [ ] Migración a microservicios
- [ ] Implementar GraphQL para API
- [ ] Agregar análisis de big data
- [ ] Integración con sistemas institucionales existentes

---

## 17. Conclusiones

El sistema SGM-IA ha sido implementado siguiendo rigurosamente la especificación IEEE 830, cumpliendo con todos los requisitos funcionales y no funcionales establecidos. La arquitectura MVW proporciona una separación clara de responsabilidades, facilitando el mantenimiento y escalabilidad del sistema.

La implementación de tecnologías modernas como Node.js, Express, Sequelize, y la integración con IA de OpenAI, posicionan al sistema como una solución robusta y innovadora para la gestión de matrículas universitarias en las Unidades Tecnológicas de Santander.

---

**Fecha de creación:** 7 de septiembre de 2026
**Versión:** 1.0.0
**Estado:** Lista para pruebas y despliegue
