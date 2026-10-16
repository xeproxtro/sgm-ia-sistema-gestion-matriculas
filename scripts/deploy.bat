@echo off
REM Script de despliegue rápido para SGM-IA (Windows)
REM Uso: deploy.bat [docker|kubernetes|help]

setlocal enabledelayedexpansion

set DEPLOYMENT_TYPE=%1
if "%DEPLOYMENT_TYPE%"=="" set DEPLOYMENT_TYPE=docker

echo 🚀 SGM-IA Deployment Script
echo ============================
echo.

if "%DEPLOYMENT_TYPE%"=="docker" (
    echo 📦 Desplegando con Docker Compose...
    echo.

    REM Verificar .env
    if not exist .env (
        echo ⚠️  Archivo .env no encontrado. Creando desde .env.example...
        copy .env.example .env
        echo ⚠️  Por favor edita .env con tus valores antes de continuar.
        echo    notepad .env
        exit /b 1
    )

    REM Construir e iniciar
    echo 🔨 Construyendo imágenes...
    docker compose build

    echo 🚀 Iniciando servicios...
    docker compose up -d

    echo ⏳ Esperando que servicios estén listos...
    timeout /t 30 /nobreak

    echo ✅ Despliegue completado!
    echo 📍 Aplicación: http://localhost:3000
    echo 📊 Ver estado: docker compose ps
    echo 📋 Ver logs: docker compose logs -f
) else if "%DEPLOYMENT_TYPE%"=="kubernetes" (
    echo ☸️  Desplegando con Kubernetes...
    echo.

    REM Verificar kubectl
    where kubectl >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ kubectl no está instalado
        exit /b 1
    )

    REM Verificar cluster
    kubectl cluster-info >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ No hay cluster de Kubernetes accesible
        exit /b 1
    )

    REM Verificar secrets
    findstr /C:"change_this" k8s\secret.yaml >nul
    if %errorlevel% equ 0 (
        echo ⚠️  Por favor actualiza k8s\secret.yaml con valores reales antes de desplegar
        echo    notepad k8s\secret.yaml
        exit /b 1
    )

    REM Construir imagen
    echo 🔨 Construyendo imagen Docker...
    docker build -t sgm-ia:latest .

    REM Cargar imagen si usando minikube
    where minikube >nul 2>&1
    if %errorlevel% equ 0 (
        minikube status >nul 2>&1
        if %errorlevel% equ 0 (
            echo 📦 Cargando imagen en minikube...
            for /f "delims=" %%i in ('minikube docker-env') do %%i
            docker build -t sgm-ia:latest .
        )
    )

    REM Desplegar
    echo 🚀 Aplicando manifests de Kubernetes...
    cd k8s
    kubectl apply -k .
    cd ..

    echo ⏳ Esperando despliegue...
    kubectl wait --for=condition=available --timeout=300s deployment/sgm-ia-app

    echo ✅ Despliegue completado!
    echo 📊 Ver pods: kubectl get pods
    echo 📋 Ver logs: kubectl logs -f deployment/sgm-ia-app

    REM Intentar obtener URL
    where minikube >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "delims=" %%i in ('minikube service sgm-ia-service --url') do echo 📍 URL: %%i
    ) else (
        echo 📍 Usar: kubectl port-forward service/sgm-ia-service 3000:80
    )
) else if "%DEPLOYMENT_TYPE%"=="help" (
    echo Uso: deploy.bat [opcion]
    echo.
    echo Opciones:
    echo   docker       Desplegar con Docker Compose (default)
    echo   kubernetes   Desplegar con Kubernetes
    echo   help         Mostrar esta ayuda
    echo.
    echo Ejemplos:
    echo   deploy.bat docker
    echo   deploy.bat kubernetes
) else (
    echo ❌ Opcion no valida: %DEPLOYMENT_TYPE%
    echo Usa 'help' para ver opciones disponibles
    exit /b 1
)

endlocal
