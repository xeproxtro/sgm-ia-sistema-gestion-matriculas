# Esquema de Base de Datos - SGM-IA

Sistema de Gestión de Matrículas con Apoyo y Filtros IA - Unidades Tecnológicas de Santander

## Tablas del Sistema

### 1. users
Tabla principal de usuarios del sistema con roles diferenciados.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  role ENUM('student', 'admin', 'superadmin') NOT NULL DEFAULT 'student',
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  otp_code VARCHAR(6),
  otp_expires_at DATETIME,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_document_number (document_number),
  INDEX idx_email (email)
);
```

### 2. students
Información académica específica de los estudiantes.

```sql
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  student_code VARCHAR(20) NOT NULL UNIQUE,
  program VARCHAR(100),
  semester INT DEFAULT 1,
  academic_status ENUM('active', 'inactive', 'graduated', 'suspended') DEFAULT 'active',
  credits_completed INT DEFAULT 0,
  gpa DECIMAL(3,2),
  priority_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_student_code (student_code),
  INDEX idx_user_id (user_id)
);
```

### 3. otp_codes
Tabla separada para gestión de códigos OTP por correo electrónico.

```sql
CREATE TABLE otp_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  code VARCHAR(6) NOT NULL,
  purpose ENUM('login', 'enrollment', 'password_reset') NOT NULL DEFAULT 'login',
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at DATETIME,
  ip_address VARCHAR(45),
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_code (code),
  INDEX idx_expires_at (expires_at)
);
```

### 4. ai_preferences
Preferencias de horarios y optimización con IA para cada usuario.

```sql
CREATE TABLE ai_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  preferred_time_slots JSON,
  avoid_days JSON,
  max_daily_hours INT DEFAULT 6,
  preferred_teachers JSON,
  priority_subjects JSON,
  optimization_goal ENUM('balanced', 'minimize_days', 'compact_schedule', 'spread_out') DEFAULT 'balanced',
  ai_suggestions_history JSON,
  last_optimization_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

### 5. curricula
Mallas curriculares por programa académico.

```sql
CREATE TABLE curricula (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  total_credits INT NOT NULL,
  duration_semesters INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 6. subjects
Materias o asignaturas de los programas académicos.

```sql
CREATE TABLE subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  credits INT NOT NULL,
  type ENUM('mandatory', 'elective', 'optional') NOT NULL,
  semester INT NOT NULL,
  prerequisites TEXT,
  curriculum_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE,
  INDEX idx_curriculum_id (curriculum_id),
  INDEX idx_code (code)
);
```

### 7. courses
Oferta de cursos con horarios y cupos.

```sql
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  group_number VARCHAR(10) NOT NULL,
  teacher VARCHAR(100) NOT NULL,
  schedule JSON,
  classroom VARCHAR(50),
  capacity INT NOT NULL,
  enrolled INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_subject_id (subject_id)
);
```

### 8. academic_records
Historial académico de los estudiantes.

```sql
CREATE TABLE academic_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  status ENUM('in_progress', 'approved', 'failed', 'cancelled', 'retired') NOT NULL,
  grade DECIMAL(3,2),
  semester_taken INT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_subject_id (subject_id)
);
```

### 9. enrollment_queues
Gestión del sistema de colas de espera por lotes.

```sql
CREATE TABLE enrollment_queues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  batch_number INT NOT NULL,
  position_in_batch INT NOT NULL,
  status ENUM('waiting', 'active', 'completed', 'expired') DEFAULT 'waiting',
  priority_score INT DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at DATETIME,
  completed_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_batch_number (batch_number),
  INDEX idx_status (status)
);
```

### 10. enrollments
Registro de matrículas confirmadas con validación OTP.

```sql
CREATE TABLE enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  semester INT NOT NULL,
  year INT NOT NULL,
  otp_verified BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR(6),
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_course_id (course_id),
  INDEX idx_semester_year (semester, year)
);
```

### 11. system_logs
Logs del sistema para auditoría y monitoreo.

```sql
CREATE TABLE system_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  status ENUM('success', 'error', 'warning') NOT NULL DEFAULT 'success',
  error_message TEXT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp),
  INDEX idx_entity (entity_type, entity_id)
);
```

## Relaciones entre Tablas

```
users (1) ----< (1) students
users (1) ----< (N) otp_codes
users (1) ----< (1) ai_preferences
users (1) ----< (N) system_logs

students (1) ----< (N) academic_records
students (1) ----< (N) enrollment_queues
students (1) ----< (N) enrollments

curricula (1) ----< (N) subjects
subjects (1) ----< (N) courses
subjects (1) ----< (N) academic_records

courses (1) ----< (N) enrollments
```

## Datos de Prueba (Seeders)

### Usuarios de Prueba

1. **Super Administrador**
   - Email: emmanuelmoreno@uts.edu.co
   - Password: d4clt//waos123
   - Documento: 1000000001

2. **Administrador del Sistema**
   - Email: emmanuelmoreno2t@gmail.com
   - Password: akirayyukimishijoswe12
   - Documento: 1000000002

3. **Estudiante**
   - Email: waosmanxd123@gmail.com
   - Password: nosexdwaos123
   - Documento: 1000000003
   - Código: 20260001
   - Programa: Ingeniería de Sistemas
   - Semestre: 5

## Notas de Seguridad

- Todas las contraseñas se almacenan con hash bcrypt
- Los códigos OTP tienen validez limitada (5 min para login, 10 min para matrícula)
- Los logs del sistema incluyen IP y user agent para auditoría
- El aislamiento por rol se implementa a nivel de aplicación (middleware) y base de datos
