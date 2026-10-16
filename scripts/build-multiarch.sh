#!/bin/bash

# Script para construir imagen Docker multi-arquitectura
# Soporta: linux/amd64, linux/arm64

set -e

IMAGE_NAME="sgm-ia"
IMAGE_TAG=${1:-latest}
REGISTRY=${2:-}

FULL_IMAGE_NAME="${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"

echo "🔨 Construyendo imagen multi-arquitectura..."
echo "📦 Imagen: ${FULL_IMAGE_NAME}"
echo "🏗️  Plataformas: linux/amd64, linux/arm64"
echo ""

# Crear builder si no existe
docker buildx version > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ docker buildx no está disponible. Por favor actualiza Docker."
    exit 1
fi

# Crear y usar builder
BUILDER_NAME="sgm-ia-builder"
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo "🔧 Creando builder: $BUILDER_NAME"
    docker buildx create --name $BUILDER_NAME --driver docker-container --use
else
    echo "✅ Usando builder existente: $BUILDER_NAME"
    docker buildx use $BUILDER_NAME
fi

# Habilitar plataformas
docker buildx inspect --bootstrap $BUILDER_NAME

# Construir imagen multi-arch
echo "🚀 Iniciando build multi-arquitectura..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t ${FULL_IMAGE_NAME} \
    --push \
    .

echo ""
echo "✅ Imagen construida y push exitoso!"
echo "📦 Imagen: ${FULL_IMAGE_NAME}"
echo ""
echo "Para usar la imagen:"
echo "  docker pull ${FULL_IMAGE_NAME}"
echo "  docker run -p 3000:3000 ${FULL_IMAGE_NAME}"
