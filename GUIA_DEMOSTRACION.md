# Guía de Demostración en Vivo - Docker, Kubernetes y Ansible

## 🎯 Objetivo
Esta guía te permite hacer una demostración en vivo de cómo funcionan Docker, Kubernetes y Ansible con tu proyecto SGM-IA.

---

## 📋 Requisitos Previos

### 1. Instalar Docker Desktop (Obligatorio para demo)

**Para Windows:**
1. Descargar desde: https://www.docker.com/products/docker-desktop/
2. Ejecutar el instalador `Docker Desktop Installer.exe`
3. Reiniciar el equipo cuando solicite
4. Iniciar Docker Desktop desde el menú de inicio
5. Esperar a que el icono de Docker esté verde (indica que está corriendo)

**Verificar instalación:**
```powershell
docker --version
docker compose version
```

**Salida esperada:**
```
Docker version 24.0.7
Docker Compose version v2.23.0
```

---

## 🎬 Demostración 1: Docker Compose (Fácil y Rápido)

### Paso 1: Preparar Variables de Entorno

El archivo `.env` ya está configurado con tus valores actuales. Revisar:

```powershell
# Ver el archivo .env
notepad .env
```

**Qué debes ver:**
- DB_PASSWORD vacío (usarás contraseña vacía para MySQL local)
- JWT_SECRET configurado
- EMAIL_USER configurado
- AI_API_KEY configurado

### Paso 2: Iniciar Servicios con Docker Compose

```powershell
# Desde la raíz del proyecto
docker compose up -d
```

**Qué verás en la terminal:**
```
[+] Running 3/3
 ✔ Network sgm-ia-network      Created
 ✔ Volume "mysql_data"         Created
 ✔ Container sgm-ia-mysql      Started
 ✔ Container sgm-ia-app       Started
```

**Explicación:**
- Docker crea una red interna para conectar los contenedores
- Crea un volumen para guardar datos de MySQL (persistencia)
- Inicia contenedor MySQL primero
- Inicia contenedor de tu aplicación después

### Paso 3: Verificar Estado

```powershell
docker compose ps
```

**Salida esperada:**
```
NAME           IMAGE          STATUS          PORTS
sgm-ia-app     sgm-ia:latest Up 30 seconds   0.0.0.0:3000->3000/tcp
sgm-ia-mysql   mysql:8.0     Up 35 seconds   3306/tcp
```

**Explicación:**
- `Up` indica que los contenedores están corriendo
- Puerto 3000 está mapeado a tu localhost
- MySQL solo accesible internamente (no mapeado a host)

### Paso 4: Ver Logs en Tiempo Real

```powershell
docker compose logs -f app
```

**Salida esperada:**
```
sgm-ia-app  | SGM-IA Server running on port 3000
sgm-ia-app  | Environment: development
sgm-ia-app  | Maintenance Mode: INACTIVE
sgm-ia-app  | Database connection established
sgm-ia-app  | Queue processing started
```

**Explicación:**
- `-f` sigue los logs en tiempo real (como `tail -f`)
- Verás que el servidor se inició correctamente
- Verás conexión a base de datos
- Verás que el procesador de colas inició

### Paso 5: Probar la Aplicación

Abre navegador en: http://localhost:3000

**Qué verás:**
- Página de login del sistema SGM-IA
- La aplicación funciona exactamente igual que sin Docker
- Puedes hacer login, probar todas las funcionalidades

### Paso 6: Ver Health Check

```powershell
# Abrir nueva terminal
curl http://localhost:3000/api/health
```

**Salida esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-16T10:30:00.000Z",
  "uptime": 45.234,
  "environment": "development"
}
```

**Explicación:**
- Este endpoint lo agregué para Kubernetes
- Indica que la aplicación está sana
- Kubernetes lo usa para saber si debe reiniciar el pod

### Paso 7: Escalar la Aplicación (Demo de Capacidades)

```powershell
# Escalar a 3 réplicas
docker compose up -d --scale app=3
```

**Salida esperada:**
```
[+] Running 4/4
 ✔ Container sgm-ia-app      Started
 ✔ Container sgm-ia-app-1    Started
 ✔ Container sgm-ia-app-2    Started
 ✔ Container sgm-ia-app-3    Started
