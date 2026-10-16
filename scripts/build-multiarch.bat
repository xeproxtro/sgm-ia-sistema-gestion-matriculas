@echo off
REM Script para construir imagen Docker multi-arquitectura (Windows)
REM Soporta: linux/amd64, linux/arm64

setlocal enabledelayedexpansion

set IMAGE_NAME=sgm-ia
set IMAGE_TAG=%1
if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest

set REGISTRY=%2
set FULL_IMAGE_NAME=%REGISTRY%%IMAGE_NAME%:%IMAGE_TAG%

echo 🔨 Construyendo imagen multi-arquitectura...
echo 📦 Imagen: %FULL_IMAGE_NAME%
echo 🏗️  Plataformas: linux/amd64, linux/arm64
echo.

REM Verificar docker buildx
docker buildx version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker buildx no está disponible. Por favor actualiza Docker.
    exit /b 1
)

REM Crear y usar builder
set BUILDER_NAME=sgm-ia-builder
docker buildx inspect %BUILDER_NAME% >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔧 Creando builder: %BUILDER_NAME%
    docker buildx create --name %BUILDER_NAME% --driver docker-container --use
) else (
    echo ✅ Usando builder existente: %BUILDER_NAME%
    docker buildx use %BUILDER_NAME%
)

REM Habilitar plataformas
docker buildx inspect --bootstrap %BUILDER_NAME%

REM Construir imagen multi-arch
echo 🚀 Iniciando build multi-arquitectura...
docker buildx build --platform linux/amd64,linux/arm64 -t %FULL_IMAGE_NAME% --push .

echo.
echo ✅ Imagen construida y push exitoso!
echo 📦 Imagen: %FULL_IMAGE_NAME%
echo.
echo Para usar la imagen:
echo   docker pull %FULL_IMAGE_NAME%
echo   docker run -p 3000:3000 %FULL_IMAGE_NAME%

endlocal
