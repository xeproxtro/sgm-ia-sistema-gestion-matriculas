# Etapa 5: Liberación (Release Stage)

Esta documentación describe la implementación de la Etapa 5 del proceso DevOps para el Sistema de Gestión de Matrículas.

## 📋 Componentes Implementados

### 1. GitHub Container Registry (ghcr.io)
Repositorio de artefactos Docker para distribución de imágenes.

**Beneficios:**
- Integración nativa con GitHub
- Autenticación automática con GITHUB_TOKEN
- Soporte para versionado semántico
- Gratis para repositorios públicos

### 2. Automated Versioning
Versionado automático basado en commits convencionales utilizando `standard-version`.

**Convention de Commits:**
- `feat:` - Nuevas features (incrementa MINOR)
- `fix:` - Bug fixes (incrementa PATCH)
- `BREAKING CHANGE:` - Cambios breaking (incrementa MAJOR)

### 3. GitHub Actions CI/CD
Pipeline automatizado para builds, tests y releases.

## 🚀 Flujo de Release

### 1. Desarrollo
```bash
# Trabajar en rama develop
git checkout develop
git checkout -b feature/nueva-funcionalidad

# Hacer commits con formato convencional
git commit -m "feat: agregar microservicio de notificaciones"
git commit -m "fix: corregir error en generación de PDF"

# Push y crear PR
git push origin feature/nueva-funcionalidad
```

### 2. Crear Release

**Opción A: Usar Script Automático (Recomendado)**

**Windows:**
```bash
scripts\release.bat patch
scripts\release.bat minor
scripts\release.bat major
```

**Linux/Mac:**
```bash
chmod +x scripts/release.sh
./scripts/release.sh patch
./scripts/release.sh minor
./scripts/release.sh major
```

**Opción B: Manual**
```bash
# Actualizar versión
npm run release:patch
npm run release:minor
npm run release:major

# Push de cambios y tags
git push --follow-tags origin main
```

### 3. Pipeline Automático

Al hacer push a `main` con un nuevo tag, GitHub Actions ejecutará:

1. **CI (Continuous Integration)**
   - Lint del código
   - Ejecución de tests
   - Build de imagen Docker
   - Push a GitHub Container Registry

2. **CD (Continuous Deployment)**
   - Creación automática de release en GitHub
   - Generación de changelog
   - Publicación de múltiples tags de imagen Docker

## 📦 Versiones de Imagen Docker

Cada release genera múltiples tags en GitHub Container Registry:

```
ghcr.io/tu-usuario/sgm-ia-sistema-gestion-matriculas:1.2.3    # Versión específica
ghcr.io/tu-usuario/sgm-ia-sistema-gestion-matriculas:1.2      # Major.Minor
ghcr.io/tu-usuario/sgm-ia-sistema-gestion-matriculas:1        # Major
ghcr.io/tu-usuario/sgm-ia-sistema-gestion-matriculas:latest   # Última versión
```

## 🔧 Configuración Inicial

### 1. Actualizar Repository Name

El repository name ya está configurado con tu usuario: `xeproxtro`

Los siguientes archivos ya están actualizados:
- `.github/workflows/ci-cd.yml` → `xeproxtro/sgm-ia-sistema-gestion-matriculas`
- `.github/workflows/docker-release.yml` → `xeproxtro/sgm-ia-sistema-gestion-matriculas`
- `docker-compose.release.yml` → `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:latest`
- `scripts/release.sh` → `xeproxtro/sgm-ia-sistema-gestion-matriculas`
- `scripts/release.bat` → `xeproxtro/sgm-ia-sistema-gestion-matriculas`

### 2. Configurar GitHub Actions

El pipeline usa `GITHUB_TOKEN` automáticamente, no requiere configuración adicional.

### 3. Configurar Repository Settings

Ve a tu repositorio en GitHub:
1. Settings → Actions → General
2. Habilita "Workflow permissions"
3. Selecciona "Read and write permissions"