```

**Verificar:**
```powershell
docker compose ps
```

**Salida esperada:**
```
NAME           IMAGE          STATUS          PORTS
sgm-ia-app     sgm-ia:latest Up              0.0.0.0:3000->3000/tcp
sgm-ia-app-1   sgm-ia:latest Up              0.0.0.0:3001->3000/tcp
sgm-ia-app-2   sgm-ia:latest Up              0.0.0.0:3002->3000/tcp
sgm-ia-app-3   sgm-ia:latest Up              0.0.0.0:3003->3000/tcp
sgm-ia-mysql   mysql:8.0     Up              3306/tcp
```

**Explicación:**
- Ahora tienes 4 contenedores de la aplicación corriendo
- Cada uno en un puerto diferente (3000-3003)
- Todos conectados al mismo MySQL
- Comparten el mismo volumen de uploads

### Paso 8: Ver Resource Usage

```powershell
docker stats
```

**Salida esperada:**
```
CONTAINER ID   NAME         CPU %     MEM USAGE / LIMIT
abc123         sgm-ia-app   0.5%      45.2MiB / 512MiB
def456         sgm-ia-app-1 0.3%      44.8MiB / 512MiB
ghi789         sgm-ia-mysql 2.1%      128MiB / 1GiB
```

**Explicación:**
- Muestra uso de CPU y memoria en tiempo real
- Puedes ver los límites configurados en docker-compose.yml
- Importante para monitoreo en producción

### Paso 9: Detener Todo

```powershell
docker compose down
```

**Salida esperada:**
```
[+] Running 4/4
 ✔ Container sgm-ia-app-3   Stopped
 ✔ Container sgm-ia-app-2   Stopped
 ✔ Container sgm-ia-app-1   Stopped
 ✔ Container sgm-ia-app     Stopped
 ✔ Container sgm-ia-mysql   Stopped
 ✔ Network sgm-ia-network   Removed
```

**Explicación:**
- Detiene todos los contenedores
- Elimina la red interna
- **NO** elimina los volúmenes (datos persisten)

### Paso 10: Eliminar Todo (Incluyendo Datos)

```powershell
docker compose down -v
```

**Salida esperada:**
```
[+] Running 5/5
 ✔ Container sgm-ia-mysql   Stopped
 ✔ Container sgm-ia-app     Stopped
 ✔ Volume mysql_data        Removed
 ✔ Network sgm-ia-network   Removed
```

**Explicación:**
- Detiene contenedores
- Elimina volúmenes (se pierden datos de MySQL)
- Útil para limpiar completamente

---

## 🎬 Demostración 2: Kubernetes (Más Avanzado)

### Paso 1: Instalar Minikube (Kubernetes Local)

**Para Windows:**
1. Descargar desde: https://minikube.sigs.k8s.io/docs/start/
2. Ejecutar: `winget install minikube`
3. O descargar el .exe manual

**Verificar:**
```powershell
minikube version
```

### Paso 2: Iniciar Minikube

```powershell
minikube start
```

**Salida esperada:**
```
😄  minikube v1.32.0 on Microsoft Windows
✨  Using the hyperv driver
🧯  The "hyperv" driver requires elevated privileges
🔑  Requesting elevated privileges
🔓  Password:
📌  Using Hyper-V driver
🎉  Ready! minikube is ready to use!
```

**Explicación:**
- Minikube crea un cluster Kubernetes local
- Usa Hyper-V en Windows para virtualización
- Demora ~2-3 minutos en iniciar

### Paso 3: Verificar Cluster

```powershell
kubectl get nodes
```

**Salida esperada:**
```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   2m    v1.28.3
```

**Explicación:**
- Un solo nodo (minikube) actúa como master y worker
- Status `Ready` indica que el cluster está funcionando

### Paso 4: Construir Imagen Docker

```powershell
# Conectar a Docker de minikube
minikube docker-env

