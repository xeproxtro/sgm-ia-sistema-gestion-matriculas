# AGENTS.md - Información de Configuración del Proyecto

## Stack Tecnológico

- **Backend**: Node.js + Express.js
- **Base de Datos**: MySQL 8.0
- **ORM**: Sequelize
- **Contenedorización**: Docker
- **Orquestación**: Kubernetes
- **Automatización**: Ansible

## Comandos de Despliegue

### Docker Compose (Desarrollo/Single Server)
```bash
# Configurar entorno
cp .env.example .env
# Editar .env con valores reales

# Desplegar
docker compose up -d

# Ver estado
docker compose ps

# Ver logs
docker compose logs -f
```

### Kubernetes (Producción)
```bash
# Actualizar secrets en k8s/secret.yaml
nano k8s/secret.yaml

# Desplegar
cd k8s
kubectl apply -k .

# Verificar
kubectl get pods
kubectl get svc
```

### Ansible (Automatización)
```bash
# Configurar inventory en ansible/inventory.ini
nano ansible/inventory.ini

# Despliegue con Docker Compose
ansible-playbook -i ansible/inventory.ini ansible/deploy-docker.yml

# Despliegue completo con Kubernetes
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml
```

### Scripts de Despliegue Rápido

**Windows:**
```bash
scripts\deploy.bat docker
scripts\deploy.bat kubernetes
scripts\rebuild-docker.bat  # Reconstruir imagen con microservicios
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh docker
./scripts/deploy.sh kubernetes
chmod +x scripts/rebuild-docker.sh
./scripts/rebuild-docker.sh  # Reconstruir imagen con microservicios
```

## Scripts de Proyecto

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo (con nodemon)
- `npm run seed` - Ejecutar seeders de base de datos
- `npm test` - Ejecutar pruebas
- `npm run lint` - Ejecutar ESLint
- `npm run release` - Crear release automático (detecta tipo)
- `npm run release:patch` - Crear release patch (1.0.0 → 1.0.1)
- `npm run release:minor` - Crear release minor (1.0.0 → 1.1.0)
- `npm run release:major` - Crear release major (1.0.0 → 2.0.0)

## Scripts de Release

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

## Documentación

- `README.md` - Documentación principal del proyecto
- `DOCKER_KUBERNETES_ANSIBLE.md` - Guía completa de despliegue con Docker, Kubernetes y Ansible
- `docs/ARQUITECTURA_Y_ESTRUCTURA.md` - Arquitectura del sistema
- `docs/ESQUEMA_BASE_DE_DATOS.md` - Esquema de base de datos

## Archivos de Configuración

- `Dockerfile` - Configuración de imagen Docker
- `docker-compose.yml` - Configuración Docker Compose
- `.dockerignore` - Archivos ignorados por Docker
- `k8s/` - Manifests de Kubernetes
  - `configmap.yaml` - Configuración no sensible
  - `secret.yaml` - Secrets (actualizar antes de desplegar)
  - `mysql-deployment.yaml` - Deployment MySQL
  - `app-deployment.yaml` - Deployment aplicación
  - `kustomization.yaml` - Kustomize config
- `ansible/` - Playbooks de Ansible
  - `inventory.ini` - Inventory de servidores
  - `deploy.yml` - Despliegue completo Kubernetes
  - `deploy-docker.yml` - Despliegue Docker Compose
  - `ansible.cfg` - Configuración Ansible

## Variables de Entorno Críticas

Antes de desplegar, configurar estas variables:

- `DB_PASSWORD` - Contraseña MySQL
- `JWT_SECRET` - Clave secreta JWT
- `EMAIL_USER` - Email para OTP
- `EMAIL_PASS` - Contraseña de aplicación email
- `AI_API_KEY` - API Key de OpenAI

## Notas Importantes

1. **Nunca** commitear `.env` con secrets reales
2. Actualizar `k8s/secret.yaml` antes de desplegar en Kubernetes
3. Usar imágenes escaneadas por seguridad en producción
4. Configurar RBAC en Kubernetes para producción
5. Implementar monitoreo y alertas en producción
6. Hacer backups regulares de la base de datos
