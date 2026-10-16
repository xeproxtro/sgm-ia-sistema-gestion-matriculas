# Guía de Despliegue: Docker, Kubernetes y Ansible

Esta guía explica cómo desplegar el Sistema de Gestión de Matrículas (SGM-IA) utilizando Docker, Kubernetes y Ansible.

## 📋 Índice

1. [Docker - Desarrollo Local](#docker---desarrollo-local)
2. [Docker Compose - Single Server](#docker-compose---single-server)
3. [Kubernetes - Producción](#kubernetes---producción)
4. [Ansible - Automatización](#ansible---automatización)
5. [Troubleshooting](#troubleshooting)

---

## Docker - Desarrollo Local

### Requisitos Previos

- Docker Desktop instalado
- Docker CLI disponible

### Paso 1: Construir la Imagen Docker

```bash
# Desde la raíz del proyecto
docker build -t sgm-ia:latest .
```

### Paso 2: Ejecutar el Contenedor

```bash
# Configurar variables de entorno
export DB_HOST=host.docker.internal
export DB_PASSWORD=tu_contraseña
export JWT_SECRET=tu_secreto
export EMAIL_USER=tu_correo@gmail.com
export EMAIL_PASS=tu_contraseña_app
export AI_API_KEY=tu_openai_key

# Ejecutar contenedor
docker run -d \
  --name sgm-ia \
  -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=tu_contraseña \
  -e JWT_SECRET=tu_secreto \
  -e EMAIL_USER=tu_correo@gmail.com \
  -e EMAIL_PASS=tu_contraseña_app \
  -e AI_API_KEY=tu_openai_key \
  sgm-ia:latest
```

### Verificar Health Check

```bash
docker inspect --format='{{.State.Health.Status}}' sgm-ia
```

### Ver Logs

```bash
docker logs -f sgm-ia
```

---

## Docker Compose - Single Server

### Requisitos Previos

- Docker y Docker Compose instalados
- MySQL configurado o usar el contenedor MySQL incluido

### Paso 1: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env
```

Variables mínimas requeridas:
```env
DB_PASSWORD=change_this_password
JWT_SECRET=change_this_secret_in_production
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
AI_API_KEY=your_openai_api_key
```

### Paso 2: Iniciar con Docker Compose

```bash
# Iniciar todos los servicios
docker compose up -d

# Verificar estado
docker compose ps

# Ver logs
docker compose logs -f app
```

### Paso 3: Acceder a la Aplicación

- **Aplicación**: http://localhost:3000
- **phpMyAdmin** (opcional): http://localhost:8080

### Comandos Útiles

```bash
# Detener servicios
docker compose down

# Detener y eliminar volúmenes
docker compose down -v

# Reconstruir imágenes (después de cambios en código)
docker compose up -d --build

# Reconstruir sin caché
docker compose build --no-cache
docker compose up -d

# Escalar aplicación
docker compose up -d --scale app=3

# Ejecutar comandos en contenedor
docker compose exec app sh

# Ejecutar scripts de microservicios dentro del contenedor
docker compose exec app npm run microservice:notifications
docker compose exec app npm run microservice:pdf-reports
docker compose exec app npm run microservice:file-generation

# Ver logs de microservicios
docker compose exec app node src/whatever/microservices/notification-service.js test 1
docker compose exec app node src/whatever/microservices/pdf-report-service.js history 1
docker compose exec app node src/whatever/microservices/file-generation-service.js students-excel
```

---

## Kubernetes - Producción

### Requisitos Previos

- Kubernetes cluster funcionando (minikube, kind, k3s, o cloud provider)
- kubectl configurado
- kubectl plugin kustomize (opcional, kubectl tiene soporte nativo desde v1.14)

### Opción A: Usar Minikube (Local)

```bash
# Iniciar minikube
minikube start

# Habilitar ingress (opcional)
minikube addons enable ingress

# Cargar imagen Docker en minikube
eval $(minikube docker-env)
docker build -t sgm-ia:latest .
```

### Opción B: Usar Kind (Local)

```bash
# Crear cluster
kind create cluster --name sgm-ia

# Cargar imagen
kind load docker-image sgm-ia:latest --name sgm-ia
```

### Opción C: Usar Cloud Provider (AWS/GCP/Azure)

1. Construir y push imagen a registry:
```bash
# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag sgm-ia:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/sgm-ia:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/sgm-ia:latest

# Docker Hub
docker tag sgm-ia:latest tu-usuario/sgm-ia:latest
docker push tu-usuario/sgm-ia:latest
```

2. Actualizar `k8s/kustomization.yaml` con tu imagen:
```yaml
images:
  - name: sgm-ia
    newName: tu-usuario/sgm-ia
    newTag: latest
```

### Paso 1: Configurar Secrets

**IMPORTANTE**: Actualiza los secrets en `k8s/secret.yaml` con valores reales antes de desplegar.

```bash
# Editar secret.yaml
nano k8s/secret.yaml
```

Cambia estos valores:
- `DB_PASSWORD`
- `JWT_SECRET`
- `EMAIL_USER` y `EMAIL_PASS`
- `AI_API_KEY`
- `MYSQL_ROOT_PASSWORD`

### Paso 2: Desplegar en Kubernetes

```bash
# Navegar al directorio k8s
cd k8s

# Aplicar configuración con kustomize
kubectl apply -k .

# Verificar despliegue
kubectl get pods -w

# Verificar servicios
kubectl get svc

# Verificar HPA (Horizontal Pod Autoscaler)
kubectl get hpa
```

### Paso 3: Acceder a la Aplicación

#### Minikube:
```bash
minikube service sgm-ia-service
```

#### LoadBalancer (Cloud):
```bash
kubectl get svc sgm-ia-service
# Usa la EXTERNAL-IP mostrada
```

#### Port Forward (Cualquier cluster):
```bash
kubectl port-forward service/sgm-ia-service 3000:80
# Accede a http://localhost:3000
```

### Comandos Útiles de Kubernetes

```bash
# Ver logs de pods
kubectl logs -f deployment/sgm-ia-app

# Ver logs de pod específico
kubectl logs -f <pod-name>

# Escalar deployment manualmente
kubectl scale deployment sgm-ia-app --replicas=5

# Ver eventos
kubectl get events --sort-by=.metadata.creationTimestamp

# Describir pod para troubleshooting
kubectl describe pod <pod-name>

# Entrar en un pod
kubectl exec -it <pod-name> -- sh

# Ver recursos usados
kubectl top pods

# Eliminar despliegue
kubectl delete -k .
```

### Monitoreo

```bash
# Ver pods con sus estados
kubectl get pods

# Ver deployments
kubectl get deployments

# Ver servicios
kubectl get services

# Ver PVCs (Persistent Volume Claims)
kubectl get pvc

# Ver configuración actual
kubectl get configmap sgm-ia-config -o yaml
kubectl get secret sgm-ia-secret -o yaml
```

---

## Ansible - Automatización

### Requisitos Previos

- Ansible instalado en tu máquina local
- Servidores destino con SSH accesible
- Python instalado en servidores destino

### Instalar Ansible

```bash
# En Ubuntu/Debian
sudo apt update
sudo apt install ansible -y

# En macOS
brew install ansible

# Verificar instalación
ansible --version
```

### Paso 1: Configurar Inventory

Edita `ansible/inventory.ini` con tus servidores:

```ini
[kubernetes_nodes]
k8s-master ansible_host=192.168.1.10 ansible_user=root
k8s-worker1 ansible_host=192.168.1.11 ansible_user=root
k8s-worker2 ansible_host=192.168.1.12 ansible_user=root

[kubernetes_master]
k8s-master

[kubernetes_workers]
k8s-worker1
k8s-worker2
```

### Paso 2: Configurar SSH Keys

```bash
# Generar clave SSH si no tienes
ssh-keygen -t rsa -b 4096

# Copiar clave a servidores
ssh-copy-id root@192.168.1.10
ssh-copy-id root@192.168.1.11
ssh-copy-id root@192.168.1.12

# Verificar conexión
ansible -i ansible/inventory.ini all -m ping
```

### Opción A: Despliegue Completo con Kubernetes

```bash
# Ejecutar playbook completo (instala K8s + despliega app)
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml

# Este playbook:
# 1. Instala Docker en todos los nodos
# 2. Instala Kubernetes en todos los nodos
# 3. Inicializa cluster en master
# 4. Une workers al cluster
# 5. Despliega SGM-IA aplicación
```

### Opción B: Despliegue Simple con Docker Compose

```bash
# Para despliegue single-server con Docker Compose
ansible-playbook -i ansible/inventory.ini ansible/deploy-docker.yml

# Este playbook:
# 1. Instala Docker
# 2. Copia archivos del proyecto
# 3. Inicia con docker-compose
```

### Actualizar Secrets en Ansible

Para actualizar secrets antes del despliegue:

```bash
# Editar k8s/secret.yaml
nano k8s/secret.yaml

# Ansible copiará este archivo durante el despliegue
```

### Comandos Útiles de Ansible

```bash
# Verificar conectividad
ansible -i ansible/inventory.ini all -m ping

# Ejecutar comando en todos los nodos
ansible -i ansible/inventory.ini all -m shell -a "docker ps"

# Verificar instalación de Kubernetes
ansible -i ansible/inventory.ini kubernetes_master -m shell -a "kubectl get nodes"

# Ejecutar solo ciertas tareas
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml --tags "docker"

# Verificar sintaxis del playbook
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml --syntax-check

# Modo verbose
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml -v
```

---

## Troubleshooting

### Docker Issues

**Problema**: Contenedor no inicia
```bash
# Ver logs
docker logs sgm-ia

# Verificar health check
docker inspect --format='{{json .State.Health}}' sgm-ia | jq
```

**Problema**: Error de conexión a base de datos
```bash
# Verificar que MySQL está corriendo
docker compose ps mysql

# Ver logs de MySQL
docker compose logs mysql
```

### Docker Compose Issues

**Problema**: Volumenes corruptos
```bash
# Eliminar y recrear
docker compose down -v
docker compose up -d
```

**Problema**: Puerto ya en uso
```bash
# Cambiar puerto en docker-compose.yml
# O matar proceso usando el puerto
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Kubernetes Issues

**Problema**: Pods no se inician
```bash
# Ver eventos
kubectl get events --sort-by=.metadata.creationTimestamp

# Describir pod
kubectl describe pod <pod-name>

# Ver logs
kubectl logs <pod-name>
```

**Problema**: ImagePullBackOff
```bash
# Verificar imagen existe
kubectl get pods

# Si usando minikube/kind, cargar imagen
eval $(minikube docker-env)
docker build -t sgm-ia:latest .
# o
kind load docker-image sgm-ia:latest
```

**Problema**: CrashLoopBackOff
```bash
# Ver logs de intentos anteriores
kubectl logs <pod-name> --previous

# Verificar configuración
kubectl describe pod <pod-name>
```

**Problema**: PersistentVolumeClaim pendiente
```bash
# Verificar PVC
kubectl get pvc

# Verificar PV
kubectl get pv

# Si en minikube, puede necesitar:
minikube addons enable volumes-provisioner
```

### Ansible Issues

**Problema**: Conexión SSH falla
```bash
# Verificar conectividad manual
ssh root@192.168.1.10

# Verificar configuración SSH
ansible -i ansible/inventory.ini all -m ping -vvv
```

**Problema**: Playbook falla en cierta tarea
```bash
# Ejecutar desde esa tarea
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml --start-at-task "Install Docker"
```

**Problema**: Variables no definidas
```bash
# Agregar variables en playbook o inventory
# O usar --extra-vars
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml --extra-vars "var=value"
```

---

## Best Practices

### Seguridad

1. **Nunca commits secrets** al repositorio
2. Usa Kubernetes Secrets para datos sensibles
3. Rotar secrets regularmente
4. Usa RBAC en Kubernetes
5. Escanea imágenes Docker con Trivy:
   ```bash
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
     aquasec/trivy image sgm-ia:latest
   ```

### Monitoreo

1. Habilita logs estructurados
2. Configura métricas con Prometheus
3. Usa dashboards de Grafana
4. Configura alertas

### Escalado

1. Usa HPA para escalado automático
2. Configura límites de recursos
3. Monitorea métricas de CPU y memoria
4. Prueba carga antes de producción

### Backups

1. Backup regular de MySQL
2. Backup de PersistentVolumes
3. Documenta procedimientos de recuperación
4. Prueba restauración regularmente

---

## Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Ansible Documentation](https://docs.ansible.com/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

## Soporte

Para soporte técnico del proyecto SGM-IA:
- Email: soporte@uts.edu.co
- Documentación: [docs/ARQUITECTURA_Y_ESTRUCTURA.md](docs/ARQUITECTURA_Y_ESTRUCTURA.md)