## 📝 Usar Imagen de Release

### Opción 1: Docker Compose con Release

```bash
# Usar docker-compose.release.yml para usar imagen de GitHub Registry
docker compose -f docker-compose.release.yml up -d

# Verificar
docker compose -f docker-compose.release.yml ps
```

### Opción 2: Pull Manual

```bash
# Pull versión específica
docker pull ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:1.2.3

# Pull latest
docker pull ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:latest

# Usar en docker-compose.yml
# Cambia la imagen en docker-compose.yml a:
# image: ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:1.2.3
```

### Opción 3: Deploy en Producción

```bash
# Pull nueva versión
docker pull ghcr.io/tu-usuario/sgm-ia-sistema-gestion-matriculas:1.2.3

# Detener contenedor actual
docker compose down

# Actualizar imagen en docker-compose.yml
# image: ghcr.io/tu-usuario/sgm-ia-sistema-gestion-matriculas:1.2.3

# Iniciar con nueva versión
docker compose up -d
```

## 🔄 Rollback a Versión Anterior

```bash
# Detener versión actual
docker compose down

# Cambiar a versión anterior en docker-compose.yml
# image: ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:1.2.2

# Iniciar versión anterior
docker compose up -d
```

## 📊 Estrategia de Branching

```
main (producción)
  ↑
  merge
  ↑
develop (desarrollo)
  ↑
  feature/* (nuevas features)
  fix/* (correcciones)
```

### Reglas:
1. **main**: Solo contiene releases, código estable
2. **develop**: Integración continua de features
3. **feature/***: Desarrollo de nuevas funcionalidades
4. **fix/***: Correcciones de bugs

## 🔍 Ver Releases en GitHub

1. Ve a tu repositorio en GitHub
2. Clic en "Releases" en el sidebar
3. Verás todos los releases con:
   - Versión
   - Changelog automático
   - Enlace a commits
   - Assets (imagen Docker)

## 📈 Métricas de Release

### Monitorear:
- Frecuencia de releases
- Tiempo entre commits y release
- Tamaño de imágenes Docker
- Tiempo de ejecución del pipeline

### Comandos útiles:
```bash
# Ver tags locales
git tag

# Ver tags remotos
git ls-remote --tags origin

# Ver changelog de commits recientes
git log --oneline --decorate
```

## 🛡️ Best Practices

### Antes de Release:
1. ✅ Todos los tests pasan
2. ✅ Lint sin errores
3. ✅ Código commiteado en main
4. ✅ Documentación actualizada
5. ✅ CHANGELOG revisado

### Durante Release:
1. ✅ Usar scripts automatizados
2. ✅ Verificar versión correcta
3. ✅ Revisar changelog generado
4. ✅ Monitorear pipeline de GitHub Actions

### Después de Release:
1. ✅ Verificar imagen en GitHub Registry
2. ✅ Probar imagen en staging
3. ✅ Actualizar documentación
4. ✅ Notificar al equipo

## 🐛 Troubleshooting

### Release falla en GitHub Actions

**Problema:** Pipeline falla en build o test

**Solución:**
```bash
# Ver logs en GitHub Actions
# Reproducir localmente
npm run lint
npm test
docker build -t test .
```

### Imagen no se publica en GitHub Registry

**Problema:** Permisos insuficientes

**Solución:**
1. Settings → Actions → General
2. Habilitar "Read and write permissions"
3. Re-run workflow

### Script de release falla

**Problema:** Cambios sin commit

**Solución:**
```bash
# Commit o stash cambios
git add .
git commit -m "chore: preparar para release"
# o
git stash
```

## 📚 Recursos Adicionales

- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🎯 Próximos Pasos

1. Configurar repository name en archivos
2. Hacer primer release de prueba (patch)
3. Verificar imagen en GitHub Registry
4. Probar despliegue con docker-compose.release.yml
5. Configurar entorno de staging
6. Implementar automated deployment a producción
