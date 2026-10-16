#!/bin/bash

# Script para facilitar el proceso de release
# Uso: ./scripts/release.sh [patch|minor|major]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ ${1}${NC}"
}

print_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "No estás en la rama main. Estás en: $CURRENT_BRANCH"
    read -p "¿Deseas continuar? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Operación cancelada"
        exit 1
    fi
fi

# Verificar cambios sin commit
if [ -n "$(git status --porcelain)" ]; then
    print_error "Hay cambios sin commit. Por favor commitea o stash los cambios primero."
    git status --short
    exit 1
fi

# Determinar tipo de release
RELEASE_TYPE=${1:-patch}

case $RELEASE_TYPE in
    patch|minor|major)
        print_info "Tipo de release: $RELEASE_TYPE"
        ;;
    *)
        print_error "Tipo de release inválido. Opciones: patch, minor, major"
        print_info "Uso: ./scripts/release.sh [patch|minor|major]"
        exit 1
        ;;
esac

# Pull últimos cambios
print_info "Actualizando rama main..."
git pull origin main

# Ejecutar release
print_info "Ejecutando release $RELEASE_TYPE..."
npm run release:$RELEASE_TYPE

# Obtener nueva versión
NEW_VERSION=$(node -p "require('./package.json').version")
print_success "Nueva versión: $NEW_VERSION"

# Push cambios y tags
print_info "Haciendo push de cambios y tags..."
git push --follow-tags origin main

print_success "Release $NEW_VERSION completado exitosamente!"
print_info "GitHub Actions iniciará el pipeline de CI/CD automáticamente."

# Mostrar información sobre la imagen Docker
print_info "La imagen Docker será publicada en:"
print_info "  - ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:$NEW_VERSION"
print_info "  - ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:latest"

print_info "Para usar la nueva imagen:"
print_info "  docker pull ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:$NEW_VERSION"