# Construir imagen
docker build -t sgm-ia:latest .
```

**Explicación:**
- Minikube tiene su propio Docker daemon
- La imagen debe construirse ahí para que Kubernetes la encuentre

### Paso 5: Desplegar en Kubernetes

```powershell
cd k8s
kubectl apply -k .
cd ..
```

**Salida esperada:**
```
configmap/sgm-ia-config created
secret/sgm-ia-secret created
persistentvolumeclaim/mysql-pvc created
deployment.apps/mysql created
service/mysql-service created
persistentvolumeclaim/app-uploads-pvc created
deployment.apps/sgm-ia-app created
service/sgm-ia-service created
horizontalpodautoscaler.autoscaling/sgm-ia-hpa created
```

**Explicación:**
- Kustomize aplica todos los recursos en orden correcto
- Crea 10 recursos Kubernetes automáticamente
- Toma ~1-2 minutos en completar

### Paso 6: Ver Pods

```powershell
kubectl get pods -w
```

**Salida esperada (evolución):**
```
NAME                           READY   STATUS              RESTARTS   AGE
mysql-5d4f8c9f9c-xk2zp         0/1     ContainerCreating   0          5s
sgm-ia-app-6f7b8c9d8c-mn2pq   0/1     ContainerCreating   0          5s
# ... 30 segundos después ...
mysql-5d4f8c9f9c-xk2zp         1/1     Running             0          35s
sgm-ia-app-6f7b8c9d8c-mn2pq   1/1     Running             0          35s
sgm-ia-app-6f7b8c9d8c-abcde   1/1     Running             0          35s
sgm-ia-app-6f7b8c9d8c-fghij   1/1     Running             0          35s
```

**Explicación:**
- `-w` watch: muestra cambios en tiempo real
- `ContainerCreating` → `Running` mientras inicia
- Se crean 3 pods de la aplicación (replicas: 3)
- `READY 1/1` indica que el contenedor está listo

### Paso 7: Ver Services

```powershell
kubectl get svc
```

**Salida esperada:**
```
NAME              TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes        ClusterIP      10.96.0.1        <none>        443/TCP        5m
mysql-service     ClusterIP      10.96.123.45     <none>        3306/TCP       4m
sgm-ia-service    LoadBalancer   10.96.234.56     <pending>     80:30000/TCP   4m
```

**Explicación:**
- `kubernetes`: servicio interno del cluster
- `mysql-service`: solo accesible internamente (ClusterIP)
- `sgm-ia-service`: LoadBalancer para acceso externo
- `EXTERNAL-IP pending` porque minikube no tiene LoadBalancer real

### Paso 8: Acceder a la Aplicación

```powershell
minikube service sgm-ia-service
```

**Salida esperada:**
```
|-----------|----------------|-------------|---------------------------|
| NAMESPACE |      NAME      | TARGET PORT |            URL            |
|-----------|----------------|-------------|---------------------------|
| default   | sgm-ia-service |        80   | http://192.168.49.2:30000 |
|-----------|----------------|-------------|---------------------------|
🎉  Opening service default/sgm-ia-service in default browser...
```

**Explicación:**
- Minikube abre automáticamente el navegador
- La aplicación se abre en una URL del cluster
- Funciona exactamente igual que en Docker Compose

### Paso 9: Ver HPA (Horizontal Pod Autoscaler)

```powershell
kubectl get hpa
```

**Salida esperada:**
```
NAME          REFERENCE                TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
sgm-ia-hpa    Deployment/sgm-ia-app    5%/70%    2         10        3          5m
```

**Explicación:**
- `TARGETS 5%/70%`: CPU actual 5%, límite 70%
- `MINPODS 2`: mínimo 2 réplicas
- `MAXPODS 10`: máximo 10 réplicas
- `REPLICAS 3`: actualmente 3 réplicas corriendo
- Si CPU > 70%, Kubernetes escala automáticamente más pods

### Paso 10: Simular Carga y Ver Escalado

```powershell
# En otra terminal, generar carga
for i in {1..100}; do curl http://localhost:3000/api/health; done
```

**Verificar escalado:**
```powershell
kubectl get pods -w
```

**Salida esperada (si hay suficiente carga):**
```
NAME                           READY   STATUS    RESTARTS   AGE
sgm-ia-app-6f7b8c9d8c-mn2pq   1/1     Running   0          10m
sgm-ia-app-6f7b8c9d8c-abcde   1/1     Running   0          10m
sgm-ia-app-6f7b8c9d8c-fghij   1/1     Running   0          10m
sgm-ia-app-6f7b8c9d8c-klmno   1/1     Running   0          5s   # Nuevo pod
sgm-ia-app-6f7b8c9d8c-pqrst   1/1     Running   0          5s   # Nuevo pod
```

**Explicación:**
- HPA detectó alta CPU
- Kubernetes creó automáticamente 2 pods más
- Todo sin intervención manual

### Paso 11: Eliminar Despliegue

```powershell
cd k8s
kubectl delete -k .
cd ..
```

**Salida esperada:**
```
configmap "sgm-ia-config" deleted
secret "sgm-ia-secret" deleted
persistentvolumeclaim "mysql-pvc" deleted
deployment.apps "mysql" deleted
service "mysql-service" deleted
...
```

**Explicación:**
- Elimina todos los recursos creados
- Los PVC persisten (datos guardados)
- Puedes volver a desplegar sin perder datos

### Paso 12: Detener Minikube

```powershell
minikube stop
```

**Salida esperada:**
```
✋  Stopping "minikube" in hyperv ...
🛑  Node "minikube" stopped
```

---

## 🎬 Demostración 3: Ansible (Automatización)

Esta demostración requiere servidores remotos. Te explico cómo funcionaría:

### Escenario

Tienes 3 servidores:
- `192.168.1.10` - Master Kubernetes
- `192.168.1.11` - Worker 1
- `192.168.1.12` - Worker 2

### Paso 1: Configurar Inventory

Edita `ansible/inventory.ini`:
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

### Paso 2: Ejecutar Playbook

```powershell
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml
```

**Salida esperada (resumida):**
```
PLAY [Prepare Kubernetes nodes] **************************************
TASK [Update apt cache] **********************************************
ok: [k8s-master]
ok: [k8s-worker1]
ok: [k8s-worker2]

