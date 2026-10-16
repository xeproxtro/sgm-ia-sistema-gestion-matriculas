# SGM-IA - Sistema de Gestión de Matrículas con Apoyo y Filtros IA

**Unidades Tecnológicas de Santander (UTS)**

Sistema web completo para la gestión de matrículas universitarias con integración de Inteligencia Artificial para optimización de horarios y sistema de colas inteligentes.

## 🚀 Características Principales

- **🤖 Optimización con IA:** Sugerencias inteligentes de horarios usando OpenAI GPT-4
- **� Autenticación 2FA:** Sistema de OTP vía Correo Electrónico para seguridad
- **🚦 Colas Inteligentes:** Gestión por lotes secuenciales (200 estudiantes/lote)
- **👥 Control de Acceso:** Tres niveles de roles (Estudiante, Admin, SuperAdmin) con aislamiento estricto
- **📊 Monitoreo en Tiempo Real:** Métricas de concurrencia y rendimiento
- **🔧 Modo Mantenimiento:** Control total para intervenciones del sistema
- **📱 Interfaz Responsiva:** Diseño moderno adaptable a dispositivos móviles

## 🏗️ Arquitectura

El sistema implementa el patrón **MVW (Model-View-Whatever)**:

- **Model:** Capa de datos con Sequelize ORM y MySQL
- **View:** Interfaces HTML5/CSS3/JavaScript modulares
- **Whatever:** Servidor Express.js con middleware y rutas API

## 📋 Requisitos del Sistema

### Requisitos de Software
- **Node.js:** v18.x o superior
- **MySQL:** v8.0 o superior
- **npm:** v9.x o superior

### Requisitos de Hardware
- **CPU:** 2 núcleos mínimo
- **RAM:** 4GB mínimo (8GB recomendado)
- **Almacenamiento:** 20GB disponibles

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd "Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA"
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Cree y edite el archivo `.env`:
```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgm_ia_db
DB_USER=root
DB_PASSWORD=tu_contraseña

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=secreto_jwt_muy_seguro
JWT_EXPIRES_IN=24h

# Correo Electrónico (OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_aplicación

# API de IA
AI_API_KEY=tu_openai_api_key
AI_API_URL=https://api.openai.com/v1/chat/completions

# Colas
BATCH_SIZE=200
QUEUE_CHECK_INTERVAL=5000

# Mantenimiento
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=Sistema en mantenimiento
```

### 4. Configurar base de datos
```bash
# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE sgm_ia_db;
EXIT;
```

### 5. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El sistema estará disponible en `http://localhost:3000`

## 🎯 Roles del Sistema

### 👨‍🎓 Estudiante
- Iniciar sesión con OTP por correo electrónico
- Consultar estado en cola de espera
- Optimizar horarios con IA
- Consultar malla curricular e historial
- Explorar electivas y optativas
- Realizar matrícula con confirmación OTP por correo

### 👨‍💼 Administrador
- Gestionar estudiantes y credenciales
- Administrar mallas curriculares
- Configurar cursos y cupos
- Monitorear colas de espera
- Generar reportes
- Activar modo mantenimiento

### 👨‍💻 Super Administrador
- Gestionar administradores
- Configurar permisos globales
- Control total del sistema
- Acceso a logs y auditoría
- Paradas de emergencia

## 📁 Estructura del Proyecto

```
SGM-IA/
├── src/
│   ├── Model/              # Modelos de base de datos
│   ├── View/               # Interfaces HTML
│   ├── Assets/             # CSS, JS, imágenes
│   ├── whatever/          # Servidor Express
│   ├── Services/           # Lógica de negocio
│   └── Config/             # Configuración
├── tests/                  # Pruebas
├── docs/                   # Documentación
└── README.md
```

Para más detalles, consulte [Documentación de Arquitectura](docs/ARQUITECTURA_Y_ESTRUCTURA.md)

