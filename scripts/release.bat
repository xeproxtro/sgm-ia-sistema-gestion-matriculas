@echo off
REM Script para facilitar el proceso de release en Windows
REM Uso: scripts\release.bat [patch|minor|major]

setlocal enabledelayedexpansion

set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%ℹ Iniciando proceso de release...%NC%

REM Verificar tipo de release
set "RELEASE_TYPE=%1"
if "%RELEASE_TYPE%"=="" set "RELEASE_TYPE=patch"

if not "%RELEASE_TYPE%"=="patch" if not "%RELEASE_TYPE%"=="minor" if not "%RELEASE_TYPE%"=="major" (
    echo %RED%❌ Tipo de release inválido. Opciones: patch, minor, major%NC%
    echo %BLUE%ℹ Uso: scripts\release.bat [patch|minor|major]%NC%
    exit /b 1
)

echo %BLUE%ℹ Tipo de release: %RELEASE_TYPE%%NC%

REM Verificar cambios sin commit
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Git no está disponible o no hay repositorio%NC%
    exit /b 1
)

for /f %%i in ('git status --porcelain') do set "HAS_CHANGES=%%i"
if defined HAS_CHANGES (
    echo %RED%❌ Hay cambios sin commit. Por favor commitea o stash los cambios primero.%NC%
    git status --short
    exit /b 1
)

REM Verificar rama actual
for /f %%i in ('git branch --show-current') do set "CURRENT_BRANCH=%%i"
if not "%CURRENT_BRANCH%"=="main" (
    echo %YELLOW%⚠️ No estás en la rama main. Estás en: %CURRENT_BRANCH%%NC%
    set /p CONTINUE="¿Deseas continuar? (y/n): "
    if /i not "!CONTINUE!"=="y" (
        echo %RED%❌ Operación cancelada%NC%
        exit /b 1
    )
)

REM Pull últimos cambios
echo %BLUE%ℹ Actualizando rama main...%NC%
git pull origin main

REM Ejecutar release
echo %BLUE%ℹ Ejecutando release %RELEASE_TYPE%...%NC%
npm run release:%RELEASE_TYPE%

if %errorlevel% neq 0 (
    echo %RED%❌ Error al ejecutar release%NC%
    exit /b 1
)

REM Obtener nueva versión
for /f %%i in ('node -p "require('./package.json').version"') do set "NEW_VERSION=%%i"
echo %GREEN%✅ Nueva versión: %NEW_VERSION%%NC%

REM Push cambios y tags
echo %BLUE%ℹ Haciendo push de cambios y tags...%NC%
git push --follow-tags origin main

if %errorlevel% neq 0 (
    echo %RED%❌ Error al hacer push%NC%
    exit /b 1
)

echo %GREEN%✅ Release %NEW_VERSION% completado exitosamente!%NC%
echo %BLUE%ℹ GitHub Actions iniciará el pipeline de CI/CD automáticamente.%NC%

echo.
echo %BLUE%ℹ La imagen Docker será publicada en:%NC%
echo   - ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:%NEW_VERSION%
echo   - ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:latest
echo.
echo %BLUE%ℹ Para usar la nueva imagen:%NC%
echo   docker pull ghcr.io/xeproxtro/sgm-ia-sistema-gestion-matriculas:%NEW_VERSION%
echo.

pause
