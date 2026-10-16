#!/bin/bash

# Script para reconstruir la imagen Docker con los nuevos microservicios
# Uso: ./scripts/rebuild-docker.sh

set -e

echo "🔄 Reconstruyendo imagen Docker con microservicios..."
echo "================================================="

# Detener contenedores
echo "🛑 Deteniendo contenedores..."
docker compose down

# Reconstruir imagen sin caché
echo "🔨 Reconstruyendo imagen (sin caché)..."
docker compose build --no-cache

# Iniciar contenedores
echo "🚀 Iniciando contenedores..."
docker compose up -d

# Esperar a que estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado
echo "📊 Verificando estado..."
docker compose ps

echo ""
echo "✅ Reconstrucción completada!"
echo ""
echo "📝 Para ejecutar microservicios dentro del contenedor:"
echo "   docker compose exec app npm run microservice:notifications"
echo "   docker compose exec app npm run microservice:pdf-reports"
echo "   docker compose exec app npm run microservice:file-generation"
echo ""
echo "📝 Para ver logs:"
echo "   docker compose logs -f app"