## 🔐 Seguridad

- **Autenticación JWT** con tokens expirables
- **OTP vía Correo Electrónico** como segundo factor
- **Encriptación bcrypt** para contraseñas
- **Rate limiting** para prevenir abusos
- **Helmet** para headers de seguridad
- **Validación de entrada** en todas las rutas

## 🤖 Integración con IA

El sistema utiliza **OpenAI GPT-4** para:
- Optimización de horarios
- Análisis de historial académico
- Sugerencias personalizadas de materias
- Consejos académicos

## 📊 API Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/verify-otp` - Verificar OTP
- `POST /api/auth/register` - Registrar usuario

### Estudiantes
- `GET /api/student/profile` - Perfil del estudiante
- `GET /api/student/history` - Historial académico
- `GET /api/curriculum/student` - Malla curricular

### Administración
- `GET /api/admin/dashboard` - Dashboard de admin
- `GET /api/admin/students` - Lista de estudiantes
- `POST /api/admin/students` - Agregar estudiante
- `GET /api/admin/queue` - Gestión de colas

### IA
- `POST /api/ai/query` - Consultar asistente IA
- `GET /api/ai/schedule-suggestions` - Sugerencias de horario

## 🧪 Pruebas

```bash
# Ejecutar pruebas
npm test

# Análisis de código
npm run lint
```

## 🚀 Despliegue

### Opciones de Despliegue

El sistema puede desplegarse de múltiples formas:

1. **Docker** - Para desarrollo local o pruebas
2. **Docker Compose** - Para despliegue single-server simple
3. **Kubernetes** - Para producción con escalado automático
4. **Ansible** - Para automatización de despliegue en servidores

Para documentación completa de contenedorización y orquestación, consulta:
📄 [DOCKER_KUBERNETES_ANSIBLE.md](DOCKER_KUBERNETES_ANSIBLE.md)

### Despliegue Rápido con Docker Compose

```bash
# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Iniciar servicios
docker compose up -d

# Acceder a http://localhost:3000
```

### Preparación para Producción
1. Establecer `NODE_ENV=production`
2. Configurar base de datos de producción
3. Usar contraseñas fuertes
4. Configurar HTTPS
5. Establecer firewall y reglas de seguridad
6. Usar Kubernetes para alta disponibilidad
7. Implementar Ansible para automatización

### Variables de Entorno Críticas
- `JWT_SECRET` - Clave secreta para tokens
- `DB_PASSWORD` - Contraseña de base de datos
- `EMAIL_PASS` - Contraseña de aplicación de correo
- `AI_API_KEY` - Clave de API de OpenAI

## 📝 Autores

- **John Eduardo Ortiz Castellanos** - Analista, diseñador y programador frontend
  - Email: jeduardoortiz@uts.edu.co

- **Emmanuel Moreno Rueda** - Programador backend y tester
  - Email: emmanuelmoreno@uts.edu.co

**Docente a cargo:** Carlos Alfonso Pineda

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles

## 🤝 Contribuciones

Este es un proyecto académico para las Unidades Tecnológicas de Santander. Para contribuciones, contacte a los autores.

## 📞 Soporte

Para soporte técnico, contacte:
- Email: soporte@uts.edu.co
- Documentación: [docs/ARQUITECTURA_Y_ESTRUCTURA.md](docs/ARQUITECTURA_Y_ESTRUCTURA.md)

## 🗺️ Roadmap

### Versión 1.1 (Próximo)
- [ ] Sistema de notificaciones push
- [ ] Mejoras en la interfaz móvil
- [ ] Optimización de rendimiento

### Versión 2.0 (Futuro)
- [ ] Análisis predictivo de rendimiento
- [ ] Integración con otros sistemas UTS
- [ ] Aplicación móvil nativa

---

**Versión:** 1.0.0  
**Fecha:** 7 de septiembre de 2026  
**Estado:** Lista para producción