TASK [Install dependencies] *****************************************
ok: [k8s-master]
ok: [k8s-worker1]
ok: [k8s-worker2]

PLAY [Install Docker] ***********************************************
TASK [Add Docker GPG key] ********************************************
changed: [k8s-master]
changed: [k8s-worker1]
changed: [k8s-worker2]

PLAY [Install Kubernetes] *******************************************
TASK [Install Kubernetes packages] **********************************
changed: [k8s-master]
changed: [k8s-worker1]
changed: [k8s-worker2]

PLAY [Initialize Kubernetes cluster on master] *********************
TASK [Initialize Kubernetes cluster] ********************************
changed: [k8s-master]

PLAY [Join workers to cluster] **************************************
TASK [Join cluster] **************************************************
changed: [k8s-worker1]
changed: [k8s-worker2]

PLAY [Deploy SGM-IA application] ***********************************
TASK [Apply Kubernetes manifests] ***********************************
changed: [k8s-master]

PLAY RECAP **********************************************************
k8s-master: ok=45 changed=30 unreachable=0 failed=0
k8s-worker1: ok=20 changed=15 unreachable=0 failed=0
k8s-worker2: ok=20 changed=15 unreachable=0 failed=0
```

**Explicación:**
- Ansible se conecta a los 3 servidores
- Instala Docker en todos
- Instala Kubernetes en todos
- Inicializa cluster en master
- Une workers al cluster
- Despliega tu aplicación
- Todo en un solo comando

---

## 🎯 Demostración Rápida con Scripts

Para demostraciones rápidas, usar los scripts que creé:

### Windows
```powershell
# Demo Docker Compose
scripts\deploy.bat docker

# Demo Kubernetes (requiere minikube)
scripts\deploy.bat kubernetes
```

### Linux/Mac
```bash
# Dar permisos
chmod +x scripts/deploy.sh

# Demo Docker Compose
./scripts/deploy.sh docker

# Demo Kubernetes
./scripts/deploy.sh kubernetes
```

---

## 📊 Qué Mostrar en la Demo

### Para Docker Compose:
1. **Portabilidad**: "Mismo contenedor, funciona en cualquier máquina"
2. **Aislamiento**: "Cada servicio en su contenedor"
3. **Escalado**: "Escalar con un comando"
4. **Persistencia**: "Datos guardados en volúmenes"

### Para Kubernetes:
1. **Auto-escalado**: "Kubernetes escala automáticamente"
2. **Self-healing**: "Si un pod falla, Kubernetes lo recrea"
3. **Load balancing**: "Balanceo automático entre réplicas"
4. **Declarativo**: "Declaro el estado deseado, Kubernetes lo cumple"

### Para Ansible:
1. **Infrastructure as Code**: "Infraestructura como código"
2. **Idempotencia**: "Puedo ejecutarlo múltiples veces"
3. **Automatización**: "Un comando para desplegar todo"
4. **Consistencia**: "Misma configuración en todos los servidores"

---

## 💡 Tips para la Demo

1. **Prepara todo antes**: Instala Docker y Minikube antes de la demo
2. **Ten .env listo**: Configura variables antes
3. **Prueba en casa**: Ejecuta todo antes de la demo pública
4. **Ten screenshots**: Captura pantallas en caso de errores
5. **Simplifica**: Muestra Docker Compose primero (más fácil)
6. **Explica bien**: Explica qué hace cada herramienta antes de ejecutar

---

## 🚨 Errores Comunes y Soluciones

### Error: "Port already in use"
```powershell
# Matar proceso usando el puerto
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: "Connection refused" (MySQL)
```powershell
# Verificar que MySQL está listo
docker compose logs mysql
# Esperar más tiempo (MySQL tarda en iniciar)
```

### Error: "ImagePullBackOff" (Kubernetes)
```powershell
# Cargar imagen en minikube
minikube image load sgm-ia:latest
```

### Error: "Permission denied" (Ansible)
```powershell
# Configurar SSH keys
ssh-copy-id root@192.168.1.10
```

---

## 📚 Recursos para Aprender Más

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Basics](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Ansible Documentation](https://docs.ansible.com/)
- [Minikube Tutorial](https://minikube.sigs.k8s.io/docs/start/)

---

## ✅ Checklist para Demo Exitosa

- [ ] Docker Desktop instalado y corriendo
- [ ] Minikube instalado (para demo Kubernetes)
- [ ] Archivo .env configurado
- [ ] Kubernetes secrets configurados
- [ ] Probado Docker Compose en casa
- [ ] Probado Kubernetes en casa
- [ ] Screenshots de éxito preparados
- [ ] Script de backup por si algo falla

¡Buena suerte con tu demostración! 🎉
