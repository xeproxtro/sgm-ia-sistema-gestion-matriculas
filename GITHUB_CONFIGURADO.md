# Configuración de GitHub para Releases

## ✅ Archivos Configurados

He actualizado todos los archivos con tu usuario de GitHub: **xeproxtro**

### Archivos Modificados:

1. **`.github/workflows/ci-cd.yml`**
   - Image name: `xeproxtro/sgm-ia-sistema-gestion-matriculas`

2. **`.github/workflows/docker-release.yml`**
   - Image name: `xeproxtro/sgm-ia-sistema-gestion-matriculas`

3. **`docker-compose.release.yml`**
   - Image: `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:latest`

4. **`scripts/release.sh`**
   - Registry: `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas`

5. **`scripts/release.bat`**
   - Registry: `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas`

6. **`.versionrc.json`**
   - Repository: `xeproxtro/sgm-ia-sistema-gestion-matriculas`

7. **`RELEASE_STAGE.md`**
   - Documentación actualizada con tu usuario

## 📦 GitHub Container Registry

Las imágenes Docker se publicarán en:

```
ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas
```

### Tags que se generarán con cada release:

- `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:1.0.1` (versión específica)
- `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:1.0` (major.minor)
- `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:1` (major)
- `ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:latest` (última versión)

## 🚀 Próximos Pasos

### 1. Habilitar GitHub Actions

Ve a tu repositorio en GitHub:
1. https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas/settings/actions
2. Clic en "General"
3. En "Workflow permissions", selecciona:
   - ✅ "Read and write permissions"
4. Clic en "Save"

### 2. Hacer Push del Código

Si aún no has subido el código a GitHub:

```bash
# Inicializar git si no está inicializado
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "chore: initial commit with microservices and CI/CD"

# Agregar remote
git remote add origin https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas.git

# Push a main
git branch -M main
git push -u origin main
```

### 3. Crear Primer Release

**Windows:**
```bash
scripts\release.bat patch
```

**Linux/Mac:**
```bash
chmod +x scripts/release.sh
./scripts/release.sh patch
```

Esto creará la versión `1.0.1` y:
- Generará CHANGELOG.md
- Creará tag git v1.0.1
- Push de cambios y tags
- Iniciará GitHub Actions automáticamente

### 4. Verificar en GitHub

1. Ve a tu repositorio: https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas
2. Clic en "Actions" para ver el pipeline ejecutándose
3. Clic en "Packages" para ver las imágenes Docker publicadas
4. Clic en "Releases" para ver los releases creados

## 🧪 Probar Imagen Docker

Después del primer release, puedes probar la imagen:

```bash
# Pull la imagen
docker pull ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:1.0.1

# Usar con docker-compose.release.yml
docker compose -f docker-compose.release.yml up -d

# Verificar
docker compose -f docker-compose.release.yml ps
```

## 📝 Convention de Commits

Para que el versionado automático funcione correctamente, usa commits con formato convencional:

```bash
# Nuevas features (incrementa MINOR)
git commit -m "feat: agregar microservicio de notificaciones"

# Bug fixes (incrementa PATCH)
git commit -m "fix: corregir error en generación de PDF"

# Cambios breaking (incrementa MAJOR)
git commit -m "feat: cambiar API de autenticación

BREAKING CHANGE: La API de autenticación ahora requiere token JWT"

# Otros cambios (no incrementan versión)
git commit -m "docs: actualizar documentación"
git commit -m "chore: actualizar dependencias"
git commit -m "style: formatear código"
```

## 🔗 URLs Importantes

- **Repositorio**: https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas
- **Actions**: https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas/actions
- **Packages**: https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas/packages
- **Releases**: https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas/releases
- **Settings**: https://github.com/xeproxtro/sgm-ia-sistema-gestion-matriculas/settings

## 📚 Documentación

- <ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\RELEASE_STAGE.md" /> - Guía completa de la etapa de liberación
- <ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\MICROSERVICIOS.md" /> - Documentación de microservicios
- <ref_file file="C:\Users\emman\Desktop\Modelo de Sistema de Gestión de Matrículas para Universidad con Apoyo y Filtros IA\MICROSERVICIOS_ESTRUCTURA.md" /> - Estructura y endpoints

## ✅ Checklist

Antes de hacer el primer release:

- [ ] Repositorio creado en GitHub
- [ ] Código push al repositorio
- [ ] GitHub Actions habilitado con permisos de lectura/escritura
- [ ] Primer release creado con script
- [ ] Pipeline de GitHub Actions ejecutado exitosamente
- [ ] Imagen Docker publicada en GitHub Container Registry
- [ ] Imagen probada con docker-compose.release.yml

Todo está configurado y listo para usar con tu usuario **xeproxtro** 🎉
