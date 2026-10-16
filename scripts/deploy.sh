#!/bin/bash

# Script de despliegue rápido para SGM-IA
# Uso: ./scripts/deploy.sh [docker|kubernetes|help]

set -e

DEPLOYMENT_TYPE=${1:-docker}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 SGM-IA Deployment Script"
echo "============================"
echo ""

case "$DEPLOYMENT_TYPE" in
    docker)
        echo "📦 Desplegando con Docker Compose..."
        
        # Verificar .env
        if [ ! -f .env ]; then
            echo "⚠️  Archivo .env no encontrado. Creando desde .env.example..."
            cp .env.example .env
            echo "⚠️  Por favor edita .env con tus valores antes de continuar."
            echo "   nano .env"
            exit 1
        fi
        
        # Construir e iniciar
        echo "🔨 Construyendo imágenes..."
        docker compose build
        
        echo "🚀 Iniciando servicios..."
        docker compose up -d
        
        echo "⏳ Esperando que servicios estén listos..."
        sleep 30
        
        echo "✅ Despliegue completado!"
        echo "📍 Aplicación: http://localhost:3000"
        echo "📊 Ver estado: docker compose ps"
        echo "📋 Ver logs: docker compose logs -f"
        ;;
        
    kubernetes)
        echo "☸️  Desplegando con Kubernetes..."
        
        # Verificar kubectl
        if ! command -v kubectl &> /dev/null; then
            echo "❌ kubectl no está instalado"
            exit 1
        fi
        
        # Verificar cluster
        if ! kubectl cluster-info &> /dev/null; then
            echo "❌ No hay cluster de Kubernetes accesible"
            exit 1
        fi
        
        # Verificar secrets
        if grep -q "change_this" k8s/secret.yaml; then
            echo "⚠️  Por favor actualiza k8s/secret.yaml con valores reales antes de desplegar"
            echo "   nano k8s/secret.yaml"
            exit 1
        fi
        
        # Construir imagen
        echo "🔨 Construyendo imagen Docker..."
        docker build -t sgm-ia:latest .
        
        # Cargar imagen si usando minikube
        if command -v minikube &> /dev/null && minikube status &> /dev/null; then
            echo "📦 Cargando imagen en minikube..."
            eval $(minikube docker-env)
            docker build -t sgm-ia:latest .
        fi
        
        # Desplegar
        echo "🚀 Aplicando manifests de Kubernetes..."
        cd k8s
        kubectl apply -k .
        cd ..
        
        echo "⏳ Esperando despliegue..."
        kubectl wait --for=condition=available --timeout=300s deployment/sgm-ia-app
        
        echo "✅ Despliegue completado!"
        echo "📊 Ver pods: kubectl get pods"
        echo "📋 Ver logs: kubectl logs -f deployment/sgm-ia-app"
        
        # Intentar obtener URL
        if command -v minikube &> /dev/null; then
            echo "📍 URL: $(minikube service sgm-ia-service --url)"
        else
            echo "📍 Usar: kubectl port-forward service/sgm-ia-service 3000:80"
        fi
        ;;
        
    help|--help|-h)
        echo "Uso: ./scripts/deploy.sh [opción]"
        echo ""
        echo "Opciones:"
        echo "  docker       Desplegar con Docker Compose (default)"
        echo "  kubernetes   Desplegar con Kubernetes"
        echo "  help         Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  ./scripts/deploy.sh docker"
        echo "  ./scripts/deploy.sh kubernetes"
        ;;
        
    *)
        echo "❌ Opción no válida: $DEPLOYMENT_TYPE"
        echo "Usa 'help' para ver opciones disponibles"
        exit 1
        ;;
esac
